'use strict';

const { pool, withTransaction } = require('../config/db');

const PRODUCT_COLS = 'id, name, price, description';

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${PRODUCT_COLS} FROM products WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

async function findVariantsByProductId(id) {
  const [rows] = await pool.query(
    'SELECT color, swatch, quantity FROM product_variants WHERE product_id = ? ORDER BY id',
    [id]
  );
  return rows;
}

async function findImagesByProductId(id) {
  const [rows] = await pool.query(
    'SELECT url, alt, color FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
    [id]
  );
  return rows;
}

function buildSearchWhere(search) {
  if (!search) return { sql: '', params: [] };
  const like = `%${search}%`;
  return { sql: ' WHERE id LIKE ? OR name LIKE ?', params: [like, like] };
}

async function findList({ search, limit, offset }) {
  const { sql, params } = buildSearchWhere(search);
  const [rows] = await pool.query(
    `SELECT id, name, price FROM products${sql} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

async function countAll({ search }) {
  const { sql, params } = buildSearchWhere(search);
  const [[row]] = await pool.query(`SELECT COUNT(*) AS total FROM products${sql}`, params);
  return row.total;
}

/** Tulis produk + varian + foto dalam SATU transaksi (rollback saat gagal). */
async function create({ id, name, price, description, variants, images }) {
  return withTransaction(async (conn) => {
    await conn.query(`INSERT INTO products (${PRODUCT_COLS}) VALUES (?, ?, ?, ?)`, [
      id,
      name,
      price,
      description,
    ]);
    for (const v of variants) {
      await conn.query(
        'INSERT INTO product_variants (product_id, color, swatch, quantity) VALUES (?, ?, ?, ?)',
        [id, v.color, v.swatch ?? null, v.quantity]
      );
    }
    images.forEach((img, i) => {
      img.sortOrder = img.sortOrder ?? i + 1;
    });
    for (const img of images) {
      await conn.query(
        'INSERT INTO product_images (product_id, url, alt, color, sort_order) VALUES (?, ?, ?, ?, ?)',
        [id, img.url, img.alt ?? '', img.color ?? null, img.sortOrder]
      );
    }
    return id;
  });
}

/** Full-replace: update baris produk + ganti seluruh varian & foto (transaksional). */
async function update({ id, name, price, description, variants, images }) {
  return withTransaction(async (conn) => {
    await conn.query('UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?', [
      name,
      price,
      description,
      id,
    ]);
    await conn.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    for (const v of variants) {
      await conn.query(
        'INSERT INTO product_variants (product_id, color, swatch, quantity) VALUES (?, ?, ?, ?)',
        [id, v.color, v.swatch ?? null, v.quantity]
      );
    }
    images.forEach((img, i) => {
      img.sortOrder = img.sortOrder ?? i + 1;
    });
    for (const img of images) {
      await conn.query(
        'INSERT INTO product_images (product_id, url, alt, color, sort_order) VALUES (?, ?, ?, ?, ?)',
        [id, img.url, img.alt ?? '', img.color ?? null, img.sortOrder]
      );
    }
    return id;
  });
}

/** Hapus produk — varian & foto ikut via ON DELETE CASCADE. */
async function remove(id) {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  findById,
  findVariantsByProductId,
  findImagesByProductId,
  findList,
  countAll,
  create,
  update,
  remove,
};
