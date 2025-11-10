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

const createCases = `
CREATE TABLE IF NOT EXISTS cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  professional_photo VARCHAR(255) NOT NULL,
  child_photo VARCHAR(255) NOT NULL,
  introduction TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createLecturers = `
CREATE TABLE IF NOT EXISTS lecturers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  photo VARCHAR(255) NOT NULL,
  introduction TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createCertificates = `
CREATE TABLE IF NOT EXISTS certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  certificate_no VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  cert_date VARCHAR(20) NOT NULL,
  status ENUM('enabled', 'disabled') DEFAULT 'enabled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_certificate_no (certificate_no),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createPartners = `
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  image VARCHAR(500) NOT NULL,
  link VARCHAR(500),
  sort_order INT DEFAULT 0,
  status ENUM('enabled', 'disabled') DEFAULT 'enabled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createMapContinents = `
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createMapMarkers = `
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

const createMapContinentPhotos = `
CREATE TABLE IF NOT EXISTS map_continent_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  continent_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_map_continent_photos_continent (continent_id),
  INDEX idx_map_continent_photos_sort (sort_order),
  CONSTRAINT fk_map_continent_photos_continent FOREIGN KEY (continent_id) REFERENCES map_continents(id) ON DELETE CASCADE
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
    await dbConn.execute(createCases);
    await dbConn.execute(createLecturers);
    await dbConn.execute(createCertificates);
    await dbConn.execute(createPartners);
    await dbConn.execute(createMapContinents);
    await dbConn.execute(createMapMarkers);
    await dbConn.execute(createMapContinentPhotos);
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
