export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      title_en VARCHAR(255) NOT NULL,
      event_date DATETIME NOT NULL,
      content LONGTEXT,
      content_en LONGTEXT,
      status ENUM('draft', 'published') DEFAULT 'draft',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_event_status (status),
      INDEX idx_event_date (event_date),
      INDEX idx_event_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}


