'use strict';

const { badRequest } = require('../errors');
const { UUID_PATTERN } = require('../schemas/cart.schema');

/** Validasi path param `:cartToken` (UUID) — 400 sebelum lookup. */
function validateCartToken(req, _res, next) {
  const { cartToken } = req.params;
  if (!UUID_PATTERN.test(cartToken || '')) {
    return next(
      badRequest(`Parameter 'cartToken' tidak valid`, [
        {
          field: 'cartToken',
          rule: 'pattern',
          value: cartToken,
          message: 'Harus berupa UUID, mis. 550e8400-e29b-41d4-a716-446655440000',
        },
      ])
    );
  }
  next();
}

/** Validasi path param `:itemId` (bigint positif) — 400 sebelum lookup. */
function validateItemId(req, _res, next) {
  const { itemId } = req.params;
  if (!/^[1-9][0-9]{0,18}$/.test(itemId || '')) {
    return next(
      badRequest(`Parameter 'itemId' tidak valid`, [
        {
          field: 'itemId',
          rule: 'pattern',
          value: itemId,
          message: 'Harus berupa angka bulat positif (bigint)',
        },
      ])
    );
  }
  next();
}

/** Validasi path param `:orderId` (bigint positif) — 400 sebelum lookup. */
function validateOrderId(req, _res, next) {
  const { orderId } = req.params;
  if (!/^[1-9][0-9]{0,18}$/.test(orderId || '')) {
    return next(
      badRequest(`Parameter 'orderId' tidak valid`, [
        {
          field: 'orderId',
          rule: 'pattern',
          value: orderId,
          message: 'Harus berupa angka bulat positif (bigint)',
        },
      ])
    );
  }
  next();
}

module.exports = { validateCartToken, validateItemId, validateOrderId };
