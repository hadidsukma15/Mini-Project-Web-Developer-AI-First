'use strict';

// Jalankan berkas/folder SQL memakai koneksi dari .env:
//   node scripts/run-sql.js db/migrations            → semua *.sql dalam folder (urut)
//   node scripts/run-sql.js db/migrations/001_init.sql
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { listSqlFiles } = require('./sql-files');

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node scripts/run-sql.js <file.sql | folder>');
    process.exit(1);
  }

  const resolved = path.resolve(target);
  const files = listSqlFiles(resolved);
  if (!files.length) {
    console.error(`FAIL — tidak ada berkas .sql di ${target}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'api_produk',
    multipleStatements: true,
    charset: 'utf8mb4_unicode_ci',
  });

  try {
    for (const file of files) {
      await conn.query(fs.readFileSync(file, 'utf8'));
      console.log(`OK  — ${path.relative(process.cwd(), file)}`);
    }
  } catch (err) {
    console.error(`FAIL — ${err.code || ''} ${err.message}`);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(`FAIL — ${err.message}`);
  process.exit(1);
});
