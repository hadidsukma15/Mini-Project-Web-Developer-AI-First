'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'api_produk',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL → number (price number, bukan "750.00")
  timezone: 'Z',
  charset: 'utf8mb4_unicode_ci',
});

/** Jalankan fungsi di dalam transaksi; rollback saat error. */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, withTransaction, closePool };
