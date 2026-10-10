'use strict';

const { badRequest } = require('../errors');

// Pola slug PRD §9.3: huruf kecil/angka/tanda hubung, tanpa '-' di awal/akhir, maks 50 char
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;

/** Validasi path param :id — 400 VALIDATION_ERROR sebelum lookup (urutan PRD §10.1). */
function validateId(req, _res, next) {
  const { id } = req.params;
  if (!SLUG_PATTERN.test(id || '')) {
    return next(
      badRequest(`Parameter 'id' tidak valid`, [
        {
          field: 'id',
          rule: 'pattern',
          value: id,
          message: 'Harus berupa slug huruf kecil (a-z, 0-9, tanda hubung), 1–50 karakter',
        },
      ])
    );
  }
  next();
}

module.exports = validateId;
module.exports.SLUG_PATTERN = SLUG_PATTERN;
