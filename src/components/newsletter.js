import { product } from '../data/product.js';

export function renderNewsletter() {
  return `
    <section class="newsletter" aria-labelledby="newsletter-title">
      <div class="newsletter__inner container">
        <h2 class="newsletter__title" id="newsletter-title">${product.newsletter}</h2>
        <form class="newsletter__form" id="newsletter-form" novalidate>
          <label class="visually-hidden" for="newsletter-email">Email address</label>
          <input
            class="newsletter__input"
            type="email"
            id="newsletter-email"
            name="email"
            placeholder="Email address"
            autocomplete="email"
            required
            aria-describedby="newsletter-message"
          />
          <button class="btn btn--primary" type="submit">Sign up</button>
        </form>
        <p class="newsletter__message" id="newsletter-message" aria-live="polite"></p>
      </div>
    </section>
  `;
}

export function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');
  const message = document.getElementById('newsletter-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!valid) {
      input.setAttribute('aria-invalid', 'true');
      message.dataset.tone = 'error';
      message.textContent = 'Please enter a valid email address.';
      input.focus();
      return;
    }

    input.removeAttribute('aria-invalid');
    message.dataset.tone = 'success';
    message.textContent = 'Thank you for signing up — you’re on the list.';
    form.reset();
  });
}
