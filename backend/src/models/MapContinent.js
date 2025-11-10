import pool from '../config/database.js';

function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((item, index) => {
      if (typeof item === 'string') {
        return { url: item.trim(), sortOrder: index };
      }
      if (item && typeof item === 'object') {
        const url = (item.url || item.imageUrl || '').trim();
        if (!url) return null;
        const sortOrder = Number.isFinite(item.sortOrder)
          ? item.sortOrder
          : Number(item.sortOrder) || index;
        return { url, sortOrder };
      }
      return null;
    })
    .filter(Boolean);
}

async function loadPhotos(connection, continentIds) {
  if (!continentIds.length) return [];
  const placeholders = continentIds.map(() => '?').join(', ');
  const [rows] = await connection.query(
    `SELECT id, continent_id AS continentId, image_url AS url, sort_order AS sortOrder
     FROM map_continent_photos
     WHERE continent_id IN (${placeholders})
     ORDER BY sort_order ASC, id ASC`,
    continentIds
  );
  return rows;
}

class MapContinent {
  static async create(data) {
    const { name, code, description, sortOrder = 0, status = 'enabled', photos = [] } = data;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO map_continents (name, code, description, sort_order, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          name.trim(),
          code ? code.trim() : null,
          description || '',
          Number.isFinite(sortOrder) ? sortOrder : Number(sortOrder) || 0,
          status
        ]
      );
      const continentId = result.insertId;
      const normalizedPhotos = normalizePhotos(photos);
      for (const photo of normalizedPhotos) {
        await conn.execute(
          `INSERT INTO map_continent_photos (continent_id, image_url, sort_order)
           VALUES (?, ?, ?)`,
          [continentId, photo.url, Number.isFinite(photo.sortOrder) ? photo.sortOrder : 0]
        );
      }
      await conn.commit();
      return { id: continentId };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async update(id, data) {
    const { name, code, description, sortOrder = 0, status = 'enabled', photos } = data;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `UPDATE map_continents
         SET name = ?, code = ?, description = ?, sort_order = ?, status = ?
         WHERE id = ?`,
        [
          name.trim(),
          code ? code.trim() : null,
          description || '',
          Number.isFinite(sortOrder) ? sortOrder : Number(sortOrder) || 0,
          status,
          id
        ]
      );
      if (photos !== undefined) {
        await conn.execute('DELETE FROM map_continent_photos WHERE continent_id = ?', [id]);
        const normalizedPhotos = normalizePhotos(photos);
        for (const photo of normalizedPhotos) {
          await conn.execute(
            `INSERT INTO map_continent_photos (continent_id, image_url, sort_order)
             VALUES (?, ?, ?)`,
            [id, photo.url, Number.isFinite(photo.sortOrder) ? photo.sortOrder : 0]
          );
        }
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM map_continents WHERE id = ?', [id]);
    return result;
  }

  static async findAll(page = 1, limit = 10, keyword = '', status) {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Math.min(100, Number(limit) > 0 ? Number(limit) : 10);
    const offset = (pageNum - 1) * limitNum;
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(name LIKE ? OR code LIKE ?)');
      const term = `%${keyword}%`;
      params.push(term, term);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const limitClause = `LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.execute(
      `SELECT id, name, code, description, sort_order AS sortOrder, status, created_at AS createdAt, updated_at AS updatedAt
       FROM map_continents
       ${whereClause}
       ORDER BY sort_order ASC, id ASC
       ${limitClause}`,
      params
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM map_continents ${whereClause}`,
      params
    );

    const continentIds = rows.map((item) => item.id);
    let photosMap = new Map();
    let markerCountMap = new Map();

    if (continentIds.length) {
      const connection = await pool.getConnection();
      try {
        const photos = await loadPhotos(connection, continentIds);
        photosMap = photos.reduce((acc, photo) => {
          if (!acc.has(photo.continentId)) acc.set(photo.continentId, []);
          acc.get(photo.continentId).push({
            id: photo.id,
            url: photo.url,
            sortOrder: Number.isFinite(photo.sortOrder) ? photo.sortOrder : 0
          });
          return acc;
        }, new Map());

        const placeholders = continentIds.map(() => '?').join(', ');
        const [markerRows] = await connection.query(
          `SELECT continent_id AS continentId, COUNT(*) AS total
           FROM map_markers
           WHERE continent_id IN (${placeholders})
           GROUP BY continent_id`,
          continentIds
        );
        markerCountMap = markerRows.reduce((acc, row) => {
          acc.set(row.continentId, row.total);
          return acc;
        }, new Map());
      } finally {
        connection.release();
      }
    }

    const data = rows.map((item) => ({
      ...item,
      sortOrder: Number(item.sortOrder) || 0,
      photos: photosMap.get(item.id) || [],
      markerCount: markerCountMap.get(item.id) || 0
    }));

    return {
      data,
      total: countRows[0]?.total || 0,
      page: pageNum,
      limit: limitNum
    };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, code, description, sort_order AS sortOrder, status,
              created_at AS createdAt, updated_at AS updatedAt
       FROM map_continents
       WHERE id = ?`,
      [id]
    );
    const continent = rows[0];
    if (!continent) return null;

    const [photos] = await pool.execute(
      `SELECT id, image_url AS url, sort_order AS sortOrder
       FROM map_continent_photos
       WHERE continent_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    return {
      ...continent,
      sortOrder: Number(continent.sortOrder) || 0,
      photos: photos.map((p) => ({
        id: p.id,
        url: p.url,
        sortOrder: Number(p.sortOrder) || 0
      }))
    };
  }

  static async findAllSimple(includeDisabled = false) {
    const where = includeDisabled ? '' : "WHERE status = 'enabled'";
    const [rows] = await pool.execute(
      `SELECT id, name, code
       FROM map_continents
       ${where}
       ORDER BY sort_order ASC, id ASC`
    );
    return rows;
  }

  static async findByCode(code) {
    if (!code) return null;
    const normalized = String(code).toLowerCase();
    const [rows] = await pool.execute(
      `SELECT id, name, code, description, sort_order AS sortOrder, status
       FROM map_continents
       WHERE LOWER(code) = ?
       LIMIT 1`,
      [normalized]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      sortOrder: Number(row.sortOrder) || 0
    };
  }

  static async findByNameOrCode(identifier) {
    if (!identifier) return null;
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    const byCode = await MapContinent.findByCode(trimmed.toLowerCase());
    if (byCode) {
      return MapContinent.findById(byCode.id);
    }

    const [rows] = await pool.execute(
      `SELECT id
       FROM map_continents
       WHERE LOWER(name) = ?
       LIMIT 1`,
      [trimmed.toLowerCase()]
    );

    const row = rows[0];
    if (!row) return null;
    return MapContinent.findById(row.id);
  }

  static async fetchForPublic() {
    const connection = await pool.getConnection();
    try {
      const [continents] = await connection.execute(
        `SELECT id, name, code, description
         FROM map_continents
         WHERE status = 'enabled'
         ORDER BY sort_order ASC, id ASC`
      );
      if (!continents.length) return [];

      const continentIds = continents.map((item) => item.id);
      const photos = await loadPhotos(connection, continentIds);

      const placeholders = continentIds.map(() => '?').join(', ');
      const [markerRows] = await connection.query(
        `SELECT id, continent_id AS continentId, country, city,
                latitude, longitude, sort_order AS sortOrder
         FROM map_markers
         WHERE status = 'enabled' AND continent_id IN (${placeholders})
         ORDER BY sort_order ASC, id ASC`,
        continentIds
      );

      const photosMap = photos.reduce((acc, photo) => {
        if (!acc.has(photo.continentId)) acc.set(photo.continentId, []);
        acc.get(photo.continentId).push({
          id: photo.id,
          url: photo.url,
          sortOrder: Number(photo.sortOrder) || 0
        });
        return acc;
      }, new Map());

      const markersByContinent = markerRows.reduce((acc, marker) => {
        if (!acc.has(marker.continentId)) acc.set(marker.continentId, []);
        acc.get(marker.continentId).push(marker);
        return acc;
      }, new Map());

      return continents.map((continent) => {
        const markers = markersByContinent.get(continent.id) || [];
        const countriesMap = new Map();

        markers.forEach((marker) => {
          const countryName = marker.country || '未知区域';
          if (!countriesMap.has(countryName)) {
            countriesMap.set(countryName, {
              country: countryName,
              cities: []
            });
          }
          countriesMap.get(countryName).cities.push({
            id: marker.id,
            country: countryName,
            city: marker.city,
            latitude: Number(marker.latitude),
            longitude: Number(marker.longitude),
            coords: [
              Number(marker.longitude),
              Number(marker.latitude)
            ],
            sortOrder: Number(marker.sortOrder) || 0
          });
        });

        return {
          id: continent.id,
          name: continent.name,
          code: continent.code,
          description: continent.description,
          photos: photosMap.get(continent.id) || [],
          countries: Array.from(countriesMap.values()).map((country) => ({
            ...country,
            cities: country.cities.sort(
              (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id
            )
          }))
        };
      });
    } finally {
      connection.release();
    }
  }
}

export default MapContinent;


