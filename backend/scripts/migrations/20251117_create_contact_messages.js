export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('parenting', 'business') NOT NULL,
      child_age INT NULL,
      interest VARCHAR(255) NULL,
      company VARCHAR(255) NULL,
      org_type VARCHAR(255) NULL,
      phone VARCHAR(50) NOT NULL,
      intention LONGTEXT NULL,
      problem LONGTEXT NULL,
      ip VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL,
      status ENUM('new', 'processed', 'spam') DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_contact_type (type),
      INDEX idx_contact_status (status),
      INDEX idx_contact_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}



