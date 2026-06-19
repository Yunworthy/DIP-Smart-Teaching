/**
 * tunnel-persistent.js — Persistent public tunnel with auto-restart.
 *
 * Usage:
 *   node tunnel-persistent.js          # starts tunnel, saves URL
 *   node tunnel-persistent.js --daemon # runs detached (background)
 *
 * Supports:
 *   1. cloudflared (Cloudflare Quick Tunnel) — preferred
 *   2. localhost.run SSH tunnel — fallback
 *
 * The public URL is always written to tunnel-url.txt.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const URL_FILE = path.join(__dirname, 'tunnel-url.txt');
const LOG_FILE = path.join(__dirname, 'tunnel.log');
const RESTART_DELAY = 5000; // ms before restart after crash
const MAX_RESTARTS = 50;    // safety cap per session

let restartCount = 0;
let currentProcess = null;

// ------------------------------------------------------------------
//  Logging
// ------------------------------------------------------------------
function log(msg) {
  const line = `[${new Date().toLocaleString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

// ------------------------------------------------------------------
//  Detect available tunnel tool
// ------------------------------------------------------------------
function detectTool() {
  // 1. cloudflared.exe in project root (manual download)
  const localPath = path.join(__dirname, 'cloudflared.exe');
  if (fs.existsSync(localPath)) {
    const stat = fs.statSync(localPath);
    if (stat.size > 5 * 1024 * 1024) {
      return { type: 'cloudflared', cmd: localPath };
    }
  }

  // 2. cloudflared binary from npm package
  const npmPath = path.join(__dirname, 'node_modules', 'cloudflared', 'bin', 'cloudflared.exe');
  if (fs.existsSync(npmPath)) {
    const stat = fs.statSync(npmPath);
    if (stat.size > 5 * 1024 * 1024) {
      return { type: 'cloudflared', cmd: npmPath };
    }
  }

  // 3. System-wide cloudflared
  try {
    const { execSync } = require('child_process');
    execSync('cloudflared --version', { stdio: 'ignore' });
    return { type: 'cloudflared', cmd: 'cloudflared' };
  } catch {}

  // 4. SSH fallback (localhost.run)
  try {
    const { execSync } = require('child_process');
    execSync('ssh -V', { stdio: 'ignore' });
    return { type: 'ssh' };
  } catch {}

  return null;
}

// ------------------------------------------------------------------
//  Cloudflare Quick Tunnel
// ------------------------------------------------------------------
function startCloudflared(cmd) {
  log('Starting Cloudflare Quick Tunnel ...');
  const proc = spawn(cmd, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let urlFound = false;

  function handle(data) {
    const text = data.toString();
    // cloudflared prints URL like: https://xxx-xxx-xxx.trycloudflare.com
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      fs.writeFileSync(URL_FILE, match[0], 'utf8');
      log('>>> Public URL: ' + match[0]);
      log('>>> URL saved to tunnel-url.txt');
    }
  }

  proc.stdout.on('data', handle);
  proc.stderr.on('data', handle);
  return proc;
}

// ------------------------------------------------------------------
//  localhost.run SSH Tunnel (fallback)
// ------------------------------------------------------------------
function startSSHTunnel() {
  log('Starting localhost.run SSH tunnel (fallback) ...');
  const proc = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-o', 'ConnectTimeout=10',
    '-R', `80:localhost:${PORT}`,
    'nokey@localhost.run',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let urlFound = false;

  function handle(data) {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-z0-9]+\.lhr\.life/);
    if (match && !urlFound) {
      urlFound = true;
      fs.writeFileSync(URL_FILE, match[0], 'utf8');
      log('>>> Public URL: ' + match[0]);
      log('>>> URL saved to tunnel-url.txt');
    }
  }

  proc.stdout.on('data', handle);
  proc.stderr.on('data', handle);
  return proc;
}

// ------------------------------------------------------------------
//  Main loop with auto-restart
// ------------------------------------------------------------------
function startTunnel() {
  if (restartCount >= MAX_RESTARTS) {
    log('Max restarts reached (' + MAX_RESTARTS + '). Giving up.');
    process.exit(1);
  }

  const tool = detectTool();
  if (!tool) {
    log('ERROR: No tunnel tool available (need cloudflared or ssh).');
    process.exit(1);
  }

  log('Using tunnel type: ' + tool.type);
  restartCount++;
  log('Attempt #' + restartCount);

  if (tool.type === 'cloudflared') {
    currentProcess = startCloudflared(tool.cmd);
  } else {
    currentProcess = startSSHTunnel();
  }

  currentProcess.on('close', (code) => {
    log('Tunnel exited with code: ' + code);
    try { fs.unlinkSync(URL_FILE); } catch {}
    if (code !== 0 || restartCount < MAX_RESTARTS) {
      log('Restarting in ' + (RESTART_DELAY / 1000) + 's ...');
      setTimeout(startTunnel, RESTART_DELAY);
    }
  });

  currentProcess.on('error', (err) => {
    log('Tunnel error: ' + err.message);
  });
}

// ------------------------------------------------------------------
//  Daemon mode: detach and exit
// ------------------------------------------------------------------
if (process.argv.includes('--daemon')) {
  log('Launching tunnel in daemon mode ...');
  const detached = spawn(process.execPath, [__filename], {
    cwd: __dirname,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  });
  detached.unref();
  log('Daemon started (PID: ' + detached.pid + ')');
  log('Check tunnel-url.txt for the public URL');
  process.exit(0);
}

// ------------------------------------------------------------------
//  Graceful shutdown
// ------------------------------------------------------------------
process.on('SIGINT', () => {
  log('Shutting down ...');
  if (currentProcess) currentProcess.kill();
  try { fs.unlinkSync(URL_FILE); } catch {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Shutting down ...');
  if (currentProcess) currentProcess.kill();
  try { fs.unlinkSync(URL_FILE); } catch {}
  process.exit(0);
});

// Start
startTunnel();
