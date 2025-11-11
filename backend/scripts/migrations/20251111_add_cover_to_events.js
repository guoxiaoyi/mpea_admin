export async function up(connection) {
  const [columns] = await connection.execute(
    'SHOW COLUMNS FROM events LIKE "cover"'
  );

  if (columns.length === 0) {
    await connection.execute(
      'ALTER TABLE events ADD COLUMN cover VARCHAR(500) NOT NULL DEFAULT "" AFTER title_en'
    );
  }
}
