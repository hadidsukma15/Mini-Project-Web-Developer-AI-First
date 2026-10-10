'use strict';

// Smoke test API (PRD §11 subset). Jalankan: npm run smoke  (server harus hidup)
// Bagian DB otomatis SKIP bila MySQL belum tersedia.
const BASE = process.env.BASE_URL || 'http://localhost:3000';

let pass = 0;
let fail = 0;
let skip = 0;

function report(name, ok, extra = '') {
  if (ok === true) { pass++; console.log(`  PASS  ${name}`); }
  else if (ok === 'skip') { skip++; console.log(`  SKIP  ${name}${extra ? ` — ${extra}` : ''}`); }
  else { fail++; console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`); }
}

async function call(method, path, { body, headers } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.headers['Content-Type'] = headers?.['Content-Type'] ?? 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { res, text, json };
}

const isDbDown = (r) => r.res.status === 500 && r.json?.code === 'INTERNAL_ERROR';

const isProblem = (r, code) =>
  (r.res.headers.get('content-type') || '').includes('application/problem+json') &&
  r.json?.code === code && r.json?.status === r.res.status;

const validProduct = {
  id: 'smoke-test-product',
  name: 'Smoke Test Product',
  price: 99.99,
  description: 'Produk uji otomatis dari scripts/smoke.js untuk verifikasi CRUD.',
  variants: [{ color: 'Black', swatch: '#111111', quantity: 5 }],
  images: [{ url: '/img/smoke.png', alt: 'Smoke test image' }],
};

async function main() {
  console.log(`Smoke test → ${BASE}\n`);

  console.log('— Dokumentasi & Health —');
  {
    const r = await call('GET', '/health');
    const dbOk = r.res.status === 200 && r.json?.status === 'ok' && r.json?.db === 'connected';
    const dbDown = r.res.status === 503 && r.json?.status === 'degraded' && r.json?.db === 'disconnected';
    report('GET /health → 200 (atau 503 saat DB belum siap)', dbOk || dbDown, `status=${r.res.status} db=${r.json?.db}`);
  }
  {
    const r = await call('GET', '/api-docs/');
    report('GET /api-docs → Swagger UI HTML', r.res.status === 200 && r.text.includes('swagger'));
  }
  {
    const r = await call('GET', '/openapi.yaml');
    report('GET /openapi.yaml → spec valid', r.res.status === 200 && r.text.includes('openapi:'));
  }
  {
    const r = await call('GET', '/openapi.json');
    report('T16 Security header nosniff', r.res.headers.get('x-content-type-options') === 'nosniff');
  }

  console.log('\n— Validasi & error path (tanpa DB) —');
  {
    const r = await call('GET', '/api/products/MW75-TUMI');
    report('T2  slug huruf besar → 400 VALIDATION_ERROR + errors[0].field=id', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR') && r.json.errors?.[0]?.field === 'id', `status=${r.res.status} code=${r.json?.code}`);
  }
  {
    const r = await call('GET', '/api/products/-mw75');
    report('T3  slug "-mw75" → 400', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
  }
  {
    const r = await call('PATCH', '/api/products/mw75-tumi');
    const allow = r.res.headers.get('allow');
    report('T10 PATCH → 405 + header Allow', r.res.status === 405 && isProblem(r, 'METHOD_NOT_ALLOWED') && (allow || '').includes('GET'), `status=${r.res.status} allow=${allow}`);
  }
  {
    const r = await call('DELETE', '/api/products');
    report('     DELETE collection → 405', r.res.status === 405 && isProblem(r, 'METHOD_NOT_ALLOWED'), `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/unknown');
    report('     path tak dikenal → 404 NOT_FOUND', r.res.status === 404 && isProblem(r, 'NOT_FOUND'), `status=${r.res.status} code=${r.json?.code}`);
  }
  {
    const r = await call('POST', '/api/products', { body: '{"name":', headers: { 'Content-Type': 'application/json' } });
    report('     JSON rusak → 400 VALIDATION_ERROR', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
  }
  {
    const r = await call('POST', '/api/products', { body: 'name=x', headers: { 'Content-Type': 'text/plain' } });
    report('T31 Content-Type text/plain → 415', r.res.status === 415 && isProblem(r, 'UNSUPPORTED_MEDIA_TYPE'), `status=${r.res.status}`);
  }
  {
    const r = await call('OPTIONS', '/api/products/mw75-tumi', { headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' } });
    report('T15 CORS preflight → 204 + allow-origin', r.res.status === 204 && !!r.res.headers.get('access-control-allow-origin'), `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/products/mw75-tumi', { headers: { Origin: 'http://localhost:5173' } });
    report('     CORS cross-origin GET → allow-origin', !!r.res.headers.get('access-control-allow-origin'), `status=${r.res.status}`);
  }
  {
    const r = await call('POST', '/api/products', { body: { name: 'No Price' } });
    report('T27 POST body invalid → 400 VALIDATION_ERROR', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
  }

  console.log('\n— Happy path (butuh MySQL: docker compose up + db:migrate + db:seed) —');
  {
    const r = await call('GET', '/api/products/mw75-tumi');
    if (r.res.status === 500 && r.json?.code === 'INTERNAL_ERROR') {
      report('T1  GET detail → 200 {data}', 'skip', 'MySQL belum tersedia');
    } else {
      const d = r.json?.data;
      report('T1  GET detail → 200 {data}', r.res.status === 200 && d?.id === 'mw75-tumi' && typeof d?.price === 'number' && Array.isArray(d?.variants) && Array.isArray(d?.images) && d?.images.length === 8, `status=${r.res.status} price=${d?.price} images=${d?.images?.length}`);
    }
  }
  {
    const r = await call('GET', '/api/products/airpods-max');
    report('T7  GET airpods-max → 404 PRODUCT_NOT_FOUND', isDbDown(r) ? 'skip' : r.res.status === 404 && isProblem(r, 'PRODUCT_NOT_FOUND'), `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/products?limit=5&offset=0');
    report('T22 list → 200 {data[], meta{total,limit,offset}}', isDbDown(r) ? 'skip' : r.res.status === 200 && Array.isArray(r.json?.data) && r.json?.meta?.limit === 5 && typeof r.json?.meta?.total === 'number', `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/products?search=mw75&limit=5&offset=0');
    report('T23 list search & pagination → 200', isDbDown(r) ? 'skip' : r.res.status === 200 && Array.isArray(r.json?.data) && r.json?.meta?.total >= 1, `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/products?foo=bar');
    report('T25 query tak dikenal diabaikan → 200', isDbDown(r) ? 'skip' : r.res.status === 200 && Array.isArray(r.json?.data), `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/products?limit=abc');
    queryInvalid(r);
  }

  console.log('\n— CRUD (butuh MySQL) —');
  let created = false;
  {
    const r = await call('POST', '/api/products', { body: validProduct });
    created = r.res.status === 201;
    report('T26 POST valid → 201 {data} + Location', isDbDown(r) ? 'skip' : created, `status=${r.res.status} code=${r.json?.code}`);
  }
  if (created) {
    {
      const r = await call('POST', '/api/products', { body: validProduct });
      report('T28 POST id duplikat → 409 DUPLICATE_ID', r.res.status === 409 && isProblem(r, 'DUPLICATE_ID'), `status=${r.res.status}`);
    }
    {
      const updated = { ...validProduct, name: 'Smoke Test Product v2', price: 149.99 };
      const r = await call('PUT', `/api/products/${validProduct.id}`, { body: updated });
      report('T30 PUT valid → 200 {data} ter-update', r.res.status === 200 && r.json?.data?.name === 'Smoke Test Product v2', `status=${r.res.status}`);
    }
    {
      const r = await call('PUT', `/api/products/${validProduct.id}`, { body: { ...validProduct, id: 'id-lain' } });
      report('T32 PUT body.id ≠ path → 400 errors[0].field=id', r.res.status === 400 && r.json?.errors?.[0]?.field === 'id', `status=${r.res.status}`);
    }
    {
      const r = await call('DELETE', `/api/products/${validProduct.id}`);
      report('T34 DELETE valid → 204 tanpa body', r.res.status === 204 && r.text === '', `status=${r.res.status}`);
    }
    {
      const r = await call('DELETE', `/api/products/${validProduct.id}`);
      report('T35 DELETE dua kali → 404 PRODUCT_NOT_FOUND', r.res.status === 404 && isProblem(r, 'PRODUCT_NOT_FOUND'), `status=${r.res.status}`);
    }
  } else {
    for (const n of ['T28 POST 409', 'T30 PUT 200', 'T32 PUT 400', 'T34 DELETE 204', 'T35 DELETE 404']) {
      report(n, 'skip', 'MySQL belum tersedia');
    }
  }

  console.log('\n— Cart (butuh MySQL) —');
  const cartToken = '550e8400-e29b-41d4-a716-446655440000';
  const cartUrl = `/api/cart/${cartToken}`;
  {
    const r = await call('POST', '/api/cart/items', {
      body: { cartToken: 'bukan-uuid', productId: 'mw75-tumi', color: 'Black' },
    });
    report('C1  token bukan UUID → 400 field=cartToken', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR') && r.json.errors?.[0]?.field === 'cartToken', `status=${r.res.status} field=${r.json.errors?.[0]?.field}`);
  }
  {
    const r = await call('GET', '/api/cart/bukan-uuid');
    report('     GET path token invalid → 400', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
  }
  {
    const r = await call('PUT', '/api/cart/items', { body: {} });
    const allow = r.res.headers.get('allow');
    report('C10 PUT /api/cart/items → 405 Allow', r.res.status === 405 && isProblem(r, 'METHOD_NOT_ALLOWED') && (allow || '').includes('POST'), `status=${r.res.status} allow=${allow}`);
  }
  {
    // Reset dulu agar berulang aman (run sebelumnya mungkin gagal di tengah)
    await call('DELETE', cartUrl);
    const r = await call('GET', cartUrl);
    report('C2  GET cart kosong → 200 {data} count=0', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.count === 0 && Array.isArray(r.json?.data?.items) && r.json?.data?.cartToken === cartToken, `status=${r.res.status} count=${r.json?.data?.count}`);
  }
  {
    const r = await call('POST', '/api/cart/items', { body: { cartToken, productId: 'mw75-tumi', color: 'Black', quantity: 2 } });
    const d = r.json?.data;
    report('C3  POST item → 200 cart count=2', isDbDown(r) ? 'skip' : r.res.status === 200 && d?.count === 2 && d?.items?.length === 1 && d?.subtotal === 1500, `status=${r.res.status} count=${d?.count} subtotal=${d?.subtotal}`);
  }
  {
    const r = await call('POST', '/api/cart/items', { body: { cartToken, productId: 'mw75-tumi', color: 'Black', quantity: 1 } });
    const d = r.json?.data;
    report('C4  POST varian sama → digabung count=3, 1 baris', isDbDown(r) ? 'skip' : r.res.status === 200 && d?.count === 3 && d?.items?.length === 1 && d?.items?.[0]?.quantity === 3, `status=${r.res.status} items=${d?.items?.length} qty=${d?.items?.[0]?.quantity}`);
  }
  {
    const r = await call('POST', '/api/cart/items', { body: { cartToken, productId: 'mw75-tumi', color: 'Green' } });
    report('C5  warna tak dikenal → 404 VARIANT_NOT_FOUND', isDbDown(r) ? 'skip' : r.res.status === 404 && isProblem(r, 'VARIANT_NOT_FOUND'), `status=${r.res.status} code=${r.json?.code}`);
  }
  {
    const r = await call('POST', '/api/cart/items', { body: { cartToken, productId: 'airpods-max', color: 'Black' } });
    report('C6  produk tak dikenal → 404 PRODUCT_NOT_FOUND', isDbDown(r) ? 'skip' : r.res.status === 404 && isProblem(r, 'PRODUCT_NOT_FOUND'), `status=${r.res.status} code=${r.json?.code}`);
  }
  {
    const r = await call('POST', '/api/cart/items', { body: { cartToken, productId: 'mw75-tumi', color: 'Black', quantity: 99 } });
    report('C7  melebihi stok (12) → 409 INSUFFICIENT_STOCK', isDbDown(r) ? 'skip' : r.res.status === 409 && isProblem(r, 'INSUFFICIENT_STOCK'), `status=${r.res.status} code=${r.json?.code}`);
  }
  let itemId = null;
  {
    const r = await call('GET', cartUrl);
    itemId = r.json?.data?.items?.[0]?.id;
    report('C8  GET cart → item id tersedia', isDbDown(r) ? 'skip' : r.res.status === 200 && typeof itemId === 'number', `itemId=${itemId}`);
  }
  {
    const r = await call('PATCH', `/api/cart/${cartToken}/items/${itemId}`, { body: { quantity: 5 } });
    report('C9  PATCH qty 5 → 200 count=5', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.count === 5, `status=${r.res.status} count=${r.json?.data?.count}`);
  }
  {
    const r = await call('PATCH', `/api/cart/${cartToken}/items/${itemId}`, { body: { quantity: 99 } });
    report('C11 PATCH qty 99 (stok 12) → 409', isDbDown(r) ? 'skip' : r.res.status === 409 && isProblem(r, 'INSUFFICIENT_STOCK'), `status=${r.res.status}`);
  }
  {
    const r = await call('DELETE', `/api/cart/${cartToken}/items/${itemId}`);
    report('C12 DELETE item → 200 count=0', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.count === 0, `status=${r.res.status} count=${r.json?.data?.count}`);
  }
  {
    const r = await call('DELETE', `/api/cart/${cartToken}/items/${itemId}`);
    report('C13 DELETE item dua kali → 404 CART_ITEM_NOT_FOUND', isDbDown(r) ? 'skip' : r.res.status === 404 && isProblem(r, 'CART_ITEM_NOT_FOUND'), `status=${r.res.status} code=${r.json?.code}`);
  }
  {
    await call('POST', '/api/cart/items', { body: { cartToken, productId: 'mw75-tumi', color: 'Black', quantity: 1 } });
    const r = await call('DELETE', cartUrl);
    report('C14 DELETE cart → 200 cart kosong', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.count === 0 && r.json?.data?.items?.length === 0, `status=${r.res.status} count=${r.json?.data?.count}`);
  }

  console.log('\n— Orders: CRUD pesanan (butuh MySQL) —');
  const orderToken = '11111111-2222-4333-8444-555555555555';
  const ordersCartUrl = `/api/cart/${orderToken}`;
  const blackStock = async () => {
    const r = await call('GET', '/api/products/mw75-tumi');
    return r.json?.data?.variants?.find((v) => v.color === 'Black')?.quantity;
  };

  // Reset dulu agar berulang aman (run sebelumnya mungkin gagal di tengah)
  await call('DELETE', ordersCartUrl);
  let stockBefore = null;
  let orderId = null;
  {
    const r = await call('POST', '/api/orders', { body: { cartToken: orderToken } });
    report('O1  cart kosong → 409 CART_EMPTY', isDbDown(r) ? 'skip' : r.res.status === 409 && isProblem(r, 'CART_EMPTY'), `status=${r.res.status} code=${r.json?.code}`);
  }
  {
    const r = await call('POST', '/api/cart/items', { body: { cartToken: orderToken, productId: 'mw75-tumi', color: 'Black', quantity: 2 } });
    report('O2  siapkan cart (Black x2) → 200', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.count === 2, `status=${r.res.status}`);
    stockBefore = await blackStock();
  }
  {
    const r = await call('POST', '/api/orders', {
      body: { cartToken: orderToken, customerName: 'Budi Santoso', email: 'budi@example.com', note: 'Smoke test order' },
    });
    const d = r.json?.data;
    orderId = d?.id;
    report(
      'O3  POST valid → 201 + Location + payload order',
      isDbDown(r) ? 'skip' :
        r.res.status === 201 &&
        !!r.res.headers.get('location') &&
        /^MD-\d{6}-[0-9A-F]{4,6}$/.test(d?.orderNumber || '') &&
        d?.status === 'pending' &&
        d?.customerName === 'Budi Santoso' &&
        d?.items?.length === 1 &&
        d?.subtotal === 1500 && d?.total === 1500,
      `status=${r.res.status} number=${d?.orderNumber} subtotal=${d?.subtotal}`
    );
  }
  {
    const r = await call('GET', ordersCartUrl);
    report('O4  cart kosong setelah checkout → count=0', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.count === 0, `count=${r.json?.data?.count}`);
  }
  {
    const after = await blackStock();
    report('O5  stok Black berkurang 2 (12 → 10)', after === stockBefore - 2, `before=${stockBefore} after=${after}`);
  }
  {
    const r = await call('GET', `/api/orders?cartToken=${orderToken}`);
    const d = r.json?.data;
    report('O6  list?cartToken → 200 {data[], meta}', isDbDown(r) ? 'skip' : r.res.status === 200 && Array.isArray(d) && d.length >= 1 && typeof r.json?.meta?.total === 'number' && d[0]?.items?.length >= 1, `status=${r.res.status} total=${r.json?.meta?.total}`);
  }
  {
    const r = await call('GET', `/api/orders/${orderId}`);
    report('O7  GET detail → 200 item snapshot (nama+harga)', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.id === orderId && r.json?.data?.items?.[0]?.name === 'MW75 TUMI' && r.json?.data?.items?.[0]?.unitPrice === 750, `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/orders/abc');
    report('O8  orderId bukan angka → 400 field=orderId', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR') && r.json.errors?.[0]?.field === 'orderId', `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/orders/99999');
    report('O9  id tak dikenal → 404 ORDER_NOT_FOUND', isDbDown(r) ? 'skip' : r.res.status === 404 && isProblem(r, 'ORDER_NOT_FOUND'), `status=${r.res.status}`);
  }
  {
    const r = await call('PATCH', `/api/orders/${orderId}`, { body: { status: 'paid' } });
    report('O10 PATCH status paid → 200', isDbDown(r) ? 'skip' : r.res.status === 200 && r.json?.data?.status === 'paid', `status=${r.res.status} value=${r.json?.data?.status}`);
  }
  {
    const r = await call('PATCH', `/api/orders/${orderId}`, { body: { status: 'bogus' } });
    report('O11 status tak dikenal → 400 field=status', r.res.status === 400 && r.json?.errors?.[0]?.field === 'status', `status=${r.res.status} field=${r.json?.errors?.[0]?.field}`);
  }
  {
    const r = await call('PATCH', `/api/orders/${orderId}`, { body: {} });
    report('O12 PATCH body kosong → 400 minimal satu field', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
  }
  {
    const r = await call('PATCH', `/api/orders/${orderId}`, { body: 'status=paid', headers: { 'Content-Type': 'text/plain' } });
    report('O13 PATCH Content-Type text/plain → 415', r.res.status === 415 && isProblem(r, 'UNSUPPORTED_MEDIA_TYPE'), `status=${r.res.status}`);
  }
  {
    const r = await call('GET', '/api/orders?status=bogus');
    report('O14 list ?status=bogus → 400', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
  }
  {
    const r = await call('PUT', `/api/orders/${orderId}`, { body: { status: 'paid' } });
    const allow = r.res.headers.get('allow');
    report('O15 PUT → 405 + Allow berisi PATCH', r.res.status === 405 && (allow || '').includes('PATCH'), `status=${r.res.status} allow=${allow}`);
  }
  {
    // Cancel dulu → stok dikembalikan; lalu un-cancel → stok dipotong lagi (simetri status)
    await call('PATCH', `/api/orders/${orderId}`, { body: { status: 'cancelled' } });
    const cancelled = await blackStock();
    await call('PATCH', `/api/orders/${orderId}`, { body: { status: 'shipped' } });
    const resumed = await blackStock();
    report('O16 status cancelled → stok kembali; shipped → stok dipotong lagi', cancelled === stockBefore && resumed === stockBefore - 2, `cancelled=${cancelled} shipped=${resumed}`);
  }
  {
    const r = await call('DELETE', `/api/orders/${orderId}`);
    report('O17 DELETE → 204 tanpa body', isDbDown(r) ? 'skip' : r.res.status === 204 && r.text === '', `status=${r.res.status}`);
  }
  {
    const restored = await blackStock();
    report('O18 stok Black kembali penuh setelah DELETE', restored === stockBefore, `before=${stockBefore} after=${restored}`);
  }
  {
    const r = await call('DELETE', `/api/orders/${orderId}`);
    report('O19 DELETE dua kali → 404 ORDER_NOT_FOUND', isDbDown(r) ? 'skip' : r.res.status === 404 && isProblem(r, 'ORDER_NOT_FOUND'), `status=${r.res.status}`);
  }

  console.log(`\n=== PASS ${pass} · FAIL ${fail} · SKIP ${skip} ===`);
  process.exit(fail > 0 ? 1 : 0);
}

function queryInvalid(r) {
  report('     ?limit=abc → 400 VALIDATION_ERROR', r.res.status === 400 && isProblem(r, 'VALIDATION_ERROR'), `status=${r.res.status}`);
}

main().catch((err) => {
  console.error('SMOKE ERROR:', err.message);
  console.error('Pastikan server hidup: npm start');
  process.exit(1);
});
