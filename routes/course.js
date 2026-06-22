const express = require('express');

const router = express.Router();

// GET / - list all chapters with knowledge point count and simulation count
router.get('/', (req, res) => {
  try {
    const chapters = req.db.prepare(`
      SELECT
        c.id,
        c.sort_order,
        c.title,
        c.subtitle,
        c.description,
        (SELECT COUNT(*) FROM knowledge_points kp WHERE kp.chapter_id = c.id) AS knowledge_point_count,
        (SELECT COUNT(*) FROM simulations s WHERE s.chapter_id = c.id) AS simulation_count
      FROM chapters c
      ORDER BY c.sort_order
    `).all();

    res.json(chapters);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /:id/knowledge-points — add knowledge point to chapter
router.post('/:id/knowledge-points', (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: '标题不能为空' });
    const chapterId = parseInt(req.params.id);
    const maxOrder = req.db.prepare('SELECT MAX(sort_order) as max_order FROM knowledge_points WHERE chapter_id = ?').get(chapterId);
    const sortOrder = (maxOrder?.max_order || 0) + 1;
    const result = req.db.prepare('INSERT INTO knowledge_points (chapter_id, title, description, sort_order) VALUES (?, ?, ?, ?)').run(chapterId, title, description || '', sortOrder);
    req.db.save();
    res.json({ id: result.lastInsertRowid, title, description, sort_order: sortOrder });
  } catch (err) {
    console.error('添加知识点失败:', err.message);
    res.status(500).json({ error: '添加知识点失败' });
  }
});

// PUT /knowledge-points/:kpId — update knowledge point
router.put('/knowledge-points/:kpId', (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: '标题不能为空' });
    req.db.prepare('UPDATE knowledge_points SET title = ?, description = ? WHERE id = ?').run(title, description || '', parseInt(req.params.kpId));
    req.db.save();
    res.json({ message: '知识点已更新' });
  } catch (err) {
    console.error('更新知识点失败:', err.message);
    res.status(500).json({ error: '更新知识点失败' });
  }
});

// DELETE /knowledge-points/:kpId — delete knowledge point
router.delete('/knowledge-points/:kpId', (req, res) => {
  try {
    req.db.prepare('DELETE FROM kp_simulations WHERE knowledge_point_id = ?').run(parseInt(req.params.kpId));
    req.db.prepare('DELETE FROM knowledge_points WHERE id = ?').run(parseInt(req.params.kpId));
    req.db.save();
    res.json({ message: '知识点已删除' });
  } catch (err) {
    console.error('删除知识点失败:', err.message);
    res.status(500).json({ error: '删除知识点失败' });
  }
});

// GET /:id - get chapter detail with all knowledge points and linked simulations
router.get('/:id', (req, res) => {
  try {
    const chapter = req.db.prepare(
      'SELECT * FROM chapters WHERE id = ?'
    ).get(req.params.id);

    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }

    const knowledgePoints = req.db.prepare(`
      SELECT kp.*
      FROM knowledge_points kp
      WHERE kp.chapter_id = ?
      ORDER BY kp.sort_order
    `).all(req.params.id);

    const simulations = req.db.prepare(`
      SELECT s.*
      FROM simulations s
      WHERE s.chapter_id = ?
      ORDER BY s.id
    `).all(req.params.id);

    // Attach linked simulations to each knowledge point
    const kpIds = knowledgePoints.map(kp => kp.id);
    if (kpIds.length > 0) {
      const kpSimLinks = req.db.prepare(`
        SELECT kps.knowledge_point_id, kps.simulation_key, s.title AS sim_title
        FROM kp_simulations kps
        LEFT JOIN simulations s ON kps.simulation_key = s.sim_key
        WHERE kps.knowledge_point_id IN (${kpIds.join(',')})
      `).all();
      const simMap = {};
      for (const link of kpSimLinks) {
        if (!simMap[link.knowledge_point_id]) simMap[link.knowledge_point_id] = [];
        simMap[link.knowledge_point_id].push({ key: link.simulation_key, title: link.sim_title || link.simulation_key });
      }
      for (const kp of knowledgePoints) {
        kp.simulations = simMap[kp.id] || [];
      }
    }

    res.json({
      ...chapter,
      knowledge_points: knowledgePoints,
      simulations: simulations
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /:id — update chapter description
router.put('/:id', (req, res) => {
  try {
    const { description } = req.body;
    const chapter = req.db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
    if (!chapter) return res.status(404).json({ error: '章节不存在' });
    req.db.prepare('UPDATE chapters SET description = ? WHERE id = ?').run(description || '', parseInt(req.params.id));
    req.db.save();
    res.json({ message: '章节已更新' });
  } catch (err) {
    console.error('更新章节失败:', err.message);
    res.status(500).json({ error: '更新章节失败' });
  }
});

module.exports = router;
