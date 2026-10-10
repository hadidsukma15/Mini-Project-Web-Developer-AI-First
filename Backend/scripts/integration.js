'use strict';

// Integration test penuh:
//   MySQL ephemeral (mysql-memory-server) → migrate → seed → jalankan app → smoke test
// Jalankan: npm run test:integration
// Catatan Linux: mysqld butuh libaio — bila tidak ada di sistem:
//   LD_LIBRARY_PATH=<dir-libaio> npm run test:integration

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const ROOT = path.join(__dirname, '..');

// Pastikan mysqld menemukan libaio/libnuma bila ada di ~/.local/lib atau /tmp/libaio
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

async function main() {
  console.log('[1/4] Menyiapkan MySQL ephemeral (unduh biner bila perlu)...');
  const { createDB } = require('mysql-memory-server');
  const db = await createDB();
  console.log(`      MySQL hidup di 127.0.0.1:${db.port} (db=${db.dbName}, user=${db.username})`);

  // Env untuk aplikasi — WAJIB sebelum require app (pool dibuat saat require)
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(db.port);
  process.env.DB_USER = db.username;
  process.env.DB_PASS = db.password ?? '';
  process.env.DB_NAME = db.dbName;
  process.env.CORS_ORIGIN = '*';

  console.log('[2/4] Migrate + seed...');
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
  } finally {
    await conn.end();
  }

  console.log('[3/4] Menjalankan app...');
  const app = require('../src/app');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(`      ${base}`);

  console.log('[4/4] Smoke test...\n');
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'smoke.js')], {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: base },
    });
    child.on('exit', (c) => resolve(c ?? 1));
  });

  server.close();
  await db.stop().catch(() => {});
  console.log('\nIntegration selesai.');
  process.exit(code);
}

main().catch(async (err) => {
  console.error('INTEGRATION ERROR:', err.message);
  process.exit(1);
});
