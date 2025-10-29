import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import Page from '../models/Page.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 所有页面管理接口需要认证
router.use(authMiddleware);
// 将外链图片下载到本地并重写内容中的 URL（主要处理秀米域名等）
async function mirrorExternalImages(html) {
  if (!html || typeof html !== 'string') return html;
  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const saveDir = path.join(uploadsRoot, 'images', ymd);
  fs.mkdirSync(saveDir, { recursive: true });

  // 图片扩展名白名单
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  
  // 判断 URL 是否为图片
  const isImageUrl = (url) => {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      // 移除查询参数后判断扩展名
      const pathWithoutQuery = pathname.split('?')[0];
      return imageExts.some(ext => pathWithoutQuery.endsWith(ext));
    } catch (_) {
      return false;
    }
  };

  // 判断是否为外链（非本地域名）
  const isExternalUrl = (url) => {
    try {
      const u = new URL(url);
      // 排除本地域名
      return u.hostname && u.hostname !== 'localhost' && !u.hostname.startsWith('127.0.0.1');
    } catch (_) {
      return false;
    }
  };

  const urlToLocal = new Map();
  const candidates = new Set();

  // 1. 匹配 <img src="...">
  const imgSrcRegex = /<img[^>]*?src=["'](https?:\/\/[^"'>]+)["'][^>]*?>/gi;
  let m;
  while ((m = imgSrcRegex.exec(html)) !== null) {
    const url = m[1];
    if (isImageUrl(url) && isExternalUrl(url)) {
      candidates.add(url);
    }
  }

  // 2. 匹配 background-image: url(...)
  const bgImageRegex = /background-image\s*:\s*url\(['"]?(https?:\/\/[^'")]+)['"]?\)/gi;
  while ((m = bgImageRegex.exec(html)) !== null) {
    const url = m[1];
    if (isImageUrl(url) && isExternalUrl(url)) {
      candidates.add(url);
    }
  }

  // 3. 匹配 background: url(...) （简写形式）
  const bgRegex = /background\s*:[^;]*url\(['"]?(https?:\/\/[^'")]+)['"]?\)/gi;
  while ((m = bgRegex.exec(html)) !== null) {
    const url = m[1];
    if (isImageUrl(url) && isExternalUrl(url)) {
      candidates.add(url);
    }
  }

  // 4. 匹配 style 属性中的其他可能包含图片的情况
  const styleUrlRegex = /url\(['"]?(https?:\/\/[^'")]+)['"]?\)/gi;
  while ((m = styleUrlRegex.exec(html)) !== null) {
    const url = m[1];
    if (isImageUrl(url) && isExternalUrl(url)) {
      candidates.add(url);
    }
  }

  // 下载并保存图片
  for (const src of candidates) {
    try {
      const resp = await fetch(src);
      if (!resp.ok) continue;
      const ab = await resp.arrayBuffer();
      const buf = Buffer.from(ab);
      const extFromPath = path.extname(new URL(src).pathname.split('?')[0]) || '.jpg';
      const safeExt = extFromPath.length <= 5 ? extFromPath : '.jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${safeExt}`;
      const full = path.join(saveDir, filename);
      fs.writeFileSync(full, buf);
      const localUrl = `/uploads/images/${ymd}/${filename}`;
      urlToLocal.set(src, localUrl);
    } catch (e) {
      // 忽略单个资源失败，保留原链接
      console.error(`下载图片失败: ${src}`, e.message);
    }
  }

  if (urlToLocal.size === 0) return html;
  let rewritten = html;
  for (const [oldUrl, newUrl] of urlToLocal.entries()) {
    const esc = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    rewritten = rewritten.replace(new RegExp(esc, 'g'), newUrl);
  }
  return rewritten;
}

// 获取页面列表
router.get(
  '/',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100'),
    query('keyword').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const keyword = req.query.keyword || '';

    try {
      const result = await Page.findAll(page, limit, keyword);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('GET /api/pages error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 获取单个页面
router.get(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const data = await Page.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: '未找到页面' });
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 新增页面
router.post(
  '/',
  [
    body('title').isString().notEmpty().withMessage('title 必填'),
    body('path').isString().notEmpty().withMessage('path 必填'),
    body('content').optional().isString(),
    body('status').optional().isIn(['published', 'draft']).withMessage('status 必须为 published 或 draft')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      if (req.body.content) {
        req.body.content = await mirrorExternalImages(req.body.content);
      }
      const exists = await Page.pathExists(req.body.path);
      if (exists) return res.status(409).json({ success: false, message: 'path 已存在' });
      const result = await Page.create(req.body);
      return res.json({ success: true, data: { id: result.insertId } });
    } catch (error) {
      console.error('POST /api/pages error:', error);
      return res.status(500).json({ success: false, message: '创建失败' });
    }
  }
);

// 更新页面
router.put(
  '/:id',
  [
    param('id').toInt().isInt().withMessage('id 必须为整数'),
    body('title').isString().notEmpty().withMessage('title 必填'),
    body('path').isString().notEmpty().withMessage('path 必填'),
    body('content').optional().isString(),
    body('status').optional().isIn(['published', 'draft']).withMessage('status 必须为 published 或 draft')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      if (req.body.content) {
        req.body.content = await mirrorExternalImages(req.body.content);
      }
      const exists = await Page.pathExists(req.body.path, req.params.id);
      if (exists) return res.status(409).json({ success: false, message: 'path 已存在' });
      await Page.update(req.params.id, req.body);
      return res.json({ success: true });
    } catch (error) {
      console.error('PUT /api/pages/:id error:', error);
      return res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

// 删除页面
router.delete(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await Page.delete(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/pages/:id error:', error);
      return res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

export default router;
