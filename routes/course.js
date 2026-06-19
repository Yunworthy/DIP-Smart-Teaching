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

module.exports = router;
