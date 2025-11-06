import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Partner from '../models/Partner.js';

const router = express.Router();

// 获取合作伙伴列表（分页）
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
      const result = await Partner.findAll(page, limit, keyword);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('获取合作伙伴列表失败:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 获取单个合作伙伴
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const partner = await Partner.findById(req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, message: '合作伙伴不存在' });
      }
      return res.json({ success: true, data: partner });
    } catch (error) {
      console.error('获取合作伙伴失败:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 创建合作伙伴
router.post(
  '/',
  [
    body('title').isString().notEmpty().withMessage('标题不能为空'),
    body('image').isString().notEmpty().withMessage('图片不能为空'),
    body('link').optional().isString(),
    body('sortOrder').optional().isInt().withMessage('排序必须为整数'),
    body('status').optional().isIn(['enabled', 'disabled']).withMessage('状态值无效')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const result = await Partner.create(req.body);
      return res.status(201).json({ success: true, message: '创建成功', data: { id: result.insertId } });
    } catch (error) {
      console.error('创建合作伙伴失败:', error);
      return res.status(500).json({ success: false, message: '创建失败' });
    }
  }
);

// 更新合作伙伴
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID 必须为整数'),
    body('title').isString().notEmpty().withMessage('标题不能为空'),
    body('image').isString().notEmpty().withMessage('图片不能为空'),
    body('link').optional().isString(),
    body('sortOrder').optional().isInt().withMessage('排序必须为整数'),
    body('status').optional().isIn(['enabled', 'disabled']).withMessage('状态值无效')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const partner = await Partner.findById(req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, message: '合作伙伴不存在' });
      }
      await Partner.update(req.params.id, req.body);
      return res.json({ success: true, message: '更新成功' });
    } catch (error) {
      console.error('更新合作伙伴失败:', error);
      return res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

// 删除合作伙伴
router.delete(
  '/:id',
  [param('id').isInt().withMessage('ID 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const partner = await Partner.findById(req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, message: '合作伙伴不存在' });
      }
      await Partner.delete(req.params.id);
      return res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('删除合作伙伴失败:', error);
      return res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

// 批量删除合作伙伴
router.post(
  '/batch-delete',
  [body('ids').isArray({ min: 1 }).withMessage('ids 必须为非空数组')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const result = await Partner.batchDelete(req.body.ids);
      return res.json({ success: true, message: '批量删除成功', data: { count: result.affectedRows } });
    } catch (error) {
      console.error('批量删除合作伙伴失败:', error);
      return res.status(500).json({ success: false, message: '批量删除失败' });
    }
  }
);

// 更新排序
router.patch(
  '/:id/sort',
  [
    param('id').isInt().withMessage('ID 必须为整数'),
    body('sortOrder').isInt().withMessage('排序必须为整数')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await Partner.updateSortOrder(req.params.id, req.body.sortOrder);
      return res.json({ success: true, message: '更新排序成功' });
    } catch (error) {
      console.error('更新排序失败:', error);
      return res.status(500).json({ success: false, message: '更新排序失败' });
    }
  }
);

export default router;

