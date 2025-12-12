import express from 'express';
import { query, param, body, validationResult } from 'express-validator';
import Page from '../models/Page.js';
import News from '../models/News.js';
import CaseModel from '../models/Case.js';
import Lecturer from '../models/Lecturer.js';
import CertificateModel from '../models/Certificate.js';
import Partner from '../models/Partner.js';
import Kindergarten from '../models/Kindergarten.js';
import Event from '../models/Event.js';
import BoardChair from '../models/BoardChair.js';
import MapContinent from '../models/MapContinent.js';
import MapMarker from '../models/MapMarker.js';
import ContactMessage from '../models/ContactMessage.js';
import Translation from '../models/Translation.js';
import locationCatalog from '../services/locationCatalog.js';

const router = express.Router();
const DEFAULT_I18N_LOCALES = ['zh', 'en'];
const CONFIGURED_I18N_LOCALES = (process.env.I18N_LOCALES || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const I18N_LOCALES = CONFIGURED_I18N_LOCALES.length ? CONFIGURED_I18N_LOCALES : DEFAULT_I18N_LOCALES;

function normalizeLocale(input) {
  const lower = (input || '').toLowerCase();
  if (I18N_LOCALES.includes(lower)) return lower;
  const matched = I18N_LOCALES.find((item) => lower.startsWith(item));
  return matched || I18N_LOCALES[0];
}

// 简单的后端多语言提示（仅用于公共接口 message 字段）
const i18nMessages = {
  invalidParams: {
    zh: '参数错误',
    en: 'Invalid parameters'
  },
  contactRateLimited: {
    zh: '提交过于频繁，请稍后再试',
    en: 'Too many requests, please try again later'
  },
  contactSubmitSuccess: {
    zh: '提交成功',
    en: 'Submitted successfully'
  },
  contactSubmitFailed: {
    zh: '提交失败',
    en: 'Submission failed'
  }
};

function getLangFromReq(req) {
  // 优先使用显式 lang 参数（query 或 body），否则看 Accept-Language
  const explicit =
    (typeof req.query?.lang === 'string' && req.query.lang) ||
    (typeof req.body?.lang === 'string' && req.body.lang);
  const lang = (explicit || req.headers['accept-language'] || '').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('zh')) return 'zh';
  return 'zh';
}

function tMsg(key, req) {
  const lang = getLangFromReq(req);
  const entry = i18nMessages[key];
  if (!entry) return '';
  return entry[lang] || entry.zh || '';
}

// 简单的内存防刷（按 IP 限制联系表单提交频率）
const contactRateLimitStore = new Map();
const CONTACT_RATE_LIMIT_INTERVAL_MS = 30 * 1000; // 同一 IP 30 秒内只能提交一次

function isContactRateLimited(ip) {
  const now = Date.now();
  const last = contactRateLimitStore.get(ip) || 0;
  if (now - last < CONTACT_RATE_LIMIT_INTERVAL_MS) {
    return true;
  }
  contactRateLimitStore.set(ip, now);
  return false;
}

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
      return res.status(400).json({ success: false, message: tMsg('invalidParams', req), errors: errors.array() });
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

router.get('/i18n/:locale', async (req, res) => {
  try {
    const locale = normalizeLocale(req.params.locale);
    const data = await Translation.exportLocale(locale);
    return res.json({ success: true, data, locale });
  } catch (error) {
    console.error('GET /api/public/i18n/:locale error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

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

// 公开：推荐幼儿园列表
router.get(
  '/kindergartens',
  [
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    const limit = req.query.limit || 12;
    try {
      const data = await Kindergarten.findPublished(limit);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/public/kindergartens error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 公开：董事会主席
router.get('/board-chair', async (req, res) => {
  try {
    const data = await BoardChair.findAll();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/public/board-chair error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 公开：活动列表
router.get(
  '/events',
  [
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    const limit = req.query.limit || 6;
    try {
      const data = await Event.findPublished(limit);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/public/events error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.get(
  '/events/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }
    try {
      const data = await Event.findById(req.params.id);
      if (!data || data.status !== 'published') {
        return res.status(404).json({ success: false, message: '未找到活动' });
      }
      return res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/public/events/:id error:', error);
      return res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

// 公开：地图标点
router.get('/map-markers', async (req, res) => {
  try {
    const data = await MapContinent.fetchForPublic();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/public/map-markers error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 公开：地图标点平铺列表
router.post('/map-markers/flat', async (req, res) => {
  try {
    const markers = await MapMarker.findAllEnabledFlat();
    return res.json({ success: true, data: markers });
  } catch (error) {
    console.error('POST /api/public/map-markers/flat error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 公开：根据国家获取所在洲的图片
router.post('/continent-photos', async (req, res) => {
  const country = typeof req.body?.country === 'string' ? req.body.country.trim() : '';
  const continentInput = typeof req.body?.continent === 'string' ? req.body.continent.trim() : '';

  if (!country && !continentInput) {
    return res.status(400).json({ success: false, message: 'country 或 continent 至少提供一个' });
  }

  try {
    if (continentInput) {
      const continentDetail = await MapContinent.findByNameOrCode(continentInput);
      if (continentDetail) {
        return res.json({
          success: true,
          data: {
            continentId: continentDetail.id,
            continentName: continentDetail.name,
            continentCode: continentDetail.code,
            photos: continentDetail.photos || []
          }
        });
      }
      if (!country) {
        return res.status(404).json({ success: false, message: '未找到对应洲信息' });
      }
    }

    if (!country) {
      return res.status(404).json({ success: false, message: '未找到对应洲信息' });
    }

    const variants = new Set([country]);
    const resolved = await locationCatalog.resolveCountryByName(country);
    if (resolved) {
      if (resolved.nameEn) variants.add(resolved.nameEn);
      if (resolved.nameZh) variants.add(resolved.nameZh);
    }

    const continentMeta =
      (await MapMarker.findContinentByCountryVariants(Array.from(variants))) ||
      (await MapMarker.findContinentByCountry(country));
    if (!continentMeta) {
      return res.status(404).json({ success: false, message: '未找到对应洲信息' });
    }

    const continent = await MapContinent.findById(continentMeta.continentId);
    const photos = continent?.photos || [];
    return res.json({
      success: true,
      data: {
        continentId: continentMeta.continentId,
        continentName: continentMeta.continentName,
        continentCode: continentMeta.continentCode,
        photos
      }
    });
  } catch (error) {
    console.error('POST /api/public/continent-photos error:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 公开：联系表单 - 家庭/亲子
router.post(
  '/contact/parenting',
  [
    body('childAge').optional().toInt().isInt({ min: 0, max: 30 }).withMessage('childAge 范围 0-30'),
    body('interest').optional().isString().isLength({ max: 255 }).withMessage('兴趣方向过长'),
    body('contact').isString().notEmpty().withMessage('联系方式必填').isLength({ max: 50 }).withMessage('联系方式过长'),
    body('problem').optional().isString().isLength({ max: 5000 }).withMessage('问题描述过长')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || '';
    if (isContactRateLimited(ip)) {
      return res.status(429).json({ success: false, message: tMsg('contactRateLimited', req) });
    }

    try {
      await ContactMessage.create({
        type: 'parenting',
        childAge: req.body.childAge,
        interest: req.body.interest,
        phone: req.body.contact,
        problem: req.body.problem,
        ip,
        userAgent: req.headers['user-agent'] || ''
      });
      return res.json({ success: true, message: tMsg('contactSubmitSuccess', req) });
    } catch (error) {
      console.error('POST /api/public/contact/parenting error:', error);
      return res.status(500).json({ success: false, message: tMsg('contactSubmitFailed', req) });
    }
  }
);

// 公开：联系表单 - 机构合作
router.post(
  '/contact/business',
  [
    body('company').optional().isString().isLength({ max: 255 }).withMessage('公司名称过长'),
    body('orgType').optional().isString().isLength({ max: 255 }).withMessage('机构类型过长'),
    body('phone').isString().notEmpty().withMessage('联系方式必填').isLength({ max: 50 }).withMessage('联系方式过长'),
    body('intention').optional().isString().isLength({ max: 5000 }).withMessage('合作意向过长')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: tMsg('invalidParams', req), errors: errors.array() });
    }

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || '';
    if (isContactRateLimited(ip)) {
      return res.status(429).json({ success: false, message: tMsg('contactRateLimited', req) });
    }

    try {
      await ContactMessage.create({
        type: 'business',
        company: req.body.company,
        orgType: req.body.orgType,
        phone: req.body.phone,
        intention: req.body.intention,
        ip,
        userAgent: req.headers['user-agent'] || ''
      });
      return res.json({ success: true, message: tMsg('contactSubmitSuccess', req) });
    } catch (error) {
      console.error('POST /api/public/contact/business error:', error);
      return res.status(500).json({ success: false, message: tMsg('contactSubmitFailed', req) });
    }
  }
);

export default router;


