import pool from '../config/database.js';

class Page {
  // 创建页面
  static async create(data) {
    const { title, path, content, status } = data;
    const [result] = await pool.execute(
      'INSERT INTO pages (title, path, content, status) VALUES (?, ?, ?, ?)',
      [title, path, content || '', status || 'draft']
    );
    return result;
  }

  // 获取页面列表（分页、搜索）
  static async findAll(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    // 保障 LIMIT/OFFSET 为安全范围内的整数
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    let query = 'SELECT * FROM pages';
    let countQuery = 'SELECT COUNT(*) as total FROM pages';
    const params = [];
    const countParams = [];

    if (keyword) {
      query += ' WHERE title LIKE ? OR path LIKE ?';
      countQuery += ' WHERE title LIKE ? OR path LIKE ?';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    // 注意：部分 MySQL 版本对 LIMIT/OFFSET 的占位符支持不好，改为内联安全数值
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

  // 根据ID查找页面
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM pages WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 更新页面
  static async update(id, data) {
    const { title, path, content, status } = data;
    const [result] = await pool.execute(
      'UPDATE pages SET title = ?, path = ?, content = ?, status = ? WHERE id = ?',
      [title, path, content, status, id]
    );
    return result;
  }

  // 删除页面
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM pages WHERE id = ?',
      [id]
    );
    return result;
  }

  // 检查路径是否存在
  static async pathExists(path, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM pages WHERE path = ?';
    const params = [path];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0].count > 0;
  }
}

export default Page;

