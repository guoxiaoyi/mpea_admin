import pool from '../config/database.js';

class CaseModel {
  static async create(data) {
    const { title, professionalPhoto, childPhoto, introduction } = data;
    const [result] = await pool.execute(
      'INSERT INTO cases (title, professional_photo, child_photo, introduction) VALUES (?, ?, ?, ?)',
      [title, professionalPhoto, childPhoto, introduction || '']
    );
    return result;
  }

  static async findAll(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    let query = 'SELECT id, title, professional_photo AS professionalPhoto, child_photo AS childPhoto, introduction, created_at, updated_at FROM cases';
    let countQuery = 'SELECT COUNT(*) as total FROM cases';
    const params = [];
    const countParams = [];

    if (keyword) {
      query += ' WHERE title LIKE ?';
      countQuery += ' WHERE title LIKE ?';
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
      'SELECT id, title, professional_photo AS professionalPhoto, child_photo AS childPhoto, introduction, created_at, updated_at FROM cases WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, data) {
    const { title, professionalPhoto, childPhoto, introduction } = data;
    const [result] = await pool.execute(
      'UPDATE cases SET title = ?, professional_photo = ?, child_photo = ?, introduction = ? WHERE id = ?',
      [title, professionalPhoto, childPhoto, introduction || '', id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM cases WHERE id = ?', [id]);
    return result;
  }
}

export default CaseModel;


