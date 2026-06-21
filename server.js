const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { initDatabase } = require('./database/db');

async function startServer() {
  const app = express();

  // Initialize database
  const db = await initDatabase(config.dbPath);

  // Ensure exam_attempts has question_order column (migration)
  try {
    db.exec("ALTER TABLE exam_attempts ADD COLUMN question_order TEXT");
  } catch (e) {
    // Column already exists — safe to ignore
  }

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(config.publicDir));
  app.use('/uploads', express.static(config.uploadsDir));

  // Make db available to routes
  app.use((req, res, next) => { req.db = db; next(); });

  // Request logging middleware
  app.use(require('./middleware/logger')());

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/chapters', require('./routes/course'));
  app.use('/api/simulations', require('./routes/simulation'));
  const assignmentRouter = require('./routes/assignment');
  app.use('/api', assignmentRouter);
  app.use('/api/cases', require('./routes/case-study'));
  app.use('/api/knowledge-graph', require('./routes/knowledge-graph'));
  app.use('/api/code', require('./routes/code'));
  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/student-import', require('./routes/student-import'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/exam', require('./routes/exam'));
  app.use('/api/export', require('./routes/export'));
  app.use('/api/resources', require('./routes/resource'));
  app.use('/api/notifications', require('./routes/notification'));
  app.use('/api/announcements', require('./routes/announcement'));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
  });

  // Graceful shutdown
  process.on('SIGINT', () => { db.close(); process.exit(0); });
  process.on('SIGTERM', () => { db.close(); process.exit(0); });

  app.listen(config.port, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║  数字图像处理智慧教学与虚拟仿真平台 v2.0    ║');
    console.log('  ╠══════════════════════════════════════════════╣');
    console.log(`  ║  本地访问: http://localhost:${config.port}              ║`);
    console.log(`  ║  局域网:   http://0.0.0.0:${config.port}              ║`);
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
