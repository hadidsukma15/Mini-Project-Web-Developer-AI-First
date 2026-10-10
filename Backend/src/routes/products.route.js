'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/products.controller');
const validateId = require('../middlewares/validateId');
const { requireJson, validateBody, validateQuery } = require('../middlewares/validateBody');
const { productInput, listQuery } = require('../schemas/product.schema');
const { methodNotAllowed } = require('../errors');

const ALLOW_COLLECTION = 'GET, HEAD, POST, OPTIONS';
const ALLOW_ITEM = 'GET, HEAD, PUT, DELETE, OPTIONS';

// — Method terdaftar (urutan: handler sebelum catch-all .all) —
router.get('/api/products', validateQuery(listQuery), ctrl.getList);
router.post('/api/products', requireJson, validateBody(productInput), ctrl.create);

router.get('/api/products/:id', validateId, ctrl.getDetail);
router.put('/api/products/:id', requireJson, validateId, validateBody(productInput), ctrl.update);
router.delete('/api/products/:id', validateId, ctrl.remove);

// — Method tak terdaftar pada path yang dikenal → 405 + header Allow (PRD §8.1) —
router.all('/api/products', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next(); // biarkan penanganan OPTIONS bawaan/cors
  next(methodNotAllowed(req.method, ALLOW_COLLECTION));
});
router.all('/api/products/:id', (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();
  next(methodNotAllowed(req.method, ALLOW_ITEM));
});

module.exports = router;
