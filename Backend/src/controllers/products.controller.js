'use strict';

const service = require('../services/products.service');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.getList = wrap(async (req, res) => {
  const result = await service.list(req.query);
  res.json(result); // { data, meta }
});

exports.getDetail = wrap(async (req, res) => {
  const product = await service.getDetail(req.params.id);
  res.json({ data: product });
});

exports.create = wrap(async (req, res) => {
  const product = await service.create(req.body);
  res.status(201).set('Location', `/api/products/${product.id}`).json({ data: product });
});

exports.update = wrap(async (req, res) => {
  const product = await service.update(req.params.id, req.body);
  res.json({ data: product });
});

exports.remove = wrap(async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).end(); // tanpa body (PRD §8.8)
});
