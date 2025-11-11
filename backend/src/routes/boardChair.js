import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import BoardChair from '../models/BoardChair.js';

const router = express.Router();

router.use(authMiddleware);

const validators = [
  body('name').isString().notEmpty().withMessage('name 必填'),
  body('nameEn').isString().notEmpty().withMessage('nameEn 必填'),
  body('avatar').isString().notEmpty().withMessage('avatar 必填'),
  body('introduction').optional().isString(),
  body('introductionEn').optional().isString()
];

router.get('/', async (req, res) => {
  try {
    const data = await BoardChair.findAll();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/board-chair error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'id 必须为整数' });
  }
  try {
    const data = await BoardChair.findById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: '未找到记录' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/board-chair/:id error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

router.post('/', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }
  try {
    const result = await BoardChair.create(req.body);
    return res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('POST /api/board-chair error:', error);
    return res.status(500).json({ success: false, message: '创建失败' });
  }
});

router.put('/:id', validators, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'id 必须为整数' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }
  try {
    await BoardChair.update(id, req.body);
    return res.json({ success: true });
  } catch (error) {
    console.error('PUT /api/board-chair/:id error:', error);
    return res.status(500).json({ success: false, message: '更新失败' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'id 必须为整数' });
  }
  try {
    await BoardChair.delete(id);
    return res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/board-chair/:id error:', error);
    return res.status(500).json({ success: false, message: '删除失败' });
  }
});

export default router;


