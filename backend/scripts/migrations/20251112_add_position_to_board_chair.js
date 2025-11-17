export async function up(connection) {
  const [columns] = await connection.execute(
    'SHOW COLUMNS FROM board_chair LIKE "position"'
  );

  if (columns.length === 0) {
    await connection.execute(
      'ALTER TABLE board_chair ADD COLUMN position VARCHAR(255) NOT NULL DEFAULT "" AFTER name_en'
    );
  }

  const [positionEnColumns] = await connection.execute(
    'SHOW COLUMNS FROM board_chair LIKE "position_en"'
  );

  if (positionEnColumns.length === 0) {
    await connection.execute(
      'ALTER TABLE board_chair ADD COLUMN position_en VARCHAR(255) NOT NULL DEFAULT "" AFTER position'
    );
  }
}


