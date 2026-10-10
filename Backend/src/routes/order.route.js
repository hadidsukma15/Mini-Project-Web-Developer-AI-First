'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { requireJson, validateBody, validateQuery } = require('../middlewares/validateBody');
const { validateOrderId } = require('../middlewares/validateParams');
const { orderCreate, orderUpdate, listQuery } = require('../schemas/order.schema');
const { methodNotAllowed } = require('../errors');

const ALLOW_COLLECTION = 'GET, HEAD, POST, OPTIONS';
const ALLOW_ITEM = 'GET, HEAD, PATCH, DELETE, OPTIONS';

// — Method terdaftar (urutan: handler sebelum catch-all .all) —
router.get('/api/orders', validateQuery(listQuery), ctrl.list);
router.post('/api/orders', requireJson, validateBody(orderCreate), ctrl.create);

router.get('/api/orders/:orderId', validateOrderId, ctrl.getDetail);
router.patch(
  '/api/orders/:orderId',
  validateOrderId,
  requireJson,
  validateBody(orderUpdate),
  ctrl.update
);
router.delete('/api/orders/:orderId', validateOrderId, ctrl.remove);

// — Method tak terdaftar pada path yang dikenal → 405 + header Allow —
router.all('/api/orders', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();
  next(methodNotAllowed(req.method, ALLOW_COLLECTION));
});
router.all('/api/orders/:orderId', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();
  next(methodNotAllowed(req.method, ALLOW_ITEM));
});

module.exports = router;
