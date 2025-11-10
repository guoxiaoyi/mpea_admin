export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS kindergartens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      address_en VARCHAR(255) NOT NULL,
      logo VARCHAR(500) NOT NULL,
      sort_order INT DEFAULT 0,
      status ENUM('enabled', 'disabled') DEFAULT 'enabled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_kindergarten_sort_order (sort_order),
      INDEX idx_kindergarten_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}


