'use strict';

const service = require('../services/cart.service');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.addItem = wrap(async (req, res) => {
  const { cart } = await service.addItem(req.body);
  res.json({ data: cart });
});

exports.getCart = wrap(async (req, res) => {
  const cart = await service.getCart(req.params.cartToken);
  res.json({ data: cart });
});

exports.updateItem = wrap(async (req, res) => {
  const cart = await service.updateItem({
    cartToken: req.params.cartToken,
    itemId: Number(req.params.itemId),
    quantity: req.body.quantity,
  });
  res.json({ data: cart });
});

exports.removeItem = wrap(async (req, res) => {
  const cart = await service.removeItem({
    cartToken: req.params.cartToken,
    itemId: Number(req.params.itemId),
  });
  res.json({ data: cart });
});

exports.clearCart = wrap(async (req, res) => {
  const cart = await service.clearCart(req.params.cartToken);
  res.json({ data: cart });
});
