'use strict';

// Validasi struktur docs/openapi.yaml: parse YAML, cek field wajib & resolusi $ref internal.
const { spec } = require('../src/docs/loadSpec');

const errors = [];

if (spec.openapi !== '3.0.3') errors.push(`openapi: ${spec.openapi} (diharapkan 3.0.3)`);
if (!spec.info?.title || !spec.info?.version) errors.push('info.title / info.version kosong');
if (!spec.paths || Object.keys(spec.paths).length === 0) errors.push('paths kosong');

// Kumpulkan semua definisi
const defs = new Set();
const METHODS = ['get', 'post', 'put', 'delete', 'head', 'options', 'patch', 'trace'];
const SKIP_KEYS = ['parameters', 'summary', 'description', 'servers', '$ref'];
for (const [p, item] of Object.entries(spec.paths || {})) {
  for (const method of Object.keys(item)) {
    if (SKIP_KEYS.includes(method)) continue;
    if (!METHODS.includes(method)) {
      errors.push(`${p}: method tak dikenal '${method}'`);
    }
    const op = item[method];
    if (METHODS.includes(method) && op && typeof op === 'object' && !op.responses) {
      errors.push(`${p} ${method}: tanpa responses`);
    }
  }
}
const collectRefs = (node, trail = '$') => {
  if (Array.isArray(node)) return node.forEach((n, i) => collectRefs(n, `${trail}[${i}]`));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === '$ref' && typeof v === 'string') checkRef(v, trail);
      else collectRefs(v, `${trail}.${k}`);
    }
  }
};
const resolvePath = (ref) => ref
  .replace(/^#\//, '')
  .split('/')
  .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
function checkRef(ref, trail) {
  if (!ref.startsWith('#/')) {
    errors.push(`${trail}: $ref eksternal belum didukung — ${ref}`);
    return;
  }
  let cur = spec;
  for (const key of resolvePath(ref)) {
    cur = cur?.[key];
    if (cur === undefined) break;
  }
  if (cur === undefined) errors.push(`${trail}: $ref tak terresolusi — ${ref}`);
}
collectRefs(spec);

// Kontrak wajib dari PRD §8 + tambahan cart & orders
const requiredPaths = [
  '/api/products',
  '/api/products/{id}',
  '/api/cart/items',
  '/api/cart/{cartToken}',
  '/api/orders',
  '/api/orders/{orderId}',
];
for (const p of requiredPaths) if (!spec.paths[p]) errors.push(`path hilang: ${p}`);
const item = spec.paths['/api/products/{id}'] || {};
for (const m of ['get', 'put', 'delete']) if (!item[m]) errors.push(`method hilang pada {id}: ${m}`);
const coll = spec.paths['/api/products'] || {};
for (const m of ['get', 'post']) if (!coll[m]) errors.push(`method hilang pada collection: ${m}`);
const cart = spec.paths['/api/cart/{cartToken}'] || {};
for (const m of ['get', 'delete']) if (!cart[m]) errors.push(`method hilang pada cart: ${m}`);
const cartItems = spec.paths['/api/cart/items'] || {};
if (!cartItems.post) errors.push('method hilang pada /api/cart/items: post');
const orderColl = spec.paths['/api/orders'] || {};
for (const m of ['get', 'post']) if (!orderColl[m]) errors.push('method hilang pada /api/orders: ' + m);
const orderItem = spec.paths['/api/orders/{orderId}'] || {};
for (const m of ['get', 'patch', 'delete']) if (!orderItem[m]) errors.push('method hilang pada /api/orders/{orderId}: ' + m);

if (errors.length) {
  console.error('OPENAPI INVALID:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log(`OPENAPI OK — ${Object.keys(spec.paths).length} paths, $ref semua terresolusi, kontrak §8 lengkap.`);
