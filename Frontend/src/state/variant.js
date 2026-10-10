import { product } from '../data/product.js';

export function getDefaultVariantId() {
  return product.variants.find((v) => v.isDefault)?.id ?? product.variants[0].id;
}

export function getVariantFromUrl() {
  const requested = new URLSearchParams(window.location.search).get('variant');
  const exists = product.variants.some((v) => v.id === requested);
  return exists ? requested : getDefaultVariantId();
}

export function syncVariantUrl(variantId) {
  const url = new URL(window.location.href);
  url.searchParams.set('variant', variantId);
  window.history.replaceState(null, '', url);
}

export function getVariant(variantId) {
  return product.variants.find((v) => v.id === variantId) ?? product.variants[0];
}
