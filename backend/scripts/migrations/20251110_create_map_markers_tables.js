export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS map_continents (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(50) UNIQUE,
      description TEXT,
      sort_order INT DEFAULT 0,
      status ENUM('enabled', 'disabled') DEFAULT 'enabled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_map_continents_sort (sort_order),
      INDEX idx_map_continents_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS map_markers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      continent_id INT NOT NULL,
      country VARCHAR(120) NOT NULL,
      city VARCHAR(120) NOT NULL,
      latitude DECIMAL(10,6) NOT NULL,
      longitude DECIMAL(10,6) NOT NULL,
      sort_order INT DEFAULT 0,
      status ENUM('enabled', 'disabled') DEFAULT 'enabled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_map_markers_continent (continent_id),
      INDEX idx_map_markers_status (status),
      INDEX idx_map_markers_sort (sort_order),
      CONSTRAINT fk_map_markers_continent FOREIGN KEY (continent_id) REFERENCES map_continents(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS map_continent_photos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      continent_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_map_continent_photos_continent (continent_id),
      INDEX idx_map_continent_photos_sort (sort_order),
      CONSTRAINT fk_map_continent_photos_continent FOREIGN KEY (continent_id) REFERENCES map_continents(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}


