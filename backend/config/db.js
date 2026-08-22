// MySQL connection pool.
// A pool is used instead of a single connection so multiple requests
// can query the database at the same time without waiting in line.

const mysql = require('mysql2/promise');

require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);

module.exports = pool;