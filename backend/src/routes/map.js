import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import MapContinent from '../models/MapContinent.js';
import MapMarker from '../models/MapMarker.js';
import locationCatalog from '../services/locationCatalog.js';

const router = express.Router();

router.use(authMiddleware);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: '参数错误',
      errors: errors.array()
    });
    return false;
  }
  return true;
}

router.get(
  '/continents',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100'),
    query('keyword').optional().isString(),
    query('status').optional().isIn(['enabled', 'disabled']).withMessage('status 非法')
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const result = await MapContinent.findAll(
        req.query.page,
        req.query.limit,
        req.query.keyword || '',
        req.query.status
      );
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('GET /api/map/continents error:', error);
      res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.get('/continents/simple', async (req, res) => {
  try {
    const data = await MapContinent.findAllSimple();
    res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/map/continents/simple error:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

router.get(
  '/continents/:id',
  [param('id').toInt().isInt({ min: 1 }).withMessage('id 必须为整数')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const data = await MapContinent.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: '未找到洲信息' });
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/map/continents/:id error:', error);
      res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

const continentValidators = [
  body('name').isString().trim().notEmpty().withMessage('name 必填'),
  body('code').optional({ nullable: true }).isString().isLength({ max: 50 }).withMessage('code 非法'),
  body('description').optional().isString(),
  body('sortOrder').optional().toInt().isInt().withMessage('sortOrder 必须为整数'),
  body('status').optional().isIn(['enabled', 'disabled']).withMessage('status 非法'),
  body('photos').optional().isArray().withMessage('photos 必须为数组'),
  body('photos.*.url').optional().isString().notEmpty().withMessage('photo.url 不能为空'),
  body('photos.*.sortOrder').optional().toInt().isInt().withMessage('photo.sortOrder 必须为整数')
];

router.post('/continents', continentValidators, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await MapContinent.create(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('POST /api/map/continents error:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'code 已存在' });
    }
    res.status(500).json({ success: false, message: '创建失败' });
  }
});

router.put(
  '/continents/:id',
  [param('id').toInt().isInt({ min: 1 }).withMessage('id 必须为整数'), ...continentValidators],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      await MapContinent.update(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('PUT /api/map/continents/:id error:', error);
      if (error?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'code 已存在' });
      }
      res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

router.delete(
  '/continents/:id',
  [param('id').toInt().isInt({ min: 1 }).withMessage('id 必须为整数')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      await MapContinent.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/map/continents/:id error:', error);
      res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

router.get(
  '/markers',
  [
    query('page').optional().toInt().isInt({ min: 1 }).withMessage('page 必须为正整数'),
    query('limit').optional().toInt().isInt({ min: 1, max: 100 }).withMessage('limit 范围 1-100'),
    query('keyword').optional().isString(),
    query('status').optional().isIn(['enabled', 'disabled']).withMessage('status 非法'),
    query('continentId').optional().toInt().isInt({ min: 1 }).withMessage('continentId 必须为整数')
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const result = await MapMarker.findAll({
        page: req.query.page,
        limit: req.query.limit,
        keyword: req.query.keyword || '',
        status: req.query.status,
        continentId: req.query.continentId
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('GET /api/map/markers error:', error);
      res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

router.get(
  '/markers/:id',
  [param('id').toInt().isInt({ min: 1 }).withMessage('id 必须为整数')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const data = await MapMarker.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: '未找到城市标记' });
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/map/markers/:id error:', error);
      res.status(500).json({ success: false, message: '获取失败' });
    }
  }
);

const markerValidators = [
  body('continentId').toInt().isInt({ min: 1 }).withMessage('continentId 必填'),
  body('country').isString().trim().notEmpty().withMessage('country 必填'),
  body('city').isString().trim().notEmpty().withMessage('city 必填'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude 范围 -90~90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude 范围 -180~180'),
  body('sortOrder').optional().toInt().isInt().withMessage('sortOrder 必须为整数'),
  body('status').optional().isIn(['enabled', 'disabled']).withMessage('status 非法')
];

router.post('/markers', markerValidators, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await MapMarker.create(req.body);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('POST /api/map/markers error:', error);
    res.status(500).json({ success: false, message: '创建失败' });
  }
});

router.put(
  '/markers/:id',
  [param('id').toInt().isInt({ min: 1 }).withMessage('id 必须为整数'), ...markerValidators],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      await MapMarker.update(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('PUT /api/map/markers/:id error:', error);
      res.status(500).json({ success: false, message: '更新失败' });
    }
  }
);

router.delete(
  '/markers/:id',
  [param('id').toInt().isInt({ min: 1 }).withMessage('id 必须为整数')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      await MapMarker.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/map/markers/:id error:', error);
      res.status(500).json({ success: false, message: '删除失败' });
    }
  }
);

router.post(
  '/markers/bulk',
  [
    body('markers')
      .isArray({ min: 1 })
      .withMessage('markers 必须为非空数组'),
    body('markers.*.continentCode')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('continentCode 必填'),
    body('markers.*.country')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('country 必填'),
    body('markers.*.city')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('city 必填'),
    body('markers.*.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('latitude 范围 -90~90'),
    body('markers.*.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('longitude 范围 -180~180'),
    body('markers.*.status')
      .optional()
      .isIn(['enabled', 'disabled'])
      .withMessage('status 非法'),
    body('markers.*.sortOrder')
      .optional()
      .toInt()
      .isInt()
      .withMessage('sortOrder 必须为整数')
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const markers = Array.isArray(req.body.markers) ? req.body.markers : [];
    const results = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const marker of markers) {
      const item = {
        city: marker.city,
        country: marker.country,
        continentCode: marker.continentCode,
        countryCode: marker.countryCode || ''
      };
      try {
        const continentCode = String(marker.continentCode || '').toLowerCase();
        let continent = await MapContinent.findByCode(continentCode);
        if (!continent) {
          const continentMeta = locationCatalog.getContinentMeta(continentCode);
          if (!continentMeta) {
            item.status = 'failed';
            item.reason = 'continent_not_found';
            failed += 1;
            results.push(item);
            continue;
          }

          try {
            const createdContinent = await MapContinent.create({
              name: continentMeta.nameZh || continentMeta.nameEn || continentMeta.code.toUpperCase(),
              code: continentMeta.code,
              description: continentMeta.nameEn || '',
              sortOrder: 0,
              status: 'enabled',
              photos: []
            });
            continent = await MapContinent.findByCode(continentMeta.code);
            if (!continent && createdContinent?.id) {
              continent = {
                id: createdContinent.id,
                code: continentMeta.code
              };
            }
          } catch (createErr) {
            if (createErr?.code === 'ER_DUP_ENTRY') {
              continent = await MapContinent.findByCode(continentMeta.code);
            } else {
              console.error('Auto create continent failed:', createErr);
              item.status = 'failed';
              item.reason = 'continent_create_failed';
              failed += 1;
              results.push(item);
              continue;
            }
          }
        }

        if (!continent) {
          item.status = 'failed';
          item.reason = 'continent_resolve_failed';
          failed += 1;
          results.push(item);
          continue;
        }

        const countryNameInput = typeof marker.country === 'string' ? marker.country.trim() : '';
        const countryCodeInput =
          typeof marker.countryCode === 'string' ? marker.countryCode.trim().toUpperCase() : '';
        const countryName =
          countryNameInput || countryCodeInput;
        const cityName = typeof marker.city === 'string' ? marker.city.trim() : '';

        if (!countryName || !cityName) {
          item.status = 'failed';
          item.reason = 'invalid_location';
          failed += 1;
          results.push(item);
          continue;
        }

        const existing = await MapMarker.findByContinentCountryCity(continent.id, countryName, cityName);
        if (existing) {
          item.status = 'skipped';
          item.reason = 'exists';
          skipped += 1;
          item.markerId = existing.id;
          results.push(item);
          continue;
        }

        const createResult = await MapMarker.create({
          continentId: continent.id,
          country: countryName,
          countryCode: countryCodeInput,
          city: cityName,
          latitude: Number(marker.latitude),
          longitude: Number(marker.longitude),
          sortOrder: Number.isFinite(marker.sortOrder) ? marker.sortOrder : Number(marker.sortOrder) || 0,
          status: marker.status || 'enabled'
        });
        item.status = 'created';
        item.markerId = createResult?.insertId || null;
        created += 1;
        results.push(item);
      } catch (error) {
        console.error('BULK create marker error:', error);
        item.status = 'failed';
        item.reason = error.message || 'unknown_error';
        failed += 1;
        results.push(item);
      }
    }

    res.json({
      success: true,
      data: {
        summary: {
          total: markers.length,
          created,
          skipped,
          failed
        },
        results
      }
    });
  }
);

router.get('/catalog/continents', async (req, res) => {
  try {
    const data = locationCatalog.listContinents();
    res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/map/catalog/continents error:', error);
    res.status(500).json({ success: false, message: '获取洲列表失败' });
  }
});

router.get(
  '/catalog/countries',
  [
    query('continentCode')
      .isString()
      .notEmpty()
      .withMessage('continentCode 必填')
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const data = await locationCatalog.getCountriesByContinent(req.query.continentCode);
      res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/map/catalog/countries error:', error);
      res.status(500).json({ success: false, message: error.message || '获取国家列表失败' });
    }
  }
);

router.get(
  '/catalog/cities',
  [
    query('countryCode')
      .isString()
      .isLength({ min: 2, max: 2 })
      .withMessage('countryCode 必须为 2 位国家代码')
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const data = await locationCatalog.getCitiesByCountryCode(req.query.countryCode);
      res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/map/catalog/cities error:', error);
      res.status(500).json({ success: false, message: error.message || '获取城市列表失败' });
    }
  }
);

router.get(
  '/catalog/city-info',
  [
    query('countryCode')
      .isString()
      .isLength({ min: 2, max: 2 })
      .withMessage('countryCode 必须为 2 位国家代码'),
    query('city').isString().notEmpty().withMessage('city 必填')
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const data = await locationCatalog.getCityInfo(req.query.countryCode, req.query.city);
      if (!data) {
        return res.status(404).json({ success: false, message: '未找到该城市的地理信息' });
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/map/catalog/city-info error:', error);
      res.status(500).json({ success: false, message: error.message || '获取城市信息失败' });
    }
  }
);

export default router;


