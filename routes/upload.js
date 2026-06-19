const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedExts = ['.doc', '.docx', '.pdf', '.png', '.jpg', '.jpeg', '.zip', '.rar'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式，仅允许: ' + allowedExts.join(', ')), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// POST /api/upload - upload single file
router.post('/', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }
    res.json({
      filePath: '/uploads/' + req.file.filename,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
});

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小不能超过10MB' });
    }
    console.error('Multer error:', err.message);
    return res.status(400).json({ error: '文件上传失败，请检查文件格式和大小' });
  }
  if (err) {
    console.error('Upload error:', err.message);
    return res.status(400).json({ error: '上传处理失败，请稍后重试' });
  }
  next();
});

module.exports = router;
