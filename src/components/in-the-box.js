import { product } from '../data/product.js';

export function renderBox() {
  return `
    <section class="box" aria-labelledby="box-title">
      <div class="container">
        <h2 class="section__title" id="box-title">In The Box</h2>
        <ul class="box__grid">
          ${product.inTheBox
            .map(
              (item) => `
            <li class="box__item">
              <div class="box__media">
                <img src="${item.image}" alt="${item.name}" loading="lazy" width="200" height="200" />
              </div>
              <p>${item.name}</p>
            </li>`,
            )
            .join('')}
        </ul>
      </div>
    </section>
  `;
}
