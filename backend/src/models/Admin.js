import bcrypt from 'bcrypt';
import pool from '../config/database.js';

class Admin {
  // 创建管理员
  static async create(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    return result;
  }

  // 根据用户名查找管理员
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  // 根据ID查找管理员
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, created_at FROM admins WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 验证密码
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 检查用户名是否存在
  static async usernameExists(username) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM admins WHERE username = ?',
      [username]
    );
    return rows[0].count > 0;
  }
}

export default Admin;

