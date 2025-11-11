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
  return value === 'published' ? 'published' : 'draft';
}

function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? row.titleEn,
    cover: row.cover,
    eventDate: row.event_date ?? row.eventDate,
    content: row.content,
    contentEn: row.content_en ?? row.contentEn,
    status: row.status,
    sortOrder: normalizeSortOrder(row.sort_order ?? row.sortOrder),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

class Event {
  static async create(data) {
    const title = sanitizeString(data.title);
    const titleEn = sanitizeString(data.titleEn);
    const cover = sanitizeString(data.cover);
    const content = data.content ?? '';
    const contentEn = data.contentEn ?? '';
    const eventDate = data.eventDate ? new Date(data.eventDate) : null;
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const status = normalizeStatus(data.status);

    if (!eventDate || Number.isNaN(eventDate.getTime())) {
      throw new Error('Invalid eventDate');
    }

    const [result] = await pool.execute(
      `
        INSERT INTO events (title, title_en, cover, event_date, content, content_en, status, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [title, titleEn, cover, eventDate, content, contentEn, status, sortOrder]
    );
    return result;
  }

  static async findAll(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, keyword = '', status) {
    const pageNum = normalizePage(page);
    const limitNum = normalizeLimit(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT id, title, title_en, cover, event_date, content, content_en, status, sort_order, created_at, updated_at
      FROM events
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM events';
    const conditions = [];
    const params = [];
    const countParams = [];

    const trimmedKeyword = sanitizeString(keyword);
    if (trimmedKeyword) {
      conditions.push('(title LIKE ? OR title_en LIKE ? OR content LIKE ? OR content_en LIKE ?)');
      const searchTerm = `%${trimmedKeyword}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status === 'draft' || status === 'published') {
      conditions.push('status = ?');
      params.push(status);
      countParams.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY sort_order ASC, event_date DESC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

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
      SELECT id, title, title_en, cover, event_date, content, content_en, status, sort_order, created_at, updated_at
      FROM events
      WHERE status = "published"
      ORDER BY event_date DESC, sort_order ASC, created_at DESC
      LIMIT ${limitNum}
    `;
    const [rows] = await pool.execute(query);
    return rows.map(mapRow);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `
        SELECT id, title, title_en, cover, event_date, content, content_en, status, sort_order, created_at, updated_at
        FROM events
        WHERE id = ?
      `,
      [id]
    );
    return mapRow(rows[0]);
  }

  static async update(id, data) {
    const title = sanitizeString(data.title);
    const titleEn = sanitizeString(data.titleEn);
    const cover = sanitizeString(data.cover);
    const content = data.content ?? '';
    const contentEn = data.contentEn ?? '';
    const eventDate = data.eventDate ? new Date(data.eventDate) : null;
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const status = normalizeStatus(data.status);

    if (!eventDate || Number.isNaN(eventDate.getTime())) {
      throw new Error('Invalid eventDate');
    }

    const [result] = await pool.execute(
      `
        UPDATE events
        SET title = ?, title_en = ?, cover = ?, event_date = ?, content = ?, content_en = ?, status = ?, sort_order = ?
        WHERE id = ?
      `,
      [title, titleEn, cover, eventDate, content, contentEn, status, sortOrder, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM events WHERE id = ?',
      [id]
    );
    return result;
  }
}

export default Event;


