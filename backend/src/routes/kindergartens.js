import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import Kindergarten from '../models/Kindergarten.js';

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100'),
    query('keyword').optional().isString(),
    query('status').optional().isIn(['enabled', 'disabled']).withMessage('status 只能为 enabled 或 disabled')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const keyword = req.query.keyword || '';
    const status = req.query.status;
    try {
      const result = await Kindergarten.findAll(page, limit, keyword, status);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('GET /api/kindergartens error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.get(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const data = await Kindergarten.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: '未找到幼儿园' });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/kindergartens/:id error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

const createAndUpdateValidators = [
  body('name').isString().notEmpty().withMessage('name 必填'),
  body('nameEn').isString().notEmpty().withMessage('nameEn 必填'),
  body('address').isString().notEmpty().withMessage('address 必填'),
  body('addressEn').isString().notEmpty().withMessage('addressEn 必填'),
  body('logo').isString().notEmpty().withMessage('logo 必填'),
  body('sortOrder').optional().toInt().isInt().withMessage('sortOrder 必须为整数'),
  body('status').optional().isIn(['enabled', 'disabled']).withMessage('status 只能为 enabled 或 disabled')
];

router.post('/', createAndUpdateValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }
  try {
    const result = await Kindergarten.create(req.body);
    return res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('POST /api/kindergartens error:', error);
    return res.status(500).json({ success: false, message: '创建失败' });
  }
});

router.put(
  '/:id',
  [
    param('id').toInt().isInt().withMessage('id 必须为整数'),
    ...createAndUpdateValidators
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await Kindergarten.update(req.params.id, req.body);
      return res.json({ success: true });
    } catch (error) {
      console.error('PUT /api/kindergartens/:id error:', error);
      return res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

router.delete(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await Kindergarten.delete(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/kindergartens/:id error:', error);
      return res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

export default router;


