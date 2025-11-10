import pool from '../config/database.js';

function toNumber(value, fallback = 0) {
  if (Number.isFinite(value)) return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

class MapMarker {
  static async create(data) {
    const {
      continentId,
      country,
      city,
      latitude,
      longitude,
      sortOrder = 0,
      status = 'enabled'
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO map_markers
        (continent_id, country, city, latitude, longitude, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        continentId,
        country.trim(),
        city.trim(),
        toNumber(latitude),
        toNumber(longitude),
        toNumber(sortOrder),
        status
      ]
    );
    return result;
  }

  static async update(id, data) {
    const {
      continentId,
      country,
      city,
      latitude,
      longitude,
      sortOrder = 0,
      status = 'enabled'
    } = data;

    const [result] = await pool.execute(
      `UPDATE map_markers
       SET continent_id = ?, country = ?, city = ?, latitude = ?, longitude = ?, sort_order = ?, status = ?
       WHERE id = ?`,
      [
        continentId,
        country.trim(),
        city.trim(),
        toNumber(latitude),
        toNumber(longitude),
        toNumber(sortOrder),
        status,
        id
      ]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM map_markers WHERE id = ?', [id]);
    return result;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT
          mm.id,
          mm.continent_id AS continentId,
          mc.name AS continentName,
          mm.country,
          mm.city,
          mm.latitude,
          mm.longitude,
          mm.sort_order AS sortOrder,
          mm.status,
          mm.created_at AS createdAt,
          mm.updated_at AS updatedAt
       FROM map_markers mm
       JOIN map_continents mc ON mc.id = mm.continent_id
       WHERE mm.id = ?`,
      [id]
    );
    const marker = rows[0];
    if (!marker) return null;
    return {
      ...marker,
      latitude: Number(marker.latitude),
      longitude: Number(marker.longitude),
      sortOrder: Number(marker.sortOrder) || 0
    };
  }

  static async findAll({ page = 1, limit = 10, keyword = '', status, continentId } = {}) {
    const pageNumRaw = Number.parseInt(page, 10);
    const limitNumRaw = Number.parseInt(limit, 10);
    const pageNum = Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : 1;
    const limitNumBase = Number.isFinite(limitNumRaw) && limitNumRaw > 0 ? limitNumRaw : 10;
    const limitNum = Math.min(100, Math.max(1, limitNumBase));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(mm.city LIKE ? OR mm.country LIKE ?)');
      const term = `%${keyword}%`;
      params.push(term, term);
    }
    if (status) {
      conditions.push('mm.status = ?');
      params.push(status);
    }
    if (continentId) {
      conditions.push('mm.continent_id = ?');
      params.push(continentId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT
          mm.id,
          mm.continent_id AS continentId,
          mc.name AS continentName,
          mm.country,
          mm.city,
          mm.latitude,
          mm.longitude,
          mm.sort_order AS sortOrder,
          mm.status,
          mm.created_at AS createdAt,
          mm.updated_at AS updatedAt
       FROM map_markers mm
       JOIN map_continents mc ON mc.id = mm.continent_id
       ${whereClause}
       ORDER BY mm.sort_order ASC, mm.id ASC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM map_markers mm
       JOIN map_continents mc ON mc.id = mm.continent_id
       ${whereClause}`,
      params
    );

    return {
      data: rows.map((row) => ({
        ...row,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        sortOrder: Number(row.sortOrder) || 0
      })),
      total: countRows[0]?.total || 0,
      page: pageNum,
      limit: limitNum
    };
  }

  static async findByContinentCountryCity(continentId, country, city) {
    const [rows] = await pool.execute(
      `SELECT id, continent_id AS continentId, country, city
       FROM map_markers
       WHERE continent_id = ? AND country = ? AND city = ?
       LIMIT 1`,
      [continentId, country, city]
    );
    return rows[0] || null;
  }

  static async findAllEnabledFlat() {
    const [rows] = await pool.execute(
      `SELECT
          mm.id,
          mm.city,
          mm.country,
          mm.latitude,
          mm.longitude,
          mc.name AS continentName,
          mc.code AS continentCode
       FROM map_markers mm
       JOIN map_continents mc ON mc.id = mm.continent_id
       WHERE mm.status = 'enabled' AND mc.status = 'enabled'
       ORDER BY mc.sort_order ASC, mc.id ASC, mm.sort_order ASC, mm.id ASC`
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.city,
      city: row.city,
      country: row.country,
      continentName: row.continentName,
      continentCode: row.continentCode,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      coords: [Number(row.longitude), Number(row.latitude)]
    }));
  }

  static async findContinentByCountry(country) {
    if (!country) return null;
    const normalized = country.trim();
    if (!normalized) return null;

    const normalizedLower = normalized.toLowerCase();

    const [rows] = await pool.execute(
      `SELECT
          mc.id AS continentId,
          mc.name AS continentName,
          mc.code AS continentCode
       FROM map_markers mm
       JOIN map_continents mc ON mc.id = mm.continent_id
       WHERE mm.status = 'enabled'
         AND mc.status = 'enabled'
         AND (
             LOWER(mm.country) = ?
             OR LOWER(mm.country) = ?
          )
       ORDER BY mc.sort_order ASC, mc.id ASC, mm.sort_order ASC, mm.id ASC
       LIMIT 1`,
      [normalizedLower, normalizedLower]
    );

    return rows[0] || null;
  }

  static async findContinentByCountryVariants(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return null;
    const normalized = Array.from(
      new Set(
        variants
          .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
          .filter(Boolean)
      )
    );
    if (!normalized.length) return null;

    const placeholders = normalized.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `SELECT
          mc.id AS continentId,
          mc.name AS continentName,
          mc.code AS continentCode
       FROM map_markers mm
       JOIN map_continents mc ON mc.id = mm.continent_id
       WHERE mm.status = 'enabled'
         AND mc.status = 'enabled'
         AND LOWER(mm.country) IN (${placeholders})
       ORDER BY mc.sort_order ASC, mc.id ASC, mm.sort_order ASC, mm.id ASC
       LIMIT 1`,
      normalized
    );

    return rows[0] || null;
  }
}

export default MapMarker;
