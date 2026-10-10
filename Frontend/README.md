# Mini Project Full-Stack — Detail Produk MW75 TUMI

Implementasi assignment **Mini Project Full-Stack: Web Developer AI-First**
(HTML · CSS · Vanilla JavaScript · SQL) — 2 halaman detail produk,
back-end Node.js, database MySQL, plus **halaman Orders** (CRUD pesanan
FE ↔ BE ↔ DB).

---

## 1. Halaman (scope assignment + Orders)

| # | Berkas | Sumber konten | Cara kerja |
|---|--------|---------------|------------|
| 1 | [`index.html`](index.html) | **Hardcode** | Seluruh konten dibaca dari `src/data/product.js` — tanpa panggilan API untuk produk |
| 2 | [`product-api.html`](product-api.html) | **Response API** | Boot → skeleton → `GET /api/products/:id` → konten dirender dari payload database |
| 3 | [`orders.html`](orders.html) | **Response API** | Daftar pesanan dari `GET /api/orders` — ubah status (`PATCH`) & hapus (`DELETE`) lewat UI, checkout dari cart panel (`POST /api/orders`)

Keduanya memakai komponen, style, dan state yang sama (`src/app.js`), jadi
tampilan identik — yang membedakan adalah sumber datanya. Strip status di
bawah breadcrumb menandai sumber data tiap halaman, termasuk tautan bolak-balik
dan (pada halaman 2) pratinjau response API mentah.

**Alur halaman 2** (`src/main-api.js`):

```
loading skeleton
   ├─ 200        → setProduct(mergeProduct(data)) → render dari API
   ├─ 400 / 404  → halaman error RFC 9457 (tanpa konten setengah jalan)
   └─ gagal jaringan / timeout / 5xx → fallback ke data lokal + console.error
```

---

## 2. Struktur Proyek

```
latihan1/
├── index.html                 # Halaman 1 — detail produk hardcode
├── product-api.html           # Halaman 2 — detail produk dari API
├── orders.html                # Halaman 3 — daftar pesanan (CRUD via API)
├── vite.config.js             # Build multi-page (3 halaman)
├── src/
│   ├── main.js                # Entry halaman 1
│   ├── main-api.js            # Entry halaman 2 (fetch + fallback + error)
│   ├── main-orders.js         # Entry halaman Orders
│   ├── app.js                 # Render & wiring bersama halaman 1 & 2
│   ├── orders-app.js          # Render & wiring halaman Orders
│   ├── components/            # Header, gallery, purchase, specs, cart-panel, orders-view, dst.
│   ├── data/product.js        # Konten hardcode (single source of truth lokal)
│   ├── data/merge.js          # Gabung payload API + konten lokal
│   ├── state/                 # store, variant, cart (update/remove/placeOrder), cartToken
│   ├── styles/                # tokens · base · layout · components · states · orders
│   └── utils/                 # api.js (client fetch), format, escape
├── scripts/smoke.mjs           # Smoke test 3 halaman (jsdom + E2E API)
├── api-produk/                 # BACK-END (lihat api-produk/README.md)
│   ├── src/                    # controllers · services · repositories · routes
│   ├── docs/openapi.yaml       # Kontrak OpenAPI 3.0.3 (Swagger UI /api-docs)
│   └── db/                     # DATABASE (lihat bagian 4)
└── TASK.md · TASK-FRONTEND.md · TASK-BACKEND.md · DESIGN.md · REQUIREMENTS.md
```

---

## 3. Menjalankan dari Nol

```bash
# 1) Database + Back-end  (terminal A)
cd api-produk
cp .env.example .env                 # sekali saja
docker compose up -d                 # MySQL 8 → 127.0.0.1:3306
#   …tanpa Docker: npm run db:dev    # MySQL lokal di 127.0.0.1:3307
npm run db:migrate                   # query CREATE TABLE
npm run db:seed                      # query INSERT data
npm run dev                          # API → http://localhost:3000

# 2) Front-end  (terminal B, di root proyek)
npm install
npm run dev                          # Vite → http://localhost:5173
```

Buka `http://localhost:5173/` (halaman hardcode),
`http://localhost:5173/product-api.html` (halaman dari API), dan
`http://localhost:5173/orders.html` (daftar pesanan).

> Tanpa back-end, halaman 2 tetap tampil utuh memakai data lokal (fallback),
> halaman 1 sepenuhnya hardcode, dan halaman Orders menampilkan error state
> dengan tombol "Coba lagi".

---

## 4. Database (query table & INSERT)

| Berkas | Isi |
|--------|-----|
| `api-produk/db/migrations/001_init.sql` | `CREATE TABLE products, product_variants, product_images` (+ FK, CHECK, index) |
| `api-produk/db/migrations/002_cart.sql` | `CREATE TABLE carts, cart_items` |
| `api-produk/db/migrations/003_orders.sql` | `CREATE TABLE orders, order_items` (+ enum status CHECK, snapshot nama & harga) |
| `api-produk/db/seed.sql` | `INSERT` 1 produk (`mw75-tumi`) · 2 varian (Black 12 / Silver 0) · 8 foto · 2 pesanan contoh (`MD-261001-A11C`, `MD-261005-B22D`) |

Semua dijalankan berurutan lewat `npm run db:migrate` lalu `npm run db:seed`.

---

## 5. API

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/health` | Status aplikasi + koneksi DB |
| GET | `/api/products` | List (`search`, `limit`, `offset`) |
| POST | `/api/products` | Buat produk (201 + `Location`) |
| GET | `/api/products/:id` | Detail produk → **dipakai halaman 2** |
| PUT/DELETE | `/api/products/:id` | Ganti / hapus produk |
| POST | `/api/cart/items` | Tambah item (stok divalidasi → 409) |
| GET/PATCH/DELETE | `/api/cart/:cartToken…` | Baca / ubah / kosongkan cart |
| GET/POST | `/api/orders` | Daftar pesanan (`cartToken`, `status`, `limit`, `offset`) · checkout (**potong stok**, snapshot ke `order_items`, cart dikosongkan → 201 + `Location`) |
| GET/PATCH/DELETE | `/api/orders/:orderId` | Detail · ubah status (`pending/paid/shipped/delivered/cancelled`) · hapus (stok dikembalikan) |

- Sukses: envelope `{ "data": … }` · Gagal: **RFC 9457** `application/problem+json`
- Dokumentasi interaktif: <http://localhost:3000/api-docs>

---

## 6. Pengujian

```bash
npm test                          # build + smoke 3 halaman (jsdom + E2E API hidup)
cd api-produk && npm run docs:openapi   # validasi kontrak OpenAPI
cd api-produk && npm run smoke          # 60 asersi API (butuh DB)
cd api-produk && npm run test:integration  # MySQL ephemeral + 60 asersi
```

Hasil terakhir (8 Okt 2026):

- Front-end `npm test` → **175/175 passed** (halaman 1 hardcode, drawer, cart panel +
  checkout, halaman 2: 404 problem+json, fallback saat API mati, render dari API,
  halaman Orders: loading/list/empty/error/retry/update status/delete 2-langkah,
  E2E ke API+MySQL hidup — stok dipotong saat checkout & pulih setelah hapus)
- Overflow horizontal: `scrollWidth - clientWidth = 0` di viewport 375px
  (**ketiga halaman**, Chromium headless)
- Back-end `npm run test:integration` → **60 PASS · 0 FAIL · 0 SKIP**
- Back-end `npm run smoke` (DB hidup) → **60 PASS · 0 FAIL · 0 SKIP**
  (bagian Orders: O1–O19 — CRUD, validasi, simetri stok saat cancel/delete)
- `npm run docs:openapi` → **OPENAPI OK** (8 paths, termasuk `/api/orders`)

---

## 7. Catatan Environment

- API hanya diikat ke loopback (`HOST=127.0.0.1`) — tidak terlihat dari luar mesin.
- `CORS_ORIGIN` default `http://localhost:5173` (origin Vite dev).
- Front-end **tidak** membaca kredensial DB — semua akses MySQL lewat Express.
- `.env` tidak di-commit; salin dari `.env.example` di tiap mesin.
