import pool from '../config/database.js';

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

function normalizeStatus(value) {
  return value === 'disabled' ? 'disabled' : 'enabled';
}

function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? row.nameEn,
    address: row.address,
    addressEn: row.address_en ?? row.addressEn,
    logo: row.logo,
    sortOrder: normalizeSortOrder(row.sort_order ?? row.sortOrder),
    status: row.status,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

class Kindergarten {
  static async create(data) {
    const name = sanitizeString(data.name);
    const nameEn = sanitizeString(data.nameEn);
    const address = sanitizeString(data.address);
    const addressEn = sanitizeString(data.addressEn);
    const logo = sanitizeString(data.logo);
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const status = normalizeStatus(data.status);

    const [result] = await pool.execute(
      'INSERT INTO kindergartens (name, name_en, address, address_en, logo, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, nameEn, address, addressEn, logo, sortOrder, status]
    );
    return result;
  }

  static async findAll(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, keyword = '', status) {
    const pageNum = normalizePage(page);
    const limitNum = normalizeLimit(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT id, name, name_en, address, address_en, logo, sort_order, status, created_at, updated_at
      FROM kindergartens
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM kindergartens';
    const conditions = [];
    const params = [];
    const countParams = [];

    const trimmedKeyword = sanitizeString(keyword);
    if (trimmedKeyword) {
      conditions.push('(name LIKE ? OR name_en LIKE ? OR address LIKE ? OR address_en LIKE ?)');
      const searchTerm = `%${trimmedKeyword}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status === 'enabled' || status === 'disabled') {
      conditions.push('status = ?');
      params.push(status);
      countParams.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY sort_order ASC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      data: rows.map(mapRow),
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  static async findPublished(limit = MAX_LIMIT) {
    const limitNum = normalizeLimit(limit, MAX_LIMIT);
    const query = `
      SELECT id, name, name_en, address, address_en, logo, sort_order, status, created_at, updated_at
      FROM kindergartens
      WHERE status = "enabled"
      ORDER BY sort_order ASC, created_at DESC
      LIMIT ${limitNum}
    `;
    const [rows] = await pool.execute(query);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `
        SELECT id, name, name_en, address, address_en, logo, sort_order, status, created_at, updated_at
        FROM kindergartens
        WHERE id = ?
      `,
      [id]
    );
    return mapRow(rows[0]);
  }

  static async update(id, data) {
    const name = sanitizeString(data.name);
    const nameEn = sanitizeString(data.nameEn);
    const address = sanitizeString(data.address);
    const addressEn = sanitizeString(data.addressEn);
    const logo = sanitizeString(data.logo);
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const status = normalizeStatus(data.status);

    const [result] = await pool.execute(
      `
        UPDATE kindergartens
        SET name = ?, name_en = ?, address = ?, address_en = ?, logo = ?, sort_order = ?, status = ?
        WHERE id = ?
      `,
      [name, nameEn, address, addressEn, logo, sortOrder, status, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM kindergartens WHERE id = ?',
      [id]
    );
    return result;
  }
}

export default Kindergarten;


