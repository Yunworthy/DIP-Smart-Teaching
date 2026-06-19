/**
 * tunnel.js — Starts an SSH reverse tunnel to expose localhost:3000 publicly.
 * Uses localhost.run (free, no account required).
 * Usage: node tunnel.js
 */
const { spawn } = require('child_process');

console.log('[tunnel] Starting public tunnel for localhost:3000 ...');

const ssh = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'ServerAliveInterval=60',
  '-o', 'ServerAliveCountMax=3',
  '-o', 'ExitOnForwardFailure=yes',
  '-R', '80:localhost:3000',
  'nokey@localhost.run'
], { stdio: ['ignore', 'pipe', 'pipe'] });

let urlFound = false;

function handleOutput(data) {
  const line = data.toString();
  // Look for the tunnel URL in output
  const match = line.match(/https:\/\/[a-z0-9]+\.lhr\.life/);
  if (match && !urlFound) {
    urlFound = true;
    console.log('\n========================================');
    console.log('  PUBLIC URL: ' + match[0]);
    console.log('========================================\n');
    console.log('Share this URL with others to access the platform.');
    console.log('Press Ctrl+C to stop the tunnel.\n');
  }
  process.stdout.write(line);
}

ssh.stdout.on('data', handleOutput);
ssh.stderr.on('data', handleOutput);

ssh.on('close', (code) => {
  console.log('[tunnel] Tunnel process exited with code:', code);
  process.exit(code || 0);
});

ssh.on('error', (err) => {
  console.error('[tunnel] Failed to start tunnel:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[tunnel] Shutting down...');
  ssh.kill();
  process.exit(0);
});
