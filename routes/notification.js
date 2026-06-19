const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

// GET / — list current user's notifications (paginated)
router.get('/', authenticate, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));
    const offset = (page - 1) * size;
    const unreadOnly = req.query.unread_only === '1';

    let where = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (unreadOnly) {
      where += ' AND is_read = 0';
    }

    const total = req.db.prepare(
      'SELECT COUNT(*) as count FROM notifications ' + where
    ).get(...params).count;

    const notifications = req.db.prepare(`
      SELECT * FROM notifications
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, size, offset);

    res.json({ notifications, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /unread-count — return count of unread notifications
router.get('/unread-count', authenticate, (req, res) => {
  try {
    const result = req.db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user.id);
    res.json({ count: result.count });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /read-all — mark all user's notifications as read
router.put('/read-all', authenticate, (req, res) => {
  try {
    req.db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
    ).run(req.user.id);
    if (req.db.save) req.db.save();
    res.json({ message: '已全部标记为已读' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /:id/read — mark one notification as read
router.put('/:id/read', authenticate, (req, res) => {
  try {
    const notification = req.db.prepare(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    req.db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ?'
    ).run(req.params.id);
    if (req.db.save) req.db.save();

    res.json({ message: '已标记为已读' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
