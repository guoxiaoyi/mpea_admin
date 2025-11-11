import pool from '../config/database.js';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? row.nameEn,
    avatar: row.avatar,
    introduction: row.introduction,
    introductionEn: row.introduction_en ?? row.introductionEn,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

class BoardChair {
  static async findAll() {
    const [rows] = await pool.execute(
      `
        SELECT id, name, name_en, avatar, introduction, introduction_en, created_at, updated_at
        FROM board_chair
        ORDER BY created_at DESC, id DESC
      `
    );
    return rows.map(mapRow);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `
        SELECT id, name, name_en, avatar, introduction, introduction_en, created_at, updated_at
        FROM board_chair
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapRow(rows[0]);
  }

  static async create(data) {
    const [result] = await pool.execute(
      `
        INSERT INTO board_chair (name, name_en, avatar, introduction, introduction_en)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        normalizeString(data.name),
        normalizeString(data.nameEn),
        normalizeString(data.avatar),
        data.introduction || '',
        data.introductionEn || ''
      ]
    );
    return result;
  }

  static async update(id, data) {
    const [result] = await pool.execute(
      `
        UPDATE board_chair
        SET name = ?, name_en = ?, avatar = ?, introduction = ?, introduction_en = ?
        WHERE id = ?
      `,
      [
        normalizeString(data.name),
        normalizeString(data.nameEn),
        normalizeString(data.avatar),
        data.introduction || '',
        data.introductionEn || '',
        id
      ]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM board_chair WHERE id = ?',
      [id]
    );
    return result;
  }
}

export default BoardChair;


