'use strict';

// Utilitas berkas SQL — dipakai run-sql / dev-db / integration.
const fs = require('fs');
const path = require('path');

/**
 * Kembalikan daftar absolut path berkas `.sql`.
 * - path folder → semua *.sql di dalamnya, diurutkan namanya (001_…, 002_…)
 * - path berkas → berkas itu saja (harus .sql)
 */
function listSqlFiles(target) {
  const stat = fs.statSync(target, { throwIfNoEntry: false });
  if (!stat) return [];
  if (stat.isFile()) return [target];
  if (stat.isDirectory()) {
    return fs
      .readdirSync(target)
      .filter((name) => name.toLowerCase().endsWith('.sql'))
      .sort()
      .map((name) => path.join(target, name));
  }
  return [];
}

/** Semua migrasi di <root>/db/migrations, urut. */
function migrationFiles(root) {
  return listSqlFiles(path.join(root, 'db', 'migrations'));
}

module.exports = { listSqlFiles, migrationFiles };
