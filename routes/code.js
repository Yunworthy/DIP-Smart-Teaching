const express = require('express');
const authenticate = require('../middleware/auth');
const { runCode } = require('../services/code-runner');

const router = express.Router();

// POST /api/code/run — Execute student code
router.post('/run', authenticate, async (req, res) => {
  try {
    const { code, language, imageData } = req.body;

    // Validate inputs
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: '请提供代码内容' });
    }
    if (!language || !['python', 'octave'].includes(language)) {
      return res.status(400).json({ error: '语言必须为 python 或 octave' });
    }
    if (code.length > 50 * 1024) {
      return res.status(400).json({ error: '代码长度不能超过50KB' });
    }

    // Run the code
    const result = await runCode(code, language, imageData || '');

    // Record submission if simulation_key is provided
    const { simulationKey } = req.body;
    if (simulationKey && req.db) {
      try {
        req.db.prepare(`
          INSERT INTO code_submissions (student_id, simulation_key, language, code, stdout, stderr, output_images, status, execution_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.user.id,
          simulationKey,
          language,
          code,
          result.stdout || '',
          result.stderr || '',
          JSON.stringify(result.images || []),
          result.exitCode === 0 ? 'success' : (result.exitCode === -1 ? 'timeout' : 'error'),
          result.executionTime || 0
        );
      } catch (e) {
        // Don't fail the request if recording fails
        console.error('Failed to record submission:', e.message);
      }
    }

    res.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      images: result.images || [],
      exitCode: result.exitCode,
      executionTime: result.executionTime || 0
    });
  } catch (err) {
    console.error('Code execution error:', err);
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /api/code/submissions/:simKey — Get student's past submissions for an experiment
router.get('/submissions/:simKey', authenticate, (req, res) => {
  try {
    const submissions = req.db.prepare(`
      SELECT id, language, code, stdout, stderr, status, execution_time, submitted_at
      FROM code_submissions
      WHERE student_id = ? AND simulation_key = ?
      ORDER BY submitted_at DESC
      LIMIT 20
    `).all(req.user.id, req.params.simKey);

    res.json(submissions);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
