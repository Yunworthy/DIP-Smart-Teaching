const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Ensure uploads/resources directory exists
const resourcesDir = path.join(__dirname, '..', 'uploads', 'resources');
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

// Multer config for resource uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resourcesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for resources (videos can be large)
});

// Helper: format file size for display
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// GET / — list all visible resources
// Students see only is_visible=1; teachers/admins see all
router.get('/', authenticate, (req, res) => {
  try {
    let rows;
    if (req.user.role === 'student') {
      rows = req.db.prepare(
        'SELECT r.*, u.real_name AS uploader_name FROM resources r LEFT JOIN users u ON r.uploader_id = u.id WHERE r.is_visible = 1 ORDER BY r.created_at DESC'
      ).all();
    } else {
      rows = req.db.prepare(
        'SELECT r.*, u.real_name AS uploader_name FROM resources r LEFT JOIN users u ON r.uploader_id = u.id ORDER BY r.created_at DESC'
      ).all();
    }
    res.json(rows);
  } catch (err) {
    console.error('获取资源列表失败:', err);
    res.status(500).json({ error: '获取资源列表失败' });
  }
});

// POST / — create resource with optional file upload (teacher/admin only)
router.post('/', authenticate, requireRole('teacher', 'admin'), upload.single('file'), (req, res) => {
  try {
    const { title, category, description, chapter_id, url } = req.body;

    if (!title) {
      return res.status(400).json({ error: '资源名称不能为空' });
    }
    if (!category) {
      return res.status(400).json({ error: '请选择资源分类' });
    }

    const validCategories = ['ppt', 'experiment_guide', 'case', 'video', 'document', 'image', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: '无效的资源分类' });
    }

    let file_path = null;
    let file_type = null;
    let file_size = null;

    if (req.file) {
      file_path = '/uploads/resources/' + req.file.filename;
      file_type = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      file_size = req.file.size;
    }

    const result = req.db.prepare(
      'INSERT INTO resources (title, category, description, file_path, file_type, file_size, url, uploader_id, chapter_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      title,
      category,
      description || null,
      file_path,
      file_type,
      file_size,
      url || null,
      req.user.id,
      chapter_id ? parseInt(chapter_id) : null
    );

    req.db.save();

    const newResource = req.db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'create', resource_type: 'resource', resource_id: String(result.lastInsertRowid), detail: '上传资源: ' + title, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json(newResource);
  } catch (err) {
    console.error('创建资源失败:', err);
    res.status(500).json({ error: '创建资源失败' });
  }
});

// PUT /:id — update resource (teacher/admin only)
router.put('/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = req.db.prepare('SELECT * FROM resources WHERE id = ?').get(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: '资源不存在' });
    }

    const { title, category, description, chapter_id, url, is_visible } = req.body;

    req.db.prepare(
      'UPDATE resources SET title = COALESCE(?, title), category = COALESCE(?, category), description = ?, chapter_id = ?, url = ?, is_visible = COALESCE(?, is_visible) WHERE id = ?'
    ).run(
      title || null,
      category || null,
      description !== undefined ? description : existing.description,
      chapter_id !== undefined ? (chapter_id ? parseInt(chapter_id) : null) : existing.chapter_id,
      url !== undefined ? url : existing.url,
      is_visible !== undefined ? (is_visible ? 1 : 0) : existing.is_visible,
      parseInt(id)
    );

    req.db.save();

    const updated = req.db.prepare('SELECT * FROM resources WHERE id = ?').get(parseInt(id));
    res.json(updated);
  } catch (err) {
    console.error('更新资源失败:', err);
    res.status(500).json({ error: '更新资源失败' });
  }
});

// DELETE /:id — delete resource + file (teacher/admin only)
router.delete('/:id', authenticate, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = req.db.prepare('SELECT * FROM resources WHERE id = ?').get(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: '资源不存在' });
    }

    // Delete the physical file if it exists
    if (existing.file_path) {
      const absPath = path.join(__dirname, '..', existing.file_path);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
    }

    req.db.prepare('DELETE FROM resources WHERE id = ?').run(parseInt(id));
    req.db.save();

    logAudit(req.db, { user_id: req.user.id, username: req.user.username, action: 'delete', resource_type: 'resource', resource_id: id, detail: '删除资源: ' + existing.title, ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

    res.json({ message: '资源已删除' });
  } catch (err) {
    console.error('删除资源失败:', err);
    res.status(500).json({ error: '删除资源失败' });
  }
});

// GET /:id/download — increment download_count and serve file
router.get('/:id/download', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const resource = req.db.prepare('SELECT * FROM resources WHERE id = ?').get(parseInt(id));
    if (!resource) {
      return res.status(404).json({ error: '资源不存在' });
    }

    // Increment download count
    req.db.prepare('UPDATE resources SET download_count = download_count + 1 WHERE id = ?').run(parseInt(id));
    req.db.save();

    // If the resource has a file, serve it
    if (resource.file_path) {
      const absPath = path.join(__dirname, '..', resource.file_path);
      if (fs.existsSync(absPath)) {
        return res.download(absPath, resource.title + (path.extname(absPath) || ''));
      }
    }

    // If the resource has a URL, redirect to it
    if (resource.url) {
      return res.redirect(resource.url);
    }

    res.status(404).json({ error: '无可下载的文件' });
  } catch (err) {
    console.error('下载资源失败:', err);
    res.status(500).json({ error: '下载资源失败' });
  }
});

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小不能超过50MB' });
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
