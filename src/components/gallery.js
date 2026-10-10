import { product } from '../data/product.js';
import { getVariant } from '../state/variant.js';

const prevIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>`;
const nextIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>`;

export function renderGallery(state) {
  const variant = getVariant(state.variantId);
  const image = variant.images[state.galleryIndex] ?? variant.images[0];

  return `
    <section
      class="gallery"
      aria-roledescription="carousel"
      aria-label="${product.name} product images"
    >
      <div class="gallery__stage">
        <img
          class="gallery__image"
          id="gallery-image"
          src="${image.src}"
          alt="${image.alt}"
          width="800"
          height="800"
          fetchpriority="high"
        />
        <button
          type="button"
          class="gallery__nav gallery__nav--prev"
          data-dir="prev"
          aria-label="Previous image"
        >
          ${prevIcon}
        </button>
        <button
          type="button"
          class="gallery__nav gallery__nav--next"
          data-dir="next"
          aria-label="Next image"
        >
          ${nextIcon}
        </button>
      </div>

      <div class="gallery__meta">
        <p class="gallery__counter" id="gallery-counter" aria-live="polite">
          ${state.galleryIndex + 1} / ${variant.images.length}
        </p>
        <ul class="gallery__thumbs" id="gallery-thumbs">
          ${variant.images
            .map(
              (item, index) => `
            <li>
              <button
                type="button"
                class="gallery__thumb"
                data-index="${index}"
                aria-label="View image ${index + 1}"
                aria-current="${index === state.galleryIndex}"
              >
                <img src="${item.src}" alt="" loading="lazy" width="76" height="76" />
              </button>
            </li>`,
            )
            .join('')}
        </ul>
      </div>
    </section>
  `;
}

let renderedVariantId = null;

export function initGallery(store) {
  renderedVariantId = store.getState().variantId;

  document.querySelector('.gallery').addEventListener('click', (event) => {
    const nav = event.target.closest('[data-dir]');
    const thumb = event.target.closest('[data-index]');

    if (nav) {
      const variant = getVariant(store.getState().variantId);
      const total = variant.images.length;
      const current = store.getState().galleryIndex;
      const nextIndex =
        nav.dataset.dir === 'next'
          ? (current + 1) % total
          : (current - 1 + total) % total;

      store.setState({ galleryIndex: nextIndex });
      return;
    }

    if (thumb) {
      store.setState({ galleryIndex: Number(thumb.dataset.index) });
    }
  });
}

export function syncGallery(state) {
  const variant = getVariant(state.variantId);
  const image = variant.images[state.galleryIndex] ?? variant.images[0];
  const imgEl = document.getElementById('gallery-image');
  const counter = document.getElementById('gallery-counter');
  const thumbs = document.getElementById('gallery-thumbs');

  if (imgEl) {
    imgEl.src = image.src;
    imgEl.alt = image.alt;
  }
  if (counter) {
    counter.textContent = `${state.galleryIndex + 1} / ${variant.images.length}`;
  }

  if (thumbs && renderedVariantId !== state.variantId) {
    renderedVariantId = state.variantId;
    thumbs.innerHTML = variant.images
      .map(
        (item, index) => `
      <li>
        <button
          type="button"
          class="gallery__thumb"
          data-index="${index}"
          aria-label="View image ${index + 1}"
          aria-current="${index === state.galleryIndex}"
        >
          <img src="${item.src}" alt="" loading="lazy" width="76" height="76" />
        </button>
      </li>`,
      )
      .join('');
    return;
  }

  document.querySelectorAll('.gallery__thumb').forEach((thumb) => {
    thumb.setAttribute('aria-current', String(Number(thumb.dataset.index) === state.galleryIndex));
  });
}
