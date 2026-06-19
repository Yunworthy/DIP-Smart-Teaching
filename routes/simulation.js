const express = require('express');

const router = express.Router();

// GET / - list all simulations with chapter info
router.get('/', (req, res) => {
  try {
    const simulations = req.db.prepare(`
      SELECT
        s.id,
        s.sim_key,
        s.title,
        s.description,
        s.chapter_id,
        s.category,
        s.sample_image,
        s.case_text,
        s.difficulty,
        s.requirements,
        c.title AS chapter_title,
        c.sort_order AS chapter_order
      FROM simulations s
      LEFT JOIN chapters c ON s.chapter_id = c.id
      ORDER BY c.sort_order, s.id
    `).all();

    res.json(simulations);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /:key - get single simulation by sim_key (parse parameters JSON)
router.get('/:key', (req, res) => {
  try {
    const sim = req.db.prepare(`
      SELECT
        s.*,
        c.title AS chapter_title,
        c.sort_order AS chapter_order
      FROM simulations s
      LEFT JOIN chapters c ON s.chapter_id = c.id
      WHERE s.sim_key = ?
    `).get(req.params.key);

    if (!sim) {
      return res.status(404).json({ error: '仿真实验不存在' });
    }

    // Parse parameters from JSON string
    let parameters = [];
    try {
      parameters = sim.parameters ? JSON.parse(sim.parameters) : [];
    } catch (e) {
      parameters = [];
    }

    // Parse ai_hints from JSON string
    let ai_hints = null;
    try {
      ai_hints = sim.ai_hints ? JSON.parse(sim.ai_hints) : null;
    } catch (e) {
      ai_hints = null;
    }

    // Get linked knowledge points
    const knowledgePoints = req.db.prepare(`
      SELECT kp.id, kp.title, kp.description, kp.difficulty, kp.category
      FROM knowledge_points kp
      INNER JOIN kp_simulations kps ON kp.id = kps.knowledge_point_id
      WHERE kps.simulation_key = ?
      ORDER BY kp.sort_order
    `).all(req.params.key);

    res.json({
      ...sim,
      parameters,
      ai_hints,
      knowledge_points: knowledgePoints
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
