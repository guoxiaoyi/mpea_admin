import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import Page from '../models/Page.js';

const router = express.Router();

// 所有页面管理接口需要认证
router.use(authMiddleware);

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
