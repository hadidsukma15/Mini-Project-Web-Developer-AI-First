import { product } from '../data/product.js';

export function renderVariantSelector(state) {
  return `
    <fieldset class="variant">
      <legend class="variant__legend">
        Color (<span id="variant-label">${
          product.variants.find((v) => v.id === state.variantId)?.label ?? ''
        }</span>)
      </legend>
      <div class="variant__options" role="radiogroup" aria-label="Color">
        ${product.variants
          .map(
            (variant) => `
          <button
            type="button"
            class="variant__option"
            role="radio"
            data-variant="${variant.id}"
            aria-checked="${variant.id === state.variantId}"
          >
            <span class="variant__swatch" style="--swatch: ${variant.swatch}" aria-hidden="true"></span>
            <span class="variant__name">${variant.label}</span>
          </button>`,
          )
          .join('')}
      </div>
    </fieldset>
  `;
}

export function initVariant(store) {
  document.querySelector('.variant__options').addEventListener('click', (event) => {
    const option = event.target.closest('[data-variant]');
    if (!option) return;

    const variantId = option.dataset.variant;
    if (variantId === store.getState().variantId) return;

    store.setState({ variantId, galleryIndex: 0 });
  });
}

export function syncVariant(state) {
  const variant = product.variants.find((v) => v.id === state.variantId);

  document.querySelectorAll('[data-variant]').forEach((option) => {
    option.setAttribute('aria-checked', String(option.dataset.variant === state.variantId));
  });

  const label = document.getElementById('variant-label');
  if (label && variant) label.textContent = variant.label;

  const announcement = document.getElementById('variant-announcement');
  if (announcement && variant) announcement.textContent = `Color selected: ${variant.label}`;
}
