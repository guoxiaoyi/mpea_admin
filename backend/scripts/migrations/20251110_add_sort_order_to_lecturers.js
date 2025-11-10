export async function up(connection) {
  // 添加 sort_order 列
  const [columnExists] = await connection.execute(
    'SHOW COLUMNS FROM lecturers LIKE "sort_order"'
  );

  if (columnExists.length === 0) {
    await connection.execute(
      'ALTER TABLE lecturers ADD COLUMN sort_order INT DEFAULT 0 AFTER introduction'
    );
  }

  // 为排序列创建索引
  const [indexExists] = await connection.execute(
    'SHOW INDEX FROM lecturers WHERE Key_name = "idx_lecturer_sort_order"'
  );

  if (indexExists.length === 0) {
    await connection.execute(
      'CREATE INDEX idx_lecturer_sort_order ON lecturers (sort_order)'
    );
  }

  // 初始化已有数据的排序值
  await connection.execute('UPDATE lecturers SET sort_order = IFNULL(sort_order, 0)');
}


