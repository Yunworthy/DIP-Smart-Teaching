const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// ========== Stats ==========

// GET /stats - comprehensive dashboard statistics (admin or teacher)
router.get('/stats', authenticate, requireRole('admin', 'teacher'), (req, res) => {
  try {
    // Total users
    const totalUsers = req.db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_active = 1').get().count;

    // User counts by role
    const userCounts = req.db.prepare(`
      SELECT role, COUNT(*) AS count FROM users WHERE is_active = 1 GROUP BY role
    `).all();
    const roleMap = {};
    userCounts.forEach(u => { roleMap[u.role] = u.count; });
    const studentCount = roleMap.student || 0;

    // Total submissions
    const totalSubmissions = req.db.prepare('SELECT COUNT(*) AS count FROM submissions').get().count;

    // Active users (submissions in last 30 days)
    const activeUsers = req.db.prepare(`
      SELECT COUNT(DISTINCT student_id) AS count FROM submissions
      WHERE submitted_at >= datetime('now', '-30 days')
    `).get().count;

    // Pending submissions (not reviewed)
    const pendingReviews = req.db.prepare(`
      SELECT COUNT(*) AS count FROM submissions WHERE status = 'pending'
    `).get().count;

    // Week submissions
    const weekSubmissions = req.db.prepare(`
      SELECT COUNT(*) AS count FROM submissions
      WHERE submitted_at >= datetime('now', '-7 days')
    `).get().count;

    // Average score
    const avgScoreResult = req.db.prepare(`
      SELECT AVG(score) AS avg FROM submissions WHERE score IS NOT NULL AND score > 0
    `).get();
    const avgScore = avgScoreResult && avgScoreResult.avg ? Math.round(avgScoreResult.avg * 10) / 10 : 0;

    // Submission trend (last 7 days)
    const submissionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = req.db.prepare(`
        SELECT COUNT(*) AS count FROM submissions
        WHERE date(submitted_at) = ?
      `).get(dateStr).count;
      submissionTrend.push({ date: dateStr, count });
    }

    // Role distribution for pie chart
    const roleDistribution = userCounts.map(u => ({ role: u.role, count: u.count }));

    // Daily active users (last 30 days)
    const dailyActive = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = req.db.prepare(`
        SELECT COUNT(DISTINCT student_id) AS count FROM submissions
        WHERE date(submitted_at) = ?
      `).get(dateStr).count;
      dailyActive.push({ date: dateStr, count });
    }

    // Recent announcements
    const announcements = req.db.prepare(`
      SELECT a.*, u.real_name AS author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.is_pinned DESC, a.created_at DESC
      LIMIT 5
    `).all();

    // Recent activities
    const recentActivities = req.db.prepare(`
      SELECT action, username, detail, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `).all().map(log => ({
      type: log.action || 'system',
      user: log.username || '',
      description: log.detail || log.action,
      time: log.created_at
    }));

    // Total experiments
    const totalExperiments = req.db.prepare('SELECT COUNT(*) AS count FROM simulations').get().count;

    res.json({
      totalUsers,
      activeUsers,
      studentCount,
      totalSubmissions,
      pendingReviews,
      weekSubmissions,
      avgScore,
      submissionTrend,
      roleDistribution,
      dailyActive,
      announcements,
      recentActivities,
      totalExperiments,
      // Legacy snake_case for backward compatibility
      user_counts: userCounts,
      total_users: totalUsers,
      total_submissions: totalSubmissions,
      active_users_30d: activeUsers
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== User Management ==========

// GET /users - list all users with pagination (admin only)
router.get('/users', authenticate, requireRole('admin'), (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const total = req.db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const users = req.db.prepare(`
      SELECT id, username, real_name, role, student_id, class_name, email, avatar, created_at, is_active
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /users - create user (admin only)
router.post('/users', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { username, password, real_name, role, student_id, class_name, email } = req.body;

    if (!username || !password || !real_name || !role) {
      return res.status(400).json({ error: '请填写必填字段：用户名、密码、姓名、角色' });
    }

    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: '无效的角色类型' });
    }

    const existing = req.db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = req.db.prepare(`
      INSERT INTO users (username, password, real_name, role, student_id, class_name, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, hash, real_name, role, student_id || null, class_name || null, email || null);

    const user = req.db.prepare(
      'SELECT id, username, real_name, role, student_id, class_name, email, created_at, is_active FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(user);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /users/:id - update user (admin only)
router.put('/users/:id', authenticate, requireRole('admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { real_name, role, student_id, class_name, email, is_active, password } = req.body;

    // If password is provided, hash it
    let passwordHash = existing.password;
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    req.db.prepare(`
      UPDATE users
      SET real_name = ?, role = ?, student_id = ?, class_name = ?, email = ?, is_active = ?, password = ?
      WHERE id = ?
    `).run(
      real_name !== undefined ? real_name : existing.real_name,
      role || existing.role,
      student_id !== undefined ? student_id : existing.student_id,
      class_name !== undefined ? class_name : existing.class_name,
      email !== undefined ? email : existing.email,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      passwordHash,
      req.params.id
    );

    const user = req.db.prepare(
      'SELECT id, username, real_name, role, student_id, class_name, email, created_at, is_active FROM users WHERE id = ?'
    ).get(req.params.id);

    res.json(user);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// DELETE /users/:id - soft delete user (admin only)
router.delete('/users/:id', authenticate, requireRole('admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (existing.id === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账号' });
    }

    req.db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);

    res.json({ message: '用户已禁用' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Students List (for teachers) ==========

// GET /students - list all students (teacher/admin only)
router.get('/students', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const students = req.db.prepare(
      "SELECT id, username, real_name, student_id, class_name, email, is_active FROM users WHERE role='student' ORDER BY student_id"
    ).all();
    res.json(students);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Announcements ==========

// POST /announcements - create announcement (teacher or admin)
router.post('/announcements', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { title, content, is_pinned } = req.body;

    if (!title) {
      return res.status(400).json({ error: '请填写公告标题' });
    }

    const result = req.db.prepare(`
      INSERT INTO announcements (author_id, title, content, is_pinned)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, title, content || null, is_pinned ? 1 : 0);

    const announcement = req.db.prepare(`
      SELECT a.*, u.real_name AS author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(announcement);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /announcements - list all announcements with author name
router.get('/announcements', (req, res) => {
  try {
    const announcements = req.db.prepare(`
      SELECT a.*, u.real_name AS author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.is_pinned DESC, a.created_at DESC
    `).all();

    res.json(announcements);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Audit & Request Logs ==========

// GET /audit-logs - list audit logs
router.get('/audit-logs', authenticate, requireRole('admin'), (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const offset = (page - 1) * size;
    const action = req.query.action || null;
    const userId = req.query.user_id || null;

    let where = '1=1';
    const params = [];
    if (action) { where += ' AND action = ?'; params.push(action); }
    if (userId) { where += ' AND user_id = ?'; params.push(userId); }

    const total = req.db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE ' + where).get(...params).count;
    const logs = req.db.prepare('SELECT * FROM audit_logs WHERE ' + where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?').all(...params, size, offset);

    res.json({ logs, total, page, size, totalPages: Math.ceil(total / size) });
  } catch(err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /request-logs - list HTTP request logs
router.get('/request-logs', authenticate, requireRole('admin'), (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 50;
    const offset = (page - 1) * size;

    const total = req.db.prepare('SELECT COUNT(*) as count FROM request_logs').get().count;
    const logs = req.db.prepare('SELECT * FROM request_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(size, offset);

    res.json({ logs, total, page, size, totalPages: Math.ceil(total / size) });
  } catch(err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /dashboard-stats - system statistics for dashboard
router.get('/dashboard-stats', authenticate, requireRole('admin'), (req, res) => {
  try {
    const userCount = req.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const submissionCount = req.db.prepare('SELECT COUNT(*) as count FROM code_submissions').get().count;
    const examAttemptCount = req.db.prepare('SELECT COUNT(*) as count FROM exam_attempts').get().count;
    const todayLogins = req.db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action='login' AND date(created_at)=date('now')").get().count;
    const todayRequests = req.db.prepare("SELECT COUNT(*) as count FROM request_logs WHERE date(created_at)=date('now')").get().count;

    res.json({ userCount, submissionCount, examAttemptCount, todayLogins, todayRequests });
  } catch(err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
