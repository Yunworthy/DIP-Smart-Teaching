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
 * Run code step-by-step for educational walkthrough.
 * Splits student code into logical steps, executes each step sequentially
 * while persisting variable state, and collects per-step results.
 *
 * @param {string} code - Student code to execute
 * @param {string} language - 'python' or 'octave'
 * @param {string} imageBase64 - Base64 encoded input image
 * @returns {Promise<{steps: Array, totalSteps: number, totalTime: number}>}
 */
async function runSteps(code, language, imageBase64) {
  const runId = crypto.randomBytes(8).toString('hex');
  const tmpDir = path.join(os.tmpdir(), 'dip_steps_' + runId);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // Save input image
    if (imageBase64) {
      const cleanB64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(cleanB64, 'base64');
      fs.writeFileSync(path.join(tmpDir, 'input.png'), imgBuffer);
    }

    const startTime = Date.now();
    let stepsResult;

    if (language === 'python') {
      stepsResult = await runPythonSteps(code, tmpDir);
    } else if (language === 'octave') {
      // Octave step mode: fall back to single-run with code split info
      stepsResult = await runOctaveSteps(code, tmpDir);
    } else {
      throw new Error('Unsupported language: ' + language);
    }

    const totalTime = (Date.now() - startTime) / 1000;

    // Collect per-step images as base64
    for (const step of stepsResult) {
      if (step.images && step.images.length > 0) {
        const imageDatas = [];
        for (const imgFile of step.images) {
          const imgPath = path.join(tmpDir, imgFile);
          try {
            const stat = fs.statSync(imgPath);
            if (stat.size > 0 && stat.size < 5 * 1024 * 1024) {
              const buf = fs.readFileSync(imgPath);
              const ext = path.extname(imgFile).toLowerCase().replace('.', '');
              const mime = ext === 'jpg' ? 'jpeg' : ext;
              imageDatas.push({
                name: imgFile,
                data: 'data:image/' + mime + ';base64,' + buf.toString('base64')
              });
            }
          } catch (e) { /* skip missing files */ }
        }
        step.images = imageDatas;
      }
    }

    return { steps: stepsResult, totalSteps: stepsResult.length, totalTime };
  } finally {
    cleanupDir(tmpDir);
  }
}

/**
 * Python step-by-step execution using step_runner.py
 */
function runPythonSteps(code, tmpDir) {
  return new Promise((resolve) => {
    // Read helper preamble
    const helperPath = path.join(__dirname, 'python_helper.py');
    let helperCode = '';
    if (fs.existsSync(helperPath)) {
      helperCode = fs.readFileSync(helperPath, 'utf8');
    }

    // Write student code and helper code to separate files
    const codePath = path.join(tmpDir, 'student_code.py');
    const helperCodePath = path.join(tmpDir, 'helper_code.py');
    fs.writeFileSync(codePath, code, 'utf8');
    fs.writeFileSync(helperCodePath, helperCode, 'utf8');

    // Run step_runner.py
    const runnerPath = path.join(__dirname, 'step_runner.py');
    const env = {
      ...process.env,
      INPUT_IMAGE: 'input.png',
      WORK_DIR: tmpDir,
      PYTHONIOENCODING: 'utf-8',
      MPLBACKEND: 'Agg'
    };

    const proc = spawn(PYTHON_PATH, [runnerPath, codePath, helperCodePath], {
      cwd: tmpDir,
      env: env,
      timeout: 60000, // 60s for step mode (multiple steps)
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
    }, 60000);

    proc.on('close', (exitCode) => {
      clearTimeout(timer);

      if (timedOut) {
        resolve([{
          stepIndex: 0, code: code, stdout: '',
          stderr: '[超时] 分步执行超过60秒已被终止。',
          images: [], variables: {}, hasError: true
        }]);
        return;
      }

      // Read step_results.json
      const resultsPath = path.join(tmpDir, 'step_results.json');
      try {
        if (fs.existsSync(resultsPath)) {
          const data = fs.readFileSync(resultsPath, 'utf8');
          const parsed = JSON.parse(data);
          resolve(Array.isArray(parsed) ? parsed : [parsed]);
        } else {
          resolve([{
            stepIndex: 0, code: code, stdout: stdout,
            stderr: stderr || 'step_results.json 未生成，执行可能失败。',
            images: [], variables: {}, hasError: true
          }]);
        }
      } catch (e) {
        resolve([{
          stepIndex: 0, code: code, stdout: stdout,
          stderr: '解析分步结果失败: ' + e.message + '\n' + stderr,
          images: [], variables: {}, hasError: true
        }]);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve([{
        stepIndex: 0, code: code, stdout: '',
        stderr: '启动Python失败: ' + err.message,
        images: [], variables: {}, hasError: true
      }]);
    });
  });
}

/**
 * Octave step-by-step execution (simplified: line-by-line split)
 */
function runOctaveSteps(code, tmpDir) {
  return new Promise((resolve) => {
    if (!fs.existsSync(OCTAVE_PATH)) {
      resolve([{
        stepIndex: 0, code: code, stdout: '',
        stderr: 'Octave未安装。请联系管理员安装GNU Octave，或选择Python语言。',
        images: [], variables: {}, hasError: true
      }]);
      return;
    }

    // Split Octave code by top-level statements (lines ending with ;)
    const lines = code.split('\n');
    const steps = [];
    let currentStep = [];

    for (const line of lines) {
      currentStep.push(line);
      // A step boundary: line ends with ; or is a control structure end
      const trimmed = line.trim();
      if (trimmed.endsWith(';') || trimmed === 'end' || trimmed.startsWith('disp(') ||
          trimmed.startsWith('fprintf(') || trimmed.startsWith('printf(')) {
        const stepCode = currentStep.join('\n').trim();
        if (stepCode) steps.push(stepCode);
        currentStep = [];
      }
    }
    // Flush remaining
    if (currentStep.length > 0) {
      const stepCode = currentStep.join('\n').trim();
      if (stepCode) steps.push(stepCode);
    }

    // Build a wrapper script that executes steps and saves state between them
    const helperPath = path.join(__dirname, 'octave_helper.m');
    let helperCode = '';
    if (fs.existsSync(helperPath)) {
      helperCode = fs.readFileSync(helperPath, 'utf8');
    }

    let script = helperCode + '\n';
    const stateFile = path.join(tmpDir, '_octave_state.mat').replace(/\\/g, '/');

    for (let i = 0; i < steps.length; i++) {
      const stepCode = steps[i].replace(/'/g, "''"); // escape single quotes for Octave strings
      // Load state from previous step
      if (i > 0) {
        script += 'try; load("' + stateFile + '"); catch; end\n';
      }
      // Execute step code
      script += steps[i] + '\n';
      // Save workspace state (exclude functions and built-in vars)
      script += 'save("' + stateFile + '");\n';
      // Print step separator
      script += 'disp("===STEP_' + i + '_END===");\n';
    }

    const scriptPath = path.join(tmpDir, 'main.m');
    fs.writeFileSync(scriptPath, script, 'utf8');

    const env = {
      ...process.env,
      INPUT_IMAGE: 'input.png',
      WORK_DIR: tmpDir
    };

    const proc = spawn(OCTAVE_PATH, ['--no-gui', '--no-window-system', scriptPath], {
      cwd: tmpDir,
      env: env,
      timeout: 60000,
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
    }, 60000);

    proc.on('close', (exitCode) => {
      clearTimeout(timer);

      if (timedOut) {
        resolve([{
          stepIndex: 0, code: code, stdout: '',
          stderr: '[超时] Octave分步执行超过60秒已被终止。',
          images: [], variables: {}, hasError: true
        }]);
        return;
      }

      // Parse stdout into steps by splitting on ===STEP_N_END=== markers
      const results = [];
      const outputParts = stdout.split(/===STEP_\d+_END===/);

      for (let i = 0; i < steps.length; i++) {
        const stepStdout = (outputParts[i] || '').replace(/^warning:.*$/gm, '').trim();
        // Collect images for this step
        const stepImages = [];
        try {
          const files = fs.readdirSync(tmpDir)
            .filter(f => /^result.*\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f))
            .sort();
          // For Octave step mode, we can only attribute all images to the last step
          if (i === steps.length - 1) {
            stepImages.push(...files);
          }
        } catch (e) {}

        results.push({
          stepIndex: i,
          code: steps[i],
          stdout: stepStdout,
          stderr: i === steps.length - 1 ? stderr.replace(/^warning:.*$/gm, '').trim() : '',
          images: stepImages,
          variables: {},
          hasError: exitCode !== 0 && i === steps.length - 1
        });
      }

      resolve(results.length > 0 ? results : [{
        stepIndex: 0, code: code, stdout: stdout,
        stderr: stderr, images: [], variables: {}, hasError: exitCode !== 0
      }]);
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve([{
        stepIndex: 0, code: code, stdout: '',
        stderr: '启动Octave失败: ' + err.message,
        images: [], variables: {}, hasError: true
      }]);
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

module.exports = { runCode, runSteps };
