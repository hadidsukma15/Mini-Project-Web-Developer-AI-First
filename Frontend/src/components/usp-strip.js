import { product } from '../data/product.js';

export function renderUsp() {
  return `
    <section class="usp" aria-label="Product highlights">
      <ul class="usp__list container">
        ${product.usps
          .map(
            (usp) => `
          <li class="usp__item">
            <img src="${usp.icon}" alt="" width="36" height="36" loading="lazy" />
            <p>${usp.label}</p>
          </li>`,
          )
          .join('')}
      </ul>
    </section>
  `;
}
