import pool from '../config/database.js';

class Lecturer {
  static async create(data) {
    const { name, photo, introduction } = data;
    const [result] = await pool.execute(
      'INSERT INTO lecturers (name, photo, introduction) VALUES (?, ?, ?)',
      [name, photo, introduction || '']
    );
    return result;
  }

  static async findAll(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    let query = 'SELECT id, name, photo, introduction, created_at, updated_at FROM lecturers';
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

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

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
      'SELECT id, name, photo, introduction, created_at, updated_at FROM lecturers WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, data) {
    const { name, photo, introduction } = data;
    const [result] = await pool.execute(
      'UPDATE lecturers SET name = ?, photo = ?, introduction = ? WHERE id = ?',
      [name, photo, introduction || '', id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM lecturers WHERE id = ?', [id]);
    return result;
  }
}

export default Lecturer;


