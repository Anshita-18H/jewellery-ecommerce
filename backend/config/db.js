// MySQL connection pool.
// A pool is used instead of a single connection so multiple requests
// can query the database at the same time without waiting in li
// MySQL connection pool.
// Supports two setups:
// 1. Local development: separate DB_HOST / DB_USER / DB_PASSWORD / etc. in .env
// 2. Deployment (e.g. Railway): a single DATABASE_URL connection string

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jewellery_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;