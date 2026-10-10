import { product } from '../data/product.js';

export function renderStory() {
  const story = product.story;

  return `
    <section class="story" aria-labelledby="story-title">
      <div class="story__inner container">
        <div class="story__media">
          <img src="${story.image}" alt="${story.imageAlt}" loading="lazy" width="822" height="822" />
        </div>
        <div class="story__content">
          <p class="eyebrow">${story.eyebrow}</p>
          <h2 class="story__title" id="story-title">${story.title}</h2>
          <p class="story__body">${story.body}</p>
        </div>
      </div>
    </section>
  `;
}
