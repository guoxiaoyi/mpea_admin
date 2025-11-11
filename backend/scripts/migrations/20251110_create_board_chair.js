export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS board_chair (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      avatar VARCHAR(500) NOT NULL,
      introduction TEXT,
      introduction_en TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM board_chair');
  if ((rows[0]?.count ?? 0) === 0) {
    await connection.execute(
      'INSERT INTO board_chair (name, name_en, avatar, introduction, introduction_en) VALUES (?, ?, ?, ?, ?)',
      ['董事会主席', 'Board Chair', '', '', '']
    );
  }
}


