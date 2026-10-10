'use strict';

const { pool, withTransaction } = require('../config/db');

const ORDER_SELECT = `
  SELECT o.id, o.order_number, o.cart_id, o.status, o.currency,
         o.customer_name, o.email, o.note, o.subtotal, o.total,
         o.created_at, o.updated_at
  FROM orders o`;

const ITEM_COLUMNS = 'id, order_id, product_id, product_name, color, unit_price, quantity, line_total';

/** Bangun WHERE bert parameter dari filter yang di-whitelist (aman dari injeksi). */
function buildFilters({ cartToken, status }) {
  const clauses = [];
  const params = [];
  if (cartToken) {
    clauses.push('o.cart_id = ?');
    params.push(cartToken);
  }
  if (status) {
    clauses.push('o.status = ?');
    params.push(status);
  }
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', params };
}

async function findList({ cartToken, status, limit, offset }) {
  const { where, params } = buildFilters({ cartToken, status });
  const [rows] = await pool.query(
    `${ORDER_SELECT}${where} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}

async function countList({ cartToken, status }) {
  const { where, params } = buildFilters({ cartToken, status });
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM orders o${where}`, params);
  return Number(rows[0]?.total ?? 0);
}

async function findById(id) {
  const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
  return rows[0] ?? null;
}

/** Versi terkunci (dipakai di dalam transaksi UPDATE/DELETE). */
async function findByIdForUpdate(conn, id) {
  const [rows] = await conn.query(`${ORDER_SELECT} WHERE o.id = ? FOR UPDATE`, [id]);
  return rows[0] ?? null;
}

async function findItemsByOrderId(orderId) {
  const [rows] = await pool.query(
    `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId]
  );
  return rows;
}

/** Batch untuk list (sekali query — tanpa N+1). */
async function findItemsByOrderIds(orderIds) {
  if (!orderIds.length) return [];
  const placeholders = orderIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
    orderIds
  );
  return rows;
}

/** Item terkunci (untuk aksi stok saat status berubah / order dihapus). */
async function findItemsForUpdate(conn, orderId) {
  const [rows] = await conn.query(
    `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id = ? FOR UPDATE`,
    [orderId]
  );
  return rows;
}

async function insertOrder(conn, { orderNumber, cartId, status, customerName, email, note, subtotal, total }) {
  const [result] = await conn.query(
    `INSERT INTO orders (order_number, cart_id, status, customer_name, email, note, subtotal, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderNumber, cartId, status, customerName ?? null, email ?? null, note ?? null, subtotal, total]
  );
  return Number(result.insertId);
}

async function insertItems(conn, orderId, items) {
  if (!items.length) return;
  const values = items.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
  const params = items.flatMap((item) => [
    orderId,
    item.productId,
    item.productName,
    item.color,
    item.unitPrice,
    item.quantity,
    item.lineTotal,
  ]);
  await conn.query(
    `INSERT INTO order_items (order_id, product_id, product_name, color, unit_price, quantity, line_total)
     VALUES ${values}`,
    params
  );
}

async function updateOrder(conn, id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return 0;
  const set = keys.map((key) => `${key} = ?`).join(', ');
  const [result] = await conn.query(`UPDATE orders SET ${set} WHERE id = ?`, [
    ...keys.map((key) => fields[key]),
    id,
  ]);
  return result.affectedRows;
}

async function deleteOrder(conn, id) {
  const [result] = await conn.query('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows;
}

// — Cart (sumber item saat checkout) —

async function findCartItemsForUpdate(conn, cartId) {
  const [rows] = await conn.query(
    `SELECT ci.product_id, ci.color, ci.quantity, p.name AS product_name, p.price
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.added_at, ci.id
     FOR UPDATE`,
    [cartId]
  );
  return rows;
}

async function clearCartItems(conn, cartId) {
  const [result] = await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  return result.affectedRows;
}

// — Stok varian (dikurangi saat pesanan dibuat, dikembalikan saat pesanan dihapus) —

async function findVariantForUpdate(conn, productId, color) {
  const [rows] = await conn.query(
    'SELECT quantity FROM product_variants WHERE product_id = ? AND color = ? FOR UPDATE',
    [productId, color]
  );
  return rows[0] ?? null;
}

async function decrementStock(conn, productId, color, quantity) {
  const [result] = await conn.query(
    'UPDATE product_variants SET quantity = quantity - ? WHERE product_id = ? AND color = ? AND quantity >= ?',
    [quantity, productId, color, quantity]
  );
  return result.affectedRows;
}

async function restoreStock(conn, productId, color, quantity) {
  await conn.query(
    'UPDATE product_variants SET quantity = quantity + ? WHERE product_id = ? AND color = ?',
    [quantity, productId, color]
  );
}

module.exports = {
  findList,
  countList,
  findById,
  findByIdForUpdate,
  findItemsByOrderId,
  findItemsByOrderIds,
  findItemsForUpdate,
  insertOrder,
  insertItems,
  updateOrder,
  deleteOrder,
  findCartItemsForUpdate,
  clearCartItems,
  findVariantForUpdate,
  decrementStock,
  restoreStock,
  withTransaction,
};
