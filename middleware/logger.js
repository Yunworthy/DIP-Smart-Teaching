// Request logging middleware - logs HTTP requests to database
module.exports = function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    const originalEnd = res.end;

    res.end = function(...args) {
      const duration = Date.now() - start;
      const userId = req.user ? req.user.id : null;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      // Only log API requests (skip static files)
      if (req.path.startsWith('/api/')) {
        try {
          req.db.prepare(`
            INSERT INTO request_logs (method, path, status_code, response_time, user_id, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(req.method, req.path, res.statusCode, duration, userId, ip);
          req.db.save();
        } catch(e) { /* ignore logging errors */ }
      }

      originalEnd.apply(res, args);
    };

    next();
  };
};
