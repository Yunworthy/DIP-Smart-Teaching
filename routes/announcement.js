const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

// GET / — list announcements (all users can see)
router.get('/', authenticate, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));
    const offset = (page - 1) * size;

    const total = req.db.prepare(
      'SELECT COUNT(*) as count FROM announcements'
    ).get().count;

    const announcements = req.db.prepare(`
      SELECT a.*, u.real_name AS author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.is_pinned DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(size, offset);

    res.json({ announcements, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST / — create announcement (teacher/admin only)
router.post('/', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { title, content, is_pinned } = req.body;

    if (!title) {
      return res.status(400).json({ error: '请填写公告标题' });
    }

    const result = req.db.prepare(`
      INSERT INTO announcements (author_id, title, content, is_pinned)
      VALUES (?, ?, ?, ?)
    `).run(
      req.user.id,
      title,
      content || null,
      is_pinned ? 1 : 0
    );

    // Create notification for all users
    const users = req.db.prepare('SELECT id FROM users').all();
    const insertNotification = req.db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (?, 'announcement', ?, ?, '/student/announcements')
    `);
    for (const u of users) {
      insertNotification.run(u.id, '系统公告：' + title, content || title);
    }

    if (req.db.save) req.db.save();

    const announcement = req.db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(announcement);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /:id — update announcement (teacher/admin only)
router.put('/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '公告不存在' });
    }

    const { title, content, is_pinned } = req.body;

    req.db.prepare(`
      UPDATE announcements
      SET title = ?, content = ?, is_pinned = ?
      WHERE id = ?
    `).run(
      title || existing.title,
      content !== undefined ? content : existing.content,
      is_pinned !== undefined ? (is_pinned ? 1 : 0) : existing.is_pinned,
      req.params.id
    );

    if (req.db.save) req.db.save();
    const announcement = req.db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    res.json(announcement);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// DELETE /:id — delete announcement (teacher/admin only)
router.delete('/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '公告不存在' });
    }

    req.db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    if (req.db.save) req.db.save();

    res.json({ message: '公告已删除' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
