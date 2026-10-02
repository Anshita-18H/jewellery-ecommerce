// MySQL connection pool.
// Supports two setups:
// 1. Cloud deployment (e.g. Aiven, Render, Railway): a single DATABASE_URL connection string
// 2. Local development: separate DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / DB_PORT in .env

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let poolConfig;

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    poolConfig = {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'defaultdb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Aiven and cloud databases mandate SSL. Set DB_SSL=false only if explicitly disabled.
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    };
  } catch {
    // Fallback to raw uri string if URL parsing fails
    poolConfig = {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    };
  }
} else {
  // Local development or separate environment variables
  const isCloudHost = (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud')) || process.env.DB_SSL === 'true';
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jewellery_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: isCloudHost ? { rejectUnauthorized: false } : undefined,
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;