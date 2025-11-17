import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { query, param, body, validationResult } from 'express-validator';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

router.use(authMiddleware);

// 管理端：联系表单列表
router.get(
  '/',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100'),
    query('type').optional().isIn(['parenting', 'business']).withMessage('type 不合法'),
    query('status').optional().isIn(['new', 'processed', 'spam']).withMessage('status 不合法'),
    query('keyword').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    try {
      const result = await ContactMessage.findAll({
        page: req.query.page,
        limit: req.query.limit,
        type: req.query.type,
        status: req.query.status,
        keyword: req.query.keyword
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('GET /api/contact-messages error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 管理端：单条详情
router.get(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const data = await ContactMessage.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: '未找到记录' });
      }
      return res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/contact-messages/:id error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 管理端：修改状态（已处理 / 垃圾）
router.patch(
  '/:id/status',
  [
    param('id').toInt().isInt().withMessage('id 必须为整数'),
    body('status').isIn(['new', 'processed', 'spam']).withMessage('status 不合法')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await ContactMessage.updateStatus(req.params.id, req.body.status);
      return res.json({ success: true });
    } catch (error) {
      console.error('PATCH /api/contact-messages/:id/status error:', error);
      return res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

// 管理端：删除
router.delete(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await ContactMessage.delete(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/contact-messages/:id error:', error);
      return res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

export default router;



