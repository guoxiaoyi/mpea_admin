import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import pageRoutes from './routes/pages.js';
import caseRoutes from './routes/cases.js';
import lecturerRoutes from './routes/lecturers.js';
import ueditorRoutes from './routes/ueditor.js';
import publicRoutes from './routes/public.js';
import certificateRoutes from './routes/certificates.js';
import partnerRoutes from './routes/partners.js';
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

// 允许剪贴板权限（Permissions-Policy）
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'clipboard-read=(self), clipboard-write=(self)');
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
// 统一前缀下的健康检查（便于反向代理）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/ueditor', ueditorRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/partners', partnerRoutes);
// 静态文件：上传目录（统一前缀）
import path from 'node:path';
import expressStatic from 'express';
// 新前缀：/api/uploads
app.use('/api/uploads', expressStatic.static(path.resolve(process.cwd(), 'uploads')));
// 兼容旧前缀：/uploads（可在确认无历史内容后移除）
app.use('/uploads', expressStatic.static(path.resolve(process.cwd(), 'uploads')));

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
