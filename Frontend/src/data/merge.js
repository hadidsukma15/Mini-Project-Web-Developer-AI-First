import { product as localProduct } from './product.js';
import { escapeHtml } from '../utils/escape.js';

/** "Black" / "Midnight Blue" → id varian: `black`, `midnight-blue`. */
function slugify(color) {
  return String(color)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Field yang memang tersedia di database → diambil dari API (di-escape). */
function apiImages(api, color) {
  const images = Array.isArray(api.images) ? api.images : [];
  const matched = images.filter((image) => image.color === color);
  const generic = matched.length ? matched : images.filter((image) => !image.color);

  return matched.length || generic.length
    ? (matched.length ? matched : generic).map((image) => ({
        src: image.url,
        alt: escapeHtml(image.alt || `${api.name} ${color ?? ''}`.trim()),
      }))
    : null;
}

/**
 * Gabungkan payload API dengan konten lokal.
 * - Dari API: `id`, `name`, `price`, `currency`, `description`,
 *   `variants[]` (color/swatch/quantity), `images[]` (url/alt/color).
 * - Tetap dari lokal: `category`, `availability`, `usps`, `policies`, `story`,
 *   `specs`, `inTheBox`, `support`, `newsletter`, navigasi/footer
 *   (kolomnya belum ada di database — lihat TASK-FRONTEND Blok B3).
 */
export function mergeProduct(api) {
  const fallbackVariants = localProduct.variants;

  const variants = (Array.isArray(api.variants) ? api.variants : []).map((variant, index) => {
    const id = slugify(variant.color) || `variant-${index + 1}`;
    const source =
      fallbackVariants.find((item) => item.id === id) ??
      fallbackVariants[index] ??
      fallbackVariants[0];

    return {
      ...source,
      id,
      label: escapeHtml(variant.color),
      swatch: variant.swatch || source.swatch,
      quantity: Number.isFinite(variant.quantity) ? variant.quantity : source.quantity,
      isDefault: index === 0,
      images: apiImages(api, variant.color) ?? source.images,
    };
  });

  return {
    ...localProduct,
    id: api.id,
    name: escapeHtml(api.name),
    price: Number(api.price),
    currency: api.currency,
    description: {
      ...localProduct.description,
      body: escapeHtml(api.description),
    },
    variants: variants.length ? variants : fallbackVariants,
  };
}
