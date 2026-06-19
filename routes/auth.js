const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// POST /login - validate username/password, return JWT token + user info
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = req.db.prepare(
      'SELECT id, username, password, real_name, role, student_id, class_name, email, avatar, is_active FROM users WHERE username = ?'
    ).get(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: '账号已被禁用，请联系管理员' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Exclude password from response
    const { password: _, ...userInfo } = user;

    logAudit(req.db, { user_id: user.id, username: user.username, action: 'login', detail: '用户登录成功', ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json({ token, user: userInfo });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /me - return current user info (auth required)
router.get('/me', authenticate, (req, res) => {
  try {
    const user = req.db.prepare(
      'SELECT id, username, real_name, role, student_id, class_name, email, avatar, created_at, is_active FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /password - change password (auth required)
router.put('/password', authenticate, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入旧密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6位' });
    }

    const user = req.db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const valid = bcrypt.compareSync(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: '旧密码错误' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    req.db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /register - create new user (auth + admin only)
router.post('/register', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { username, password, real_name, role, student_id, class_name, email } = req.body;

    if (!username || !password || !real_name || !role) {
      return res.status(400).json({ error: '请填写必填字段：用户名、密码、姓名、角色' });
    }

    const existing = req.db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = req.db.prepare(
      'INSERT INTO users (username, password, real_name, role, student_id, class_name, email) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(username, hash, real_name, role, student_id || null, class_name || null, email || null);

    const user = req.db.prepare(
      'SELECT id, username, real_name, role, student_id, class_name, email, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(user);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
