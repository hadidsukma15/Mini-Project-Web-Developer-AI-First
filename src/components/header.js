import { product } from '../data/product.js';
import { markets } from '../data/markets.js';
import { getMarket } from '../data/markets.js';
import { renderCartPanel, initCartPanel, syncCartPanel } from './cart-panel.js';

const icons = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`,
  account: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
};

function marketList(selectedCode) {
  return markets
    .map(
      (market) => `
      <li>
        <button
          type="button"
          class="market__option"
          role="option"
          data-market="${market.code}"
          aria-selected="${market.code === selectedCode}"
        >
          ${market.country} (${market.currency} ${market.symbol})
        </button>
      </li>`,
    )
    .join('');
}

export function renderHeader(state) {
  const market = getMarket(state.ui.market);

  return `
    <div class="announcement" role="region" aria-label="Announcement">
      <p>${product.announcement}</p>
    </div>
    <header class="site-header" id="site-header">
      <div class="site-header__inner container">
        <a class="brand" href="#" aria-label="Master &amp; Dynamic home">
          <img src="/img/logo-md.svg" alt="Master &amp; Dynamic" width="190" height="28" />
        </a>

        <nav class="nav" aria-label="Primary">
          <ul class="nav__list">
            ${product.nav
              .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
              .join('')}
          </ul>
        </nav>

        <div class="header-actions">
          <button
            type="button"
            class="icon-btn nav-toggle"
            id="nav-toggle"
            aria-expanded="false"
            aria-controls="nav-drawer"
            aria-label="Open menu"
          >
            ${icons.menu}
          </button>

          <a class="header-actions__link" href="${product.support.ctaHref}">Support</a>

          <button
            type="button"
            class="icon-btn"
            id="search-trigger"
            aria-expanded="false"
            aria-controls="search-panel"
            aria-label="Open search"
          >
            ${icons.search}
          </button>

          <a class="icon-btn" href="#" aria-label="Open account page">${icons.account}</a>

          <button
            type="button"
            class="icon-btn"
            id="cart-button"
            aria-label="Cart, ${state.cart.count} items"
          >
            ${icons.cart}
            <span class="cart-count" id="cart-count" data-count="${state.cart.count}">${state.cart.count}</span>
          </button>

          <div class="market">
            <button
              type="button"
              class="market__trigger"
              id="market-trigger"
              aria-expanded="false"
              aria-controls="market-list"
              aria-haspopup="listbox"
            >
              <span class="market__country" id="market-country">${market.code}</span>
              <span class="market__caption">Country</span>
              ${icons.chevron}
            </button>
            <ul class="market__list" id="market-list" role="listbox" aria-label="Select country and currency" hidden>
              ${marketList(state.ui.market)}
            </ul>
          </div>
        </div>
      </div>
    </header>

    <div class="drawer-overlay" id="drawer-overlay" hidden></div>
    <aside
      class="drawer"
      id="nav-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      hidden
    >
      <div class="drawer__head">
        <p class="drawer__title">Menu</p>
        <button type="button" class="icon-btn" id="drawer-close" aria-label="Close menu">
          ${icons.close}
        </button>
      </div>

      <nav class="drawer__nav" aria-label="Mobile">
        <ul class="drawer__list">
          ${product.nav
            .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
            .join('')}
        </ul>
      </nav>

      <div class="drawer__group">
        <p class="drawer__label" id="drawer-country-label">Country</p>
        <ul class="drawer__markets" role="listbox" aria-labelledby="drawer-country-label">
          ${markets
            .map(
              (market) => `
            <li>
              <button
                type="button"
                class="drawer__market"
                role="option"
                data-market="${market.code}"
                aria-selected="${market.code === state.ui.market}"
              >
                ${market.country} (${market.currency} ${market.symbol})
              </button>
            </li>`,
            )
            .join('')}
        </ul>
      </div>

      <div class="drawer__group drawer__links">
        <a href="${product.support.ctaHref}">Support</a>
        <a href="#">Account</a>
      </div>
    </aside>

    ${renderCartPanel(state)}
  `;
}

export function initHeader(store) {
  const trigger = document.getElementById('market-trigger');
  const list = document.getElementById('market-list');

  trigger.addEventListener('click', () => {
    const isOpen = !list.hidden;
    list.hidden = isOpen;
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });

  list.addEventListener('click', (event) => {
    const option = event.target.closest('[data-market]');
    if (!option) return;

    store.setState({ ui: { ...store.getState().ui, market: option.dataset.market } });
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  });

  document.addEventListener('click', (event) => {
    if (list.hidden) return;
    if (!event.target.closest('.market')) {
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  initDrawer(store);
  initCartPanel(store);
}

/** Drawer mobile (≤1023px): nav utama, country selector, account/support. */
function initDrawer(store) {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('drawer-close');

  if (!toggle || !drawer || !overlay || !closeBtn) return;

  const isOpen = () => !drawer.hidden;

  function openDrawer() {
    drawer.hidden = false;
    overlay.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    closeBtn.focus();
  }

  function closeDrawer({ restoreFocus = true } = {}) {
    drawer.hidden = true;
    overlay.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen() ? closeDrawer() : openDrawer()));
  closeBtn.addEventListener('click', () => closeDrawer());
  overlay.addEventListener('click', () => closeDrawer());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) closeDrawer();
  });

  // Focus trap: Tab berputar di dalam drawer selama terbuka.
  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    const focusables = [...drawer.querySelectorAll('a[href], button:not([disabled])')];
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

  drawer.addEventListener('click', (event) => {
    const option = event.target.closest('[data-market]');
    if (option) {
      store.setState({ ui: { ...store.getState().ui, market: option.dataset.market } });
      return;
    }

    // Navigasi dari drawer → tutup dulu supaya overlay tidak menutupi halaman.
    if (event.target.closest('a[href]')) closeDrawer({ restoreFocus: false });
  });
}

export function syncHeader(state) {
  const countEl = document.getElementById('cart-count');
  const cartBtn = document.getElementById('cart-button');
  const countryEl = document.getElementById('market-country');

  if (countEl) {
    countEl.textContent = state.cart.count;
    countEl.dataset.count = state.cart.count;
  }
  if (cartBtn) {
    cartBtn.setAttribute('aria-label', `Cart, ${state.cart.count} items`);
  }
  if (countryEl) {
    countryEl.textContent = state.ui.market;
  }

  document.querySelectorAll('[data-market]').forEach((option) => {
    option.setAttribute('aria-selected', String(option.dataset.market === state.ui.market));
  });

  syncCartPanel(state);
}
