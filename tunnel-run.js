/**
 * tunnel-run.js — Starts tunnel, saves URL to tunnel-url.txt, keeps running.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const URL_FILE = path.join(__dirname, 'tunnel-url.txt');

console.log('[tunnel] Starting public tunnel ...');

const ssh = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'ServerAliveInterval=60',
  '-o', 'ServerAliveCountMax=3',
  '-R', '80:localhost:3000',
  'nokey@localhost.run'
], { stdio: ['ignore', 'pipe', 'pipe'] });

function handle(data) {
  const text = data.toString();
  process.stdout.write(text);
  const match = text.match(/https:\/\/[a-z0-9]+\.lhr\.life/);
  if (match) {
    fs.writeFileSync(URL_FILE, match[0], 'utf8');
    console.log('\n>>> URL saved to tunnel-url.txt: ' + match[0] + ' <<<\n');
  }
}

ssh.stdout.on('data', handle);
ssh.stderr.on('data', handle);

ssh.on('close', (code) => {
  console.log('[tunnel] Exited with code:', code);
  try { fs.unlinkSync(URL_FILE); } catch {}
  process.exit(code || 0);
});

process.on('SIGINT', () => { ssh.kill(); process.exit(0); });
