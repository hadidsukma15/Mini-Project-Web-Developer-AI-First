'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');
const { requireJson, validateBody } = require('../middlewares/validateBody');
const { validateCartToken, validateItemId } = require('../middlewares/validateParams');
const { cartItemInput, cartItemUpdate } = require('../schemas/cart.schema');
const { methodNotAllowed } = require('../errors');

const ALLOW_ITEMS = 'POST, OPTIONS';
const ALLOW_CART = 'GET, DELETE, OPTIONS';
const ALLOW_ITEM = 'PATCH, DELETE, OPTIONS';

// — Method terdaftar (urutan: handler sebelum catch-all .all) —
router.post('/api/cart/items', requireJson, validateBody(cartItemInput), ctrl.addItem);

router.get('/api/cart/:cartToken', validateCartToken, ctrl.getCart);
router.delete('/api/cart/:cartToken', validateCartToken, ctrl.clearCart);

router.patch(
  '/api/cart/:cartToken/items/:itemId',
  validateCartToken,
  validateItemId,
  requireJson,
  validateBody(cartItemUpdate),
  ctrl.updateItem
);
router.delete('/api/cart/:cartToken/items/:itemId', validateCartToken, validateItemId, ctrl.removeItem);

// — Method tak terdaftar pada path yang dikenal → 405 + header Allow —
router.all('/api/cart/items', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();
  next(methodNotAllowed(req.method, ALLOW_ITEMS));
});
router.all('/api/cart/:cartToken', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();
  next(methodNotAllowed(req.method, ALLOW_CART));
});
router.all('/api/cart/:cartToken/items/:itemId', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();
  next(methodNotAllowed(req.method, ALLOW_ITEM));
});

module.exports = router;
