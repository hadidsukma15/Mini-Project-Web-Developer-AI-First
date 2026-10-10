'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const candidateLibs = [
  path.join(process.env.HOME || '', '.local/lib'),
  '/tmp/libaio/usr/lib/x86_64-linux-gnu',
];
for (const libDir of candidateLibs) {
  if (fs.existsSync(libDir)) {
    const cur = process.env.LD_LIBRARY_PATH || '';
    if (!cur.includes(libDir)) {
      process.env.LD_LIBRARY_PATH = cur ? `${libDir}:${cur}` : libDir;
    }
  }
}

const ROOT = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });

const port = Number(process.env.DB_PORT || 3306);
const dbName = process.env.DB_NAME || 'api_produk';

async function main() {
  console.log(`[dev-db] Menyiapkan MySQL server di port ${port}...`);
  const { createDB } = require('mysql-memory-server');
  const db = await createDB({ port, dbName });
  console.log(`[dev-db] MySQL berjalan di 127.0.0.1:${db.port} (database: ${db.dbName}, user: ${db.username})`);

  console.log('[dev-db] Menjalankan migrasi dan seed...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: db.port,
    user: db.username,
    password: db.password ?? '',
    database: db.dbName,
    multipleStatements: true,
    charset: 'utf8mb4_unicode_ci',
  });

  try {
    const { migrationFiles } = require('./sql-files');
    for (const file of [...migrationFiles(ROOT), path.join(ROOT, 'db', 'seed.sql')]) {
      await conn.query(fs.readFileSync(file, 'utf8'));
      console.log(`      OK ${path.relative(ROOT, file)}`);
    }

    // Buat user sesuai `.env` (DB_USER/DB_PASS) agar kredensial yang sama
    // berlaku untuk Docker Compose maupun dev-db ini.
    const appUser = process.env.DB_USER;
    const appPass = process.env.DB_PASS;
    if (appUser && appUser !== db.username) {
      await conn.query(`CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`, [appUser, appPass ?? '']);
      await conn.query(`GRANT ALL PRIVILEGES ON \`${db.dbName}\`.* TO ?@'%'`, [appUser]);
      await conn.query('FLUSH PRIVILEGES');
      console.log(`      OK user \`${appUser}\` (sesuai .env) diberi akses ke ${db.dbName}`);
    }
  } finally {
    await conn.end();
  }

  console.log('\n[dev-db] Database siap digunakan untuk development.');
  console.log('[dev-db] Tekan Ctrl+C untuk menghentikan server database.');

  const cleanup = async () => {
    console.log('\n[dev-db] Menghentikan MySQL...');
    await db.stop().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('[dev-db] ERROR:', err.message);
  process.exit(1);
});
