'use strict';

const crypto = require('crypto');
const repo = require('../repositories/order.repository');
const {
  orderNotFound,
  cartEmpty,
  variantNotFound,
  insufficientStock,
} = require('../errors');

const CURRENCY = 'USD'; // konstanta aplikasi (arsitektur §6.1) — tanpa kolom DB
const round2 = (n) => Math.round(n * 100) / 100;

/** Nomor pesanan unik: MD-YYMMDD-XXXXXX (6 hex acak; ulang bila bentrok). */
function generateOrderNumber(date = new Date()) {
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MD-${yy}${mm}${dd}-${suffix}`;
}

/** Rakit envelope order dari baris order + item-nya (join sudah di-preload). */
function assemble(order, items = []) {
  const mapped = items.map((item) => ({
    id: Number(item.id),
    productId: item.product_id,
    name: item.product_name,
    color: item.color,
    quantity: Number(item.quantity),
    unitPrice: item.unit_price,
    lineTotal: item.line_total,
  }));
  return {
    id: Number(order.id),
    orderNumber: order.order_number,
    cartToken: order.cart_id,
    status: order.status,
    currency: order.currency,
    customerName: order.customer_name,
    email: order.email,
    note: order.note,
    itemsCount: mapped.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: order.subtotal,
    total: order.total,
    items: mapped,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

async function list({ cartToken, status, limit, offset }) {
  const [rows, total] = await Promise.all([
    repo.findList({ cartToken, status, limit, offset }),
    repo.countList({ cartToken, status }),
  ]);
  const allItems = await repo.findItemsByOrderIds(rows.map((row) => row.id));
  const byOrder = new Map();
  for (const item of allItems) {
    const bucket = byOrder.get(item.order_id) || [];
    bucket.push(item);
    byOrder.set(item.order_id, bucket);
  }
  return {
    data: rows.map((row) => assemble(row, byOrder.get(row.id) ?? [])),
    meta: { total, limit, offset },
  };
}

async function getById(id) {
  const order = await repo.findById(id);
  if (!order) throw orderNotFound(id);
  const items = await repo.findItemsByOrderId(order.id);
  return assemble(order, items);
}

/** Kunci semua varian dalam pesanan & pastikan stok mencukupi (untuk create/uncancel). */
async function assertAndConsumeStock(conn, items) {
  for (const item of items) {
    const variant = await repo.findVariantForUpdate(conn, item.product_id, item.color);
    if (!variant) throw variantNotFound(item.product_id, item.color);
    if (variant.quantity < item.quantity) {
      throw insufficientStock(item.product_id, item.color, variant.quantity);
    }
    await repo.decrementStock(conn, item.product_id, item.color, item.quantity);
  }
}

async function restoreStockFromItems(conn, items) {
  for (const item of items) {
    await repo.restoreStock(conn, item.product_id, item.color, item.quantity);
  }
}

/**
 * Checkout: ubah isi cart menjadi pesanan (satu transaksi).
 * - Stok varian divalidasi lalu dikurangi (committed saat pesanan dibuat).
 * - Harga & nama produk di-snapshot ke `order_items`.
 * - Cart dikosongkan setelah pesanan berhasil dibuat.
 */
async function create({ cartToken, customerName, email, note }) {
  const orderId = await repo.withTransaction(async (conn) => {
    const cartRows = await repo.findCartItemsForUpdate(conn, cartToken);
    if (!cartRows.length) throw cartEmpty(cartToken);

    await assertAndConsumeStock(
      conn,
      cartRows.map((row) => ({ product_id: row.product_id, color: row.color, quantity: row.quantity }))
    );

    const items = cartRows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      color: row.color,
      unitPrice: row.price,
      quantity: row.quantity,
      lineTotal: round2(row.price * row.quantity),
    }));
    const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));

    let id = 0;
    let lastErr = null;
    for (let attempt = 0; attempt < 3 && !id; attempt += 1) {
      try {
        id = await repo.insertOrder(conn, {
          orderNumber: generateOrderNumber(),
          cartId: cartToken,
          status: 'pending',
          customerName,
          email,
          note,
          subtotal,
          total: subtotal,
        });
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          lastErr = err; // nomor bentrok → coba generate ulang
          continue;
        }
        throw err;
      }
    }
    if (!id) throw lastErr;

    await repo.insertItems(conn, id, items);
    await repo.clearCartItems(conn, cartToken);
    return id;
  });

  return getById(orderId);
}

/**
 * Update pesanan (sebagian): status / identitas pembeli.
 * Efek stok saat status berubah:
 * - masuk `cancelled` → stok varian dikembalikan;
 * - keluar `cancelled` → stok divalidasi & dikurangi lagi.
 */
async function update(id, patch) {
  await repo.withTransaction(async (conn) => {
    const order = await repo.findByIdForUpdate(conn, id);
    if (!order) throw orderNotFound(id);

    const nextStatus = patch.status && patch.status !== order.status ? patch.status : null;

    if (nextStatus === 'cancelled') {
      const items = await repo.findItemsForUpdate(conn, id);
      await restoreStockFromItems(conn, items);
    } else if (order.status === 'cancelled' && nextStatus) {
      const items = await repo.findItemsForUpdate(conn, id);
      await assertAndConsumeStock(conn, items);
    }

    const fields = {};
    if (patch.status !== undefined) fields.status = patch.status;
    if (patch.customerName !== undefined) fields.customer_name = patch.customerName;
    if (patch.email !== undefined) fields.email = patch.email;
    if (patch.note !== undefined) fields.note = patch.note;

    await repo.updateOrder(conn, id, fields);
  });

  return getById(id);
}

/** Hapus pesanan (hard delete, item ikut CASCADE) + kembalikan stok bila belum dibatalkan. */
async function remove(id) {
  await repo.withTransaction(async (conn) => {
    const order = await repo.findByIdForUpdate(conn, id);
    if (!order) throw orderNotFound(id);

    if (order.status !== 'cancelled') {
      const items = await repo.findItemsForUpdate(conn, id);
      await restoreStockFromItems(conn, items);
    }
    await repo.deleteOrder(conn, id);
  });
}

module.exports = { list, getById, create, update, remove, CURRENCY };
