'use strict';

const { z } = require('zod');
const { cartToken } = require('./cart.schema');

/** Status pesanan (kolom `orders.status` + CHECK constraint di 003_orders.sql). */
const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const orderStatus = z.enum(ORDER_STATUSES, {
  errorMap: () => ({
    message: `Status harus salah satu dari: ${ORDER_STATUSES.join(', ')}`,
  }),
});

const customerName = z
  .string({ invalid_type_error: 'Nama harus berupa string' })
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(80, 'Nama maksimal 80 karakter')
  .nullish();

const email = z
  .string({ invalid_type_error: 'Email harus berupa string' })
  .trim()
  .toLowerCase()
  .email('Email tidak valid')
  .max(120, 'Email maksimal 120 karakter')
  .nullish();

const note = z
  .string({ invalid_type_error: 'Catatan harus berupa string' })
  .trim()
  .max(500, 'Catatan maksimal 500 karakter')
  .nullish();

/** Body POST /api/orders — checkout: ubah isi cart menjadi pesanan. */
const orderCreate = z
  .object({
    cartToken,
    customerName,
    email,
    note,
  })
  .strict();

/** Body PATCH /api/orders/{orderId} — minimal satu field. */
const orderUpdate = z
  .object({
    status: orderStatus.optional(),
    customerName,
    email,
    note,
  })
  .strict()
  .refine((val) => ['status', 'customerName', 'email', 'note'].some((k) => val[k] !== undefined), {
    message: 'Minimal satu field harus dikirim (status, customerName, email, atau note)',
  });

/** Query GET /api/orders — param tak dikenal diabaikan (non-strict). */
const listQuery = z.object({
  cartToken: cartToken.optional(),
  status: orderStatus.optional(),
  limit: z.coerce
    .number({ invalid_type_error: 'Limit harus angka' })
    .int('Limit harus integer')
    .min(1, 'Limit minimal 1')
    .max(100, 'Limit maksimal 100')
    .optional()
    .default(20),
  offset: z.coerce
    .number({ invalid_type_error: 'Offset harus angka' })
    .int('Offset harus integer')
    .min(0, 'Offset tidak boleh negatif')
    .optional()
    .default(0),
});

module.exports = { ORDER_STATUSES, orderStatus, orderCreate, orderUpdate, listQuery };
