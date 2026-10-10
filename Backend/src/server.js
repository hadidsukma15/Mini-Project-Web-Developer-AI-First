'use strict';

require('dotenv').config();

const app = require('./app');
const { pool, closePool } = require('./config/db');

const PORT = Number(process.env.PORT || 3000);
// Loopback saja — API tidak terlihat dari jaringan lokal/internet.
// Ubah jadi 0.0.0.0 bila suatu saat perlu diakses dari perangkat lain.
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, async () => {
  console.log(`API Produk   : http://localhost:${PORT}/api/products  (bind ${HOST}:${PORT})`);
  console.log(`Swagger UI   : http://localhost:${PORT}/api-docs`);
  console.log(`OpenAPI spec : http://localhost:${PORT}/openapi.yaml`);
  try {
    await pool.query('SELECT 1');
    console.log('MySQL        : terhubung');
  } catch (err) {
    console.warn(`MySQL        : TIDAK terhubung (${err.code || err.message}) — jalankan 'docker compose up -d' lalu 'npm run db:migrate && npm run db:seed'`);
  }
});

// Graceful shutdown — tutup pool sebelum keluar
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log(`\n[${signal}] menutup server & pool...`);
    server.close(async () => {
      await closePool().catch(() => {});
      process.exit(0);
    });
  });
}
