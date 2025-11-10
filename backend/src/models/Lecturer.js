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
  const sortOrder = Number.parseInt(value, 10);
  return Number.isNaN(sortOrder) ? 0 : sortOrder;
}

class Lecturer {
  static async create(data) {
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const [result] = await pool.execute(
      'INSERT INTO lecturers (name, photo, introduction, sort_order) VALUES (?, ?, ?, ?)',
      [data.name, data.photo, data.introduction || '', sortOrder]
    );
    return result;
  }

  static async findAll(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, keyword = '') {
    const pageNum = normalizePage(page);
    const limitNum = normalizeLimit(limit);
    const offset = (pageNum - 1) * limitNum;
    let query = 'SELECT id, name, photo, introduction, sort_order AS sortOrder, created_at, updated_at FROM lecturers';
    let countQuery = 'SELECT COUNT(*) as total FROM lecturers';
    const params = [];
    const countParams = [];

    if (keyword) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
    }

    query += ` ORDER BY sort_order ASC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      data: rows,
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, photo, introduction, sort_order AS sortOrder, created_at, updated_at FROM lecturers WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, data) {
    const sortOrder = normalizeSortOrder(data.sortOrder);
    const [result] = await pool.execute(
      'UPDATE lecturers SET name = ?, photo = ?, introduction = ?, sort_order = ? WHERE id = ?',
      [data.name, data.photo, data.introduction || '', sortOrder, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM lecturers WHERE id = ?', [id]);
    return result;
  }
}

export default Lecturer;

