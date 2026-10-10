import { product } from '../data/product.js';

export function renderSpecs() {
  return `
    <section class="specs" aria-labelledby="specs-title">
      <div class="container">
        <h2 class="section__title" id="specs-title">Tech Specs</h2>
        <div class="specs__grid">
          ${product.specs
            .map(
              (spec) => `
            <div class="specs__group">
              <h3>${spec.group}</h3>
              <dl class="specs__list">
                ${spec.items
                  .map(
                    (item) => `
                  <div class="specs__row">
                    <dt>${item.label}</dt>
                    <dd>${item.value}</dd>
                  </div>`,
                  )
                  .join('')}
              </dl>
            </div>`,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}
