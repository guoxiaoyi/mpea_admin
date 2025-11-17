import pool from '../config/database.js';

class CaseModel {
  static async create(data) {
    const {
      title,
      titleEn,
      professionalPhoto,
      childPhoto,
      introduction,
      introductionEn,
      featured
    } = data;
    const [result] = await pool.execute(
      'INSERT INTO cases (title, title_en, professional_photo, child_photo, introduction, introduction_en, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, titleEn || '', professionalPhoto, childPhoto, introduction || '', introductionEn || '', featured ? 1 : 0]
    );
    return result;
  }

  static async findAll(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    let query = 'SELECT id, title, title_en AS titleEn, professional_photo AS professionalPhoto, child_photo AS childPhoto, introduction, introduction_en AS introductionEn, featured, created_at, updated_at FROM cases';
    let countQuery = 'SELECT COUNT(*) as total FROM cases';
    const params = [];
    const countParams = [];

    if (keyword) {
      query += ' WHERE title LIKE ? OR title_en LIKE ?';
      countQuery += ' WHERE title LIKE ? OR title_en LIKE ?';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
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
      'SELECT id, title, title_en AS titleEn, professional_photo AS professionalPhoto, child_photo AS childPhoto, introduction, introduction_en AS introductionEn, featured, created_at, updated_at FROM cases WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, data) {
    const {
      title,
      titleEn,
      professionalPhoto,
      childPhoto,
      introduction,
      introductionEn,
      featured
    } = data;
    const [result] = await pool.execute(
      'UPDATE cases SET title = ?, title_en = ?, professional_photo = ?, child_photo = ?, introduction = ?, introduction_en = ?, featured = ? WHERE id = ?',
      [title, titleEn || '', professionalPhoto, childPhoto, introduction || '', introductionEn || '', featured ? 1 : 0, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM cases WHERE id = ?', [id]);
    return result;
  }
}

export default CaseModel;


