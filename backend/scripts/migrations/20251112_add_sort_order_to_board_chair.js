export async function up(connection) {
  const [columns] = await connection.execute(
    'SHOW COLUMNS FROM board_chair LIKE "sort_order"'
  );

  if (columns.length === 0) {
    await connection.execute(
      'ALTER TABLE board_chair ADD COLUMN sort_order INT DEFAULT 0 AFTER avatar'
    );
  }

  const [indexes] = await connection.execute(
    'SHOW INDEX FROM board_chair WHERE Key_name = "idx_board_chair_sort_order"'
  );

  if (indexes.length === 0) {
    await connection.execute(
      'CREATE INDEX idx_board_chair_sort_order ON board_chair (sort_order)'
    );
  }
}


