#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'mpea_cms',
} = process.env;

const createDatabaseSQL = `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

const createAdmins = `
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createPages = `
CREATE TABLE IF NOT EXISTS pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  path VARCHAR(200) UNIQUE NOT NULL,
  content TEXT,
  status ENUM('published', 'draft') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createNews = `
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  content TEXT,
  status ENUM('published', 'draft') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

async function main() {
  let serverConn;
  let dbConn;
  try {
    serverConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });
    await serverConn.execute(createDatabaseSQL);
    console.log(`✓ 数据库 ${DB_NAME} 已创建/存在`);

    dbConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });

    await dbConn.execute(createAdmins);
    await dbConn.execute(createPages);
    await dbConn.execute(createNews);
    console.log('✓ 数据库表已创建/存在');
    process.exit(0);
  } catch (err) {
    console.error('✗ 初始化数据库失败:', err.message);
    process.exit(1);
  } finally {
    if (serverConn) await serverConn.end();
    if (dbConn) await dbConn.end();
  }
}

main();
