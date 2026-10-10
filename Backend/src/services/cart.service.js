'use strict';

const repo = require('../repositories/cart.repository');
const { productNotFound, variantNotFound, insufficientStock, cartItemNotFound } = require('../errors');

const CURRENCY = 'USD'; // konstanta aplikasi (arsitektur §6.1) — tanpa kolom DB
const round2 = (n) => Math.round(n * 100) / 100;

/** Rakit envelope cart dari baris item (tanpa query tambahan — no N+1). */
function assemble(cartToken, rows) {
  const items = rows.map((row) => ({
    id: Number(row.id),
    productId: row.product_id,
    name: row.product_name,
    color: row.color,
    quantity: Number(row.quantity),
    unitPrice: row.price,
    lineTotal: round2(row.price * row.quantity),
  }));
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));
  return { cartToken, currency: CURRENCY, count, subtotal, items };
}

async function getCart(cartToken) {
  const rows = await repo.findItems(cartToken);
  return assemble(cartToken, rows);
}

/** Tambah item: gabung dengan baris yang sama (product + warna) bila sudah ada. */
async function addItem({ cartToken, productId, color, quantity }) {
  const finalQty = await repo.withTransaction(async (conn) => {
    const product = await repo.findProductForUpdate(conn, productId);
    if (!product) throw productNotFound(productId);

    const variant = await repo.findVariantForUpdate(conn, productId, color);
    if (!variant) throw variantNotFound(productId, color);

    const existing = await repo.findItemForUpdate(conn, cartToken, productId, color);
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > variant.quantity) throw insufficientStock(productId, color, variant.quantity);

    await repo.ensureCart(conn, cartToken);
    if (existing) await repo.updateItemQuantity(conn, existing.id, nextQty);
    else await repo.insertItem(conn, { cartId: cartToken, productId, color, quantity: nextQty });
    return nextQty;
  });

  const cart = await getCart(cartToken);
  return { cart, quantity: finalQty };
}

/** Ganti jumlah satu item (tetap dibatasi stok varian). */
async function updateItem({ cartToken, itemId, quantity }) {
  await repo.withTransaction(async (conn) => {
    const item = await repo.findItemForUpdateById(conn, cartToken, itemId);
    if (!item) throw cartItemNotFound(itemId);

    const variant = await repo.findVariantForUpdate(conn, item.product_id, item.color);
    if (!variant) throw variantNotFound(item.product_id, item.color);
    if (quantity > variant.quantity) {
      throw insufficientStock(item.product_id, item.color, variant.quantity);
    }

    await repo.updateItemQuantity(conn, item.id, quantity);
  });

  return getCart(cartToken);
}

async function removeItem({ cartToken, itemId }) {
  const affected = await repo.removeItem(cartToken, itemId);
  if (!affected) throw cartItemNotFound(itemId);
  return getCart(cartToken);
}

async function clearCart(cartToken) {
  await repo.clearCart(cartToken);
  return getCart(cartToken);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
