import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export const authMiddleware = (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证 token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // 将解码后的用户信息附加到请求对象
    req.admin = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

