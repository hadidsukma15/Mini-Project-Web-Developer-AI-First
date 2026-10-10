import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/states.css';

import { product } from './data/product.js';
import { createStore } from './state/store.js';
import { getVariantFromUrl, syncVariantUrl } from './state/variant.js';
import { restoreCart } from './state/cart.js';
import { escapeHtml } from './utils/escape.js';

import { renderHeader, initHeader, syncHeader } from './components/header.js';
import { renderSearchPanel, initSearch, syncSearch } from './components/search-panel.js';
import { renderGallery, initGallery, syncGallery } from './components/gallery.js';
import { renderPurchase, initPurchase, syncPurchase } from './components/purchase-panel.js';
import { renderUsp } from './components/usp-strip.js';
import { renderTrust } from './components/trust-cards.js';
import { renderStory } from './components/story-tumi.js';
import { renderDescription } from './components/description.js';
import { renderSpecs } from './components/tech-specs.js';
import { renderBox } from './components/in-the-box.js';
import { renderSupport } from './components/support.js';
import { renderNewsletter, initNewsletter } from './components/newsletter.js';
import { renderFooter } from './components/footer.js';

const SOURCE_LABELS = {
  hardcode: 'Halaman detail 1 — konten hardcode (tanpa panggilan API)',
  api: 'Halaman detail 2 — konten diisi dari response API',
  fallback: 'Halaman detail 2 — API tidak terjangkau, memakai data fallback lokal',
};

/** Store bersama kedua halaman; `productStatus` melacak siklus load halaman 2. */
export function createProductStore(patch = {}) {
  return createStore({
    variantId: getVariantFromUrl(),
    galleryIndex: 0,
    cart: { count: 0, items: [] },
    ui: { searchOpen: false, market: 'US' },
    feedback: { key: 0, message: '', tone: '' },
    productStatus: 'ready',
    ...patch,
  });
}

function renderBreadcrumb() {
  return `
    <nav class="breadcrumb container" aria-label="Breadcrumb">
      <ol>
        ${product.breadcrumb
          .map((crumb) =>
            crumb.href
              ? `<li><a href="${crumb.href}">${crumb.label}</a></li>`
              : `<li aria-current="page">${crumb.label}</li>`,
          )
          .join('')}
      </ol>
    </nav>
  `;
}

/** Strip sumber data: menandai halaman hardcode vs halaman dari API. */
function renderSource(source) {
  if (!source) return '';

  const other =
    source.kind === 'hardcode'
      ? { href: './product-api.html', label: 'Buka halaman dari API' }
      : { href: './index.html', label: 'Buka halaman hardcode' };

  let extra = '';
  if (source.kind === 'api') {
    const json = JSON.stringify(source.payload ?? {}, null, 2);
    extra = `
      <details class="source__details">
        <summary>Lihat response API</summary>
        <pre><code>${escapeHtml(json)}</code></pre>
      </details>`;
  } else if (source.kind === 'fallback') {
    extra = `<p class="source__note">${escapeHtml(
      source.detail || 'Permintaan gagal — data lokal dipakai agar halaman tetap utuh.',
    )}</p>`;
  }

  return `
    <aside class="source source--${source.kind}" data-status="${source.kind}" aria-label="Sumber data halaman">
      <span class="source__dot" aria-hidden="true"></span>
      <p class="source__text">${SOURCE_LABELS[source.kind] ?? ''}</p>
      ${
        source.endpoint
          ? `<code class="source__endpoint">GET ${escapeHtml(source.endpoint)}</code>`
          : ''
      }
      <a class="source__link" href="${other.href}">${other.label} →</a>
      ${extra}
    </aside>
  `;
}

/** Skeleton tanpa layout shift selama menunggu response API. */
export function renderLoading(productId) {
  const endpoint = `/api/products/${productId}`;
  document.getElementById('app').innerHTML = `
    <div class="loading" role="status" aria-live="polite" aria-busy="true">
      <div class="announcement"><p>Memuat detail produk dari API…</p></div>
      <header class="site-header">
        <div class="site-header__inner container">
          <span class="brand"><img src="/img/logo-md.svg" alt="Master &amp; Dynamic" width="190" height="28" /></span>
        </div>
      </header>
      <main class="container loading__main">
        <div class="skeleton skeleton--crumb" aria-hidden="true"></div>
        <section class="hero" aria-hidden="true">
          <div class="skeleton skeleton--stage"></div>
          <div class="skeleton__panel">
            <div class="skeleton skeleton--line skeleton--sm"></div>
            <div class="skeleton skeleton--title"></div>
            <div class="skeleton skeleton--line"></div>
            <div class="skeleton skeleton--block"></div>
            <div class="skeleton skeleton--cta"></div>
          </div>
        </section>
        <p class="loading__endpoint"><code>GET ${escapeHtml(endpoint)}</code></p>
      </main>
    </div>
  `;
}

/** Respons 4xx (problem+json) → halaman error utuh, tanpa konten setengah jalan. */
export function renderErrorPage(store, error, productId) {
  const state = store.getState();
  const detail = escapeHtml(error.detail || 'Permintaan ke API gagal.');
  const problems = Array.isArray(error.errors) ? error.errors : [];

  document.getElementById('app').innerHTML = `
    ${renderHeader(state)}
    ${renderSearchPanel(state)}
    <main id="main" class="container error-view">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><a href="./index.html">All Products</a></li>
          <li aria-current="page">API error</li>
        </ol>
      </nav>
      <p class="eyebrow">GET /api/products/${escapeHtml(productId)}</p>
      <h1 class="error-view__title">${escapeHtml(error.title || 'Request Failed')}</h1>
      <p class="error-view__detail">${detail}</p>
      <p class="error-view__meta">
        <code>HTTP ${escapeHtml(error.status ?? '')}</code>
        <code>${escapeHtml(error.code || 'ERROR')}</code>
      </p>
      ${
        problems.length
          ? `<ul class="error-view__list">${problems
              .map(
                (problem) =>
                  `<li><code>${escapeHtml(problem.field ?? '')}</code> ${escapeHtml(problem.message ?? '')}</li>`,
              )
              .join('')}</ul>`
          : ''
      }
      <div class="error-view__actions">
        <a class="btn btn--primary" href="./product-api.html?id=${encodeURIComponent(productId)}">Coba lagi</a>
        <a class="btn btn--outline" href="./index.html">Buka halaman hardcode</a>
      </div>
    </main>
    ${renderFooter()}
  `;

  initHeader(store);
  initSearch(store);
  document.title = `${error.title || 'API Error'} | MW75 TUMI`;
}

/**
 * Render halaman detail lengkap + wiring event.
 * Dipakai halaman 1 (hardcode) dan halaman 2 (API) agar struktur identik.
 */
export function mountApp(store, { source = null } = {}) {
  const state = store.getState();
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderHeader(state)}
    ${renderSearchPanel(state)}

    <main id="main">
      ${renderBreadcrumb()}
      ${renderSource(source)}

      <section class="hero container" aria-label="${product.name}">
        ${renderGallery(state)}
        ${renderPurchase(state)}
      </section>

      ${renderUsp()}
      ${renderTrust()}
      ${renderStory()}
      ${renderDescription()}
      ${renderSpecs()}
      ${renderBox()}
      ${renderSupport()}
      ${renderNewsletter()}
    </main>

    ${renderFooter()}
  `;

  initHeader(store);
  initSearch(store);
  initGallery(store);
  initPurchase(store);
  initNewsletter();

  let prevVariantId = state.variantId;

  store.subscribe((next) => {
    if (next.variantId !== prevVariantId) {
      prevVariantId = next.variantId;
      syncVariantUrl(next.variantId);
    }

    syncHeader(next);
    syncGallery(next);
    syncPurchase(next);
    syncSearch(next);
  });

  // Cart: hydrate dari localStorage → konfirmasi ke database (bila API hidup)
  restoreCart(store);
}
