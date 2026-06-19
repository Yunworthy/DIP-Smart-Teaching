const express = require('express');

const router = express.Router();

// GET / - list all enterprise cases with chapter info
router.get('/', (req, res) => {
  try {
    const cases = req.db.prepare(`
      SELECT
        ec.id,
        ec.title,
        ec.description,
        ec.category,
        ec.related_chapter_id,
        ec.content,
        ec.results_text,
        ec.production_issues,
        ec.sample_images,
        ec.difficulty,
        c.title AS chapter_title,
        c.sort_order AS chapter_order
      FROM enterprise_cases ec
      LEFT JOIN chapters c ON ec.related_chapter_id = c.id
      ORDER BY c.sort_order, ec.id
    `).all();

    res.json(cases);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /:id - get single case detail
router.get('/:id', (req, res) => {
  try {
    const caseItem = req.db.prepare(`
      SELECT
        ec.*,
        c.title AS chapter_title,
        c.sort_order AS chapter_order
      FROM enterprise_cases ec
      LEFT JOIN chapters c ON ec.related_chapter_id = c.id
      WHERE ec.id = ?
    `).get(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ error: '案例不存在' });
    }

    res.json(caseItem);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
