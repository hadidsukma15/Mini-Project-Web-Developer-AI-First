import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/states.css';
import './styles/orders.css';

import { createStore } from './state/store.js';
import { restoreCart } from './state/cart.js';
import { renderHeader, initHeader, syncHeader } from './components/header.js';
import { renderSearchPanel, initSearch, syncSearch } from './components/search-panel.js';
import { renderFooter } from './components/footer.js';
import {
  renderOrdersMain,
  initOrders,
  syncOrders,
} from './components/orders-view.js';

/** Store halaman Orders — field header (cart/ui/feedback) + state daftar pesanan. */
export function createOrdersStore(patch = {}) {
  return createStore({
    ui: { searchOpen: false, market: 'US' },
    cart: { count: 0, items: [] },
    feedback: { key: 0, message: '', tone: '' },
    orders: { status: 'loading', items: [], error: null },
    ...patch,
  });
}

export function mountOrders(store) {
  const state = store.getState();

  document.getElementById('app').innerHTML = `
    ${renderHeader(state)}
    ${renderSearchPanel(state)}
    ${renderOrdersMain(state)}
    ${renderFooter()}
  `;

  initHeader(store);
  initSearch(store);

  store.subscribe((next) => {
    syncHeader(next);
    syncSearch(next);
    syncOrders(next);
  });

  // Cart: hydrate dari localStorage → sinkron dengan database (bila API hidup)
  restoreCart(store);

  // Muat daftar pesanan + wire aksi (update status / hapus / retry)
  initOrders(store);
}
