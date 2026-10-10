'use strict';

const { pool, withTransaction } = require('../config/db');

const ITEM_SELECT = `
  SELECT ci.id, ci.product_id, ci.color, ci.quantity,
         p.name AS product_name, p.price
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.cart_id = ?
  ORDER BY ci.added_at, ci.id`;

async function findItems(cartId) {
  const [rows] = await pool.query(ITEM_SELECT, [cartId]);
  return rows;
}

/** Versi terkunci (dipakai di dalam transaksi PATCH). */
async function findItemForUpdateById(conn, cartId, itemId) {
  const [rows] = await conn.query(
    'SELECT id, product_id, color, quantity FROM cart_items WHERE id = ? AND cart_id = ? FOR UPDATE',
    [itemId, cartId]
  );
  return rows[0] ?? null;
}

/** Kunci baris produk (cek keberadaan) di dalam transaksi. */
async function findProductForUpdate(conn, productId) {
  const [rows] = await conn.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
  return rows[0] ?? null;
}

/** Kunci baris varian — sumber kebenaran stok. */
async function findVariantForUpdate(conn, productId, color) {
  const [rows] = await conn.query(
    'SELECT quantity FROM product_variants WHERE product_id = ? AND color = ? FOR UPDATE',
    [productId, color]
  );
  return rows[0] ?? null;
}

/** Kunci item (product+color) di cart — untuk cek jumlah sebelum upsert. */
async function findItemForUpdate(conn, cartId, productId, color) {
  const [rows] = await conn.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND color = ? FOR UPDATE',
    [cartId, productId, color]
  );
  return rows[0] ?? null;
}

async function ensureCart(conn, cartId) {
  await conn.query('INSERT IGNORE INTO carts (id) VALUES (?)', [cartId]);
}

async function insertItem(conn, { cartId, productId, color, quantity }) {
  await conn.query(
    'INSERT INTO cart_items (cart_id, product_id, color, quantity) VALUES (?, ?, ?, ?)',
    [cartId, productId, color, quantity]
  );
}

async function updateItemQuantity(conn, itemId, quantity) {
  await conn.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
}

async function removeItem(cartId, itemId) {
  const [result] = await pool.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [
    itemId,
    cartId,
  ]);
  return result.affectedRows;
}

async function clearCart(cartId) {
  const [result] = await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  return result.affectedRows;
}

module.exports = {
  findItems,
  findItemForUpdateById,
  findProductForUpdate,
  findVariantForUpdate,
  findItemForUpdate,
  ensureCart,
  insertItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  withTransaction,
};
