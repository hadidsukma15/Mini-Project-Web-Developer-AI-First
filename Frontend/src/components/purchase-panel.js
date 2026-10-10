import { product, getAvailabilityState, isVariantAvailable } from '../data/product.js';
import { getMarket } from '../data/markets.js';
import { formatPrice } from '../utils/format.js';
import { getVariant } from '../state/variant.js';
import { addToCart } from '../state/cart.js';
import { renderVariantSelector, initVariant, syncVariant } from './variant-selector.js';

/** Satu sumber kebenaran untuk badge + CTA + helper (availability × stok varian). */
function getCtaState(state) {
  const availability = getAvailabilityState(product);
  const variantAvailable = isVariantAvailable(getVariant(state.variantId));

  let helper = availability.helper;
  if (availability.enabled && !variantAvailable) {
    helper = 'This color is currently out of stock.';
  }

  return {
    label: availability.label,
    ctaLabel: availability.ctaLabel,
    helper,
    enabled: availability.enabled && variantAvailable,
  };
}

export function renderPurchase(state) {
  const cta = getCtaState(state);

  return `
    <div class="purchase">
      <p class="purchase__category eyebrow">${product.category}</p>
      <h1 class="purchase__title">${product.name}</h1>

      <p class="purchase__price" id="price">${formatPrice(product.price, getMarket(state.ui.market))}</p>

      <p class="badge" id="availability-badge" role="status" data-tone="muted">
        ${cta.label}
      </p>

      ${renderVariantSelector(state)}

      <div class="purchase__cta">
        <button
          type="button"
          class="btn btn--cta"
          id="add-to-cart"
          ${cta.enabled ? '' : 'disabled aria-disabled="true"'}
        >
          ${cta.ctaLabel}
        </button>
        <p class="purchase__helper" id="cta-helper">${cta.helper}</p>
        <p class="purchase__feedback" id="cart-feedback" aria-live="polite"></p>
        <p class="visually-hidden" id="variant-announcement" aria-live="polite"></p>
      </div>

      <aside class="protection" aria-label="Purchase protection">
        <p class="protection__title">Enhance your purchase with protection</p>
        <p class="protection__note">
          Optional coverage powered by our protection partner — available at checkout.
        </p>
      </aside>
    </div>
  `;
}

export function initPurchase(store) {
  const cta = document.getElementById('add-to-cart');

  cta.addEventListener('click', () => {
    if (!getCtaState(store.getState()).enabled) return;

    const variant = getVariant(store.getState().variantId);
    addToCart(store, {
      productId: product.id,
      productName: product.name,
      variant: variant.label,
      quantity: 1,
    });
  });

  initVariant(store);
}

export function syncPurchase(state) {
  const price = document.getElementById('price');
  const badge = document.getElementById('availability-badge');
  const cta = document.getElementById('add-to-cart');
  const helper = document.getElementById('cta-helper');
  const feedback = document.getElementById('cart-feedback');
  const ctaState = getCtaState(state);

  if (price) price.textContent = formatPrice(product.price, getMarket(state.ui.market));

  if (badge) badge.textContent = ctaState.label;
  if (helper) helper.textContent = ctaState.helper;

  if (cta) {
    cta.textContent = ctaState.ctaLabel;
    cta.disabled = !ctaState.enabled;
    if (ctaState.enabled) cta.removeAttribute('aria-disabled');
    else cta.setAttribute('aria-disabled', 'true');
  }

  if (feedback) {
    feedback.textContent = state.feedback?.message ?? '';
    feedback.dataset.tone = state.feedback?.tone ?? '';
  }

  syncVariant(state);
}
