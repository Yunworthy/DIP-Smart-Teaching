const jwt = require('jsonwebtoken');
const config = require('../config');

// ============================================================
//  AUTH_BYPASS: 临时关闭登录验证（恢复时改为 false）
// ============================================================
const AUTH_BYPASS = true;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Bypass mode: when no token present, auto-inject a default user
  if (AUTH_BYPASS && (!authHeader || !authHeader.startsWith('Bearer '))) {
    req.user = { id: 1, role: 'admin', username: 'demo' };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    // Bypass mode: if token is invalid, still allow through with default user
    if (AUTH_BYPASS) {
      req.user = { id: 1, role: 'admin', username: 'demo' };
      return next();
    }
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

module.exports = authenticate;
