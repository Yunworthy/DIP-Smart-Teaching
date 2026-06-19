const express = require('express');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// GET / - return full knowledge graph: all nodes + all edges, include chapter info in nodes
router.get('/', (req, res) => {
  try {
    const nodes = req.db.prepare(`
      SELECT
        kp.id,
        kp.chapter_id,
        kp.parent_id,
        kp.title,
        kp.description,
        kp.principle,
        kp.difficulty,
        kp.sort_order,
        kp.category,
        c.title AS chapter_title,
        c.sort_order AS chapter_order
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      ORDER BY kp.chapter_id, kp.sort_order
    `).all();

    const edges = req.db.prepare(`
      SELECT id, source_id, target_id, relation_type, weight
      FROM kp_relations
    `).all();

    // Attach linked simulations to each KP node
    const kpSimLinks = req.db.prepare(`
      SELECT kps.knowledge_point_id, kps.simulation_key, s.title AS sim_title
      FROM kp_simulations kps
      LEFT JOIN simulations s ON kps.simulation_key = s.sim_key
    `).all();
    const simMap = {};
    for (const link of kpSimLinks) {
      if (!simMap[link.knowledge_point_id]) simMap[link.knowledge_point_id] = [];
      simMap[link.knowledge_point_id].push({ key: link.simulation_key, title: link.sim_title || link.simulation_key });
    }
    for (const node of nodes) {
      node.simulations = simMap[node.id] || [];
    }

    res.json({ nodes, edges });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /progress - update learning progress (student only)
// NOTE: Must be defined before /:chapterId to avoid "progress" being matched as a parameter
router.put('/progress', authenticate, requireRole('student'), (req, res) => {
  try {
    const { knowledge_point_id, mastery_level, simulation_completed } = req.body;

    if (!knowledge_point_id) {
      return res.status(400).json({ error: '请指定知识点ID' });
    }

    const kp = req.db.prepare('SELECT * FROM knowledge_points WHERE id = ?').get(knowledge_point_id);
    if (!kp) {
      return res.status(404).json({ error: '知识点不存在' });
    }

    // Check for existing progress record
    const existing = req.db.prepare(
      'SELECT * FROM learning_progress WHERE student_id = ? AND knowledge_point_id = ?'
    ).get(req.user.id, knowledge_point_id);

    if (existing) {
      req.db.prepare(`
        UPDATE learning_progress
        SET mastery_level = ?, simulation_completed = ?, last_accessed = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        mastery_level !== undefined ? mastery_level : existing.mastery_level,
        simulation_completed !== undefined ? simulation_completed : existing.simulation_completed,
        existing.id
      );
    } else {
      req.db.prepare(`
        INSERT INTO learning_progress (student_id, knowledge_point_id, mastery_level, simulation_completed)
        VALUES (?, ?, ?, ?)
      `).run(
        req.user.id,
        knowledge_point_id,
        mastery_level || 0,
        simulation_completed ? 1 : 0
      );
    }

    const progress = req.db.prepare(
      'SELECT * FROM learning_progress WHERE student_id = ? AND knowledge_point_id = ?'
    ).get(req.user.id, knowledge_point_id);

    res.json(progress);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /progress - get my learning progress for all knowledge points (student only)
// NOTE: Must be defined before /:chapterId to avoid "progress" being matched as a parameter
router.get('/progress', authenticate, requireRole('student'), (req, res) => {
  try {
    const progress = req.db.prepare(`
      SELECT
        lp.*,
        kp.title AS knowledge_point_title,
        kp.chapter_id,
        kp.difficulty,
        kp.category,
        c.title AS chapter_title
      FROM learning_progress lp
      LEFT JOIN knowledge_points kp ON lp.knowledge_point_id = kp.id
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      WHERE lp.student_id = ?
      ORDER BY kp.chapter_id, kp.sort_order
    `).all(req.user.id);

    res.json(progress);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /:chapterId - return graph data for specific chapter only
router.get('/:chapterId', (req, res) => {
  try {
    const chapterId = req.params.chapterId;

    const chapter = req.db.prepare('SELECT * FROM chapters WHERE id = ?').get(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }

    const nodes = req.db.prepare(`
      SELECT
        kp.id,
        kp.chapter_id,
        kp.parent_id,
        kp.title,
        kp.description,
        kp.principle,
        kp.difficulty,
        kp.sort_order,
        kp.category,
        c.title AS chapter_title,
        c.sort_order AS chapter_order
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      WHERE kp.chapter_id = ?
      ORDER BY kp.sort_order
    `).all(chapterId);

    // Get node IDs for this chapter to filter edges
    const nodeIds = nodes.map(n => n.id);

    // Get edges where source or target belongs to this chapter
    const edges = req.db.prepare(`
      SELECT id, source_id, target_id, relation_type, weight
      FROM kp_relations
    `).all().filter(e => nodeIds.includes(e.source_id) || nodeIds.includes(e.target_id));

    // Attach linked simulations to each KP node
    const kpSimLinks = req.db.prepare(`
      SELECT kps.knowledge_point_id, kps.simulation_key, s.title AS sim_title
      FROM kp_simulations kps
      LEFT JOIN simulations s ON kps.simulation_key = s.sim_key
      WHERE kps.knowledge_point_id IN (${nodeIds.join(',')})
    `).all();
    const simMap = {};
    for (const link of kpSimLinks) {
      if (!simMap[link.knowledge_point_id]) simMap[link.knowledge_point_id] = [];
      simMap[link.knowledge_point_id].push({ key: link.simulation_key, title: link.sim_title || link.simulation_key });
    }
    for (const node of nodes) {
      node.simulations = simMap[node.id] || [];
    }

    res.json({ chapter, nodes, edges });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
