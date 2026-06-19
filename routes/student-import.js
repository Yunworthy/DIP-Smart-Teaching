const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { logAudit } = require('../utils/audit');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'imports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

/**
 * Parse CSV file into lines of columns.
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  let startIdx = 0;
  if (lines[0]) {
    var firstLine = lines[0].toLowerCase();
    if (/[\u4e00-\u9fff]/.test(lines[0]) ||
        /student[_\s]?id|name|class|学号|姓名|班级/.test(firstLine)) {
      startIdx = 1;
    }
  }
  const rows = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length >= 3) {
      rows.push(cols);
    }
  }
  return rows;
}

/**
 * Parse Excel (.xlsx / .xls) file into rows of [studentId, realName, className].
 */
function parseExcel(filePath) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  // Convert to array of arrays (header row included)
  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (allRows.length === 0) return [];

  // Detect and skip header row
  let startIdx = 0;
  const firstRow = allRows[0].map(c => String(c).toLowerCase().trim());
  const hasHeader = firstRow.some(c =>
    /学号|姓名|班级|student|name|class/.test(c)
  );
  if (hasHeader) startIdx = 1;

  const rows = [];
  for (let i = startIdx; i < allRows.length; i++) {
    const row = allRows[i].map(c => String(c).trim());
    if (row.length >= 3 && row[0] && row[1]) {
      rows.push(row);
    }
  }
  return rows;
}

// POST /api/student-import - upload CSV/XLSX and create student accounts
router.post('/', authenticate, requireRole('teacher', 'admin'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请上传文件' });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname || '').toLowerCase();

    // Parse file based on extension
    let rows;
    if (ext === '.xlsx' || ext === '.xls') {
      rows = parseExcel(filePath);
    } else {
      rows = parseCSV(filePath);
    }

    const results = { success: 0, skipped: 0, failed: 0, errors: [] };
    const insertUser = req.db.prepare(
      'INSERT OR IGNORE INTO users (username, password, real_name, role, student_id, class_name, email) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length < 3) {
        results.failed++;
        results.errors.push('第' + (i + 1) + '行: 列数不足(需要学号,姓名,班级)');
        continue;
      }

      const [studentId, realName, className] = cols;
      if (!studentId || !realName) {
        results.failed++;
        results.errors.push('第' + (i + 1) + '行: 学号或姓名为空');
        continue;
      }

      // Password = last 6 digits of student_id
      const lastSix = studentId.slice(-6);
      const studentHash = bcrypt.hashSync(lastSix, 10);
      const email = studentId + '@hbwxy.edu.cn';

      try {
        const result = insertUser.run(studentId, studentHash, realName, 'student', studentId, className, email);
        if (result.changes > 0) {
          results.success++;
        } else {
          results.skipped++;
        }
      } catch (e) {
        results.failed++;
        results.errors.push('第' + (i + 1) + '行(' + studentId + '): ' + e.message);
      }
    }

    // Clean up uploaded file
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'import', resource_type: 'student', detail: '批量导入学生: 成功' + results.success + '人, 跳过' + results.skipped + '人, 失败' + results.failed + '人', ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json(results);
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

module.exports = router;
