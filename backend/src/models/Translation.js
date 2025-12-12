import pool from '../config/database.js';

function safeParseJSON(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function normalizeLocaleValues(values = {}) {
  if (!values || typeof values !== 'object') return {};
  const normalized = {};
  for (const [locale, val] of Object.entries(values)) {
    if (val === undefined || val === null) continue;
    normalized[locale] = typeof val === 'string' ? val : String(val);
  }
  return normalized;
}

function deriveNamespace(fullKey) {
  if (!fullKey) return 'root';
  const trimmed = fullKey.trim();
  const [first] = trimmed.split('.');
  return first || 'root';
}

function sanitizeFullKey(fullKey) {
  if (typeof fullKey !== 'string') return '';
  return fullKey.trim().replace(/\s+/g, '');
}

function assignToTree(target, segments, value) {
  if (!segments.length) {
    return value;
  }
  const [head, ...rest] = segments;
  const isIndex = /^\d+$/.test(head);

  if (isIndex) {
    const index = Number(head);
    const base = Array.isArray(target) ? target : [];
    base[index] = assignToTree(base[index], rest, value);
    return base;
  }

  const base = target && typeof target === 'object' && !Array.isArray(target) ? target : {};
  base[head] = assignToTree(base[head], rest, value);
  return base;
}

function flattenPayload(payload, prefix = '') {
  const entries = [];
  const nextPrefix = (key) => (prefix ? `${prefix}.${key}` : key);

  if (Array.isArray(payload)) {
    payload.forEach((item, index) => {
      const keyPath = nextPrefix(String(index));
      if (item && typeof item === 'object') {
        entries.push(...flattenPayload(item, keyPath));
      } else {
        entries.push({
          fullKey: keyPath,
          value: item === undefined || item === null ? '' : String(item),
          label: keyPath.split('.').slice(-1)[0] || keyPath
        });
      }
    });
    return entries;
  }

  if (payload && typeof payload === 'object') {
    Object.entries(payload).forEach(([key, value]) => {
      const keyPath = nextPrefix(key);
      if (value && typeof value === 'object') {
        entries.push(...flattenPayload(value, keyPath));
      } else {
        entries.push({
          fullKey: keyPath,
          value: value === undefined || value === null ? '' : String(value),
          label: key
        });
      }
    });
    return entries;
  }

  if (prefix) {
    entries.push({
      fullKey: prefix,
      value: payload === undefined || payload === null ? '' : String(payload),
      label: prefix.split('.').slice(-1)[0] || prefix
    });
  }

  return entries;
}

class Translation {
  static mapRow(row) {
    return {
      id: row.id,
      namespace: row.namespace,
      fullKey: row.full_key,
      label: row.label,
      description: row.description,
      sortOrder: row.sort_order,
      updatedBy: row.updated_by,
      updatedById: row.updated_by_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      values: safeParseJSON(row.locale_values)
    };
  }

  static async findAll({ page = 1, limit = 20, keyword = '', namespace = '' } = {}) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(10000, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereParts = [];
    const params = [];
    const countParams = [];

    if (namespace) {
      whereParts.push('namespace = ?');
      params.push(namespace);
      countParams.push(namespace);
    }
    if (keyword) {
      whereParts.push('(full_key LIKE ? OR label LIKE ? OR description LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
      countParams.push(like, like, like);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const query = `
      SELECT * FROM translations
      ${whereSQL}
      ORDER BY namespace ASC, sort_order ASC, full_key ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const countSQL = `
      SELECT COUNT(*) as total FROM translations
      ${whereSQL}
    `;

    const [rows] = await pool.execute(query, params);
    const [countRows] = await pool.execute(countSQL, countParams.length ? countParams : params);

    return {
      data: rows.map(Translation.mapRow),
      total: countRows[0]?.total || 0,
      page: pageNum,
      limit: limitNum
    };
  }

  static async findNamespaces() {
    const [rows] = await pool.execute('SELECT DISTINCT namespace FROM translations ORDER BY namespace ASC');
    return rows.map((row) => row.namespace);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM translations WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return null;
    return Translation.mapRow(rows[0]);
  }

  static async findByFullKey(fullKey) {
    const cleanKey = sanitizeFullKey(fullKey);
    if (!cleanKey) return null;
    const [rows] = await pool.execute('SELECT * FROM translations WHERE full_key = ? LIMIT 1', [cleanKey]);
    if (!rows.length) return null;
    return Translation.mapRow(rows[0]);
  }

  static async create(data) {
    const fullKey = sanitizeFullKey(data.fullKey);
    if (!fullKey) {
      throw new Error('fullKey is required');
    }
    const namespace = data.namespace || deriveNamespace(fullKey);
    const normalizedValues = normalizeLocaleValues(data.values);
    const [result] = await pool.execute(
      `INSERT INTO translations (namespace, full_key, label, description, sort_order, locale_values, updated_by, updated_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        namespace,
        fullKey,
        data.label || null,
        data.description || null,
        data.sortOrder ?? 0,
        JSON.stringify(normalizedValues),
        data.updatedBy || null,
        data.updatedById || null
      ]
    );
    return { id: result.insertId };
  }

  static async update(id, data) {
    const fields = [];
    const params = [];

    if (data.fullKey) {
      const fullKey = sanitizeFullKey(data.fullKey);
      fields.push('full_key = ?');
      params.push(fullKey);
      fields.push('namespace = ?');
      params.push(data.namespace || deriveNamespace(fullKey));
    }
    if (data.label !== undefined) {
      fields.push('label = ?');
      params.push(data.label || null);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description || null);
    }
    if (data.sortOrder !== undefined) {
      fields.push('sort_order = ?');
      params.push(Number.isFinite(data.sortOrder) ? data.sortOrder : 0);
    }
    if (data.values !== undefined) {
      fields.push('locale_values = ?');
      params.push(JSON.stringify(normalizeLocaleValues(data.values)));
    }
    if (data.updatedBy !== undefined) {
      fields.push('updated_by = ?');
      params.push(data.updatedBy || null);
    }
    if (data.updatedById !== undefined) {
      fields.push('updated_by_id = ?');
      params.push(data.updatedById || null);
    }

    if (!fields.length) {
      return { affectedRows: 0 };
    }

    params.push(id);
    const [result] = await pool.execute(
      `UPDATE translations SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM translations WHERE id = ?', [id]);
    return result;
  }

  static async upsertLocaleEntry({ fullKey, locale, value, label, description, sortOrder, updatedBy, updatedById }) {
    const cleanKey = sanitizeFullKey(fullKey);
    if (!cleanKey) {
      throw new Error('fullKey is required');
    }
    const namespace = deriveNamespace(cleanKey);
    const normalizedValue = value === undefined || value === null ? '' : (typeof value === 'string' ? value : String(value));
    const existing = await Translation.findByFullKey(cleanKey);
    if (existing) {
      const values = { ...existing.values, [locale]: normalizedValue };
      await pool.execute(
        `UPDATE translations
         SET locale_values = ?, label = ?, description = ?, sort_order = ?, updated_by = ?, updated_by_id = ?
         WHERE id = ?`,
        [
        JSON.stringify(values),
          label === undefined ? existing.label : (label || null),
          description === undefined ? existing.description : (description || null),
          sortOrder === undefined ? existing.sortOrder || 0 : sortOrder,
          updatedBy || null,
          updatedById || null,
          existing.id
        ]
      );
      return existing.id;
    }

    const initialValues = { [locale]: normalizedValue };
    const [result] = await pool.execute(
      `INSERT INTO translations (namespace, full_key, label, description, sort_order, locale_values, updated_by, updated_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        namespace,
        cleanKey,
        label || null,
        description || null,
        sortOrder ?? 0,
        JSON.stringify(initialValues),
        updatedBy || null,
        updatedById || null
      ]
    );
    return result.insertId;
  }

  static async importLocale(locale, payload, meta = {}) {
    const entries = flattenPayload(payload);
    let successCount = 0;
    for (const [index, entry] of entries.entries()) {
      await Translation.upsertLocaleEntry({
        fullKey: entry.fullKey,
        locale,
        value: entry.value,
        label: entry.label,
        sortOrder: index,
        updatedBy: meta.updatedBy,
        updatedById: meta.updatedById
      });
      successCount += 1;
    }
    return { count: successCount };
  }

  static async exportLocale(locale) {
    const [rows] = await pool.execute('SELECT full_key, locale_values FROM translations ORDER BY sort_order ASC, full_key ASC');
    let tree = {};
    for (const row of rows) {
      const values = safeParseJSON(row.locale_values);
      if (!Object.prototype.hasOwnProperty.call(values, locale)) continue;
      const val = values[locale];
      const segments = row.full_key.split('.').map((segment) => segment.trim()).filter(Boolean);
      if (!segments.length) continue;
      tree = assignToTree(tree, segments, val);
    }
    return tree;
  }
}

Translation.flattenPayload = flattenPayload;
Translation.assignToTree = assignToTree;

export default Translation;


