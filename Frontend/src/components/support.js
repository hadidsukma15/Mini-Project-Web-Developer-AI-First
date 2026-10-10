import { product } from '../data/product.js';

export function renderSupport() {
  const support = product.support;

  return `
    <section
      class="support"
      aria-labelledby="support-title"
      style="background-image: url('${support.image}')"
    >
      <div class="support__content container">
        <h2 class="support__title" id="support-title">${support.title}</h2>
        <p class="support__body">${support.body}</p>
        <a class="btn btn--primary" href="${support.ctaHref}">${support.ctaLabel}</a>
      </div>
    </section>
  `;
}
