#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, 'migrations');

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'mpea_cms'
} = process.env;

async function ensureDatabase(connection) {
  await connection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
}

async function ensureMigrationsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function loadMigrations() {
  try {
    const files = await fs.readdir(migrationsDir);
    return files
      .filter((file) => file.endsWith('.js'))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function hasMigrationRun(connection, name) {
  const [rows] = await connection.execute(
    'SELECT 1 FROM schema_migrations WHERE name = ? LIMIT 1',
    [name]
  );
  return rows.length > 0;
}

async function markMigrationRan(connection, name) {
  await connection.execute(
    'INSERT INTO schema_migrations (name) VALUES (?)',
    [name]
  );
}

async function runMigrations() {
  const serverConnection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    await ensureDatabase(serverConnection);
  } finally {
    await serverConnection.end();
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    await ensureMigrationsTable(connection);
    const migrations = await loadMigrations();

    if (migrations.length === 0) {
      console.log('没有可执行的迁移文件。');
      return;
    }

    for (const migrationName of migrations) {
      const alreadyRun = await hasMigrationRun(connection, migrationName);
      if (alreadyRun) {
        console.log(`跳过 ${migrationName}（已执行）`);
        continue;
      }

      console.log(`执行迁移：${migrationName}`);
      const migrationModule = await import(
        pathToFileURL(path.join(migrationsDir, migrationName)).href
      );

      if (typeof migrationModule.up !== 'function') {
        throw new Error(`${migrationName} 未导出 up(connection) 方法`);
      }

      await migrationModule.up(connection);
      await markMigrationRan(connection, migrationName);
      console.log(`✓ 完成 ${migrationName}`);
    }

    console.log('所有迁移执行完成。');
  } catch (error) {
    console.error('执行迁移失败:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

runMigrations();


