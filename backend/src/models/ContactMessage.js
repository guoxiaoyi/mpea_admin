import pool from '../config/database.js';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeInt(value) {
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    childAge: row.child_age,
    interest: row.interest,
    company: row.company,
    orgType: row.org_type,
    phone: row.phone,
    intention: row.intention,
    problem: row.problem,
    ip: row.ip,
    userAgent: row.user_agent,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class ContactMessage {
  static async create(data) {
    const type = data.type === 'business' ? 'business' : 'parenting';
    const childAge = normalizeInt(data.childAge);
    const interest = normalizeString(data.interest);
    const company = normalizeString(data.company);
    const orgType = normalizeString(data.orgType);
    const phone = normalizeString(data.phone);
    const intention = typeof data.intention === 'string' ? data.intention : null;
    const problem = typeof data.problem === 'string' ? data.problem : null;
    const ip = normalizeString(data.ip);
    const userAgent = normalizeString(data.userAgent).slice(0, 255);
    const status = data.status === 'processed' || data.status === 'spam' ? data.status : 'new';

    const [result] = await pool.execute(
      `
        INSERT INTO contact_messages
          (type, child_age, interest, company, org_type, phone, intention, problem, ip, user_agent, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [type, childAge, interest, company, orgType, phone, intention, problem, ip, userAgent, status]
    );

    return result;
  }

  static async findAll({ page = 1, limit = 10, type, status, keyword } = {}) {
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT id, type, child_age, interest, company, org_type, phone, intention, problem, ip, user_agent, status, created_at, updated_at
      FROM contact_messages
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM contact_messages';

    const conditions = [];
    const params = [];
    const countParams = [];

    if (type === 'parenting' || type === 'business') {
      conditions.push('type = ?');
      params.push(type);
      countParams.push(type);
    }

    if (status === 'new' || status === 'processed' || status === 'spam') {
      conditions.push('status = ?');
      params.push(status);
      countParams.push(status);
    }

    const kw = normalizeString(keyword);
    if (kw) {
      conditions.push('(phone LIKE ? OR company LIKE ? OR interest LIKE ? OR intention LIKE ? OR problem LIKE ?)');
      const like = `%${kw}%`;
      params.push(like, like, like, like, like);
      countParams.push(like, like, like, like, like);
    }

    if (conditions.length > 0) {
      const where = ` WHERE ${conditions.join(' AND ')}`;
      query += where;
      countQuery += where;
    }

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const [countRows] = await pool.execute(countQuery, countParams);

    return {
      data: rows.map(mapRow),
      total: countRows[0]?.total || 0,
      page: pageNum,
      limit: limitNum
    };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `
        SELECT id, type, child_age, interest, company, org_type, phone, intention, problem, ip, user_agent, status, created_at, updated_at
        FROM contact_messages
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapRow(rows[0]);
  }

  static async updateStatus(id, status) {
    const safeStatus = status === 'processed' || status === 'spam' ? status : 'new';
    const [result] = await pool.execute(
      `
        UPDATE contact_messages
        SET status = ?
        WHERE id = ?
      `,
      [safeStatus, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM contact_messages WHERE id = ?',
      [id]
    );
    return result;
  }
}

export default ContactMessage;



