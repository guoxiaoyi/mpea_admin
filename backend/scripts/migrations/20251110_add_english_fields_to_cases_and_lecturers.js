export async function up(connection) {
  // cases.title_en
  const [caseTitleEn] = await connection.execute(
    'SHOW COLUMNS FROM cases LIKE "title_en"'
  );
  if (caseTitleEn.length === 0) {
    await connection.execute(
      'ALTER TABLE cases ADD COLUMN title_en VARCHAR(255) NOT NULL DEFAULT "" AFTER title'
    );
  }

  // cases.introduction_en
  const [caseIntroductionEn] = await connection.execute(
    'SHOW COLUMNS FROM cases LIKE "introduction_en"'
  );
  if (caseIntroductionEn.length === 0) {
    await connection.execute(
      'ALTER TABLE cases ADD COLUMN introduction_en TEXT AFTER introduction'
    );
  }

  // lecturers.name_en
  const [lecturerNameEn] = await connection.execute(
    'SHOW COLUMNS FROM lecturers LIKE "name_en"'
  );
  if (lecturerNameEn.length === 0) {
    await connection.execute(
      'ALTER TABLE lecturers ADD COLUMN name_en VARCHAR(255) NOT NULL DEFAULT "" AFTER name'
    );
  }

  // lecturers.introduction_en
  const [lecturerIntroductionEn] = await connection.execute(
    'SHOW COLUMNS FROM lecturers LIKE "introduction_en"'
  );
  if (lecturerIntroductionEn.length === 0) {
    await connection.execute(
      'ALTER TABLE lecturers ADD COLUMN introduction_en TEXT AFTER introduction'
    );
  }

  // Ensure no NULL values remain for new VARCHAR columns
  await connection.execute(
    'UPDATE cases SET title_en = IFNULL(title_en, "")'
  );
  await connection.execute(
    'UPDATE lecturers SET name_en = IFNULL(name_en, "")'
  );
}


