import express from 'express';
import { query, param, validationResult } from 'express-validator';
import Page from '../models/Page.js';
import News from '../models/News.js';
import CaseModel from '../models/Case.js';
import Lecturer from '../models/Lecturer.js';
import CertificateModel from '../models/Certificate.js';
import Partner from '../models/Partner.js';

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

// 公开：案例列表
router.get(
  '/cases',
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
      const result = await CaseModel.findAll(page, limit, keyword);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 公开：讲师列表
router.get(
  '/lecturers',
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
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 公开：证书查询（根据姓名和证书编号）
router.get(
  '/certificates/search',
  [
    query('name').isString().notEmpty().withMessage('姓名不能为空'),
    query('certificateNo').isString().notEmpty().withMessage('证书编号不能为空')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    
    try {
      const name = req.query.name.trim();
      let certificateNo = req.query.certificateNo.trim();
      
      // 如果用户输入的不带 "No."，自动添加
      if (!/^No\./i.test(certificateNo)) {
        certificateNo = `N.${certificateNo}`;
      }
      
      const certificate = await CertificateModel.findByNameAndCertificateNo(name, certificateNo);
      
      if (!certificate) {
        return res.json({ success: true, data: null, message: '未查询到该证书' });
      }
      
      return res.json({ success: true, data: certificate });
    } catch (error) {
      console.error('查询证书失败:', error);
      return res.status(500).json({ success: false, message: '查询失败' });
    }
  }
);

// 公开：合作伙伴列表
router.get(
  '/partners',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 100;
    try {
      const result = await Partner.findPublished(page, limit);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('获取合作伙伴列表失败:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

export default router;


