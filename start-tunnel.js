const lt = require('./node_modules/localtunnel');
lt({ port: 3000, local_host: 'localhost' })
  .then(tunnel => {
    console.log('=== PUBLIC URL ===');
    console.log(tunnel.url);
    console.log('==================');
    console.log('Tunnel running. Press Ctrl+C to stop.');
    tunnel.on('close', () => console.log('Tunnel closed.'));
    tunnel.on('error', err => console.error('Tunnel error:', err.message));
  })
  .catch(err => {
    console.error('Failed to start tunnel:', err.message);
    process.exit(1);
  });
