'use strict';

const repo = require('../repositories/products.repository');
const { productNotFound, duplicateId, badRequest } = require('../errors');

const CURRENCY = 'USD'; // konstanta aplikasi (arsitektur §6.1) — tanpa kolom DB

function assertBodyIdMatchesPath(id, body) {
  if (body.id !== id) {
    throw badRequest(`Body 'id' harus sama dengan path 'id'`, [
      {
        field: 'id',
        rule: 'mismatch',
        value: body.id,
        message: `Diharapkan '${id}'`,
      },
    ]);
  }
}

async function getDetail(id) {
  const product = await repo.findById(id);
  if (!product) throw productNotFound(id);

  const [variants, images] = await Promise.all([
    repo.findVariantsByProductId(id),
    repo.findImagesByProductId(id),
  ]);

  return { ...product, currency: CURRENCY, variants, images };
}

async function list({ search, limit, offset }) {
  const [items, total] = await Promise.all([
    repo.findList({ search, limit, offset }),
    repo.countAll({ search }),
  ]);
  return {
    data: items.map((p) => ({ ...p, currency: CURRENCY })),
    meta: { total, limit, offset },
  };
}

async function create(body) {
  try {
    await repo.create(body);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw duplicateId(body.id);
    throw err;
  }
  return getDetail(body.id);
}

async function update(id, body) {
  assertBodyIdMatchesPath(id, body); // 400 sebelum lookup (urutan PRD §10.3.4)

  const existing = await repo.findById(id);
  if (!existing) throw productNotFound(id);

  try {
    await repo.update(body);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw duplicateId(body.id);
    throw err;
  }
  return getDetail(id);
}

async function remove(id) {
  const affected = await repo.remove(id);
  if (!affected) throw productNotFound(id);
}

module.exports = { getDetail, list, create, update, remove };
