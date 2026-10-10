# Task List — Backend (`api-produk`)

| Informasi | Keterangan |
|-----------|-----------|
| Dokumen | TASK-BACKEND.md (tasklist backend — pasangan `TASK-FRONTEND.md`) |
| Lokasi | `api-produk/` |
| Stack | Node.js 18+ · Express 4 · MySQL 8 · Zod · Swagger (OpenAPI 3.0) |
| Kontrak | `api-produk/context/prd.md` (PRD §8 API, §11 test matrix) · `context/architecture.md` |
| Perintah | `npm run dev` · `docker compose up -d` · `npm run db:migrate` · `npm run db:seed` · `npm run smoke` · `npm run test:integration` · `npm run docs:openapi` |

**Cara pakai**
- Centang `[ ]` → `[x]` setelah diverifikasi, jangan hanya "kode sudah ditulis".
- Kolom **Ref** menunjuk bagian di `context/prd.md` / `context/architecture.md`.
- Status terakhir diperbarui: **8 Okt 2026** (verifikasi ulang: `docs:openapi` lulus — **8 paths** termasuk `/api/orders`, `test:integration` **60 PASS / 0 FAIL / 0 SKIP**, `smoke` **60 PASS**, frontend terhubung via `GET /api/products/mw75-tumi` + `GET/PATCH/DELETE /api/orders`).

---

## Status Implementasi

| Fase | Status | Keterangan |
|------|--------|-----------|
| 0 Setup | ✅ selesai | `.env.example`, `.env`, `docker-compose.yml`, dependensi, struktur folder layer |
| 1 Infra DB | ✅ selesai | Migrate + seed diverifikasi via `npm run test:integration` & `npm run db:dev` (1 produk / 2 varian / 8 foto) |
| 2 Layer dasar & GET detail | ✅ selesai | Pool → repository → service → controller; envelope `{data}` |
| 3 Assembly & error | ✅ selesai | Varian + foto tergabung tanpa N+1; RFC 9457 problem+json (400/404/405/409/415/413/500) |
| 4 CRUD Release 2 | ✅ selesai | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`, transaksional; **diverifikasi DB hidup** |
| 5 Dokumentasi Swagger | ✅ selesai | `/api-docs` (UI), `/openapi.json`, `/openapi.yaml`; **8 path** terdokumentasi (health, products, cart, orders) |
| 6 QA & pengujian | ✅ selesai | `docs:openapi` lulus · `test:integration` **60 PASS · 0 FAIL · 0 SKIP** · PRD matrix terpenuhi |
| 7 Hardening & roadmap | 🟡 7.1 selesai | T-7.1 selesai (`GET /health`, `README.md`, log 500, CORS) · T-7.2 roadmap perluasan skema siap didiskusikan |
| 8 Cart (keranjang) | ✅ selesai | Migrasi `002_cart.sql` (`carts` + `cart_items`) · 5 endpoint cart · stok divalidasi (409) · terdokumentasi & teruji (15 asersi cart) |
| 9 Orders (pesanan) | ✅ selesai | Migrasi `003_orders.sql` (`orders` + `order_items`) · 5 endpoint orders · checkout potong stok + snapshot · 19 asersi (O1–O19) |

---

## Fase 0 — Setup & Konfigurasi

### T-0.1 Proyek & dependensi
- [x] `package.json`: scripts `start`, `dev`, `db:migrate`, `db:seed`, `smoke`, `test:integration`, `docs:openapi`.
- [x] Dependensi: `express`, `cors`, `helmet`, `dotenv`, `mysql2`, `zod`, `js-yaml`, `swagger-ui-express`.
- [x] Struktur folder layer: `config/ · controllers/ · services/ · repositories/ · routes/ · middlewares/ · schemas/ · docs/ · errors.js`.

**Ref:** architecture §2, §3, §4 · **Verifikasi:** `npm run dev` tanpa error.

### T-0.2 Environment & keamanan konfigurasi
- [x] `.env.example` (PORT, HOST, CORS_ORIGIN, DB_*), `.env` tidak di-commit.
- [x] `CORS_ORIGIN` default sesuai front-end dev (`http://localhost:5173`).
- [x] `helmet` aktif (CSP dimainkan untuk aset Swagger), `x-powered-by` dimatikan.
- [x] Salin `.env.example` → `.env` di mesin masing-masing (sekali, per developer).
- [x] **Mode lokal saja (loopback)** — API `HOST=127.0.0.1` (`src/server.js`) dan MySQL `127.0.0.1:3306` (compose) → **tidak terlihat dari perangkat lain di jaringan lokal/internet**. Verifikasi: `curl http://127.0.0.1:3000` → 200, `curl http://<ip-lan>:3000` → ditolak. Ubah ke `0.0.0.0` hanya bila suatu saat perlu diakses dari perangkat lain (mis. uji dari HP).
- [ ] **Restart server setelah ubah `HOST`** — proses `npm start`/`npm run dev` yang berjalan sebelum edit masih memakai bind lama (`*:3000`); Ctrl+C lalu jalankan ulang.

**Ref:** architecture §10, §12 · **Verifikasi:** server start tanpa hardcode kredensial di kode.

---

## Fase 1 — Infrastruktur Database

### T-1.1 MySQL via Docker / Dev Runner
- [x] `docker-compose.yml`: MySQL 8, database `api_produk`, user least-privilege `app`.
- [x] Opsi alternatif tanpa Docker daemon: `npm run db:dev` / ephemeral MySQL di port 3306 (di mesin ini dipakai port **3307** — lihat `DB_PORT` di `.env`).
- [x] `scripts/dev-db.js` membuat database + user **sesuai kredensial `.env`** dan memberi grant (`DB_USER`/`DB_PASS`), sehingga `npm start` langsung `db:connected` tanpa GRANT manual.

**Ref:** architecture §11 · **Verifikasi:** diverifikasi via `npm run test:integration` & `npm run db:dev` (8 Okt 2026: `GET /health` → `{"status":"ok","db":"connected"}`).

### T-1.2 Migrate & seed
- [x] `db/migrations/001_init.sql` — tabel `products`, `product_variants`, `product_images` (UNIQUE warna, CHECK, FK CASCADE, utf8mb4).
- [x] `db/seed.sql` — 1 produk (`mw75-tumi`) + varian Black/Silver + 8 foto per warna.
- [x] `npm run db:migrate` sukses tanpa error.
- [x] `npm run db:seed` sukses; verifikasi isi: `SELECT COUNT(*)` = 1 produk / 2 varian / 8 foto.

**Ref:** architecture §5, §11 · **Verifikasi:** query SQL manual hasil sesuai §5.2/§11 (diverifikasi via test runner).

---

## Fase 2 — Layer Dasar & Read API

### T-2.1 Pool & repository
- [x] `src/config/db.js` — pool `mysql2/promise`, `decimalNumbers: true` (harga tetap number).
- [x] `src/repositories/products.repository.js` — SQL hanya di layer ini, placeholder `?`.
- [x] Assembly varian + foto di service tanpa N+1.

**Ref:** architecture §7.1–§7.3 · Risiko #1 · **Verifikasi:** `price` bertipe `number` pada respons.

### T-2.2 `GET /api/products/:id`
- [x] Envelope `{ data: {...} }`, 200.
- [x] Validasi path param `id` (slug) → 400 `VALIDATION_ERROR` + `errors[].field`.
- [x] 404 `PRODUCT_NOT_FOUND` (bukan 500) saat data tak ada.

**Ref:** PRD §8.2, §10.1, US-03/US-04 · **Verifikasi:** smoke T2/T3/T7 (menunggu DB untuk T7).

### T-2.3 List `GET /api/products`
- [x] Query `search`, `limit`, `offset` divalidasi (Zod) → `meta {total, limit, offset}`.
- [x] Projection ringan (tanpa `description`/`images`/`variants`).
- [x] Param tak dikenal diabaikan (bukan 400).

**Ref:** PRD §8.5, US-10 · **Verifikasi:** smoke `?limit=abc` → 400 PASS; `?search=` perlu DB.

---

## Fase 3 — Error Handling & Middleware

### T-3.1 Problem Details (RFC 9457)
- [x] `src/errors.js` + `middlewares/errorHandler.js` — `type/title/status/detail/instance` + `code` + `errors[]`.
- [x] Kode error: `VALIDATION_ERROR`, `NOT_FOUND`, `PRODUCT_NOT_FOUND`, `METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE`, `PAYLOAD_TOO_LARGE`, `CONFLICT`, `INTERNAL_ERROR`.
- [x] 405 + header `Allow` untuk method tak terdaftar; 404 path tak dikenal; 415 tanpa `application/json`; 413 body >100kb; JSON rusak → 400.

**Ref:** PRD §8.4, §9.5, US-06 · **Verifikasi:** smoke T10, 404 path, 415, 413, JSON rusak — **semua PASS**.

### T-3.2 Urutan validasi
- [x] `415` / `400` / `409` **sebelum** `404`.

**Ref:** PRD §10.1, test T35 · **Verifikasi:** smoke urutan validasi PASS.

---

## Fase 4 — CRUD Release 2

### T-4.1 `POST /api/products`
- [x] Body divalidasi penuh (Zod, §10.3), `requireJson` → 415 bila bukan JSON.
- [x] 201 + header `Location`; transaksional (produk → varian → foto).
- [x] Duplikasi `id` → 409 `CONFLICT`.

**Ref:** PRD §8.6, US-11 · **Verifikasi:** smoke T26/T28 — **menunggu DB**.

### T-4.2 `PUT /api/products/:id` (full-replace)
- [x] Ganti seluruh produk + varian + foto dalam satu transaksi (rollback saat gagal).
- [x] 200 + envelope; 404 bila tak ada; 400 bila body tak valid.

**Ref:** PRD §8.7, US-12, architecture §7.4 · **Verifikasi:** smoke T30/T32 — **menunggu DB**.

### T-4.3 `DELETE /api/products/:id`
- [x] 204 tanpa body; 404 bila tak ada; CASCADE menghapus varian & foto.

**Ref:** PRD §8.8, US-13 · **Verifikasi:** smoke T34/T35 — **menunggu DB**.

---

## Fase 5 — Dokumentasi Swagger (OpenAPI 3.0)

### T-5.1 Spec & UI
- [x] `docs/openapi.yaml` (618 baris): 5 operation, `components/parameters|schemas`, contoh respons, tag, server lokal.
- [x] `GET /api-docs` (Swagger UI), `/openapi.json`, `/openapi.yaml`.
- [x] Helmet disetel agar aset Swagger UI tidak diblokir CSP.
- [x] `scripts/validate-openapi.js` — cek field wajib, `$ref` teresolusi, kontrak §8 lengkap.

**Ref:** architecture §3.1 · **Verifikasi:** `npm run docs:openapi` → **OPENAPI OK** (7 Okt 2026).

### T-5.2 Sinkronisasi spec ↔ kode
- [x] Semua endpoint di `routes/products.route.js` punya operasi di spec (5/5) + `/health`.
- [x] Setiap ubah kontrak API → update `docs/openapi.yaml` + jalankan `npm run docs:openapi` (DoD terpenuhi).

**Ref:** architecture §3.1 · **Verifikasi:** daftar path spec = daftar route (3 paths, OPENAPI OK).

---

## Fase 6 — QA & Pengujian

> Jalankan berurutan. Fase 1 wajib lulus dulu untuk smoke DB & integration.

### T-6.1 Dokumentasi
- [x] `npm run docs:openapi` lulus.

### T-6.2 Smoke test (tanpa DB)
- [x] `npm run smoke` → **PASS** untuk test non-DB (Swagger UI, 400 slug, 405+Allow, 404 path, 415, 413/JSON rusak, CORS preflight, `?limit=abc`).

### T-6.3 Smoke test (dengan DB)
- [x] `npm run test:integration` / DB hidup → `npm run smoke` → **60 PASS · 0 FAIL · 0 SKIP** (T1, T7, T22, T23, T25, T26, T27, T28, T30, T32, T34, T35, cart C1–C14, orders O1–O19, `/health`, CORS, security header).

### T-6.4 Integration test
- [x] `npm run test:integration` (MySQL ephemeral `mysql-memory-server`) → 60 asersi lulus (exit code 0).
- [x] Catatan Linux: `libaio` & `libnuma` otomatis diakomodasi via `LD_LIBRARY_PATH`.

**Ref:** architecture §13 · **Verifikasi:** semua skrip exit code 0.

### T-6.5 Test matrix penuh PRD
- [x] T1–T35 lulus (gabungan smoke + integration), termasuk header `Content-Type` (T13), problem+json (T14), `{data, meta}` (T22), CORS preflight & actual (T15), security headers (T16).

**Ref:** PRD §11 · **Verifikasi:** checklist §11 tercentang.

---

## Fase 7 — Hardening & Jalur Perluasan (roadmap, sebagian di luar scope MVP)

### T-7.1 Wajib sebelum serah terima
- [x] `GET /health` — cek aplikasi + koneksi DB (`{status, db}`) untuk monitoring.
- [x] `README.md` backend: cara setup (compose / `db:dev` → migrate → seed → dev), daftar endpoint, tautan `/api-docs`.
- [x] Log error 500 minimal (message + stack ke console/berkas) — tanpa membocorkan detail ke client.
- [x] Uji manual lintas origin: FE `http://localhost:5173` → API `http://localhost:3000` (preflight + respons).

**Ref:** architecture §12 · PRD US-07 · **Verifikasi:** curl / smoke test lulus.

### T-7.2 Perluasan skema (butuh perubahan DB + spec)
- [ ] Kolom `products.availability ENUM('in_stock','pre_order','sold_out')` → badge/CTA FE.
- [ ] Kolom `products.category` (atau tabel `categories`).
- [ ] Tabel `product_specs` / `product_usps` / `product_in_the_box` (bukan kolom JSON).
- [ ] `FULLTEXT INDEX (name, description)` untuk `?search=`.
- [ ] Kolom `products.currency CHAR(3) DEFAULT 'USD'` (multi-currency).
- [ ] Perubahan apa pun → migrasi baru + update `docs/openapi.yaml` + tambah test.

**Ref:** architecture §14 · **Verifikasi:** `docs:openapi` tetap lulus; smoke/regression lulus.

### T-7.3 Di luar scope exercise (catatan saja)
- [ ] Auth/otorisasi (`Authorization`) + `express-rate-limit`.
- [ ] Logging terstruktur (pino/winston), metrics, deployment/HTTPS.

**Ref:** PRD §3.2, architecture §14 · **Verifikasi:** — (tidak dikerjakan untuk exercise ini).

---

## Fase 8 — Cart (keranjang belanja)

> Item ADD TO CART dari front-end disimpan **di database**, bukan hanya di memori browser.
> Identitas cart = **cart token (UUID)** yang dipegang client (localStorage) — tanpa auth, sesuai scope exercise.

### T-8.1 Skema database
- [x] `db/migrations/002_cart.sql`: tabel `carts` (PK `id CHAR(36)` = cart token) + `cart_items`
      (`UNIQUE (cart_id, product_id, color)`, FK komposit → `product_variants(product_id, color)`
      `ON DELETE CASCADE`, `CHECK quantity >= 1`).
- [x] `npm run db:migrate` menjalankan **seluruh** `db/migrations/*.sql` (urut) — `scripts/run-sql.js` menerima folder; `scripts/sql-files.js` dipakai juga oleh `dev-db.js` & `integration.js`.
- [x] `db/seed.sql` me-reset `cart_items`/`carts` agar seed tetap idempoten.

**Ref:** TASK-FRONTEND Blok B/D · **Verifikasi:** `test:integration` migrate 001+002+seed lulus.

### T-8.2 Endpoint cart (layer penuh)
- [x] `POST /api/cart/items` — tambah/gabung item; cart dibuat otomatis (`INSERT IGNORE`).
- [x] `GET /api/cart/:cartToken` — isi cart (`count`, `subtotal`, `items[]` + `unitPrice`/`lineTotal`); token baru → cart kosong `200`.
- [x] `PATCH /api/cart/:cartToken/items/:itemId` — ganti jumlah.
- [x] `DELETE /api/cart/:cartToken/items/:itemId` — hapus satu item.
- [x] `DELETE /api/cart/:cartToken` — kosongkan cart (idempoten, `200`).
- [x] Catch-all `.all()` → `405` + header `Allow` (pola products); CORS `methods` ditambah `PATCH`.
- [x] Layer: `schemas/cart.schema.js` (Zod strict) → `routes` → `middlewares/validateParams.js` (validasi param) → `controllers` → `services` → `repositories` (semua tulis di dalam `withTransaction` + `FOR UPDATE`).

**Ref:** architecture §2–§4 · **Verifikasi:** `npm run smoke` bagian Cart.

### T-8.3 Validasi bisnis & error
- [x] Stok adalah `product_variants.quantity` → jumlah gabungan melebihi stok → `409 INSUFFICIENT_STOCK` (kunci baris varian dulu — aman terhadap request bersamaan).
- [x] Warna tak ada → `404 VARIANT_NOT_FOUND`; produk tak ada → `404 PRODUCT_NOT_FOUND`; item bukan milik token → `404 CART_ITEM_NOT_FOUND`.
- [x] Semua keluar sebagai `application/problem+json` + `code` (ditambahkan ke `errors.js` & `errorHandler.TITLES`).

**Ref:** PRD §8/§10 · **Verifikasi:** asersi C5, C6, C7, C11, C13 lulus.

### T-8.4 Dokumentasi & test
- [x] `docs/openapi.yaml`: tag `cart`, 5 operation, parameter `cartTokenPath`/`itemIdPath`, schema `CartInput`/`CartItemUpdate`/`CartItem`/`Cart`/`CartEnvelope`, response `VariantNotFound`/`InsufficientStock`/`CartItemNotFound`.
- [x] `validate-openapi.js` mewajibkan path cart (`/api/cart/items`, `/api/cart/{cartToken}`).
- [x] `scripts/smoke.js` bagian **Cart** (C1–C14) — auto-SKIP bila MySQL mati.
- [x] `README.md`: tabel endpoint cart + catatan `002_cart.sql`.

**Ref:** architecture §13 · **Verifikasi:** `docs:openapi` lulus · `test:integration` **60 PASS / 0 FAIL / 0 SKIP** (suite penuh; Fase 8 sendiri diverifikasi saat suite 41 PASS).

---

## Fase 9 — Orders (pesanan)

> Permintaan: *“bisa melihat apa yang dipesan, CRUD, database + API yang
> menghubungkan front end, backend, dan database.”* Pesanan = **checkout cart**
> (snapshot nama & harga) — statusnya bisa diubah/dihapus, stok ikut bergerak.

### T-9.1 Skema database
- [x] `db/migrations/003_orders.sql`: tabel `orders` (`order_number` UNIQUE, `cart_id`, `status`
      `VARCHAR` + `CHECK` 5 enum, `customer_name`/`email`/`note` nullable, `items_count`,
      `subtotal`/`total`, index) + `order_items` (snapshot `product_name`/`color`/`unit_price`,
      FK → `orders(id) ON DELETE CASCADE`, **tanpa FK** ke products/carts — arsip tidak ikut
      berubah bila produk dihapus).
- [x] `db/seed.sql` me-reset `order_items`/`orders` di awal (idempoten) + 2 pesanan contoh
      (`MD-261001-A11C` delivered, `MD-261005-B22D` pending) agar halaman Orders langsung berisi.
- [x] `npm run db:migrate` menjalankan 001+002+003 berurutan.

**Ref:** TASK-FRONTEND Blok F · **Verifikasi:** `test:integration` migrate 001+002+003+seed lulus.

### T-9.2 Endpoint orders (layer penuh)
- [x] `GET /api/orders` — list + filter `cartToken`/`status` + `limit` (1–100) / `offset` → `{data, meta:{total,limit,offset}}`; item di-preload (tanpa N+1).
- [x] `POST /api/orders` — checkout `{cartToken, customerName?, email?, note?}` → **201 + `Location`**; cart kosong → **409 CART_EMPTY**; potong stok per varian (kunci baris), snapshot nama+harga ke `order_items`, cart dikosongkan — semua dalam satu transaksi.
- [x] `GET /api/orders/:orderId` — detail (bila tak ada → **404 ORDER_NOT_FOUND**).
- [x] `PATCH /api/orders/:orderId` — ubah `status` (enum 5 nilai) — **bukan PUT**.
- [x] `DELETE /api/orders/:orderId` — **204** tanpa body; stok dikembalikan (kecuali status `cancelled`, sudah diembalikan).
- [x] Catch-all `.all()` → 405 + `Allow` (`GET, HEAD, POST, OPTIONS` untuk collection; `GET, HEAD, PATCH, DELETE, OPTIONS` untuk item); `validateOrderId` menolak `abc` → 400.

**Ref:** architecture §2–§4 · **Verifikasi:** `npm run smoke` bagian Orders (O1–O19).

### T-9.3 Validasi bisnis & error
- [x] Body pakai Zod `.strict()` + refine (PATCH `{}` → 400 minimal satu field); `Content-Type` selain JSON → 415; status tak dikenal → 400 `field=status`.
- [x] `errors.js`: `orderNotFound()` (404) + `cartEmpty()` (409) → masuk `errorHandler.TITLES`.
- [x] Simetri stok: masuk `cancelled` → stok kembali; keluar `cancelled` → stok dipotong lagi (O16); `DELETE` → stok penuh (O18).
- [x] `orderNumber` = `MD-YYMMDD-XXXXXX` (6 hex uppercase) dengan retry ≤3 saat `ER_DUP_ENTRY`.

**Ref:** PRD §8/§10 · **Verifikasi:** asersi O1, O8–O16, O18–O19 lulus.

### T-9.4 Dokumentasi & test
- [x] `docs/openapi.yaml`: tag `orders`, path `/api/orders` + `/api/orders/{orderId}`, parameter (`orderCartTokenQuery`/`orderStatusQuery`/`orderIdPath`), schema `Order`/`OrderItem`/`OrderInput`/`OrderUpdate`/`OrderEnvelope`/`OrderListResponse`, response `OrderNotFound`.
- [x] `validate-openapi.js` mewajibkan path orders → **OPENAPI OK — 8 paths**.
- [x] `scripts/smoke.js` bagian **Orders** (O1–O19) & `scripts/integration.js` ikut berjalan → masing-masing **60 PASS / 0 FAIL / 0 SKIP**.
- [x] `README.md` (api-produk): tabel endpoint orders + penjelasan semantik stok/pesanan.

**Ref:** architecture §13 · **Verifikasi:** `docs:openapi` lulus · `smoke` & `test:integration` **60 PASS / 0 FAIL / 0 SKIP**.

---

## Dependensi Antar-Tugas

```
T-0.1 → T-0.2 → T-1.1 → T-1.2 → (T-2.* … T-4.* bisa diverifikasi)
                                   T-2.1 → T-2.2 → T-2.3
                                   T-3.1 → T-3.2
                                   T-2.* + T-3.* → T-4.1 → T-4.2 → T-4.3
T-5.* (independent, butuh route final)
T-6.1 → T-6.2 → T-6.3 → T-6.4 → T-6.5   (T-6.3/6.4 butuh Fase 1 lulus)
T-7.1 → serah terima; T-7.2 → rilis berikutnya
T-8.* (setelah Fase 1) → konsumsi oleh TASK-FRONTEND Blok D
T-9.* (setelah Fase 8) → konsumsi oleh TASK-FRONTEND Blok F (checkout + halaman Orders)
```

---

## Definition of Done (DoD) Backend

1. Fase 0–4 & 8–9 seluruhnya tercentang dan **diverifikasi dengan DB hidup** (bukan hanya kode).
2. `npm run smoke` → 0 FAIL; `npm run test:integration` exit 0 (60 asersi: 26 produk + 15 cart + 19 orders).
3. Test matrix PRD T1–T35 lulus (Fase 6.5).
4. `npm run docs:openapi` lulus (8 paths); Swagger UI terbuka di `/api-docs` dan operasi products/cart/orders bisa di-"Try it out".
5. Tidak ada SQL di luar repository; tidak ada kredensial di repo (`.env` ter-ignore).
6. Semua error keluar sebagai `application/problem+json` dengan `code` yang sesuai.
7. `README.md` menjelaskan setup dari nol sampai server hidup.
