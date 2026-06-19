/**
 * code-runner.js — Backend code execution service
 * Executes Python and Octave code with image I/O support.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Octave CLI path (configurable via env)
const OCTAVE_PATH = process.env.OCTAVE_PATH ||
  'C:\\Program Files\\GNU Octave\\Octave-11.3.0\\mingw64\\bin\\octave-cli.exe';
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Run code with an input image and return results.
 * @param {string} code - Student code to execute
 * @param {string} language - 'python' or 'octave'
 * @param {string} imageBase64 - Base64 encoded input image (without data URI prefix)
 * @returns {Promise<{stdout: string, stderr: string, images: string[], exitCode: number, executionTime: number}>}
 */
async function runCode(code, language, imageBase64) {
  // Create isolated temp directory
  const runId = crypto.randomBytes(8).toString('hex');
  const tmpDir = path.join(os.tmpdir(), 'dip_run_' + runId);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // Save input image
    if (imageBase64) {
      const cleanB64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(cleanB64, 'base64');
      fs.writeFileSync(path.join(tmpDir, 'input.png'), imgBuffer);
    }

    const startTime = Date.now();

    let result;
    if (language === 'python') {
      result = await runPython(code, tmpDir);
    } else if (language === 'octave') {
      result = await runOctave(code, tmpDir);
    } else {
      throw new Error('Unsupported language: ' + language);
    }

    result.executionTime = (Date.now() - startTime) / 1000;

    // Collect output images
    result.images = collectOutputImages(tmpDir);

    return result;
  } finally {
    // Cleanup temp directory
    cleanupDir(tmpDir);
  }
}

/**
 * Execute Python code
 */
function runPython(code, tmpDir) {
  return new Promise((resolve) => {
    // Read helper preamble
    const helperPath = path.join(__dirname, 'python_helper.py');
    let helperCode = '';
    if (fs.existsSync(helperPath)) {
      helperCode = fs.readFileSync(helperPath, 'utf8');
    }

    // Build full script: helper + student code
    const fullScript = helperCode + '\n# === Student Code ===\n' + code;
    const scriptPath = path.join(tmpDir, 'main.py');
    fs.writeFileSync(scriptPath, fullScript, 'utf8');

    const env = {
      ...process.env,
      INPUT_IMAGE: 'input.png',
      WORK_DIR: tmpDir,
      PYTHONIOENCODING: 'utf-8',
      MPLBACKEND: 'Agg'
    };

    const proc = spawn(PYTHON_PATH, [scriptPath], {
      cwd: tmpDir,
      env: env,
      timeout: DEFAULT_TIMEOUT,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, DEFAULT_TIMEOUT);

    proc.on('close', (exitCode) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({ stdout, stderr: stderr + '\n[超时] 代码执行超过30秒已被终止。', exitCode: -1 });
      } else {
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: '启动Python失败: ' + err.message, exitCode: -1 });
    });
  });
}

/**
 * Execute Octave code
 */
function runOctave(code, tmpDir) {
  return new Promise((resolve) => {
    // Check if octave exists
    if (!fs.existsSync(OCTAVE_PATH)) {
      resolve({
        stdout: '',
        stderr: 'Octave未安装。请联系管理员安装GNU Octave，或选择Python语言。',
        exitCode: -1
      });
      return;
    }

    // Read helper preamble
    const helperPath = path.join(__dirname, 'octave_helper.m');
    let helperCode = '';
    if (fs.existsSync(helperPath)) {
      helperCode = fs.readFileSync(helperPath, 'utf8');
    }

    // Build full script
    const fullScript = helperCode + '\n%% === Student Code ===\n' + code;
    const scriptPath = path.join(tmpDir, 'main.m');
    fs.writeFileSync(scriptPath, fullScript, 'utf8');

    const env = {
      ...process.env,
      INPUT_IMAGE: 'input.png',
      WORK_DIR: tmpDir
    };

    const proc = spawn(OCTAVE_PATH, ['--no-gui', '--no-window-system', scriptPath], {
      cwd: tmpDir,
      env: env,
      timeout: DEFAULT_TIMEOUT,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, DEFAULT_TIMEOUT);

    proc.on('close', (exitCode) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({ stdout, stderr: stderr + '\n[超时] 代码执行超过30秒已被终止。', exitCode: -1 });
      } else {
        // Filter out Octave banner lines
        stdout = stdout.replace(/^warning:.*$/gm, '').trim();
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: '启动Octave失败: ' + err.message, exitCode: -1 });
    });
  });
}

/**
 * Scan temp directory for output images and return as base64 array
 */
function collectOutputImages(tmpDir) {
  const images = [];
  try {
    const files = fs.readdirSync(tmpDir)
      .filter(f => /^result.*\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f))
      .sort();

    for (const file of files) {
      const filePath = path.join(tmpDir, file);
      const stat = fs.statSync(filePath);
      // Limit individual image size to 5MB
      if (stat.size > 0 && stat.size < 5 * 1024 * 1024) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(file).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' ? 'jpeg' : ext;
        const base64 = 'data:image/' + mime + ';base64,' + buffer.toString('base64');
        images.push({ name: file, data: base64 });
      }
    }
  } catch (e) {
    // Ignore errors during image collection
  }
  return images;
}

/**
 * Recursively remove a directory
 */
function cleanupDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (e) {
    // Best effort cleanup
  }
}

module.exports = { runCode };
