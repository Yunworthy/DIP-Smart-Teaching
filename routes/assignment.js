const express = require('express');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// ========== Assignment Routes ==========

// GET /assignments - list assignments
// Students see published only; teachers see their own + all published
router.get('/assignments', authenticate, (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'student') {
      assignments = req.db.prepare(`
        SELECT
          a.*,
          u.real_name AS teacher_name,
          c.title AS chapter_title
        FROM assignments a
        LEFT JOIN users u ON a.teacher_id = u.id
        LEFT JOIN chapters c ON a.chapter_id = c.id
        WHERE a.is_published = 1
        ORDER BY a.created_at DESC
      `).all();
    } else {
      // Teachers and admins see all assignments
      assignments = req.db.prepare(`
        SELECT
          a.*,
          u.real_name AS teacher_name,
          c.title AS chapter_title
        FROM assignments a
        LEFT JOIN users u ON a.teacher_id = u.id
        LEFT JOIN chapters c ON a.chapter_id = c.id
        ORDER BY a.created_at DESC
      `).all();
    }

    res.json(assignments);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /assignments - create assignment (teacher only)
router.post('/assignments', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, type, chapter_id, simulation_key, deadline, max_score, is_published } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: '请填写作业标题和类型' });
    }

    const result = req.db.prepare(`
      INSERT INTO assignments (teacher_id, title, description, type, chapter_id, simulation_key, deadline, max_score, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title,
      description || null,
      type,
      chapter_id || null,
      simulation_key || null,
      deadline || null,
      max_score || 100,
      is_published ? 1 : 0
    );

    const assignment = req.db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);
    if (req.db.save) req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'create', resource_type: 'assignment', resource_id: String(result.lastInsertRowid), detail: '创建作业: ' + title, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.status(201).json(assignment);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /assignments/:id - update assignment (teacher only)
router.put('/assignments/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, type, chapter_id, simulation_key, deadline, max_score, is_published } = req.body;

    const existing = req.db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '作业不存在' });
    }

    req.db.prepare(`
      UPDATE assignments
      SET title = ?, description = ?, type = ?, chapter_id = ?, simulation_key = ?, deadline = ?, max_score = ?, is_published = ?
      WHERE id = ?
    `).run(
      title || existing.title,
      description !== undefined ? description : existing.description,
      type || existing.type,
      chapter_id !== undefined ? chapter_id : existing.chapter_id,
      simulation_key !== undefined ? simulation_key : existing.simulation_key,
      deadline !== undefined ? deadline : existing.deadline,
      max_score || existing.max_score,
      is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
      req.params.id
    );

    const assignment = req.db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (req.db.save) req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'update', resource_type: 'assignment', resource_id: req.params.id, detail: '更新作业: ' + (title || existing.title), ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json(assignment);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// DELETE /assignments/:id - delete assignment (teacher only)
router.delete('/assignments/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '作业不存在' });
    }

    // Delete associated submissions first
    req.db.prepare('DELETE FROM submissions WHERE assignment_id = ?').run(req.params.id);
    req.db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    if (req.db.save) req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'delete', resource_type: 'assignment', resource_id: req.params.id, detail: '删除作业: ' + existing.title, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json({ message: '作业已删除' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /assignments/:id/submissions - list submissions for an assignment (teacher only)
router.get('/assignments/:id/submissions', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const assignment = req.db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const submissions = req.db.prepare(`
      SELECT
        s.*,
        u.real_name AS student_name,
        u.student_id AS student_number,
        u.class_name,
        r.real_name AS reviewer_name
      FROM submissions s
      LEFT JOIN users u ON s.student_id = u.id
      LEFT JOIN users r ON s.reviewed_by = r.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `).all(req.params.id);

    res.json(submissions);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Submission Routes ==========

// POST /submissions - submit assignment (student only)
router.post('/submissions', authenticate, requireRole('student'), (req, res) => {
  try {
    const { assignment_id, content, file_path, simulation_result } = req.body;

    if (!assignment_id) {
      return res.status(400).json({ error: '请指定作业ID' });
    }

    const assignment = req.db.prepare('SELECT * FROM assignments WHERE id = ? AND is_published = 1').get(assignment_id);
    if (!assignment) {
      return res.status(404).json({ error: '作业不存在或未发布' });
    }

    // Check if deadline has passed
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
      return res.status(400).json({ error: '已超过截止时间，无法提交' });
    }

    // Check for existing submission
    const existing = req.db.prepare(
      'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?'
    ).get(assignment_id, req.user.id);

    if (existing) {
      // Update existing submission
      req.db.prepare(`
        UPDATE submissions
        SET content = ?, file_path = ?, simulation_result = ?, submitted_at = CURRENT_TIMESTAMP, status = 'pending'
        WHERE id = ?
      `).run(
        content || null,
        file_path || null,
        simulation_result || null,
        existing.id
      );

      const submission = req.db.prepare('SELECT * FROM submissions WHERE id = ?').get(existing.id);
      if (req.db.save) req.db.save();
      return res.json(submission);
    }

    const result = req.db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, content, file_path, simulation_result)
      VALUES (?, ?, ?, ?, ?)
    `).run(assignment_id, req.user.id, content || null, file_path || null, simulation_result || null);

    const submission = req.db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);
    if (req.db.save) req.db.save();
    res.status(201).json(submission);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /submissions/mine - list my submissions with assignment info (student only)
router.get('/submissions/mine', authenticate, requireRole('student'), (req, res) => {
  try {
    const submissions = req.db.prepare(`
      SELECT
        s.*,
        a.title AS assignment_title,
        a.type AS assignment_type,
        a.deadline,
        a.max_score,
        c.title AS chapter_title,
        r.real_name AS reviewer_name
      FROM submissions s
      LEFT JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN chapters c ON a.chapter_id = c.id
      LEFT JOIN users r ON s.reviewed_by = r.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `).all(req.user.id);

    res.json(submissions);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /submissions/:id/review - review submission (teacher only)
router.put('/submissions/:id/review', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { score, feedback, status } = req.body;

    const submission = req.db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    const newStatus = status || 'graded';
    const validStatuses = ['pending', 'reviewed', 'returned', 'graded'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    req.db.prepare(`
      UPDATE submissions
      SET score = ?, feedback = ?, status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      score !== undefined ? score : submission.score,
      feedback !== undefined ? feedback : submission.feedback,
      newStatus,
      req.user.id,
      req.params.id
    );

    const updated = req.db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (req.db.save) req.db.save();

    // Create notification for the student
    req.db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (?, 'assignment_graded', ?, ?, ?)
    `).run(
      submission.student_id,
      '作业已批改',
      '您的作业已被批改，得分：' + (score !== undefined ? score : submission.score),
      '/student/homework'
    );
    req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'grade', resource_type: 'submission', resource_id: req.params.id, detail: '批改作业提交 #' + req.params.id + (score !== undefined ? ', 分数: ' + score : ''), ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json(updated);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /submissions/batch-review - batch review submissions (teacher only)
router.post('/submissions/batch-review', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { submission_ids, score, feedback, status } = req.body;

    if (!Array.isArray(submission_ids) || submission_ids.length === 0) {
      return res.status(400).json({ error: '请选择要批改的提交' });
    }

    const newStatus = status || 'graded';
    const validStatuses = ['pending', 'reviewed', 'returned', 'graded'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    const stmt = req.db.prepare(`
      UPDATE submissions
      SET score = ?, feedback = ?, status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let updatedCount = 0;
    for (const subId of submission_ids) {
      const submission = req.db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
      if (submission) {
        stmt.run(
          score !== undefined ? score : submission.score,
          feedback !== undefined ? feedback : submission.feedback,
          newStatus,
          req.user.id,
          subId
        );
        // Create notification for the student
        req.db.prepare(`
          INSERT INTO notifications (user_id, type, title, content, link)
          VALUES (?, 'assignment_graded', ?, ?, ?)
        `).run(
          submission.student_id,
          '作业已批改',
          '您的作业已被批改，得分：' + (score !== undefined ? score : submission.score),
          '/student/homework'
        );
        updatedCount++;
      }
    }

    if (req.db.save) req.db.save();
    res.json({ message: '批量评分完成', updated: updatedCount });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
