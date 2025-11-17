export async function up(connection) {
  const [columns] = await connection.execute(
    'SHOW COLUMNS FROM cases LIKE "featured"'
  );

  if (columns.length === 0) {
    await connection.execute(
      'ALTER TABLE cases ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0 AFTER introduction'
    );
    await connection.execute(
      'CREATE INDEX idx_cases_featured ON cases (featured)'
    ).catch((err) => {
      if (err?.code !== 'ER_DUP_KEYNAME') throw err;
    });
  }
}


