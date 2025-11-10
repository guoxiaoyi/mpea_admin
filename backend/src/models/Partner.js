import pool from '../config/database.js';

const BASE_FIELDS = `
  id,
  title,
  image,
  link,
  sort_order,
  status,
  created_at,
  updated_at
`;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function normalizePage(value, fallback = DEFAULT_PAGE) {
  const page = Number.parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? fallback : page;
}

function normalizeLimit(value, fallback = DEFAULT_LIMIT) {
  const limit = Number.parseInt(value, 10);
  if (Number.isNaN(limit)) return fallback;
  return Math.min(MAX_LIMIT, Math.max(1, limit));
}

function normalizeSortOrder(value) {
  const order = Number.parseInt(value, 10);
  return Number.isNaN(order) ? 0 : order;
}

function normalizeStatus(status) {
  return status === 'disabled' ? 'disabled' : 'enabled';
}

function sanitizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapPartner(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    image: row.image,
    link: row.link,
    sortOrder: normalizeSortOrder(row.sort_order ?? row.sortOrder),
    status: row.status,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

class Partner {
  // 创建合作伙伴表（保留兼容，推荐使用迁移脚本）
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        image VARCHAR(500) NOT NULL,
        link VARCHAR(500),
        sort_order INT DEFAULT 0,
        status ENUM('enabled', 'disabled') DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sort_order (sort_order),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.execute(createTableSQL);
  }

  // 创建合作伙伴
  static async create(data) {
    const title = sanitizeString(data.title);
    const image = sanitizeString(data.image);
    const link = sanitizeString(data.link);
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const status = normalizeStatus(data.status);

    const [result] = await pool.execute(
      'INSERT INTO partners (title, image, link, sort_order, status) VALUES (?, ?, ?, ?, ?)',
      [title, image, link, sortOrder, status]
    );

    return result;
  }

  // 查询所有合作伙伴（分页，带搜索）
  static async findAll(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, keyword = '') {
    const pageNum = normalizePage(page);
    const limitNum = normalizeLimit(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = `SELECT ${BASE_FIELDS} FROM partners`;
    let countQuery = 'SELECT COUNT(*) as total FROM partners';
    const params = [];
    const countParams = [];

    const trimmedKeyword = sanitizeString(keyword);
    if (trimmedKeyword) {
      query += ' WHERE title LIKE ?';
      countQuery += ' WHERE title LIKE ?';
      const searchTerm = `%${trimmedKeyword}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
    }

    query += ` ORDER BY sort_order ASC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      data: rows.map(mapPartner),
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  // 查询启用的合作伙伴（公开接口）
  static async findPublished(page = DEFAULT_PAGE, limit = MAX_LIMIT) {
    const pageNum = normalizePage(page);
    const limitNum = normalizeLimit(limit, MAX_LIMIT);
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT id, title, image, link, sort_order, status, created_at, updated_at
      FROM partners
      WHERE status = "enabled"
      ORDER BY sort_order ASC, created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const countQuery = 'SELECT COUNT(*) as total FROM partners WHERE status = "enabled"';

    const [rows] = await pool.execute(query);
    const [countResult] = await pool.execute(countQuery);

    return {
      data: rows.map(mapPartner),
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT ${BASE_FIELDS} FROM partners WHERE id = ?`,
      [id]
    );
    return mapPartner(rows[0]);
  }

  // 更新合作伙伴
  static async update(id, data) {
    const title = sanitizeString(data.title);
    const image = sanitizeString(data.image);
    const link = sanitizeString(data.link);
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const status = normalizeStatus(data.status);

    const [result] = await pool.execute(
      'UPDATE partners SET title = ?, image = ?, link = ?, sort_order = ?, status = ? WHERE id = ?',
      [title, image, link, sortOrder, status, id]
    );
    return result;
  }

  // 删除合作伙伴
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM partners WHERE id = ?', [id]);
    return result;
  }

  // 批量删除
  static async batchDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return { affectedRows: 0 };
    const uniqueIds = Array.from(new Set(ids));
    const placeholders = uniqueIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM partners WHERE id IN (${placeholders})`,
      uniqueIds
    );
    return result;
  }

  // 更新排序
  static async updateSortOrder(id, sortOrder) {
    const safeOrder = normalizeSortOrder(sortOrder);
    const [result] = await pool.execute(
      'UPDATE partners SET sort_order = ? WHERE id = ?',
      [safeOrder, id]
    );
    return result;
  }
}

export default Partner;

