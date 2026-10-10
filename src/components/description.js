import { product } from '../data/product.js';

export function renderDescription() {
  const description = product.description;

  return `
    <section class="description" aria-labelledby="description-title">
      <div class="description__inner container">
        <div class="description__content">
          <p class="eyebrow">${description.eyebrow}</p>
          <h2 class="description__title" id="description-title">${description.title}</h2>
          <p class="description__body">${description.body}</p>
          <div class="description__links">
            ${description.links
              .map(
                (link) =>
                  `<p>${link.prefix} <a href="${link.href}">${link.label}</a></p>`,
              )
              .join('')}
          </div>
        </div>
        <div class="description__media">
          <img
            src="${description.image}"
            alt="${description.imageAlt}"
            loading="lazy"
            width="823"
            height="823"
          />
        </div>
      </div>
    </section>
  `;
}
