import { product } from '../data/product.js';

export function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer__grid">
          ${product.footerGroups
            .map(
              (group) => `
            <div class="footer__group">
              <h2 class="footer__title">${group.title}</h2>
              <ul class="footer__links">
                ${group.links
                  .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
                  .join('')}
              </ul>
            </div>`,
            )
            .join('')}
        </div>

        <ul class="footer__legal">
          ${product.legal.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}
        </ul>

        <div class="footer__meta">
          <p class="footer__address">${product.address}</p>
          <p>${product.copyright}</p>
        </div>
      </div>
    </footer>
  `;
}
