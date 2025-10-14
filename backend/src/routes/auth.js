import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { jwtConfig } from '../config/jwt.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// 管理员登录
router.post(
  '/login',
  [
    body('username').isString().notEmpty().withMessage('username 必填'),
    body('password').isString().notEmpty().withMessage('password 必填')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
      const admin = await Admin.findByUsername(username);
      if (!admin) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const ok = await Admin.verifyPassword(password, admin.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const token = jwt.sign({ id: admin.id, username: admin.username }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

      return res.json({ success: true, data: { token, admin: { id: admin.id, username: admin.username } } });
    } catch (error) {
      return res.status(500).json({ success: false, message: '登录失败' });
    }
  }
);

// 退出登录（前端丢弃 token 即可，这里仅返回成功）
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: '已退出' });
});

export default router;
