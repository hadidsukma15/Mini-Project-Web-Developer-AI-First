'use strict';

const service = require('../services/order.service');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.list = wrap(async (req, res) => {
  const result = await service.list(req.query);
  res.json({ data: result.data, meta: result.meta });
});

exports.create = wrap(async (req, res) => {
  const order = await service.create(req.body);
  res.location(`/api/orders/${order.id}`).status(201).json({ data: order });
});

exports.getDetail = wrap(async (req, res) => {
  const order = await service.getById(Number(req.params.orderId));
  res.json({ data: order });
});

exports.update = wrap(async (req, res) => {
  const order = await service.update(Number(req.params.orderId), req.body);
  res.json({ data: order });
});

exports.remove = wrap(async (req, res) => {
  await service.remove(Number(req.params.orderId));
  res.status(204).end();
});
