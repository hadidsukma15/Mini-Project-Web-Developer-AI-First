import { getMarket } from '../data/markets.js';
import { formatPrice } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { apiGet, apiPatch, apiDelete } from '../utils/api.js';

export const ORDERS_ENDPOINT = '/api/orders';
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const SOURCE_LABELS = {
  api: 'Halaman Orders — daftar pesanan diambil dari response API',
  error: 'Halaman Orders — API tidak terjangkau, pesanan tidak dapat dimuat',
};

function formatMoney(amount, state) {
  return formatPrice(amount, getMarket(state.ui.market));
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Strip sumber data (konsisten dengan halaman detail). */
function renderStrip(status) {
  const kind = status === 'error' ? 'error' : 'api';
  const label =
    kind === 'error'
      ? SOURCE_LABELS.error
      : `${SOURCE_LABELS.api} — ${ORDERS_ENDPOINT}`;
  return `
    <span class="source__dot" aria-hidden="true"></span>
    <p class="source__text">${escapeHtml(label)}</p>
    <code class="source__endpoint">GET ${escapeHtml(ORDERS_ENDPOINT)}</code>
  `;
}

function applyStrip(el, orders) {
  if (!el) return;
  const kind = orders.status === 'error' ? 'error' : 'api';
  el.className = `source source--${kind}`;
  el.dataset.status = kind;
  el.innerHTML = renderStrip(orders.status);
}

function renderSkeleton() {
  return `
    <div class="orders__loading" role="status" aria-live="polite" aria-busy="true">
      <p class="visually-hidden">Memuat pesanan dari API…</p>
      <div class="skeleton skeleton--block" aria-hidden="true"></div>
      <div class="skeleton skeleton--block" aria-hidden="true"></div>
      <div class="skeleton skeleton--block" aria-hidden="true"></div>
    </div>`;
}

function renderError(orders) {
  const error = orders.error || {};
  return `
    <div class="orders__error" data-role="orders-error">
      <p class="orders__error-title">${escapeHtml(error.title || 'Gagal memuat pesanan')}</p>
      <p class="orders__error-detail">${escapeHtml(error.detail || 'API tidak merespons.')}</p>
      <p class="orders__error-meta">
        <code>HTTP ${escapeHtml(error.status ?? '')}</code>
        <code>${escapeHtml(error.code || 'ERROR')}</code>
      </p>
      <button type="button" class="btn btn--primary" data-role="orders-retry">Coba lagi</button>
    </div>`;
}

function renderEmpty() {
  return `
    <div class="orders__empty">
      <p class="orders__empty-title">Belum ada pesanan.</p>
      <p class="orders__empty-text">Tambahkan produk ke keranjang, lalu checkout untuk membuat pesanan pertama Anda.</p>
      <a class="btn btn--primary" href="./index.html">Mulai belanja</a>
    </div>`;
}

function statusOptions(current) {
  return ORDER_STATUSES.map(
    (status) =>
      `<option value="${status}" ${status === current ? 'selected' : ''}>${status}</option>`
  ).join('');
}

function renderCard(order, state) {
  const customer = [order.customerName, order.email].filter(Boolean).join(' · ');
  const json = escapeHtml(JSON.stringify(order, null, 2));

  return `
    <article class="order-card" data-order-id="${order.id}" data-status="${escapeHtml(order.status)}">
      <header class="order-card__head">
        <div>
          <p class="order-card__number">${escapeHtml(order.orderNumber)}</p>
          <p class="order-card__date">${escapeHtml(formatDate(order.createdAt))} · ${order.itemsCount} item</p>
        </div>
        <span class="order-card__status" data-status="${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
      </header>

      <ul class="order-card__items">
        ${order.items
          .map(
            (item) => `
          <li class="order-card__item">
            <span class="order-card__item-name">${escapeHtml(item.name)} · ${escapeHtml(item.color)}</span>
            <span class="order-card__item-qty">× ${item.quantity}</span>
            <strong class="order-card__item-total">${formatMoney(item.lineTotal, state)}</strong>
          </li>`
          )
          .join('')}
      </ul>

      <footer class="order-card__foot">
        <p class="order-card__total">Total <strong>${formatMoney(order.total, state)}</strong></p>
        ${customer ? `<p class="order-card__customer">${escapeHtml(customer)}</p>` : ''}
        ${order.note ? `<p class="order-card__note">“${escapeHtml(order.note)}”</p>` : ''}
        <details class="order-card__details">
          <summary>Lihat response API</summary>
          <pre><code>${json}</code></pre>
        </details>
      </footer>

      <div class="order-card__actions">
        <label class="order-card__field" for="status-${order.id}">
          <span>Status</span>
          <select class="order-card__select" id="status-${order.id}" data-role="status-select">
            ${statusOptions(order.status)}
          </select>
        </label>
        <button type="button" class="btn btn--outline" data-role="save-status">Update status</button>
        <button
          type="button"
          class="btn btn--outline order-card__delete"
          data-role="delete"
          data-confirm="0"
        >
          Delete order
        </button>
        <a class="order-card__reorder" href="./index.html">Pesan lagi</a>
      </div>

      <p class="order-card__msg" data-role="order-msg" data-tone="" aria-live="polite"></p>
    </article>`;
}

function renderList(state) {
  const { orders } = state;
  if (orders.status === 'loading') return renderSkeleton();
  if (orders.status === 'error') return renderError(orders);
  if (!orders.items.length) return renderEmpty();
  return `<div class="orders__grid">${orders.items.map((order) => renderCard(order, state)).join('')}</div>`;
}

/** Render isi utama halaman Orders (sekali saat boot). */
export function renderOrdersMain(state) {
  return `
    <main id="main">
      <nav class="breadcrumb container" aria-label="Breadcrumb">
        <ol>
          <li><a href="./index.html">All Products</a></li>
          <li><a href="./product-api.html">MW75 TUMI</a></li>
          <li aria-current="page">My Orders</li>
        </ol>
      </nav>

      <aside class="source source--api" id="orders-source" data-status="api" aria-label="Sumber data halaman">
        ${renderStrip(state.orders.status)}
      </aside>

      <section class="orders container">
        <header class="orders__head">
          <p class="eyebrow">Account</p>
          <h1 class="orders__title">Your Orders</h1>
          <p class="orders__intro">
            Semua pesanan yang dibuat dari keranjang — disimpan di database
            (<code>orders</code> + <code>order_items</code>) dan diambil lewat
            <code>GET /api/orders</code>.
          </p>
          <p class="orders__feedback" id="orders-feedback" data-tone="" aria-live="polite"></p>
        </header>

        <div id="orders-list">${renderList(state)}</div>
      </section>
    </main>
  `;
}

function setFeedback(message, tone = '') {
  const el = document.getElementById('orders-feedback');
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

function setCardMsg(card, message, tone = '') {
  const el = card?.querySelector('[data-role="order-msg"]');
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

/** Tarik daftar pesanan dari API → state `orders` (loading → ready | error). */
export function loadOrders(store) {
  store.setState({
    orders: { ...store.getState().orders, status: 'loading', error: null },
  });

  if (typeof fetch !== 'function') {
    store.setState({
      orders: {
        status: 'error',
        items: [],
        error: { code: 'NO_FETCH', detail: 'fetch tidak tersedia' },
      },
    });
    return Promise.resolve(null);
  }

  return apiGet(`${ORDERS_ENDPOINT}?limit=50`).then((res) => {
    if (res.ok) {
      store.setState({ orders: { status: 'ready', items: res.data || [], error: null } });
      return res.data;
    }
    console.error('[orders] gagal memuat pesanan:', res.error);
    store.setState({ orders: { status: 'error', items: [], error: res.error } });
    return null;
  });
}

function replaceOrder(store, order) {
  const { orders } = store.getState();
  store.setState({
    orders: {
      ...orders,
      items: orders.items.map((item) => (item.id === order.id ? order : item)),
    },
  });
}

function dropOrder(store, orderId) {
  const { orders } = store.getState();
  store.setState({
    orders: { ...orders, items: orders.items.filter((item) => item.id !== orderId) },
  });
}

/** Wire event list (delegasi sekali): update status, hapus (2 langkah), retry. */
export function initOrders(store) {
  const list = document.getElementById('orders-list');
  if (!list) return;

  list.addEventListener('click', (event) => {
    const retry = event.target.closest('[data-role="orders-retry"]');
    if (retry) {
      loadOrders(store);
      return;
    }

    const saveBtn = event.target.closest('[data-role="save-status"]');
    if (saveBtn) {
      const card = saveBtn.closest('[data-order-id]');
      const orderId = Number(card?.dataset.orderId);
      const select = card?.querySelector('[data-role="status-select"]');
      const status = select?.value;
      if (!orderId || !status) return;

      saveBtn.disabled = true;
      setCardMsg(card, 'Menyimpan…', 'pending');

      apiPatch(`${ORDERS_ENDPOINT}/${orderId}`, { status }).then((res) => {
        saveBtn.disabled = false;
        if (res.ok) {
          replaceOrder(store, res.data);
          // Elemen kartu ikut ter-render ulang → ambil ulang dari DOM.
          const freshCard = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
          setCardMsg(freshCard, `Status → ${res.data.status}`, 'success');
          setFeedback(`Pesanan ${res.data.orderNumber} diperbarui.`, 'success');
        } else {
          setCardMsg(card, res.error?.detail || 'Gagal memperbarui status', 'error');
        }
      });
      return;
    }

    const deleteBtn = event.target.closest('[data-role="delete"]');
    if (deleteBtn) {
      const card = deleteBtn.closest('[data-order-id]');
      const orderId = Number(card?.dataset.orderId);
      if (!orderId) return;

      // Konfirmasi 2 langkah (tanpa dialog blocking)
      if (deleteBtn.dataset.confirm !== '1') {
        deleteBtn.dataset.confirm = '1';
        deleteBtn.textContent = 'Yakin? Hapus permanen';
        deleteBtn.classList.add('is-danger');
        setCardMsg(card, 'Klik sekali lagi untuk menghapus pesanan ini.', 'pending');
        return;
      }

      deleteBtn.disabled = true;
      apiDelete(`${ORDERS_ENDPOINT}/${orderId}`).then((res) => {
        if (res.ok) {
          dropOrder(store, orderId);
          setFeedback(`Pesanan #${orderId} dihapus.`, 'success');
        } else {
          deleteBtn.disabled = false;
          deleteBtn.dataset.confirm = '0';
          deleteBtn.textContent = 'Delete order';
          deleteBtn.classList.remove('is-danger');
          setCardMsg(card, res.error?.detail || 'Gagal menghapus pesanan', 'error');
        }
      });
    }
  });

  loadOrders(store);
}

let lastRendered = null;

/** Render ulang strip + daftar saat state `orders` berubah. */
export function syncOrders(state) {
  if (state.orders === lastRendered) return;
  lastRendered = state.orders;

  applyStrip(document.getElementById('orders-source'), state.orders);

  const list = document.getElementById('orders-list');
  if (list) list.innerHTML = renderList(state);
}
