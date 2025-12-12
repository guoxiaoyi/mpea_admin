export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS translations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      namespace VARCHAR(120) NOT NULL,
      full_key VARCHAR(255) NOT NULL,
      label VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      sort_order INT DEFAULT 0,
      locale_values JSON NOT NULL,
      updated_by VARCHAR(120) DEFAULT NULL,
      updated_by_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_full_key (full_key),
      KEY idx_namespace (namespace),
      KEY idx_sort_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}


