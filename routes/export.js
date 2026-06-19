const express = require('express');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// ========== Export Routes (teacher/admin only) ==========

// Helper: escape a CSV field (wrap in quotes if it contains comma, quote, or newline)
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Helper: set UTF-8 BOM CSV headers for download
function setCsvHeaders(res, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(filename) + '"');
}

// GET /export/grades - export individual grades CSV
router.get('/grades', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { assignment_id, chapter_id, class_name } = req.query;

    let sql = `
      SELECT
        u.student_id AS student_number,
        u.real_name AS student_name,
        u.class_name,
        a.title AS assignment_title,
        a.max_score,
        s.submitted_at,
        s.score,
        s.status,
        s.feedback
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (assignment_id) {
      sql += ' AND s.assignment_id = ?';
      params.push(assignment_id);
    }
    if (chapter_id) {
      sql += ' AND a.chapter_id = ?';
      params.push(chapter_id);
    }
    if (class_name) {
      sql += ' AND u.class_name = ?';
      params.push(class_name);
    }

    sql += ' ORDER BY u.class_name, u.student_id, s.submitted_at DESC';

    const rows = req.db.prepare(sql).all(...params);

    // Build CSV
    const BOM = '\uFEFF';
    const header = ['学号', '姓名', '班级', '作业标题', '提交时间', '分数', '满分', '得分率', '状态', '评语'];
    const lines = [header.map(csvEscape).join(',')];

    const statusMap = { pending: '待批改', reviewed: '已批阅', returned: '已退回', graded: '已评分' };

    for (const row of rows) {
      const rate = (row.score !== null && row.score !== undefined && row.max_score)
        ? ((row.score / row.max_score) * 100).toFixed(1) + '%'
        : '--';
      lines.push([
        csvEscape(row.student_number),
        csvEscape(row.student_name),
        csvEscape(row.class_name),
        csvEscape(row.assignment_title),
        csvEscape(row.submitted_at),
        csvEscape(row.score !== null && row.score !== undefined ? row.score : '--'),
        csvEscape(row.max_score),
        csvEscape(rate),
        csvEscape(statusMap[row.status] || row.status),
        csvEscape(row.feedback)
      ].join(','));
    }

    setCsvHeaders(res, '成绩导出.csv');
    res.send(BOM + lines.join('\n'));
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /export/summary - export class-level summary CSV
router.get('/summary', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    // Get all students grouped by class
    const classes = req.db.prepare(`
      SELECT DISTINCT class_name FROM users
      WHERE role = 'student' AND class_name IS NOT NULL AND class_name != ''
      ORDER BY class_name
    `).all();

    const BOM = '\uFEFF';
    const header = ['班级', '学生人数', '已提交数', '提交率', '平均分', '最高分', '最低分', '及格率'];
    const lines = [header.map(csvEscape).join(',')];

    for (const cls of classes) {
      // Total students in class
      const totalStudents = req.db.prepare(
        "SELECT COUNT(*) AS cnt FROM users WHERE role = 'student' AND class_name = ?"
      ).get(cls.class_name).cnt;

      // Distinct students who submitted
      const submitted = req.db.prepare(`
        SELECT COUNT(DISTINCT s.student_id) AS cnt
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE u.class_name = ? AND u.role = 'student'
      `).get(cls.class_name).cnt;

      // Score stats (only graded/reviewed submissions with a score)
      const stats = req.db.prepare(`
        SELECT
          AVG(s.score) AS avg_score,
          MAX(s.score) AS max_score,
          MIN(s.score) AS min_score,
          SUM(CASE WHEN s.score >= a.max_score * 0.6 THEN 1 ELSE 0 END) AS pass_count,
          COUNT(s.score) AS scored_count
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        JOIN assignments a ON s.assignment_id = a.id
        WHERE u.class_name = ? AND u.role = 'student' AND s.score IS NOT NULL
      `).get(cls.class_name);

      const submitRate = totalStudents > 0 ? ((submitted / totalStudents) * 100).toFixed(1) + '%' : '--';
      const avgScore = stats.avg_score !== null ? stats.avg_score.toFixed(1) : '--';
      const maxScore = stats.max_score !== null ? stats.max_score : '--';
      const minScore = stats.min_score !== null ? stats.min_score : '--';
      const passRate = stats.scored_count > 0
        ? ((stats.pass_count / stats.scored_count) * 100).toFixed(1) + '%'
        : '--';

      lines.push([
        csvEscape(cls.class_name),
        csvEscape(totalStudents),
        csvEscape(submitted),
        csvEscape(submitRate),
        csvEscape(avgScore),
        csvEscape(maxScore),
        csvEscape(minScore),
        csvEscape(passRate)
      ].join(','));
    }

    setCsvHeaders(res, '班级汇总.csv');
    res.send(BOM + lines.join('\n'));
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
