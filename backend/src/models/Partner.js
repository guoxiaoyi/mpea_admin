import pool from '../config/database.js';

class Partner {
  // 创建合作伙伴表
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
    const { title, image, link, sortOrder = 0, status = 'enabled' } = data;
    const [result] = await pool.execute(
      'INSERT INTO partners (title, image, link, sort_order, status) VALUES (?, ?, ?, ?, ?)',
      [title, image, link, sortOrder, status]
    );
    return result;
  }

  // 查询所有合作伙伴（分页，带搜索）
  static async findAll(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    let query = 'SELECT id, title, image, link, sort_order AS sortOrder, status, created_at AS createdAt, updated_at AS updatedAt FROM partners';
    let countQuery = 'SELECT COUNT(*) as total FROM partners';
    const params = [];
    const countParams = [];

    if (keyword) {
      query += ' WHERE title LIKE ?';
      countQuery += ' WHERE title LIKE ?';
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

  // 查询启用的合作伙伴（公开接口）
  static async findPublished(page = 1, limit = 100) {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 100));
    const offset = (pageNum - 1) * limitNum;
    
    const query = 'SELECT id, title, image, link, sort_order AS sortOrder FROM partners WHERE status = "enabled" ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?';
    const countQuery = 'SELECT COUNT(*) as total FROM partners WHERE status = "enabled"';

    const [rows] = await pool.execute(query, [limitNum, offset]);
    const [countResult] = await pool.execute(countQuery);

    return {
      data: rows,
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, title, image, link, sort_order AS sortOrder, status, created_at AS createdAt, updated_at AS updatedAt FROM partners WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 更新合作伙伴
  static async update(id, data) {
    const { title, image, link, sortOrder, status } = data;
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
    if (!ids || ids.length === 0) return { affectedRows: 0 };
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM partners WHERE id IN (${placeholders})`,
      ids
    );
    return result;
  }

  // 更新排序
  static async updateSortOrder(id, sortOrder) {
    const [result] = await pool.execute(
      'UPDATE partners SET sort_order = ? WHERE id = ?',
      [sortOrder, id]
    );
    return result;
  }
}

export default Partner;

