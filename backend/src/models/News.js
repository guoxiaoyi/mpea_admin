import pool from '../config/database.js';

class News {
  static async create(data) {
    const { title, slug, content, status } = data;
    const [result] = await pool.execute(
      'INSERT INTO news (title, slug, content, status) VALUES (?, ?, ?, ?)',
      [title, slug, content || '', status || 'draft']
    );
    return result;
  }

  static async findPublished(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    let query = 'SELECT id, title, slug, content, status, created_at, updated_at FROM news WHERE status = "published"';
    let countQuery = 'SELECT COUNT(*) as total FROM news WHERE status = "published"';
    const params = [];
    const countParams = [];
    if (keyword) {
      query += ' AND (title LIKE ? OR slug LIKE ?)';
      countQuery += ' AND (title LIKE ? OR slug LIKE ?)';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    return { data: rows, total: countResult[0].total, page: pageNum, limit: limitNum };
  }

  static async findPublishedBySlug(slug) {
    const [rows] = await pool.execute(
      'SELECT id, title, slug, content, status, created_at, updated_at FROM news WHERE slug = ? AND status = "published" LIMIT 1',
      [slug]
    );
    return rows[0];
  }
}

export default News;


