import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import pageRoutes from './routes/pages.js';
import './config/database.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 基础请求日志
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const cost = Date.now() - start;
    console.log(`[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${cost}ms)`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// 全局错误处理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, message: '服务器错误' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
