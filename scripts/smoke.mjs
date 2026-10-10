import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Smoke test frontend — 3 halaman (sesuai mini project):
 *   1. `index.html`       → konten hardcode (src/data/product.js)
 *   2. `product-api.html` → konten dari response API (GET /api/products/:id)
 *   3. `orders.html`      → daftar pesanan dari API (CRUD via /api/orders)
 *
 * Bundle dist berupa ES module, jadi di-dinamis-import oleh Node dengan
 * global jsdom (window/document/localStorage/fetch) yang dipasang lebih dulu.
 * `?run=` men-force eksekusi ulang entry untuk tiap skenario (modul bersama
 * sengaja di-cache → jalankan halaman 1 dulu, skenario API-success paling akhir).
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const results = [];
let runId = 0;

// Simpan fetch asli Node sebelum diganti per skenario (dipakai skenario E2E).
const nativeFetch = globalThis.fetch;

const unhandled = [];
process.on('unhandledRejection', (err) => unhandled.push(err));

const check = (name, cond, detail = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);

function setGlobal(name, value) {
  try {
    globalThis[name] = value;
  } catch {
    Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  }
}

/** Baca dist/<html> + pastikan entry JS-nya ikut ter-bundle (wiring build). */
function readPage(htmlFile) {
  const html = fs.readFileSync(path.join(root, 'dist', htmlFile), 'utf8');
  const match = html.match(/<script type="module"[^>]*src="\/(assets\/[^"]+\.js)"/);
  check(`${htmlFile}: punya entry module script`, !!match);
  const bundlePath = match ? path.join(root, 'dist', match[1]) : null;
  check(`${htmlFile}: bundle ada di dist`, !!bundlePath && fs.existsSync(bundlePath), match?.[1]);
  return { html, bundlePath };
}

/** Pasang jsdom sebagai global runtime untuk bundle yang akan di-import. */
function createPage(htmlFile, { url, fetchImpl } = {}) {
  const { html, bundlePath } = readPage(htmlFile);
  const dom = new JSDOM(html.replace(/<script[^>]*><\/script>/, ''), {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });

  const windowErrors = [];
  dom.window.addEventListener('error', (event) => windowErrors.push(event.message));

  setGlobal('window', dom.window);
  setGlobal('document', dom.window.document);
  setGlobal('location', dom.window.location);
  setGlobal('history', dom.window.history);
  setGlobal('localStorage', dom.window.localStorage);
  setGlobal('fetch', fetchImpl);

  return { dom, window: dom.window, document: dom.window.document, windowErrors, bundlePath };
}

async function importBundle(page) {
  const spec = `${pathToFileURL(page.bundlePath).href}?run=${++runId}`;
  try {
    await import(spec);
  } catch (err) {
    check('bundle dievaluasi tanpa exception', false, String(err?.stack || err));
  }
}

async function waitFor(predicate, timeoutMs = 3000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
}

const jsonResponse = (body, status = 200) => {
  const text = JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text };
};

/** Payload produk tiruan dengan ciri khas yang membedakannya dari mock lokal. */
const API_PRODUCT = {
  data: {
    id: 'mw75-tumi',
    name: 'MW75 TUMI',
    price: 750,
    currency: 'USD',
    description:
      'DESKRIPSI DARI DATABASE — diisi otomatis oleh halaman ini dari response API.',
    variants: [
      { color: 'Black', swatch: '#1b1b1b', quantity: 12 },
      { color: 'Silver', swatch: '#c0c0c0', quantity: 0 },
    ],
    images: [
      { url: '/img/black-engraving.png', alt: 'Black engraving (API)', color: 'Black' },
      { url: '/img/black-hero.png', alt: 'Black hero (API)', color: 'Black' },
      { url: '/img/silver-hero.png', alt: 'Silver hero (API)', color: 'Silver' },
      { url: '/img/silver-front.png', alt: 'Silver front (API)', color: 'Silver' },
    ],
  },
};

const EMPTY_CART = {
  data: { cartToken: '00000000-0000-4000-8000-000000000000', currency: 'USD', count: 0, subtotal: 0, items: [] },
};

const ADDED_CART = {
  data: {
    cartToken: '00000000-0000-4000-8000-000000000000',
    currency: 'USD',
    count: 1,
    subtotal: 750,
    items: [
      {
        id: 'item-1',
        productId: 'mw75-tumi',
        name: 'MW75 TUMI',
        color: 'Black',
        quantity: 1,
        unitPrice: 750,
        lineTotal: 750,
      },
    ],
  },
};

const NOT_FOUND_PROBLEM = {
  type: 'https://errors.api.produk/product-not-found',
  title: 'Product Not Found',
  status: 404,
  detail: 'Produk dengan id tersebut tidak ada di database.',
  instance: '/api/products/tidak-ada',
  code: 'PRODUCT_NOT_FOUND',
};

/** Stub fetch meniru backend Express: envelope {data} / problem+json. */
function stubFetch({ product = API_PRODUCT, cart = EMPTY_CART, addedCart = ADDED_CART } = {}) {
  return async (input) => {
    const url = String(input);
    if (url.includes('/api/cart/items')) return jsonResponse(addedCart);
    if (url.includes('/api/cart/')) return jsonResponse(cart);
    if (url.includes('/api/products/tidak-ada')) return jsonResponse(NOT_FOUND_PROBLEM, 404);
    if (url.includes('/api/products/')) return jsonResponse(product);
    return jsonResponse({ title: 'Not Found', status: 404 }, 404);
  };
}

// ===========================================================================
// HALAMAN 1 — index.html (konten hardcode)
// ===========================================================================

const page1 = createPage('index.html', { url: 'http://localhost/?variant=silver' });
const { document, window } = page1;
const errors = page1.windowErrors;

await importBundle(page1);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// AC-01 structure
check('AC-01 header', !!$('.site-header'));
check('AC-01 gallery', !!$('.gallery'));
check('AC-01 h1 identity', $('.purchase__title')?.textContent === 'MW75 TUMI');
check('AC-01 category', $('.purchase__category')?.textContent === 'Noise-Cancelling Wireless Headphones');
check('AC-01 availability badge', /In stock/.test($('#availability-badge')?.textContent ?? ''));
check('AC-01 variant', $$('.variant__option').length === 2, String($$('.variant__option').length));
check('AC-01 CTA', !!$('#add-to-cart'));
check('AC-01 USP', $$('.usp__item').length === 6, String($$('.usp__item').length));
check('AC-01 trust', $$('.trust__card').length === 3, String($$('.trust__card').length));
check('AC-01 story', /TUMI/.test($('#story-title')?.textContent ?? ''));
check('AC-01 description', /Active Noise-Cancelling/.test($('#description-title')?.textContent ?? ''));
check('AC-01 specs', $$('.specs__row').length === 16, String($$('.specs__row').length));
check('AC-01 in the box', $$('.box__item').length === 7, String($$('.box__item').length));
check('AC-01 support', !!$('.support a[href="https://support.masterdynamic.com"]'));
check('AC-01 newsletter', !!$('#newsletter-form'));
check('AC-01 footer', $$('.footer__group').length === 3, String($$('.footer__group').length));
check('AC-01 breadcrumb', $$('.breadcrumb li').length === 2, String($$('.breadcrumb li').length));

// AC-07 price
check('AC-07 price USD', $('#price')?.textContent === 'US$750.00', $('#price')?.textContent);

// Variant from URL (?variant=silver)
check('AC-18 URL variant init', $('.variant__option[data-variant="silver"]')?.getAttribute('aria-checked') === 'true');
check('AC-18 gallery follows variant', ($('#gallery-image')?.getAttribute('src') ?? '').includes('silver'));
check('AC-18 legend', $('#variant-label')?.textContent === 'Silver');

// AC-08 CTA disabled when selected variant is out of stock (Silver qty 0)
$('#add-to-cart').click();
check(
  'AC-08 CTA disabled & no cart',
  $('#add-to-cart')?.disabled === true &&
    $('#add-to-cart')?.getAttribute('aria-disabled') === 'true' &&
    $('#cart-count').textContent === '0',
  $('#cart-count').textContent
);

// AC-02/03/04 gallery nav (wrap-around)
const firstSrc = $('#gallery-image').getAttribute('src');
$('.gallery__nav--next').click();
check('AC-03 next', $('#gallery-image').getAttribute('src') !== firstSrc && $('#gallery-counter').textContent.trim() === '2 / 4', $('#gallery-counter').textContent.trim());
$('.gallery__nav--prev').click();
$('.gallery__nav--prev').click();
check('AC-04 prev wrap', $('#gallery-counter').textContent.trim() === '4 / 4', $('#gallery-counter').textContent.trim());
$('.gallery__nav--next').click();
check('AC-03 wrap back to 1', $('#gallery-counter').textContent.trim() === '1 / 4');

// AC-05/06 variant switching
$('.variant__option[data-variant="black"]').click();
check('AC-05 black active', $('.variant__option[data-variant="black"]').getAttribute('aria-checked') === 'true');
check('AC-05 only one active', $$('.variant__option[aria-checked="true"]').length === 1);
check('AC-05 visual black', $('#gallery-image').getAttribute('src').includes('black'));
check('AC-18 URL updated', window.location.search.includes('variant=black'), window.location.search);
check('AC-18 gallery reset', $('#gallery-counter').textContent.trim() === '1 / 4', $('#gallery-counter').textContent.trim());
check('AC-18 alt updated', ($('#gallery-image')?.getAttribute('alt') ?? '').includes('black'));
check('variant announcement', $('#variant-announcement').textContent === 'Color selected: Black');
check('thumb aria-current', $('.gallery__thumb[aria-current="true"]')?.dataset.index === '0');

// AC-13 search
$('#search-trigger').click();
check('AC-13 search open', $('#search-panel').hidden === false && $('#search-trigger').getAttribute('aria-expanded') === 'true');
check('AC-13 focus input', document.activeElement === $('#search-input'));
const input = $('#search-input');
input.value = 'mw08';
input.dispatchEvent(new window.Event('input', { bubbles: true }));
check('AC-13 filter suggested', $$('#search-results li').length === 2, String($$('#search-results li').length));
input.value = '';
input.dispatchEvent(new window.Event('input', { bubbles: true }));
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('AC-13 Esc close', $('#search-panel').hidden === true && $('#search-trigger').getAttribute('aria-expanded') === 'false');
check('AC-13 focus back', document.activeElement === $('#search-trigger'));

// AC-14 country selector
$('#market-trigger').click();
check('AC-14 market open', $('#market-list').hidden === false && $('#market-trigger').getAttribute('aria-expanded') === 'true');
check('AC-14 market options', $$('.market__option').length === 15, String($$('.market__option').length));
$('.market__option[data-market="DE"]').click();
check('AC-14 market selected', $('#market-country').textContent === 'DE');
check('price converted EUR', $('#price').textContent === '€690.00', $('#price').textContent);
check('market list closed', $('#market-list').hidden === true);

// T-6.1 Drawer mobile (hamburger ≤1023px)
check('T-6.1 nav toggle ada', !!$('#nav-toggle') && $('#nav-toggle').getAttribute('aria-controls') === 'nav-drawer');
check(
  'T-6.1 drawer tertutup di awal',
  $('#nav-drawer').hidden === true && $('#nav-toggle').getAttribute('aria-expanded') === 'false'
);
$('#nav-toggle').click();
check(
  'T-6.1 drawer terbuka + kunci scroll',
  $('#nav-drawer').hidden === false &&
    $('#nav-toggle').getAttribute('aria-expanded') === 'true' &&
    document.body.classList.contains('is-locked')
);
check('T-6.1 drawer berisi nav utama', $$('#nav-drawer .drawer__list a').length === 6, String($$('#nav-drawer .drawer__list a').length));
check('T-6.1 drawer berisi country selector', $$('#nav-drawer .drawer__market').length === 15, String($$('#nav-drawer .drawer__market').length));
check('T-6.1 fokus masuk ke drawer', document.activeElement === $('#drawer-close'));
$('#drawer-close').click();
check(
  'T-6.1 tombol tutup mengembalikan fokus',
  $('#nav-drawer').hidden === true &&
    $('#nav-toggle').getAttribute('aria-expanded') === 'false' &&
    document.activeElement === $('#nav-toggle') &&
    !document.body.classList.contains('is-locked')
);
$('#nav-toggle').click();
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('T-6.1 Esc menutup drawer', $('#nav-drawer').hidden === true && $('#nav-toggle').getAttribute('aria-expanded') === 'false');
$('#nav-toggle').click();
$('#nav-drawer .drawer__market[data-market="GB"]').click();
check('T-6.1 country di drawer bekerja', $('#market-country').textContent === 'GB', $('#market-country').textContent);
$('#drawer-close').click();

// AC-08 active CTA (Black in stock) → cart grows + feedback inline
$('#add-to-cart').click();
check(
  'AC-08 enabled CTA adds item',
  $('#cart-count').textContent === '1' && /Added to cart/.test($('#cart-feedback').textContent),
  `count=${$('#cart-count').textContent} feedback="${$('#cart-feedback').textContent}"`
);

// Cart panel: buka, lihat isi, checkout → POST /api/orders
{
  check('cart panel ada di header', !!$('#cart-panel') && !!$('#cart-overlay') && !!$('#cart-button'));
  $('#cart-button').click();
  check(
    'cart panel terbuka + kunci scroll',
    $('#cart-panel').hidden === false &&
      $('#cart-button').getAttribute('aria-expanded') === 'true' &&
      document.body.classList.contains('is-locked')
  );
  check('cart panel menampilkan item', $$('#cart-items-list .cart-item').length === 1, String($$('#cart-items-list .cart-item').length));
  const subtotalAtOpen = $('#cart-panel-subtotal')?.textContent;
  check(
    'cart panel subtotal mengikuti market',
    /£592\.50|US\$750\.00/.test(subtotalAtOpen ?? ''),
    subtotalAtOpen
  );

  // Qty +/- di panel (lokal, tanpa server di halaman ini)
  $('#cart-items-list [data-action="inc"]').click();
  check(
    'cart panel + menambah jumlah',
    $('#cart-items-list .cart-item__count')?.textContent === '2' &&
      $('#cart-panel-subtotal')?.textContent !== subtotalAtOpen,
    `qty=${$('#cart-items-list .cart-item__count')?.textContent} subtotal=${$('#cart-panel-subtotal')?.textContent}`
  );
  $('#cart-items-list [data-action="dec"]').click();
  check(
    'cart panel − mengurangi jumlah',
    $('#cart-items-list .cart-item__count')?.textContent === '1' &&
      $('#cart-panel-subtotal')?.textContent === subtotalAtOpen,
    `qty=${$('#cart-items-list .cart-item__count')?.textContent} subtotal=${$('#cart-panel-subtotal')?.textContent}`
  );

  // Validasi form checkout (client-side)
  $('#checkout-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  check(
    'checkout tanpa nama → error + aria-invalid',
    /Nama minimal/.test($('#checkout-feedback').textContent) && $('#checkout-name').getAttribute('aria-invalid') === 'true',
    $('#checkout-feedback').textContent
  );
  $('#checkout-name').value = 'Budi';
  $('#checkout-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  check(
    'checkout email invalid → ditolak',
    /Email tidak valid/.test($('#checkout-feedback').textContent) && $('#checkout-email').getAttribute('aria-invalid') === 'true',
    $('#checkout-feedback').textContent
  );

  // Checkout sukses (stub backend Express)
  const orderCalls = [];
  setGlobal('fetch', async (input, init = {}) => {
    orderCalls.push({ url: String(input), method: (init.method || 'GET').toUpperCase(), body: init.body });
    if (String(input).includes('/api/orders')) {
      return jsonResponse(
        {
          data: {
            id: 7,
            orderNumber: 'MD-261008-T3ST01',
            cartToken: '00000000-0000-4000-8000-000000000000',
            status: 'pending',
            currency: 'USD',
            customerName: 'Budi',
            email: 'budi@example.com',
            note: null,
            itemsCount: 1,
            subtotal: 750,
            total: 750,
            items: [],
            createdAt: '2026-10-08T03:00:00.000Z',
            updatedAt: '2026-10-08T03:00:00.000Z',
          },
        },
        201
      );
    }
    return jsonResponse({ title: 'Not Found', status: 404 }, 404);
  });

  $('#checkout-email').value = 'budi@example.com';
  $('#checkout-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await waitFor(() => /MD-261008-T3ST01/.test($('#checkout-feedback')?.textContent ?? ''), 2000);
  check(
    'checkout sukses → nomor pesanan ditampilkan',
    /MD-261008-T3ST01/.test($('#checkout-feedback').textContent),
    $('#checkout-feedback').textContent
  );
  check(
    'checkout memanggil POST /api/orders',
    orderCalls.some((c) => c.method === 'POST' && c.url.includes('/api/orders')),
    JSON.stringify(orderCalls.map((c) => `${c.method} ${c.url}`))
  );
  check(
    'cart kosong setelah checkout',
    $('#cart-count').textContent === '0' && !!$('#cart-empty'),
    `count=${$('#cart-count').textContent}`
  );

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check(
    'Esc menutup cart panel',
    $('#cart-panel').hidden === true && $('#cart-button').getAttribute('aria-expanded') === 'false'
  );

  setGlobal('fetch', undefined);
}

// AC-16 keyboard: all interactive controls reachable via Tab (structural check)
const focusables = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
check('AC-16 focusables present', focusables.length > 30, String(focusables.length));

// AC-17 ARIA
check('AC-17 radiogroup', !!$('[role="radiogroup"]'));
check('AC-17 live regions', $$('[aria-live]').length >= 3, String($$('[aria-live]').length));
check('AC-17 nav labels', !!$('nav[aria-label="Primary"]') && !!$('nav[aria-label="Breadcrumb"]'));
check('AC-17 icon buttons labeled', $$('.icon-btn[aria-label]').length >= 3, String($$('.icon-btn[aria-label]').length));
check('AC-17 images alt', $$('img:not([alt])').length === 0, `missing alt: ${$$('img:not([alt])').length}`);
check('AC-17 h1 single', $$('h1').length === 1, String($$('h1').length));

// AC-19 footer legal
check('AC-19 legal links', $$('.footer__legal a').length === 7, String($$('.footer__legal a').length));

// headings hierarchy sanity
const headings = $$('h1,h2,h3').map((h) => h.tagName);
check('heading order sane', headings[0] === 'H1' && !headings.includes('H4'), headings.join(','));

// newsletter validation
$('#newsletter-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
check('newsletter invalid', $('#newsletter-message').dataset.tone === 'error' && $('#newsletter-email').getAttribute('aria-invalid') === 'true');
$('#newsletter-email').value = 'test@example.com';
$('#newsletter-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
check('newsletter valid', $('#newsletter-message').dataset.tone === 'success');

// Sumber data halaman 1 = hardcode + tautan ke halaman 2
check('halaman 1 ditandai hardcode', $('.source')?.dataset.status === 'hardcode', $('.source')?.dataset.status);
check('halaman 1 tertaut ke halaman API', $('.source a[href="./product-api.html"]') !== null);

check('no JS errors (halaman 1)', errors.length === 0, errors.join(' | '));

// ===========================================================================
// HALAMAN 2 — product-api.html (konten dari response API)
// ===========================================================================

// --- Skenario A: API menjawab 404 (problem+json) → halaman error utuh
const page2NotFound = createPage('product-api.html', {
  url: 'http://localhost/product-api.html?id=tidak-ada',
  fetchImpl: stubFetch(),
});
await importBundle(page2NotFound);
await waitFor(() => page2NotFound.document.querySelector('.error-view, .source'));

{
  const doc = page2NotFound.document;
  check('API 404 → halaman error tampil', !!doc.querySelector('.error-view'));
  check(
    'API 404 → tanpa konten setengah jalan',
    !doc.querySelector('.purchase') && !doc.querySelector('#add-to-cart')
  );
  check(
    'API 404 → detail problem+json ditampilkan',
    /tidak ada di database/.test(doc.querySelector('.error-view__detail')?.textContent ?? ''),
    doc.querySelector('.error-view__detail')?.textContent
  );
  check(
    'API 404 → kode error tampil',
    /PRODUCT_NOT_FOUND/.test(doc.querySelector('.error-view__meta')?.textContent ?? '')
  );
  check(
    'API 404 → aksi coba lagi membawa id yang sama',
    (doc.querySelector('.error-view__actions a')?.getAttribute('href') ?? '').includes('id=tidak-ada'),
    doc.querySelector('.error-view__actions a')?.getAttribute('href')
  );
  check('API 404 → chrome halaman tetap ada', !!doc.querySelector('.site-header') && !!doc.querySelector('.site-footer'));
  check('API 404 → tanpa error runtime', page2NotFound.windowErrors.length === 0, page2NotFound.windowErrors.join(' | '));
}

// --- Skenario B: API mati → fallback ke data lokal (halaman tetap utuh)
const consoleErrors = [];
const originalConsoleError = console.error;
console.error = (...args) => consoleErrors.push(args.map(String).join(' '));

const page2Fallback = createPage('product-api.html', {
  url: 'http://localhost/product-api.html',
  fetchImpl: undefined,
});
await importBundle(page2Fallback);
await waitFor(() => page2Fallback.document.querySelector('.source'));

console.error = originalConsoleError;

{
  const doc = page2Fallback.document;
  check('API mati → strip fallback tampil', doc.querySelector('.source')?.dataset.status === 'fallback', doc.querySelector('.source')?.dataset.status);
  check(
    'API mati → konten dari mock lokal',
    /The MW75 Active Noise-Cancelling Wireless Headphones deliver/.test(
      doc.querySelector('.description__body')?.textContent ?? ''
    ),
    (doc.querySelector('.description__body')?.textContent ?? '').slice(0, 50)
  );
  check('API mati → halaman tetap utuh', !!doc.querySelector('.purchase') && doc.querySelectorAll('.variant__option').length === 2);
  check('API mati → console.error dipanggil', consoleErrors.some((line) => line.includes('product-api')), consoleErrors.join(' | ').slice(0, 120));
  check('API mati → tanpa error runtime', page2Fallback.windowErrors.length === 0, page2Fallback.windowErrors.join(' | '));
}

// --- Skenario C: API hidup → seluruh section terisi dari response API
const page2Live = createPage('product-api.html', {
  url: 'http://localhost/product-api.html',
  fetchImpl: stubFetch(),
});
await importBundle(page2Live);
await waitFor(() => page2Live.document.querySelector('.source'));

{
  const doc = page2Live.document;
  const q = (sel) => doc.querySelector(sel);
  const qa = (sel) => [...doc.querySelectorAll(sel)];

  check('API hidup → strip API tampil', q('.source')?.dataset.status === 'api', q('.source')?.dataset.status);
  check(
    'API hidup → endpoint ditampilkan',
    /GET \/api\/products\/mw75-tumi/.test(q('.source__endpoint')?.textContent ?? ''),
    q('.source__endpoint')?.textContent
  );
  check(
    'API hidup → deskripsi dari response API',
    /DESKRIPSI DARI DATABASE/.test(q('.description__body')?.textContent ?? ''),
    (q('.description__body')?.textContent ?? '').slice(0, 60)
  );
  check('API hidup → harga dari API', q('#price')?.textContent === 'US$750.00', q('#price')?.textContent);
  check('API hidup → nama produk', q('.purchase__title')?.textContent === 'MW75 TUMI');
  check('API hidup → varian dari API', qa('.variant__option').length === 2, String(qa('.variant__option').length));
  check(
    'API hidup → swatch silver dari DB (#c0c0c0)',
    (q('.variant__option[data-variant="silver"] .variant__swatch')?.getAttribute('style') ?? '').includes('#c0c0c0'),
    q('.variant__option[data-variant="silver"] .variant__swatch')?.getAttribute('style')
  );
  check(
    'API hidup → gallery mengikuti foto API',
    (q('#gallery-image')?.getAttribute('src') ?? '').includes('black-engraving'),
    q('#gallery-image')?.getAttribute('src')
  );
  check('API hidup → counter gallery', q('#gallery-counter')?.textContent.trim() === '1 / 2', q('#gallery-counter')?.textContent.trim());
  check(
    'API hidup → response API bisa dilihat (details)',
    /"mw75-tumi"/.test(q('.source__details pre')?.textContent ?? '')
  );

  // Varian habis (quantity 0 dari DB) → CTA nonaktif tanpa request baru
  qa('.variant__option[data-variant="silver"]')[0]?.click();
  check('API hidup → stok 0 dari DB mematikan CTA', q('#add-to-cart')?.disabled === true, String(q('#add-to-cart')?.disabled));
  check(
    'API hidup → helper stok habis',
    /out of stock/.test(q('#cta-helper')?.textContent ?? ''),
    q('#cta-helper')?.textContent
  );

  // Kembali ke Black (stok 12 dari DB) → CTA aktif → cart tersimpan
  qa('.variant__option[data-variant="black"]')[0]?.click();
  check('API hidup → stok > 0 mengaktifkan CTA', q('#add-to-cart')?.disabled === false, String(q('#add-to-cart')?.disabled));
  q('#add-to-cart').click();
  await waitFor(() => q('#cart-count')?.textContent === '1', 1500);
  check('API hidup → ADD TO CART terhitung', q('#cart-count')?.textContent === '1', q('#cart-count')?.textContent);
  check(
    'API hidup → feedback inline muncul',
    /Added to cart/.test(q('#cart-feedback')?.textContent ?? ''),
    q('#cart-feedback')?.textContent
  );

  check('API hidup → tanpa error runtime', page2Live.windowErrors.length === 0, page2Live.windowErrors.join(' | '));
}

// ===========================================================================
// HALAMAN 3 — orders.html (daftar pesanan + CRUD via API)
// ===========================================================================

const ORDER_ITEM = (overrides = {}) => ({
  id: 11,
  productId: 'mw75-tumi',
  name: 'MW75 TUMI',
  color: 'Black',
  quantity: 2,
  unitPrice: 750,
  lineTotal: 1500,
  ...overrides,
});

const ORDER_LIST = {
  data: [
    {
      id: 1,
      orderNumber: 'MD-261001-A11C',
      cartToken: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      status: 'delivered',
      currency: 'USD',
      customerName: 'Andi',
      email: 'andi@example.com',
      note: 'Kirim ke kantor',
      itemsCount: 2,
      subtotal: 1500,
      total: 1500,
      items: [ORDER_ITEM()],
      createdAt: '2026-10-01T09:15:00.000Z',
      updatedAt: '2026-10-03T10:00:00.000Z',
    },
    {
      id: 2,
      orderNumber: 'MD-261005-B22D',
      cartToken: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      status: 'pending',
      currency: 'USD',
      customerName: 'Sari',
      email: 'sari@example.com',
      note: null,
      itemsCount: 1,
      subtotal: 450,
      total: 450,
      items: [ORDER_ITEM({ id: 12, quantity: 1, unitPrice: 450, lineTotal: 450 })],
      createdAt: '2026-10-05T14:30:00.000Z',
      updatedAt: '2026-10-05T14:30:00.000Z',
    },
  ],
  meta: { total: 2, limit: 50, offset: 0 },
};

/** Stub backend /api/orders (GET list, PATCH status, DELETE 204). */
function stubOrdersFetch({ list = ORDER_LIST } = {}) {
  const calls = [];
  const impl = async (input, init = {}) => {
    const url = String(input);
    const method = (init.method || 'GET').toUpperCase();
    calls.push(`${method} ${url}${init.body ? ` body=${init.body}` : ''}`);

    if (url.includes('/api/orders')) {
      if (method === 'GET') return jsonResponse(list);
      if (method === 'PATCH') {
        const id = Number(url.match(/(\d+)$/)?.[1]);
        const order = list.data.find((o) => o.id === id);
        const body = JSON.parse(init.body || '{}');
        return jsonResponse({
          data: { ...order, ...body, updatedAt: '2026-10-08T04:00:00.000Z' },
        });
      }
      if (method === 'DELETE') return { ok: true, status: 204, text: async () => '' };
    }
    return jsonResponse({ title: 'Not Found', status: 404 }, 404);
  };
  return { impl, calls };
}

{
  readPage('orders.html');

  // Loading: fetch tertunda → skeleton tampil
  let releaseList;
  const pending = new Promise((resolve) => {
    releaseList = resolve;
  });
  const pageOrders = createPage('orders.html', {
    url: 'http://localhost/orders.html',
    fetchImpl: () => pending.then(() => jsonResponse(ORDER_LIST)),
  });
  await importBundle(pageOrders);
  const odoc = pageOrders.document;

  check('O-PAGE loading → skeleton daftar pesanan', !!odoc.querySelector('.orders__loading'));
  check('O-PAGE h1 Your Orders', odoc.querySelector('h1')?.textContent === 'Your Orders', odoc.querySelector('h1')?.textContent);
  check(
    'O-PAGE strip sumber data GET /api/orders',
    odoc.querySelector('#orders-source')?.dataset.status === 'api' &&
      /GET \/api\/orders/.test(odoc.querySelector('#orders-source')?.textContent ?? ''),
    odoc.querySelector('#orders-source')?.dataset.status
  );

  releaseList();
  await waitFor(() => odoc.querySelectorAll('.order-card').length === 2);

  check('O-PAGE 2 kartu pesanan', odoc.querySelectorAll('.order-card').length === 2, String(odoc.querySelectorAll('.order-card').length));
  check('O-PAGE nomor pesanan tampil', /MD-261001-A11C/.test(odoc.body.textContent));
  check(
    'O-PAGE badge status delivered',
    odoc.querySelector('.order-card .order-card__status')?.textContent === 'delivered',
    odoc.querySelector('.order-card .order-card__status')?.textContent
  );
  check('O-PAGE item snapshot (nama · warna)', /MW75 TUMI · Black/.test(odoc.body.textContent));
  check('O-PAGE qty × 2', /× 2/.test(odoc.body.textContent));
  check('O-PAGE total format US$', /US\$1,500\.00/.test(odoc.body.textContent), odoc.querySelector('.order-card__total')?.textContent.trim());
  check('O-PAGE customer', /Andi · andi@example\.com/.test(odoc.body.textContent));
  check('O-PAGE note pesanan', /Kirim ke kantor/.test(odoc.body.textContent));
  check(
    'O-PAGE response API bisa dilihat',
    /"orderNumber": "MD-261001-A11C"/.test(odoc.querySelector('.order-card__details pre')?.textContent ?? '')
  );
  check(
    'O-PAGE select 5 status',
    odoc.querySelectorAll('.order-card:first-child .order-card__select option').length === 5,
    String(odoc.querySelectorAll('.order-card:first-child .order-card__select option').length)
  );
  check(
    'O-PAGE select menunjuk status saat ini',
    odoc.querySelector('.order-card__select')?.value === 'delivered',
    odoc.querySelector('.order-card__select')?.value
  );

  // Update status → PATCH /api/orders/:id
  const stubA = stubOrdersFetch();
  setGlobal('fetch', stubA.impl);
  const card1 = odoc.querySelector('.order-card[data-order-id="1"]');
  card1.querySelector('.order-card__select').value = 'shipped';
  card1.querySelector('[data-role="save-status"]').click();
  await waitFor(() =>
    /Status → shipped/.test(
      odoc.querySelector('.order-card[data-order-id="1"] [data-role="order-msg"]')?.textContent ?? ''
    )
  );
  const freshCard1 = odoc.querySelector('.order-card[data-order-id="1"]');
  check(
    'O-PAGE update status memanggil PATCH',
    stubA.calls.some((c) => /^PATCH\s+\S*\/api\/orders\/1(\s|$)/.test(c)),
    JSON.stringify(stubA.calls)
  );
  check(
    'O-PAGE pesan sukses setelah render ulang',
    /Status → shipped/.test(freshCard1?.querySelector('[data-role="order-msg"]')?.textContent ?? ''),
    freshCard1?.querySelector('[data-role="order-msg"]')?.textContent
  );
  check(
    'O-PAGE badge berubah ke shipped',
    freshCard1?.querySelector('.order-card__status')?.textContent === 'shipped',
    freshCard1?.querySelector('.order-card__status')?.textContent
  );
  check(
    'O-PAGE feedback global diperbarui',
    /MD-261001-A11C diperbarui/.test(odoc.querySelector('#orders-feedback')?.textContent ?? ''),
    odoc.querySelector('#orders-feedback')?.textContent
  );

  // Hapus 2 langkah (konfirmasi dulu, baru DELETE)
  const card2 = odoc.querySelector('.order-card[data-order-id="2"]');
  const delBtn = card2.querySelector('[data-role="delete"]');
  delBtn.click();
  check(
    'O-PAGE delete minta konfirmasi dulu',
    delBtn.textContent.trim() === 'Yakin? Hapus permanen' &&
      delBtn.classList.contains('is-danger') &&
      stubA.calls.filter((c) => c.startsWith('DELETE')).length === 0,
    delBtn.textContent.trim()
  );
  delBtn.click();
  await waitFor(() => odoc.querySelectorAll('.order-card').length === 1);
  check(
    'O-PAGE DELETE dipanggil + kartu hilang',
    stubA.calls.some((c) => /^DELETE\s+\S*\/api\/orders\/2(\s|$)/.test(c)) &&
      odoc.querySelectorAll('.order-card').length === 1,
    JSON.stringify(stubA.calls.filter((c) => c.startsWith('DELETE')))
  );
  check('O-PAGE feedback hapus', /Pesanan #2 dihapus/.test(odoc.querySelector('#orders-feedback')?.textContent ?? ''));
  check('O-PAGE tanpa error runtime', pageOrders.windowErrors.length === 0, pageOrders.windowErrors.join(' | '));

  // Empty state
  const pageEmpty = createPage('orders.html', {
    url: 'http://localhost/orders.html',
    fetchImpl: stubOrdersFetch({ list: { data: [], meta: { total: 0, limit: 50, offset: 0 } } }).impl,
  });
  await importBundle(pageEmpty);
  await waitFor(() => pageEmpty.document.querySelector('.orders__empty'));
  check(
    'O-PAGE empty state',
    /Belum ada pesanan/.test(pageEmpty.document.body.textContent) &&
      !!pageEmpty.document.querySelector('.orders__empty a[href="./index.html"]')
  );
  check('O-PAGE empty → strip tetap api', pageEmpty.document.querySelector('#orders-source')?.dataset.status === 'api');
  check('O-PAGE empty tanpa error', pageEmpty.windowErrors.length === 0, pageEmpty.windowErrors.join(' | '));

  // API mati → error state + retry bisa pulih
  const pageErr = createPage('orders.html', { url: 'http://localhost/orders.html' });
  await importBundle(pageErr);
  await waitFor(() => pageErr.document.querySelector('.orders__error'));
  check('O-PAGE error state tampil', /Gagal memuat pesanan/.test(pageErr.document.body.textContent));
  check('O-PAGE strip error', pageErr.document.querySelector('#orders-source')?.dataset.status === 'error', pageErr.document.querySelector('#orders-source')?.dataset.status);
  check(
    'O-PAGE kode error NO_FETCH tampil',
    /NO_FETCH/.test(pageErr.document.querySelector('.orders__error-meta')?.textContent ?? ''),
    pageErr.document.querySelector('.orders__error-meta')?.textContent?.replace(/\s+/g, ' ')
  );

  setGlobal('fetch', stubOrdersFetch().impl);
  pageErr.document.querySelector('[data-role="orders-retry"]').click();
  await waitFor(() => pageErr.document.querySelectorAll('.order-card').length === 2);
  check('O-PAGE retry memuat ulang daftar', pageErr.document.querySelectorAll('.order-card').length === 2);
  check('O-PAGE error page tanpa error runtime', pageErr.windowErrors.length === 0, pageErr.windowErrors.join(' | '));
}

// ===========================================================================
// Ringkasan
// ===========================================================================

check('no unhandled rejections', unhandled.length === 0, unhandled.map((e) => String(e)).join(' | '));

// --- Skenario D (opsional): API Express + MySQL benar-benar hidup
async function apiIsUp() {
  if (typeof nativeFetch !== 'function') return false;
  try {
    const res = await nativeFetch(`http://127.0.0.1:${process.env.PORT || 3000}/health`, {
      signal: AbortSignal.timeout(700),
    });
    const body = await res.json().catch(() => null);
    return res.ok && body?.status === 'ok';
  } catch {
    return false;
  }
}

if (await apiIsUp()) {
  const page2Real = createPage('product-api.html', {
    url: 'http://localhost/product-api.html',
    fetchImpl: nativeFetch,
  });
  await importBundle(page2Real);
  await waitFor(() => page2Real.document.querySelector('.source, .error-view'));

  const doc = page2Real.document;
  check('E2E API+DB → strip API tampil', doc.querySelector('.source')?.dataset.status === 'api', doc.querySelector('.source')?.dataset.status);
  check(
    'E2E API+DB → deskripsi berasal dari tabel products',
    /TUMI x Master & Dynamic MW75/.test(doc.querySelector('.description__body')?.textContent ?? ''),
    (doc.querySelector('.description__body')?.textContent ?? '').slice(0, 60)
  );
  check('E2E API+DB → harga dari kolom price', doc.querySelector('#price')?.textContent === 'US$750.00', doc.querySelector('#price')?.textContent);
  check('E2E API+DB → varian dari product_variants', doc.querySelectorAll('.variant__option').length === 2, String(doc.querySelectorAll('.variant__option').length));
  check('E2E API+DB → tanpa error runtime', page2Real.windowErrors.length === 0, page2Real.windowErrors.join(' | '));

  // --- E2E Orders: FE → BE → DB (buat, lihat, ubah status, hapus) ----------
  const apiBase = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const e2eToken = globalThis.crypto.randomUUID();

  const getBlackQty = async () => {
    const res = await nativeFetch(`${apiBase}/api/products/mw75-tumi`);
    const body = await res.json();
    return body?.data?.variants?.find((v) => v.color === 'Black')?.quantity;
  };

  const qtyBefore = await getBlackQty();

  // 1) Isi keranjang (perlu cart valid agar checkout lolos)
  const cartAdd = await nativeFetch(`${apiBase}/api/cart/items`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cartToken: e2eToken, productId: 'mw75-tumi', color: 'Black', quantity: 2 }),
  });
  check('E2E orders → isi keranjang ok', cartAdd.status >= 200 && cartAdd.status < 300, `status=${cartAdd.status}`);

  // 2) Checkout → 201 + stok dipotong + cart dikosongkan
  const orderCreate = await nativeFetch(`${apiBase}/api/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cartToken: e2eToken, customerName: 'QA E2E', email: 'qa@example.com', note: 'smoke test' }),
  });
  const created = (await orderCreate.json().catch(() => null))?.data;
  check(
    'E2E orders → POST /api/orders 201 + nomor pesanan',
    orderCreate.status === 201 && !!created?.orderNumber,
    `status=${orderCreate.status} number=${created?.orderNumber}`
  );
  const qtyAfterCreate = await getBlackQty();
  check(
    'E2E orders → stok dipotong saat checkout',
    qtyAfterCreate === qtyBefore - 2,
    `before=${qtyBefore} after=${qtyAfterCreate}`
  );
  const cartAfter = await (await nativeFetch(`${apiBase}/api/cart/${e2eToken}`)).json();
  check('E2E orders → cart dikosongkan setelah checkout', (cartAfter?.data?.items ?? []).length === 0, String(cartAfter?.data?.items?.length));

  // 3) Halaman Orders dengan fetch asli → pesanan kita tampil
  const pageOrdersLive = createPage('orders.html', {
    url: 'http://localhost/orders.html',
    fetchImpl: nativeFetch,
  });
  await importBundle(pageOrdersLive);
  await waitFor(() => pageOrdersLive.document.body.textContent.includes(created?.orderNumber ?? '___'), 4000);
  const ldoc = pageOrdersLive.document;
  check(
    'E2E orders → pesanan tampil di halaman',
    !!created?.orderNumber && ldoc.body.textContent.includes(created.orderNumber)
  );
  check('E2E orders → strip API tampil', ldoc.querySelector('#orders-source')?.dataset.status === 'api', ldoc.querySelector('#orders-source')?.dataset.status);
  check(
    'E2E orders → customer dari tabel orders',
    /QA E2E · qa@example\.com/.test(ldoc.body.textContent),
    ldoc.querySelector(`.order-card[data-order-id="${created.id}"] .order-card__customer`)?.textContent
  );

  // 4) Ubah status lewat UI → PATCH asli
  const liveCard = ldoc.querySelector(`.order-card[data-order-id="${created.id}"]`);
  liveCard.querySelector('.order-card__select').value = 'shipped';
  liveCard.querySelector('[data-role="save-status"]').click();
  await waitFor(
    () =>
      ldoc.querySelector(`.order-card[data-order-id="${created.id}"] .order-card__status`)?.textContent ===
      'shipped',
    3000
  );
  check(
    'E2E orders → PATCH status lewat UI',
    ldoc.querySelector(`.order-card[data-order-id="${created.id}"] .order-card__status`)?.textContent === 'shipped',
    ldoc.querySelector(`.order-card[data-order-id="${created.id}"] .order-card__status`)?.textContent
  );

  // 5) Hapus (2 langkah) lewat UI → DELETE asli
  const liveDel = ldoc.querySelector(`.order-card[data-order-id="${created.id}"] [data-role="delete"]`);
  liveDel.click();
  liveDel.click();
  await waitFor(() => !ldoc.querySelector(`.order-card[data-order-id="${created.id}"]`), 3000);
  check(
    'E2E orders → kartu hilang setelah hapus',
    !ldoc.querySelector(`.order-card[data-order-id="${created.id}"]`)
  );

  const goneRes = await nativeFetch(`${apiBase}/api/orders/${created.id}`);
  check('E2E orders → GET detail 404 setelah dihapus', goneRes.status === 404, `status=${goneRes.status}`);
  const qtyRestored = await getBlackQty();
  check(
    'E2E orders → stok pulih setelah hapus',
    qtyRestored === qtyBefore,
    `expected=${qtyBefore} actual=${qtyRestored}`
  );
  check('E2E orders → tanpa error runtime', pageOrdersLive.windowErrors.length === 0, pageOrdersLive.windowErrors.join(' | '));
} else {
  results.push('SKIP — API hidup tidak terdeteksi (jalankan `npm start` di api-produk untuk skenario E2E)');
}

console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
