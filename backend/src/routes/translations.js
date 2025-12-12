import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { body, param, query, validationResult } from 'express-validator';
import Translation from '../models/Translation.js';

const router = express.Router();
router.use(authMiddleware);

const DEFAULT_LOCALES = ['zh', 'en'];
const SUPPORTED_LOCALES = (process.env.I18N_LOCALES || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const AVAILABLE_LOCALES = SUPPORTED_LOCALES.length ? SUPPORTED_LOCALES : DEFAULT_LOCALES;

function sendValidationError(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: '参数错误',
      errors: errors.array()
    });
    return true;
  }
  return false;
}

function normalizeValues(values) {
  if (!values || typeof values !== 'object') return {};
  const result = {};
  Object.entries(values).forEach(([locale, value]) => {
    if (value === undefined || value === null) return;
    result[locale] = typeof value === 'string' ? value : String(value);
  });
  return result;
}

router.get('/meta', async (req, res) => {
  try {
    const namespaces = await Translation.findNamespaces();
    res.json({
      success: true,
      data: {
        locales: AVAILABLE_LOCALES,
        namespaces
      }
    });
  } catch (error) {
    console.error('GET /api/translations/meta error:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

router.get(
  '/',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 10000 }).withMessage('limit 范围 1-10000'),
    query('namespace').optional().isString(),
    query('keyword').optional().isString()
  ],
  async (req, res) => {
    if (sendValidationError(req, res)) return;
    const { page = 1, limit = 20, namespace = '', keyword = '' } = req.query;
    try {
      const data = await Translation.findAll({ page, limit, namespace, keyword });
      res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/translations error:', error);
      res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.get(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    if (sendValidationError(req, res)) return;
    try {
      const row = await Translation.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: '未找到翻译条目' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      console.error('GET /api/translations/:id error:', error);
      res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.post(
  '/',
  [
    body('fullKey').isString().notEmpty().withMessage('fullKey 必填'),
    body('label').optional().isString(),
    body('description').optional().isString(),
    body('sortOrder').optional().toInt().isInt({ min: 0 }),
    body('values').optional().isObject().withMessage('values 必须为对象')
  ],
  async (req, res) => {
    if (sendValidationError(req, res)) return;
    try {
      const payload = {
        fullKey: req.body.fullKey,
        label: req.body.label,
        description: req.body.description,
        sortOrder: req.body.sortOrder,
        values: normalizeValues(req.body.values || {}),
        updatedBy: req.admin?.username,
        updatedById: req.admin?.id
      };
      const result = await Translation.create(payload);
      const created = await Translation.findById(result.id);
      res.json({ success: true, data: created });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'fullKey 已存在' });
      }
      console.error('POST /api/translations error:', error);
      res.status(500).json({ success: false, message: '创建失败' });
    }
  }
);

router.put(
  '/:id',
  [
    param('id').toInt().isInt().withMessage('id 必须为整数'),
    body('fullKey').optional().isString().notEmpty().withMessage('fullKey 必填'),
    body('label').optional().isString(),
    body('description').optional().isString(),
    body('sortOrder').optional().toInt().isInt({ min: 0 }),
    body('values').optional().isObject().withMessage('values 必须为对象')
  ],
  async (req, res) => {
    if (sendValidationError(req, res)) return;
    try {
      const payload = {
        fullKey: req.body.fullKey,
        label: req.body.label,
        description: req.body.description,
        sortOrder: req.body.sortOrder,
        values: req.body.values === undefined ? undefined : normalizeValues(req.body.values),
        updatedBy: req.admin?.username,
        updatedById: req.admin?.id
      };
      await Translation.update(req.params.id, payload);
      const row = await Translation.findById(req.params.id);
      res.json({ success: true, data: row });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'fullKey 已存在' });
      }
      console.error('PUT /api/translations/:id error:', error);
      res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

router.delete(
  '/:id',
  [param('id').toInt().isInt().withMessage('id 必须为整数')],
  async (req, res) => {
    if (sendValidationError(req, res)) return;
    try {
      await Translation.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/translations/:id error:', error);
      res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

router.post(
  '/import',
  [
    body('locale').isString().notEmpty().withMessage('locale 必填'),
    body('data').custom((value) => value && typeof value === 'object' && !Array.isArray(value)).withMessage('data 必须为对象')
  ],
  async (req, res) => {
    if (sendValidationError(req, res)) return;
    const locale = req.body.locale;
    if (!AVAILABLE_LOCALES.includes(locale)) {
      return res.status(400).json({ success: false, message: `locale 仅支持: ${AVAILABLE_LOCALES.join(', ')}` });
    }
    try {
      const result = await Translation.importLocale(locale, req.body.data, {
        updatedBy: req.admin?.username,
        updatedById: req.admin?.id
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('POST /api/translations/import error:', error);
      res.status(500).json({ success: false, message: '导入失败' });
    }
  }
);

export default router;


