'use strict';

const { z } = require('zod');
const { slug } = require('./product.schema');

// UUID v4 longgar (versi & variant nibble bebas) — dipakai sebagai cart token.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cartToken = z
  .string({ required_error: 'cartToken wajib diisi', invalid_type_error: 'cartToken harus berupa string' })
  .regex(UUID_PATTERN, 'cartToken harus berupa UUID (contoh: 550e8400-e29b-41d4-a716-446655440000)');

const color = z.string().trim().min(1, 'Warna wajib diisi').max(30, 'Warna maksimal 30 karakter');

const quantity = z
  .number({ invalid_type_error: 'Quantity harus berupa number' })
  .int('Quantity harus integer')
  .min(1, 'Quantity minimal 1')
  .max(99, 'Quantity maksimal 99');

/** Body POST /api/cart/items — tambah (atau gabung) satu item. */
const cartItemInput = z
  .object({
    cartToken,
    productId: slug,
    color,
    quantity: quantity.optional().default(1),
  })
  .strict();

/** Body PATCH /api/cart/{cartToken}/items/{itemId} — ganti jumlah. */
const cartItemUpdate = z
  .object({
    quantity,
  })
  .strict();

module.exports = { UUID_PATTERN, cartToken, cartItemInput, cartItemUpdate };
