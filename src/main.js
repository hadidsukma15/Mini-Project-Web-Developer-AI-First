import { createProductStore, mountApp } from './app.js';

// Halaman detail 1 — seluruh konten dibaca dari src/data/product.js (hardcode).
const store = createProductStore({ productStatus: 'ready' });

mountApp(store, { source: { kind: 'hardcode' } });
