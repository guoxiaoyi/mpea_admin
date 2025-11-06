import pool from '../config/database.js';

class CertificateModel {
  // 创建证书表（如果不存在）
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        certificate_no VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        cert_date VARCHAR(20) NOT NULL,
        status ENUM('enabled', 'disabled') DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_certificate_no (certificate_no),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.execute(createTableSQL);
  }

  // 批量插入证书（用于Excel导入）
  static async batchInsert(certificates) {
    if (!certificates || certificates.length === 0) {
      return { insertedCount: 0, skippedCount: 0, errors: [] };
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const cert of certificates) {
      try {
        await pool.execute(
          'INSERT INTO certificates (certificate_no, name, cert_date) VALUES (?, ?, ?)',
          [cert.certificate_no, cert.name, cert.cert_date]
        );
        insertedCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
        } else {
          errors.push({
            certificate_no: cert.certificate_no,
            name: cert.name,
            error: error.message
          });
        }
      }
    }

    return { insertedCount, skippedCount, errors };
  }

  // 查询所有证书（分页）
  static async findAll(page = 1, limit = 10, keyword = '') {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    let query = 'SELECT id, certificate_no AS certificateNo, name, cert_date AS certDate, status, created_at AS createdAt, updated_at AS updatedAt FROM certificates';
    let countQuery = 'SELECT COUNT(*) as total FROM certificates';
    const params = [];
    const countParams = [];

    if (keyword) {
      query += ' WHERE certificate_no LIKE ? OR name LIKE ?';
      countQuery += ' WHERE certificate_no LIKE ? OR name LIKE ?';
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

  // 根据证书编号查询（公共查询接口）
  static async findByCertificateNo(certificateNo) {
    const [rows] = await pool.execute(
      'SELECT id, certificate_no AS certificateNo, name, cert_date AS certDate, status, created_at AS createdAt FROM certificates WHERE certificate_no = ? AND status = "enabled"',
      [certificateNo]
    );
    return rows[0];
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, certificate_no AS certificateNo, name, cert_date AS certDate, status, created_at AS createdAt, updated_at AS updatedAt FROM certificates WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 更新证书
  static async update(id, data) {
    const { certificateNo, name, certDate, status } = data;
    
    // 如果提供了status，则更新它；否则只更新其他字段
    if (status !== undefined) {
      const [result] = await pool.execute(
        'UPDATE certificates SET certificate_no = ?, name = ?, cert_date = ?, status = ? WHERE id = ?',
        [certificateNo, name, certDate, status, id]
      );
      return result;
    } else {
      const [result] = await pool.execute(
        'UPDATE certificates SET certificate_no = ?, name = ?, cert_date = ? WHERE id = ?',
        [certificateNo, name, certDate, id]
      );
      return result;
    }
  }

  // 删除证书
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM certificates WHERE id = ?', [id]);
    return result;
  }

  // 批量删除
  static async batchDelete(ids) {
    if (!ids || ids.length === 0) return { affectedRows: 0 };
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM certificates WHERE id IN (${placeholders})`,
      ids
    );
    return result;
  }
}

export default CertificateModel;

