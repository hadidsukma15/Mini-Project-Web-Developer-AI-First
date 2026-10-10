import { product } from '../data/product.js';
import { getMarket } from '../data/markets.js';
import { formatPrice } from '../utils/format.js';
import { updateCartItem, removeCartItem, placeOrder } from '../state/cart.js';

const icons = {
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
};

/** Total USD untuk baris cart (pakai unitPrice server bila ada — sumber satunya tetap data/API). */
function lineTotal(item, market) {
  const unit = typeof item.unitPrice === 'number' ? item.unitPrice : product.price;
  return formatPrice(unit * item.quantity, market);
}

function renderItems(state) {
  const { cart, ui } = state;
  const market = getMarket(ui.market);

  if (!cart.items.length) {
    return `
      <div class="cart-panel__empty" id="cart-empty">
        <p>Your cart is empty.</p>
        <a href="./index.html">Continue shopping →</a>
      </div>`;
  }

  return `
    <ul class="cart-panel__list" id="cart-items-list">
      ${cart.items
        .map((item) => {
          const label = `${item.productName}, ${item.variant}`;
          return `
        <li class="cart-item" data-item-id="${item.itemId ?? ''}" data-product="${item.productId}" data-variant="${item.variant}">
          <div class="cart-item__info">
            <p class="cart-item__name">${item.productName}</p>
            <p class="cart-item__meta">${item.variant}</p>
          </div>
          <div class="cart-item__qty" role="group" aria-label="Quantity of ${label}">
            <button type="button" class="cart-item__step" data-action="dec" aria-label="Decrease quantity of ${label}">−</button>
            <span class="cart-item__count" data-qty="${item.quantity}">${item.quantity}</span>
            <button type="button" class="cart-item__step" data-action="inc" aria-label="Increase quantity of ${label}">+</button>
          </div>
          <p class="cart-item__total">${lineTotal(item, market)}</p>
          <button type="button" class="cart-item__remove" data-action="remove" aria-label="Remove ${label} from cart">
            ${icons.close}
          </button>
        </li>`;
        })
        .join('')}
    </ul>`;
}

/**
 * Identitas keanggotaan baris cart: pakai `itemId` (setelah sync server),
 * fallback `productId:variant` untuk item lokal yang belum punya id —
 * tanpa ini signature item lokal selalu '' dan panel tidak ikut re-render.
 */
function signatureFor(items) {
  return items
    .map((item) => (item.itemId != null ? `id:${item.itemId}` : `${item.productId}:${item.variant}`))
    .join(',');
}

function rowSelectorFor(item) {
  return item.itemId != null
    ? `[data-item-id="${item.itemId}"]`
    : `[data-product="${item.productId}"][data-variant="${item.variant}"]`;
}

export function renderCartPanel(state) {
  const market = getMarket(state.ui.market);
  const signature = signatureFor(state.cart.items);
  const subtotal = state.cart.items.reduce((sum, item) => {
    const unit = typeof item.unitPrice === 'number' ? item.unitPrice : product.price;
    return sum + unit * item.quantity;
  }, 0);

  return `
    <div class="cart-overlay" id="cart-overlay" hidden></div>
    <aside
      class="cart-panel"
      id="cart-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
      hidden
    >
      <div class="cart-panel__head">
        <p class="cart-panel__title">Your Cart <span class="cart-panel__badge" id="cart-panel-badge">${state.cart.count}</span></p>
        <button type="button" class="icon-btn" id="cart-close" aria-label="Close cart">
          ${icons.close}
        </button>
      </div>

      <div class="cart-panel__body">
        <div id="cart-panel-items" data-signature="${signature}">${renderItems(state)}</div>

        <div class="cart-panel__subtotal">
          <span>Subtotal (USD)</span>
          <strong id="cart-panel-subtotal">${formatPrice(subtotal, market)}</strong>
        </div>

        <form class="checkout" id="checkout-form" novalidate>
          <p class="checkout__title">Checkout</p>
          <p class="checkout__hint">Pesanan tersimpan di database — lihat statusnya di halaman Orders.</p>

          <label class="checkout__field" for="checkout-name">
            <span>Nama</span>
            <input id="checkout-name" name="name" type="text" autocomplete="name" placeholder="Budi Santoso" required minlength="2" />
          </label>
          <label class="checkout__field" for="checkout-email">
            <span>Email</span>
            <input id="checkout-email" name="email" type="email" autocomplete="email" placeholder="budi@example.com" required />
          </label>
          <label class="checkout__field" for="checkout-note">
            <span>Catatan (opsional)</span>
            <input id="checkout-note" name="note" type="text" placeholder="Instruksi pengiriman" maxlength="500" />
          </label>

          <p class="checkout__feedback" id="checkout-feedback" aria-live="polite"></p>

          <button class="btn btn--primary checkout__submit" id="checkout-submit" type="submit">
            Place order
          </button>
        </form>

        <a class="cart-panel__link" href="./orders.html">Lihat pesanan saya →</a>
      </div>
    </aside>
  `;
}

let lastFocused = null;

function isPanelOpen() {
  const panel = document.getElementById('cart-panel');
  return !!panel && !panel.hidden;
}

export function openCartPanel() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  const trigger = document.getElementById('cart-button');
  if (!panel || !overlay) return;

  lastFocused = document.activeElement;
  panel.hidden = false;
  overlay.hidden = false;
  trigger?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('is-locked');
  document.getElementById('cart-close')?.focus();
}

export function closeCartPanel({ restoreFocus = true } = {}) {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  const trigger = document.getElementById('cart-button');
  if (!panel || panel.hidden) return;

  panel.hidden = true;
  overlay.hidden = true;
  trigger?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-locked');
  if (restoreFocus && lastFocused && document.contains(lastFocused)) lastFocused.focus();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setCheckoutFeedback(message, tone) {
  const el = document.getElementById('checkout-feedback');
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone || '';
}

export function initCartPanel(store) {
  const trigger = document.getElementById('cart-button');
  const overlay = document.getElementById('cart-overlay');
  const closeBtn = document.getElementById('cart-close');
  const panel = document.getElementById('cart-panel');
  const form = document.getElementById('checkout-form');

  if (!trigger || !panel || !overlay || !closeBtn) return;

  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'cart-panel');

  trigger.addEventListener('click', () => (isPanelOpen() ? closeCartPanel() : openCartPanel()));
  closeBtn.addEventListener('click', () => closeCartPanel());
  overlay.addEventListener('click', () => closeCartPanel());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isPanelOpen()) closeCartPanel();
  });

  // Focus trap selama panel terbuka
  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = [...panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Aksi per item (delegasi): tambah/kurang jumlah, hapus
  panel.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    const row = actionBtn.closest('[data-item-id], [data-product]');
    if (!row) return;
    const { cart } = store.getState();
    const item = cart.items.find((entry) => row.matches(rowSelectorFor(entry)));
    if (!item) return;

    const action = actionBtn.dataset.action;
    if (action === 'inc') updateCartItem(store, item, item.quantity + 1);
    if (action === 'dec') updateCartItem(store, item, item.quantity - 1);
    if (action === 'remove') removeCartItem(store, item);
  });

  // Checkout → POST /api/orders
  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const noteInput = document.getElementById('checkout-note');
    const submit = document.getElementById('checkout-submit');
    const { cart } = store.getState();

    nameInput?.removeAttribute('aria-invalid');
    emailInput?.removeAttribute('aria-invalid');

    if (!cart.items.length) {
      setCheckoutFeedback('Cart kosong — tambahkan produk dulu.', 'error');
      return;
    }

    const name = (nameInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const note = (noteInput?.value || '').trim();

    if (name.length < 2) {
      setCheckoutFeedback('Nama minimal 2 karakter.', 'error');
      nameInput?.setAttribute('aria-invalid', 'true');
      nameInput?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setCheckoutFeedback('Email tidak valid.', 'error');
      emailInput?.setAttribute('aria-invalid', 'true');
      emailInput?.focus();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
    }
    setCheckoutFeedback('Membuat pesanan…', 'pending');

    placeOrder(store, { customerName: name, email, note: note || undefined })
      .then((result) => {
        if (result.ok) {
          setCheckoutFeedback(`Pesanan ${result.order.orderNumber} dibuat ✓`, 'success');
          if (nameInput) nameInput.value = '';
          if (emailInput) emailInput.value = '';
          if (noteInput) noteInput.value = '';
        } else {
          setCheckoutFeedback(result.error?.detail || 'Checkout gagal — coba lagi.', 'error');
        }
      })
      .catch((err) => setCheckoutFeedback(String(err?.message || err), 'error'))
      .finally(() => {
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute('aria-busy');
        }
      });
  });
}

export function syncCartPanel(state) {
  const badge = document.getElementById('cart-panel-badge');
  const subtotalEl = document.getElementById('cart-panel-subtotal');
  const itemsEl = document.getElementById('cart-panel-items');
  const submit = document.getElementById('checkout-submit');

  if (badge) badge.textContent = String(state.cart.count);

  if (subtotalEl) {
    const market = getMarket(state.ui.market);
    const subtotal = state.cart.items.reduce((sum, item) => {
      const unit = typeof item.unitPrice === 'number' ? item.unitPrice : product.price;
      return sum + unit * item.quantity;
    }, 0);
    subtotalEl.textContent = formatPrice(subtotal, market);
  }

  // Render ulang hanya bila keanggotaan baris berubah (jaga fokus input checkout);
  // perubahan jumlah disinkronkan per baris tanpa mengganti struktur DOM.
  const signature = signatureFor(state.cart.items);
  if (itemsEl && itemsEl.dataset.signature !== signature) {
    itemsEl.innerHTML = renderItems(state);
    itemsEl.dataset.signature = signature;
  } else if (itemsEl) {
    state.cart.items.forEach((item) => {
      const row = itemsEl.querySelector(rowSelectorFor(item));
      const count = row?.querySelector('.cart-item__count');
      if (count && count.dataset.qty !== String(item.quantity)) {
        count.textContent = String(item.quantity);
        count.dataset.qty = String(item.quantity);
      }
    });
  }

  if (submit) submit.disabled = state.cart.count === 0;
}
