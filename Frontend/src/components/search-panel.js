import { suggested } from '../data/suggested.js';
import { product } from '../data/product.js';

let lastFocused = null;

function renderItems(items) {
  if (!items.length) {
    return `<li class="search-panel__empty" id="search-empty">No products match your search.</li>`;
  }
  return items
    .map((item) => `<li><a href="${item.href}">${item.name}</a></li>`)
    .join('');
}

export function renderSearchPanel(state) {
  return `
    <div
      class="search-panel"
      id="search-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      ${state.ui.searchOpen ? '' : 'hidden'}
    >
      <div class="search-panel__inner container">
        <div class="search-panel__bar">
          <input
            type="search"
            class="search-panel__input"
            id="search-input"
            placeholder="Search"
            aria-label="Search products"
            autocomplete="off"
          />
          <button type="button" class="search-panel__close" id="search-close" aria-label="Close search">
            &times;
          </button>
        </div>

        <div class="search-panel__results">
          <p class="search-panel__heading" id="search-heading">Suggested</p>
          <ul class="search-panel__list" id="search-results">
            ${renderItems(suggested)}
          </ul>

          <div class="search-panel__support">
            <p class="search-panel__subheading">Need Product Support?</p>
            <p>Get further information at <a href="${product.support.ctaHref}">Support Center</a></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSearch(store) {
  const trigger = document.getElementById('search-trigger');
  const panel = document.getElementById('search-panel');
  const closeBtn = document.getElementById('search-close');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  trigger.addEventListener('click', () => {
    lastFocused = trigger;
    store.setState({ ui: { ...store.getState().ui, searchOpen: true } });
  });

  closeBtn.addEventListener('click', () => {
    store.setState({ ui: { ...store.getState().ui, searchOpen: false } });
  });

  panel.addEventListener('click', (event) => {
    if (event.target === panel) {
      store.setState({ ui: { ...store.getState().ui, searchOpen: false } });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && store.getState().ui.searchOpen) {
      store.setState({ ui: { ...store.getState().ui, searchOpen: false } });
    }
  });

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const filtered = query
      ? suggested.filter((item) => item.name.toLowerCase().includes(query))
      : suggested;
    results.innerHTML = renderItems(filtered);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      store.setState({ ui: { ...store.getState().ui, searchOpen: false } });
    }
  });

  void panel;
}

export function syncSearch(state) {
  const panel = document.getElementById('search-panel');
  const trigger = document.getElementById('search-trigger');
  const input = document.getElementById('search-input');

  if (!panel) return;

  const open = state.ui.searchOpen;
  panel.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('is-locked', open);

  if (open) {
    input.focus();
  } else if (lastFocused) {
    lastFocused.focus();
    lastFocused = null;
  }
}
