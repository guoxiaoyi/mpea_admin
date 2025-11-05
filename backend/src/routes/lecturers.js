import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import Lecturer from '../models/Lecturer.js';

const router = express.Router();

router.use(authMiddleware);

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
      const result = await Lecturer.findAll(page, limit, keyword);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('GET /api/lecturers error:', error);
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
      const data = await Lecturer.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: '未找到讲师' });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/lecturers/:id error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('name 必填'),
    body('photo').isString().notEmpty().withMessage('photo 必填'),
    body('introduction').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const result = await Lecturer.create(req.body);
      return res.json({ success: true, data: { id: result.insertId } });
    } catch (error) {
      console.error('POST /api/lecturers error:', error);
      return res.status(500).json({ success: false, message: '创建失败' });
    }
  }
);

router.put(
  '/:id',
  [
    param('id').toInt().isInt().withMessage('id 必须为整数'),
    body('name').isString().notEmpty().withMessage('name 必填'),
    body('photo').isString().notEmpty().withMessage('photo 必填'),
    body('introduction').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      await Lecturer.update(req.params.id, req.body);
      return res.json({ success: true });
    } catch (error) {
      console.error('PUT /api/lecturers/:id error:', error);
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
      await Lecturer.delete(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/lecturers/:id error:', error);
      return res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

export default router;


