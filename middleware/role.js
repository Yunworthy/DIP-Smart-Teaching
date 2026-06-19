function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: '权限不足' });
    }
    // Admin is a superuser — can access any role-restricted route
    if (req.user.role === 'admin') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

module.exports = requireRole;
