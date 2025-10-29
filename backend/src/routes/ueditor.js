import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 确保上传目录存在
const uploadsRoot = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

// 生成按日期的子目录
function resolveSavePath(sub = '') {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dir = path.join(uploadsRoot, sub, `${yyyy}${mm}${dd}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据 action 分类保存目录：图片/附件/涂鸦
    const action = (req.query?.action || '').toString();
    const sub = action === 'uploadfile' ? 'files' : action === 'uploadscrawl' ? 'scrawls' : 'images';
    cb(null, resolveSavePath(sub));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// UEditor 配置响应（action=config）
router.get('/controller', (req, res) => {
  if (req.query.action !== 'config') {
    return res.status(400).json({ state: 'Invalid action' });
  }

  const cfg = {
    imageActionName: 'uploadimage',
    imageFieldName: 'upfile',
    imageMaxSize: 5 * 1024 * 1024,
    imageAllowFiles: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
    imageUrlPrefix: '/api',
    imagePathFormat: '/images/{yyyy}{mm}{dd}/{time}{rand:6}',

    scrawlActionName: 'uploadscrawl',
    scrawlFieldName: 'upfile',
    scrawlMaxSize: 2 * 1024 * 1024,
    scrawlUrlPrefix: '/api',
    scrawlPathFormat: '/scrawls/{yyyy}{mm}{dd}/{time}{rand:6}',

    fileActionName: 'uploadfile',
    fileFieldName: 'upfile',
    fileMaxSize: 10 * 1024 * 1024,
    fileAllowFiles: ['.txt', '.pdf', '.zip', '.rar', '.7z', '.doc', '.docx', '.xls', '.xlsx'],
    fileUrlPrefix: '/api',
    filePathFormat: '/files/{yyyy}{mm}{dd}/{time}{rand:6}',

    // 远程图片抓取
    catcherActionName: 'catchimage',
    catcherFieldName: 'source',
    catcherMaxSize: 5 * 1024 * 1024,
    catcherAllowFiles: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
    catcherUrlPrefix: '/api',
    catcherPathFormat: '/images/{yyyy}{mm}{dd}/{time}{rand:6}',
  };

  // 兼容 UEditor 以 JSONP 方式拉取配置（script 标签 + callback）
  const cb = req.query.callback;
  if (cb) {
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    return res.send(`${cb}(${JSON.stringify(cfg)})`);
  }

  return res.json(cfg);
});

// 上传图片（multipart）
router.post('/controller', upload.single('upfile'), async (req, res) => {
  const { action } = req.query;

  // 贴图（base64）
  if (action === 'uploadscrawl') {
    try {
      const dataUrl = req.body?.upfile || '';
      const base64 = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      const dir = resolveSavePath('scrawls');
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const full = path.join(dir, filename);
      fs.writeFileSync(full, buf);
      const url = `/uploads/scrawls/${path.basename(dir)}/${filename}`;
      return res.json({ state: 'SUCCESS', url, title: filename, original: filename });
    } catch (e) {
      return res.status(500).json({ state: 'ERROR', message: e.message });
    }
  }

  // 普通文件/图片
  if (action === 'uploadimage' || action === 'uploadfile') {
    if (!req.file) return res.status(400).json({ state: 'ERROR', message: 'no file' });
    const parent = action === 'uploadimage' ? 'images' : 'files';
    // 将磁盘路径映射为 /uploads URL
    // 目录结构：/uploads/{parent}/YYYYMMDD/filename
    const relDir = path.basename(path.dirname(req.file.path));
    const url = `/uploads/${parent}/${relDir}/${req.file.filename}`;
    // 处理中文原始文件名乱码（latin1 -> utf8）
    const rawOriginal = req.file.originalname || '';
    let originalUtf8 = rawOriginal;
    try { originalUtf8 = Buffer.from(rawOriginal, 'latin1').toString('utf8'); } catch (_) {}
    const type = path.extname(req.file.originalname || req.file.filename) || '';
    const size = req.file.size || 0;
    return res.json({ state: 'SUCCESS', url, title: originalUtf8, original: originalUtf8, type, size });
  }

  return res.status(400).json({ state: 'ERROR', message: 'Unsupported action' });
});

// 远程图片抓取（catchimage）
router.get('/controller', async (req, res, next) => {
  if (req.query.action !== 'catchimage') return next();
  try {
    const sources = Array.isArray(req.query.source) ? req.query.source : [req.query.source].filter(Boolean);
    const results = [];
    for (const src of sources) {
      const resp = await fetch(src);
      const buf = Buffer.from(await resp.arrayBuffer());
      const dir = resolveSavePath('images');
      const ext = path.extname(new URL(src).pathname) || '.jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
      const full = path.join(dir, filename);
      fs.writeFileSync(full, buf);
      const url = `/uploads/images/${path.basename(dir)}/${filename}`;
      results.push({ state: 'SUCCESS', source: src, url });
    }
    return res.json({ state: 'SUCCESS', list: results });
  } catch (e) {
    return res.status(500).json({ state: 'ERROR', message: e.message });
  }
});

export default router;


