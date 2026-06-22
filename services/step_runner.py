"""
DIP Platform — Step-by-step code execution engine.

Splits student Python code into logical steps (by top-level AST statements),
executes each step sequentially while persisting variable state via pickle,
and collects per-step results: stdout, stderr, output images, variable summaries.

Usage (called by code-runner.js):
    python step_runner.py <student_code_file> <helper_code_file>

Outputs:
    step_results.json  — JSON array of step results
    result_step_N_*.png — images produced during step N
"""
import ast
import sys
import os
import json
import pickle
import traceback
import glob
import io

STATE_FILE = '_step_state.pkl'

# ============================================================
#  Code splitting (AST-based)
# ============================================================

def split_into_steps(code):
    """Split Python source code into logical steps using AST top-level nodes."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return [{'code': code, 'error': '语法错误: ' + str(e)}]

    steps = []
    for node in tree.body:
        source = ast.get_source_segment(code, node)
        if source is None:
            # Fallback: extract by line numbers
            lines = code.split('\n')
            start = node.lineno - 1
            end = getattr(node, 'end_lineno', node.lineno)
            source = '\n'.join(lines[start:end])
        if source.strip():
            steps.append({'code': source, 'error': None})
    return steps


# ============================================================
#  State persistence
# ============================================================

_BUILTIN_SKIP = {
    '__name__', '__doc__', '__package__', '__loader__',
    '__spec__', '__builtins__', '__file__', '__cached__',
}

def _is_skip_type(val):
    """Check if a value's type should be excluded from state persistence."""
    import types
    if isinstance(val, types.ModuleType):
        return True
    # Skip matplotlib objects (Figure, Axes, etc. cannot be reliably pickled/restored)
    tname = type(val).__name__
    tmod = type(val).__module__ or ''
    if 'matplotlib' in tmod:
        return True
    return False

def _is_mpl_type(val):
    """Check if a value is a matplotlib type (for in-memory tracking only).
    Unlike _is_skip_type, this does NOT match generic modules like pickle/ast."""
    tmod = type(val).__module__ or ''
    if 'matplotlib' in tmod:
        return True
    return False

def _extract_mpl_objects():
    """Extract matplotlib objects from globals() into a dict (in-memory only, not pickled).
    This preserves Figure/Axes references across steps without unreliable pickle serialization.
    Also catches numpy ndarrays with dtype=object (e.g., axes arrays from plt.subplots)."""
    import numpy as np
    mpl = {}
    for name in list(globals().keys()):
        if name.startswith('_') or name in _BUILTIN_SKIP:
            continue
        val = globals()[name]
        is_mpl = _is_mpl_type(val)
        # Also catch numpy arrays containing matplotlib objects (e.g., axes from plt.subplots)
        if not is_mpl and isinstance(val, np.ndarray) and val.dtype == object:
            is_mpl = True
        if is_mpl:
            mpl[name] = val
            del globals()[name]
    return mpl

def _restore_mpl_objects(mpl_dict):
    """Restore matplotlib objects from in-memory dict back into globals()."""
    globals().update(mpl_dict)

def save_state(exclude_names):
    """Serialize user-defined variables to a pickle file."""
    state = {}
    for name, val in list(globals().items()):
        if name.startswith('_') or name in exclude_names or name in _BUILTIN_SKIP:
            continue
        if callable(val) and not isinstance(val, type):
            continue  # skip functions (helper-defined ones are in exclude_names)
        if _is_skip_type(val):
            continue
        try:
            data = pickle.dumps(val, protocol=pickle.HIGHEST_PROTOCOL)
            if len(data) < 50 * 1024 * 1024:  # skip vars > 50 MB
                state[name] = val
        except Exception:
            pass
    with open(STATE_FILE, 'wb') as f:
        pickle.dump(state, f, protocol=pickle.HIGHEST_PROTOCOL)


def load_state():
    """Deserialize variables from the pickle file."""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'rb') as f:
                return pickle.load(f)
        except Exception:
            return {}
    return {}


# ============================================================
#  Variable summarization
# ============================================================

def summarize_var(value):
    """Return a short human-readable summary of a variable."""
    try:
        import numpy as np
        if isinstance(value, np.ndarray):
            if value.dtype == object:
                return 'ndarray | shape={} dtype=object ({})'.format(
                    value.shape, type(value.flat[0]).__name__ if value.size > 0 else 'empty')
            mn, mx = value.min(), value.max()
            return 'ndarray | shape={} dtype={} range=[{},{}]'.format(
                value.shape, value.dtype, mn, mx)
    except ImportError:
        pass

    if isinstance(value, (int, float, bool)):
        return '{} = {}'.format(type(value).__name__, value)
    if isinstance(value, str):
        s = value if len(value) <= 80 else value[:77] + '...'
        return 'str = "{}"'.format(s)
    if isinstance(value, (list, tuple)):
        tname = type(value).__name__
        return '{} len={}'.format(tname, len(value))
    if isinstance(value, dict):
        keys = list(value.keys())[:6]
        return 'dict keys={}'.format(keys)
    if isinstance(value, set):
        return 'set len={}'.format(len(value))
    return type(value).__name__


# ============================================================
#  Image collection
# ============================================================

_IMAGE_PATTERN = 'result*.*'
_IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif'}

def _scan_images():
    """Return set of result image filenames in current directory."""
    found = set()
    for f in glob.glob(_IMAGE_PATTERN):
        ext = os.path.splitext(f)[1].lower()
        if ext in _IMAGE_EXTS:
            found.add(f)
    return found


# ============================================================
#  Main execution
# ============================================================

def run_all(student_code, helper_code):
    """Execute student code step-by-step, returning a list of step results."""
    steps = split_into_steps(student_code)
    if not steps:
        return []

    # Execute helper preamble (defines imread_color, savefig, info, etc.)
    try:
        exec(compile(helper_code, '<helper>', 'exec'), globals())
    except Exception as e:
        return [{'stepIndex': -1, 'code': '# helper init', 'stdout': '',
                 'stderr': 'Helper初始化失败: ' + str(e),
                 'images': [], 'variables': {}, 'hasError': True}]

    # Remember everything the helper defined — we won't persist these
    helper_names = set(globals().keys())

    # In-memory store for matplotlib objects that can't be pickled
    mpl_objects = {}

    results = []
    for idx, step in enumerate(steps):
        step_code = step['code']
        result = {
            'stepIndex': idx,
            'code': step_code,
            'stdout': '',
            'stderr': '',
            'images': [],
            'variables': {},
            'hasError': False,
        }

        # If split_into_steps reported a syntax error, surface it
        if step.get('error'):
            result['stderr'] = step['error']
            result['hasError'] = True
            results.append(result)
            break

        # Load state from previous step
        prev_state = load_state()
        globals().update(prev_state)

        # Restore matplotlib objects (fig, axes, etc.) from previous steps
        _restore_mpl_objects(mpl_objects)

        # Snapshot images before execution
        images_before = _scan_images()

        # Capture stdout
        buf = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = buf

        try:
            compiled = compile(step_code, '<step_{}>'.format(idx), 'exec')
            exec(compiled, globals())
            result['stdout'] = buf.getvalue()
        except Exception:
            result['stderr'] = traceback.format_exc()
            result['hasError'] = True
            result['stdout'] = buf.getvalue()
        finally:
            sys.stdout = old_stdout

        # Collect new images
        images_after = _scan_images()
        new_images = sorted(images_after - images_before)
        result['images'] = new_images

        # Extract matplotlib objects from globals() into in-memory store
        # Must happen BEFORE save_state so pickle doesn't try to serialize them
        mpl_objects.update(_extract_mpl_objects())

        # Save state for next step (non-matplotlib variables only)
        save_state(helper_names)

        # Variable summary — only user-created vars
        for name, val in globals().items():
            if name.startswith('_') or name in helper_names or name in _BUILTIN_SKIP:
                continue
            if callable(val) and not isinstance(val, type):
                continue
            if _is_skip_type(val):
                continue
            result['variables'][name] = summarize_var(val)

        results.append(result)

        # Stop on error to avoid cascading failures
        if result['hasError']:
            break

    return results


# ============================================================
#  Entry point
# ============================================================

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: step_runner.py <code_file> <helper_file>'}))
        sys.exit(1)

    code_file = sys.argv[1]
    helper_file = sys.argv[2]

    with open(code_file, 'r', encoding='utf-8') as f:
        student_code = f.read()
    with open(helper_file, 'r', encoding='utf-8') as f:
        helper_code = f.read()

    # Ensure we're in the working directory
    work_dir = os.environ.get('WORK_DIR', '.')
    os.chdir(work_dir)

    steps_result = run_all(student_code, helper_code)

    # Write JSON output
    with open('step_results.json', 'w', encoding='utf-8') as f:
        json.dump(steps_result, f, ensure_ascii=False, indent=2)
