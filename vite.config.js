import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (name) => fileURLToPath(new URL(`./${name}`, import.meta.url));

// Multi-page: index.html = detail produk hardcode,
// product-api.html = detail produk dari response API,
// orders.html = daftar pesanan (CRUD via API).
export default defineConfig({
  build: {
    // Polyfill modulepreload memanggil fetch() saat load — tidak dibutuhkan
    // di browser modern dan mengganggu smoke test di jsdom.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: page('index.html'),
        productApi: page('product-api.html'),
        orders: page('orders.html'),
      },
    },
  },
});
