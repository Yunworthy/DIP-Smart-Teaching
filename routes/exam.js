const express = require('express');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// ========== Question Bank (teacher/admin) ==========

// GET /questions — list questions with filters and pagination
router.get('/questions', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));
    const offset = (page - 1) * size;

    let where = 'WHERE 1=1';
    const params = [];

    if (req.query.chapter_id) {
      where += ' AND q.chapter_id = ?';
      params.push(parseInt(req.query.chapter_id));
    }
    if (req.query.type) {
      where += ' AND q.type = ?';
      params.push(req.query.type);
    }
    if (req.query.difficulty) {
      where += ' AND q.difficulty = ?';
      params.push(parseInt(req.query.difficulty));
    }
    if (req.query.keyword) {
      where += ' AND q.content LIKE ?';
      params.push('%' + req.query.keyword + '%');
    }

    const total = req.db.prepare(
      'SELECT COUNT(*) as count FROM exam_questions q ' + where
    ).get(...params).count;

    const questions = req.db.prepare(`
      SELECT q.*, c.title AS chapter_title, u.real_name AS creator_name
      FROM exam_questions q
      LEFT JOIN chapters c ON q.chapter_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      ${where}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, size, offset);

    res.json({ questions, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /questions — create question
router.post('/questions', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { chapter_id, type, content, options, answer, explanation, difficulty, score_weight } = req.body;

    if (!type || !content || answer === undefined || answer === null || answer === '') {
      return res.status(400).json({ error: '请填写题目类型、内容和答案' });
    }

    const validTypes = ['single_choice', 'multi_choice', 'true_false', 'fill_blank', 'short_answer'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的题目类型' });
    }

    const result = req.db.prepare(`
      INSERT INTO exam_questions (chapter_id, type, content, options, answer, explanation, difficulty, score_weight, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chapter_id || null,
      type,
      content,
      options || null,
      answer,
      explanation || null,
      difficulty || 3,
      score_weight || 5,
      req.user.id
    );

    req.db.save();
    const question = req.db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(question);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /questions/:id — update question
router.put('/questions/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '题目不存在' });
    }

    const { chapter_id, type, content, options, answer, explanation, difficulty, score_weight } = req.body;

    req.db.prepare(`
      UPDATE exam_questions
      SET chapter_id = ?, type = ?, content = ?, options = ?, answer = ?, explanation = ?, difficulty = ?, score_weight = ?
      WHERE id = ?
    `).run(
      chapter_id !== undefined ? chapter_id : existing.chapter_id,
      type || existing.type,
      content || existing.content,
      options !== undefined ? options : existing.options,
      answer !== undefined ? answer : existing.answer,
      explanation !== undefined ? explanation : existing.explanation,
      difficulty || existing.difficulty,
      score_weight || existing.score_weight,
      req.params.id
    );

    req.db.save();
    const question = req.db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(req.params.id);
    res.json(question);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// DELETE /questions/:id — delete question
router.delete('/questions/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '题目不存在' });
    }

    req.db.prepare('DELETE FROM exam_questions_map WHERE question_id = ?').run(req.params.id);
    req.db.prepare('DELETE FROM exam_questions WHERE id = ?').run(req.params.id);
    req.db.save();

    res.json({ message: '题目已删除' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Exams (teacher/admin) ==========

// GET /exams — list exams
router.get('/exams', authenticate, (req, res) => {
  try {
    let exams;
    if (req.user.role === 'student') {
      exams = req.db.prepare(`
        SELECT e.*, u.real_name AS teacher_name
        FROM exams e
        LEFT JOIN users u ON e.teacher_id = u.id
        WHERE e.is_published = 1
        ORDER BY e.created_at DESC
      `).all();
    } else {
      exams = req.db.prepare(`
        SELECT e.*, u.real_name AS teacher_name
        FROM exams e
        LEFT JOIN users u ON e.teacher_id = u.id
        ORDER BY e.created_at DESC
      `).all();
    }

    // For each exam, count questions and attempts
    for (const exam of exams) {
      exam.question_actual = req.db.prepare(
        'SELECT COUNT(*) as count FROM exam_questions_map WHERE exam_id = ?'
      ).get(exam.id).count;
      exam.attempt_count = req.db.prepare(
        'SELECT COUNT(*) as count FROM exam_attempts WHERE exam_id = ?'
      ).get(exam.id).count;
    }

    res.json(exams);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /exams — create exam with question selection
router.post('/exams', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const {
      title, description, chapter_ids, duration_minutes, total_score,
      pass_score, question_count, shuffle_questions, shuffle_options,
      start_time, end_time, question_ids
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: '请填写考试标题' });
    }

    const result = req.db.prepare(`
      INSERT INTO exams (title, description, teacher_id, chapter_ids, duration_minutes, total_score, pass_score, question_count, shuffle_questions, shuffle_options, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      req.user.id,
      chapter_ids || null,
      duration_minutes || 60,
      total_score || 100,
      pass_score || 60,
      question_count || 20,
      shuffle_questions !== undefined ? (shuffle_questions ? 1 : 0) : 1,
      shuffle_options !== undefined ? (shuffle_options ? 1 : 0) : 1,
      start_time || null,
      end_time || null
    );

    const examId = result.lastInsertRowid;

    // Add question mappings
    if (question_ids && Array.isArray(question_ids) && question_ids.length > 0) {
      const insertMap = req.db.prepare(
        'INSERT INTO exam_questions_map (exam_id, question_id, sort_order, score) VALUES (?, ?, ?, ?)'
      );
      question_ids.forEach((qid, idx) => {
        const score = qid.score || Math.floor((total_score || 100) / question_ids.length);
        insertMap.run(examId, qid.id || qid, idx, score);
      });
    }

    req.db.save();
    const exam = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'create', resource_type: 'exam', resource_id: String(examId), detail: '创建考试: ' + title, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.status(201).json(exam);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /exams/:id — update exam
router.put('/exams/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const {
      title, description, chapter_ids, duration_minutes, total_score,
      pass_score, question_count, shuffle_questions, shuffle_options,
      start_time, end_time, question_ids
    } = req.body;

    req.db.prepare(`
      UPDATE exams
      SET title = ?, description = ?, chapter_ids = ?, duration_minutes = ?, total_score = ?,
          pass_score = ?, question_count = ?, shuffle_questions = ?, shuffle_options = ?,
          start_time = ?, end_time = ?
      WHERE id = ?
    `).run(
      title || existing.title,
      description !== undefined ? description : existing.description,
      chapter_ids !== undefined ? chapter_ids : existing.chapter_ids,
      duration_minutes || existing.duration_minutes,
      total_score || existing.total_score,
      pass_score !== undefined ? pass_score : existing.pass_score,
      question_count || existing.question_count,
      shuffle_questions !== undefined ? (shuffle_questions ? 1 : 0) : existing.shuffle_questions,
      shuffle_options !== undefined ? (shuffle_options ? 1 : 0) : existing.shuffle_options,
      start_time !== undefined ? start_time : existing.start_time,
      end_time !== undefined ? end_time : existing.end_time,
      req.params.id
    );

    // Update question mappings if provided
    if (question_ids && Array.isArray(question_ids)) {
      req.db.prepare('DELETE FROM exam_questions_map WHERE exam_id = ?').run(req.params.id);
      const insertMap = req.db.prepare(
        'INSERT INTO exam_questions_map (exam_id, question_id, sort_order, score) VALUES (?, ?, ?, ?)'
      );
      question_ids.forEach((qid, idx) => {
        const score = qid.score || Math.floor((total_score || existing.total_score) / question_ids.length);
        insertMap.run(req.params.id, qid.id || qid, idx, score);
      });
    }

    req.db.save();
    const exam = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    res.json(exam);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// DELETE /exams/:id — delete exam
router.delete('/exams/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '考试不存在' });
    }

    req.db.prepare('DELETE FROM exam_attempts WHERE exam_id = ?').run(req.params.id);
    req.db.prepare('DELETE FROM exam_questions_map WHERE exam_id = ?').run(req.params.id);
    req.db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
    req.db.save();

    res.json({ message: '考试已删除' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /exams/:id/publish — publish exam
router.post('/exams/:id/publish', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const existing = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const questionCount = req.db.prepare(
      'SELECT COUNT(*) as count FROM exam_questions_map WHERE exam_id = ?'
    ).get(req.params.id).count;

    if (questionCount === 0) {
      return res.status(400).json({ error: '请先添加考试题目后再发布' });
    }

    req.db.prepare('UPDATE exams SET is_published = 1 WHERE id = ?').run(req.params.id);

    // Create notification for all students
    const students = req.db.prepare("SELECT id FROM users WHERE role = 'student'").all();
    const insertNotification = req.db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (?, 'exam_published', ?, ?, ?)
    `);
    for (const s of students) {
      insertNotification.run(s.id, '新考试发布', '考试"' + existing.title + '"已发布，请及时参加。', '/student/exams');
    }

    req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'publish', resource_type: 'exam', resource_id: req.params.id, detail: '发布考试: ' + existing.title, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    const exam = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    res.json(exam);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /exams/:id/questions — get exam questions for teacher management
router.get('/exams/:id/questions', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const questions = req.db.prepare(`
      SELECT eq.*, em.sort_order, em.score AS exam_score
      FROM exam_questions_map em
      JOIN exam_questions eq ON em.question_id = eq.id
      WHERE em.exam_id = ?
      ORDER BY em.sort_order
    `).all(req.params.id);

    res.json(questions);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Student exam taking ==========

// GET /exams/:id/start — start exam, get questions (without answers)
router.get('/exams/:id/start', authenticate, requireRole('student'), (req, res) => {
  try {
    const exam = req.db.prepare('SELECT * FROM exams WHERE id = ? AND is_published = 1').get(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: '考试不存在或未发布' });
    }

    // Check if student already has an in-progress attempt
    let attempt = req.db.prepare(
      "SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'"
    ).get(req.params.id, req.user.id);

    if (!attempt) {
      // Check if already submitted
      const finished = req.db.prepare(
        "SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND status IN ('submitted','graded')"
      ).get(req.params.id, req.user.id);

      if (finished) {
        return res.status(400).json({ error: '您已完成此考试' });
      }

      // Create new attempt
      const result = req.db.prepare(
        'INSERT INTO exam_attempts (exam_id, student_id) VALUES (?, ?)'
      ).run(req.params.id, req.user.id);
      req.db.save();

      attempt = req.db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(result.lastInsertRowid);
    }

    // Get questions for this exam
    let questions = req.db.prepare(`
      SELECT eq.id, eq.type, eq.content, eq.options, eq.difficulty, em.sort_order, em.score AS exam_score
      FROM exam_questions_map em
      JOIN exam_questions eq ON em.question_id = eq.id
      WHERE em.exam_id = ?
      ORDER BY em.sort_order
    `).all(req.params.id);

    // Shuffle questions if configured
    if (exam.shuffle_questions) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    // Shuffle options for choice questions if configured
    if (exam.shuffle_options) {
      questions = questions.map(q => {
        if ((q.type === 'single_choice' || q.type === 'multi_choice') && q.options) {
          try {
            const opts = JSON.parse(q.options);
            // Create index mapping
            const indexed = opts.map((opt, idx) => ({ opt, origIdx: idx }));
            // Shuffle
            for (let i = indexed.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
            }
            q.options = JSON.stringify(indexed.map(x => x.opt));
            q._optionMap = indexed.map(x => x.origIdx);
          } catch (e) { /* keep original options */ }
        }
        return q;
      });
    }

    // Restore answers if resuming
    let savedAnswers = {};
    if (attempt.answers) {
      try { savedAnswers = JSON.parse(attempt.answers); } catch (e) { savedAnswers = {}; }
    }

    res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration_minutes: exam.duration_minutes,
        total_score: exam.total_score,
        pass_score: exam.pass_score,
      },
      attempt: {
        id: attempt.id,
        started_at: attempt.started_at,
        status: attempt.status,
      },
      questions,
      savedAnswers,
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /exams/:id/submit — submit exam answers
router.post('/exams/:id/submit', authenticate, requireRole('student'), (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: '请提供答案' });
    }

    const attempt = req.db.prepare(
      "SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'"
    ).get(req.params.id, req.user.id);

    if (!attempt) {
      return res.status(404).json({ error: '未找到进行中的考试记录' });
    }

    // Get exam questions with correct answers for grading
    const questions = req.db.prepare(`
      SELECT eq.id, eq.type, eq.answer, em.score AS exam_score
      FROM exam_questions_map em
      JOIN exam_questions eq ON em.question_id = eq.id
      WHERE em.exam_id = ?
    `).all(req.params.id);

    // Auto-grade objective questions
    let objectiveScore = 0;
    let totalObjectiveScore = 0;
    let hasSubjective = false;

    for (const q of questions) {
      const studentAnswer = answers[String(q.id)];
      const isObjective = ['single_choice', 'multi_choice', 'true_false'].includes(q.type);

      if (isObjective) {
        totalObjectiveScore += q.exam_score;
        if (studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '') {
          let correct = false;
          if (q.type === 'multi_choice') {
            // Compare sorted comma-separated indices
            const sa = String(studentAnswer).split(',').map(s => s.trim()).sort().join(',');
            const ca = String(q.answer).split(',').map(s => s.trim()).sort().join(',');
            correct = sa === ca;
          } else {
            correct = String(studentAnswer) === String(q.answer);
          }
          if (correct) {
            objectiveScore += q.exam_score;
          }
        }
      } else {
        hasSubjective = true;
      }
    }

    const totalScore = hasSubjective ? null : objectiveScore;
    const status = hasSubjective ? 'submitted' : 'graded';

    req.db.prepare(`
      UPDATE exam_attempts
      SET answers = ?, total_score = ?, objective_score = ?, finished_at = CURRENT_TIMESTAMP, status = ?
      WHERE id = ?
    `).run(
      JSON.stringify(answers),
      totalScore,
      objectiveScore,
      status,
      attempt.id
    );

    req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'submit', resource_type: 'exam', resource_id: req.params.id, detail: '提交考试, 客观题得分: ' + objectiveScore, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json({
      attempt_id: attempt.id,
      objective_score: objectiveScore,
      total_objective_score: totalObjectiveScore,
      total_score: totalScore,
      status: status,
      message: hasSubjective ? '考试已提交，主观题待教师批改' : '考试已完成',
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// POST /exams/:id/save-progress — save progress without submitting
router.post('/exams/:id/save-progress', authenticate, requireRole('student'), (req, res) => {
  try {
    const { answers } = req.body;

    const attempt = req.db.prepare(
      "SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'"
    ).get(req.params.id, req.user.id);

    if (!attempt) {
      return res.status(404).json({ error: '未找到进行中的考试记录' });
    }

    req.db.prepare(
      'UPDATE exam_attempts SET answers = ? WHERE id = ?'
    ).run(JSON.stringify(answers || {}), attempt.id);
    req.db.save();

    res.json({ message: '进度已保存' });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /attempts/mine — list student's exam attempts
router.get('/attempts/mine', authenticate, requireRole('student'), (req, res) => {
  try {
    const attempts = req.db.prepare(`
      SELECT ea.*, e.title AS exam_title, e.total_score AS exam_total_score,
             e.pass_score, e.duration_minutes
      FROM exam_attempts ea
      LEFT JOIN exams e ON ea.exam_id = e.id
      WHERE ea.student_id = ?
      ORDER BY ea.started_at DESC
    `).all(req.user.id);

    res.json(attempts);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// ========== Teacher grading ==========

// GET /exams/:id/attempts — list all attempts for an exam
router.get('/exams/:id/attempts', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const exam = req.db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const attempts = req.db.prepare(`
      SELECT ea.*, u.real_name AS student_name, u.student_id AS student_number, u.class_name
      FROM exam_attempts ea
      LEFT JOIN users u ON ea.student_id = u.id
      WHERE ea.exam_id = ?
      ORDER BY ea.started_at DESC
    `).all(req.params.id);

    res.json({ exam, attempts });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /attempts/:id/detail — get attempt detail with questions
router.get('/attempts/:id/detail', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const attempt = req.db.prepare(`
      SELECT ea.*, e.title AS exam_title, u.real_name AS student_name
      FROM exam_attempts ea
      LEFT JOIN exams e ON ea.exam_id = e.id
      LEFT JOIN users u ON ea.student_id = u.id
      WHERE ea.id = ?
    `).get(req.params.id);

    if (!attempt) {
      return res.status(404).json({ error: '考试记录不存在' });
    }

    const questions = req.db.prepare(`
      SELECT eq.*, em.sort_order, em.score AS exam_score
      FROM exam_questions_map em
      JOIN exam_questions eq ON em.question_id = eq.id
      WHERE em.exam_id = ?
      ORDER BY em.sort_order
    `).all(attempt.exam_id);

    let studentAnswers = {};
    if (attempt.answers) {
      try { studentAnswers = JSON.parse(attempt.answers); } catch (e) { studentAnswers = {}; }
    }

    res.json({ attempt, questions, studentAnswers });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// PUT /attempts/:id/grade — manually grade subjective questions
router.put('/attempts/:id/grade', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const attempt = req.db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
    if (!attempt) {
      return res.status(404).json({ error: '考试记录不存在' });
    }

    const { subjective_scores, total_score } = req.body;

    // subjective_scores: { question_id: score, ... }
    let subjectiveTotal = 0;
    if (subjective_scores && typeof subjective_scores === 'object') {
      for (const score of Object.values(subjective_scores)) {
        subjectiveTotal += Number(score) || 0;
      }
    }

    const finalTotal = total_score !== undefined
      ? total_score
      : (attempt.objective_score || 0) + subjectiveTotal;

    req.db.prepare(`
      UPDATE exam_attempts
      SET total_score = ?, status = 'graded', finished_at = COALESCE(finished_at, CURRENT_TIMESTAMP)
      WHERE id = ?
    `).run(finalTotal, req.params.id);

    req.db.save();

    const updated = req.db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// GET /chapters — get chapters for question bank filters
router.get('/chapters', authenticate, (req, res) => {
  try {
    const chapters = req.db.prepare('SELECT id, title, sort_order FROM chapters ORDER BY sort_order').all();
    res.json(chapters);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
