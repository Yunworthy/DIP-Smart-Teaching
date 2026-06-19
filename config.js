const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dip-platform-secret-key-2026',
  jwtExpiresIn: '24h',
  dbPath: path.join(__dirname, 'database', 'platform.db'),
  uploadsDir: path.join(__dirname, 'uploads'),
  publicDir: path.join(__dirname, 'public'),
};
