import express from 'express';
import { query, param, validationResult } from 'express-validator';
import Page from '../models/Page.js';
import News from '../models/News.js';

const router = express.Router();

// 公开：分页列表（仅 published）
router.get(
  '/pages',
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
      const result = await Page.findPublished(page, limit, keyword);
      return res.json({ success: true, data: result });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 公开：按 path 获取（仅 published）
router.get(
  '/pages/by-id/:id',
  [param('id').isString().notEmpty().withMessage('id 必填')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const data = await Page.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: '未找到页面' });
      return res.json({ success: true, data });
    } catch (e) {
      console.log(e)
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

export default router;

// 公开：新闻列表（仅 published）
router.get(
  '/news',
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
      const result = await News.findPublished(page, limit, keyword);
      return res.json({ success: true, data: result });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 公开：按 slug 获取新闻（仅 published）
router.get(
  '/news/by-slug/:slug',
  [param('slug').isString().notEmpty().withMessage('slug 必填')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const data = await News.findPublishedBySlug(req.params.slug);
      if (!data) return res.status(404).json({ success: false, message: '未找到新闻' });
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);


