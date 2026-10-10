import { product } from '../data/product.js';

export function renderTrust() {
  const { shipping, returns, warranty } = product.policies;

  return `
    <section class="trust container" aria-label="Shopping benefits">
      <article class="trust__card">
        <h2>${shipping.title}</h2>
        <p>${shipping.body}</p>
      </article>

      <article class="trust__card">
        <h2>${returns.title}</h2>
        <p>${returns.body}</p>
      </article>

      <article class="trust__card">
        <h2>${warranty.title}</h2>
        <p>
          ${warranty.body.replace(
            warranty.linkLabel,
            `<a href="${warranty.linkHref}">${warranty.linkLabel}</a>`,
          )}
        </p>
      </article>
    </section>
  `;
}
