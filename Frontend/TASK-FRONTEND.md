# Task List — Frontend (Halaman Detail Produk)

| Informasi | Keterangan |
|-----------|-----------|
| Dokumen | TASK-FRONTEND.md (tasklist frontend — pasangan `TASK-BACKEND.md`) |
| Lokasi | Root project (`src/`, `public/`, `index.html`) |
| Stack | Vite + Vanilla HTML/CSS/JavaScript |
| Detail lengkap | Fase 0–9 per sub-task → `TASK.md` (dokumen induk, mayoritas sudah selesai) |
| Perintah | `npm run dev` · `npm run build` · `npm run preview` · `npm test` |
| Backend | `api-produk/` — API `http://localhost:3000` · Swagger UI `/api-docs` · spec `/openapi.yaml` |

**Cara pakai**
- Centang `[ ]` → `[x]` setelah diverifikasi (build lulus, console bersih, alur teruji).
- **Blok A** = sisa pekerjaan frontend murni · **Blok B** = integrasi backend API · **Blok E** = halaman detail ke-2 (syarat Mini Project) · **Blok C** = lanjutan opsional.
- Status terakhir diperbarui: **8 Okt 2026**.

---

## Menyiapkan Environment (wajib sebelum Blok B)

Frontend **tidak perlu koneksi MySQL langsung** — Docker Compose hanya dijalankan
sekali oleh siapa pun yang menghidupkan backend, lalu FE cukup memanggil API.

```bash
# 1) Hidupkan database + backend (sekali per sesi kerja)
cd api-produk
cp .env.example .env            # sekali saja — kredensial = default compose
docker compose up -d             # MySQL 8 → container api-produk-mysql :3306
docker compose ps                # tunggu status healthy
npm run db:migrate && npm run db:seed
npm run dev                      # API hidup → http://localhost:3000/api-docs

# 2) Di terminal terpisah: jalankan frontend
cd .. (root project)
npm run dev                      # Vite → http://localhost:5173
```

> **Tanpa Docker:** backend juga bisa dijalankan dengan MySQL in-memory →
> `cd api-produk && npm run db:dev` (MySQL `127.0.0.1:3307`, user/grant dibuat otomatis
> dari `.env`, lalu `npm run db:migrate && npm run db:seed` di terminal berbeda).

- Detail & troubleshooting DB → `TASK-BACKEND.md` Fase 1.
- Tanpa backend, halaman tetap jalan 100% dari mock `src/data/product.js` (fallback di Blok B).

---

## Status Implementasi (ringkas dari TASK.md)

| Bagian | Status | Keterangan |
|--------|--------|-----------|
| Fase 0 Setup · 1 Data & state · 2 Tokens & skeleton | ✅ selesai | Struktur `data/state/components/styles/utils` sesuai DESIGN §4 |
| Fase 3 Komponen inti · 4 Konten · 5 Newsletter/footer | ✅ selesai | Semua render dari `src/data/product.js` (single source of truth) |
| Fase 6 Responsive | ✅ selesai | T-6.1 drawer mobile (hamburger ≤1023px, focus trap) · T-6.2…T-6.4 lulus |
| Fase 7 A11y & perf | ✅ selesai | Focus visible, ARIA, lazy-load, reduced-motion |
| Fase 8 QA AC | ✅ selesai | `npm test` → **175/175 lulus** (jsdom + E2E API hidup) · overflow 375px = 0 di 3 halaman · 0 console error |
| Fase 9 Finalisasi | ✅ selesai | T-9.1/T-9.2 selesai; T-9.3 dicentang (T-6.1 lulus) |
| **Integrasi backend API** | ✅ selesai | Blok B: render dari `GET /api/products/:id` + fallback + error page (Blok E) |
| **Cart → database** | ✅ selesai | CTA aktif (`in_stock`) · optimistik + sinkron `POST /api/cart/items` · restore saat boot |
| **Cart panel + checkout** | ✅ selesai | Blok F1–F2: panel cart (qty ±, hapus, subtotal) + form checkout → `POST /api/orders` |
| **Halaman Orders (CRUD)** | ✅ selesai | Blok F3–F5: `orders.html` list/ubah status/hapus dari `GET/PATCH/DELETE /api/orders` |

---

## Blok A — Sisa Pekerjaan Frontend Murni

### A1. Drawer mobile (penghambat T-6.1 & T-9.3)
- [x] Hamburger toggle di header (≤1023px) → drawer `role="dialog"` + overlay; tutup via × / Esc / klik overlay.
- [x] Drawer memuat nav utama, country selector, account (yang kini disembunyikan di ≤640px).
- [x] Tap target ≥44px; fokus masuk ke drawer dan kembali ke trigger saat ditutup (focus trap).
- [x] `aria-expanded` pada trigger hamburger; body scroll di-lock saat drawer terbuka.
- [x] Verifikasi: `npm test` blok T-6.1 (9 asersi) · overflow diukur di Chromium pada viewport 375px → `scrollWidth - clientWidth = 0` · 0 console error.

**Ref:** TASK.md T-6.1 · FR-01, FR-24, AC-15 · **Verifikasi:** jsdom smoke + Chromium headless.
**Implementasi:** `src/components/header.js` (`initDrawer`) · `src/styles/layout.css` (`.icon-btn.nav-toggle`, `.drawer*`).

### A2. Finalisasi
- [x] T-6.1 lulus → centang T-9.3: arsipkan task, perbarui "known issues" di `TASK.md`.
- [ ] (Opsional) uji lintas browser Firefox/Safari bila tersedia.
- [x] Pastikan `npm run build` + `npm test` tetap lulus setelah perubahan drawer → **111/111** (milestone; suite kini **175/175**).

**Ref:** TASK.md T-9.3 · **Verifikasi:** semua checklist TASK.md tercentang.

---

## Blok B — Integrasi Backend API (Langkah 2)

> Kontrak: `api-produk/context/prd.md` §8 (respons) dan §14.1 (pemetaan payload → komponen).
> Field yang **tersedia dari API**: `id`, `name`, `price`, `currency`, `description`, `images[]` (dengan `color`), `variants[]` (`color`, `swatch`, `quantity`).
> Field yang **belum ada di DB** (tetap dari `src/data/product.js`): `category`, `availability`, `usps[]`, `policies`, `story`, `specs[]`, `inTheBox[]`, `support`, `newsletter` → `api-produk` architecture §6.1/§14.
> **Jangan simpan kredensial DB di front-end** — semua akses MySQL lewat API Express saja.

### B1. API client & konfigurasi
- [x] `src/utils/api.js` — wrapper `fetch`: base URL dari `import.meta.env.VITE_API_URL` (default `http://localhost:3000`), timeout/abort, parse envelope `{data}`.
- [x] Tangani `application/problem+json` (RFC 9457) → objek error terstruktur (`code`, `title`, `detail`, `errors[]`).
- [x] `.env.example` front-end: `VITE_API_URL=http://localhost:3000`.
- [x] Pastikan CORS backend mengizinkan origin `http://localhost:5173` (sudah di `api-produk/.env`).

**Ref:** PRD §14.3, US-07 · **Verifikasi:** panggil API dari halaman dev tanpa blokir CORS → Chromium render `product-api.html` dengan `data-status="api"`.

### B2. Boot: fetch payload detail
- [x] Saat init, `GET /api/products/mw75-tumi` → render seluruh section dari `.data` (`src/main-api.js`).
- [x] **Loading state**: skeleton/placeholder saat menunggu (tanpa layout shift, CLS tetap ~0) — `renderLoading()` di `src/app.js` + `src/styles/states.css`.
- [x] **Gagal jaringan / API mati** → fallback ke `src/data/product.js` + `console.error` + indikator halus (strip `data-status="fallback"` — halaman tetap utuh).
- [x] **400/404 (problem+json)** → tampilkan pesan fallback dari `detail`, **jangan** render konten setengah jalan (`renderErrorPage`).
- [x] Ganti varian tetap **tanpa request baru** (state lokal + URL `?variant=`).

**Ref:** PRD §14.2, §14.3, §14.4 · **Verifikasi:** matikan API → halaman tetap tampil (mock); hidupkan API → data dari server (smoke skenario A/B/C + E2E).

### B3. Pemetaan payload → komponen
- [x] `name`, `price`, `currency` → purchase panel (`formatCurrency` tetap `US$750.00`).
- [x] `images[]` → **filter per warna** (`images.filter(i => i.color === varianWarna)`) → gallery (urutan `sort_order` sudah dari query); fallback ke set lokal bila varian tak punya foto.
- [x] `variants[]` → variant selector (`color`, `swatch`); `quantity = 0` → status habis (CTA mati).
- [x] `description` → section description.
- [x] Field tanpa sumber DB (`category`, `availability`, `usps`, `policies`, `story`, `specs`, `inTheBox`, `support`) → **merge fallback** dari `src/data/product.js` (satu fungsi `mergeProduct(apiData)` di `src/data/merge.js`).
- [x] Harga/spec **hanya** dari satu sumber (jangan duplikasi literal — NFR-04).

**Ref:** PRD §14.1 · TASK.md T-9.1 · **Verifikasi:** grep `750`/`338`/`40mm` hanya di `src/data/` dan payload API.

### B4. State aplikasi & resilience
- [x] Tambah state `productStatus: 'loading' | 'ready' | 'fallback' | 'error'` (factory `createProductStore()` di `src/app.js`).
- [x] CTA/badge mengikuti `availability` (dari mock, selama kolom belum ada di DB) + `variants[].quantity` bila relevan.
- [x] Tidak ada console error pada alur: buka → load → ganti varian → cart → search → newsletter (dengan API hidup & mati) — `console.error` hanya dipakai sengaja pada fallback sesuai B2.

**Ref:** BHV-04, AC-08, AC-20 · **Verifikasi:** uji dua skenario (API up/down) di smoke test.

### B5. QA integrasi
- [x] `npm run build` sukses; `npm test` tetap lulus → saat itu **111/111** (kini 175/175; smoke test diperluas untuk halaman 2).
- [x] Uji viewport 375 / 768 / 1024 / 1440: tidak ada overflow (375px → `scrollWidth - clientWidth = 0`), 0 console error.
- [x] Uji keyboard + ARIA ulang untuk area yang berubah (loading/live region baru) — `role="status"`, `aria-busy`, `aria-live` skeleton & error page.
- [x] Verifikasi kontrak pakai `npm run smoke` di backend (endpoint yang dipakai FE lulus).

**Ref:** TASK.md Fase 8 · architecture §13 · **Verifikasi:** seluruh skrip lulus.

---

## Blok D — Cart tersimpan di database ✅

> Butuh backend Fase 8 (`TASK-BACKEND.md`) hidup untuk sinkronisasi; tanpa API halaman tetap jalan (fallback state lokal).

### D1. Status CTA mengikuti availability + stok varian
- [x] `src/data/product.js`: `availability: 'in_stock'` (badge **In stock**, CTA aktif) + `quantity` per varian (Black 12 / Silver 0 = sama dengan seed).
- [x] `purchase-panel.js`: `getCtaState()` → `enabled = availability.enabled && stok varian > 0`; helper "This color is currently out of stock." bila varian habis; `syncPurchase` update `data-tone` feedback.
- [x] `scripts/smoke.mjs`: badge `/In stock/`, CTA disabled saat `?variant=silver`, klik CTA aktif → count 1 + feedback. **Suite saat itu 111/111** (kini **175/175**).

### D2. API client
- [x] `src/utils/api.js`: base URL `VITE_API_URL` (default `http://localhost:3000`), timeout 5s (`AbortController`), buka envelope `{data}`, error `problem+json` → `{status, code, title, detail, errors[]}`; **tidak pernah melempar** (gagal jaringan → `{ok:false}`), aman bila `fetch` tak tersedia.

### D3. Cart state + sinkronisasi
- [x] `src/state/cartToken.js`: UUID di `localStorage` (`md:cart-token`) dengan fallback `crypto.randomUUID` → `getRandomValues` → `Math.random`.
- [x] `src/state/cart.js` (tulis ulang): item `{productId, productName, variant, quantity}`, `count = Σ quantity`;
  - **optimistik**: update state + feedback sukses + snapshot `localStorage` (`md:cart-items`) → lalu `POST /api/cart/items`;
  - sukses → state diganti dari payload server; **ditolak server** (mis. `409`) → feedback `tone: error` + resync `GET`; gagal jaringan → tetap lokal + `console.warn` (bukan `error`);
- [x] `restoreCart(store)` saat boot di `main.js`: hydrate snapshot lokal → tukar dengan cart server bila API hidup (refresh halaman → count tetap dari DB).

**Ref:** REQUIREMENTS FR-11, BHV-04/05, AC-08 · TASK-BACKEND Fase 8 · **Verifikasi:** `npm run build && npm test` → saat itu 111/111, kini **175/175** · E2E: klik ADD TO CART → baris muncul di tabel `cart_items`.

---

## Blok E — Halaman Detail Produk ke-2 (syarat Mini Project) ✅

> Guidance submission: **2 halaman detail produk** — halaman 1 memakai data hardcode,
> halaman 2 mengambil konten dari response API. Stack sama (HTML/CSS/Vanilla JS).

### E1. Halaman 2 (server-rendered via API)
- [x] `product-api.html` + `src/main-api.js` (entry terpisah, terdaftar di `vite.config.js` multi-page).
- [x] Boot: `renderLoading()` (skeleton, `role="status"`) → `GET /api/products/mw75-tumi` → `setProduct(mergeProduct(data))` → `mountApp({source:'api'})`.
- [x] Strip **sumber data** di bawah header: `data-status="api"` (`GET /api/products/mw75-tumi`), `fallback` (mock), `error` (problem+json) — indikator halus, tidak mengubah layout.
- [x] Envelope `{data}` + `problem+json` ditangani `src/utils/api.js`; timeout 5s → fallback.
- [x] Varian/galeri/CTA di halaman 2 memakai logika yang sama (module bersama), tanpa duplikasi literal harga/spec.

### E2. Tautan & isolasi halaman
- [x] Footer `Help & Info` → link **Product Detail (API)** → `./product-api.html` (halaman 1 tetap hardcode).
- [x] `mergeProduct(api)` (`src/data/merge.js`) hanya menimpa field yang tersedia dari API; sisanya tetap dari `src/data/product.js`.
- [x] Kedua halaman di-build Vite (`dist/index.html`, `dist/product-api.html`).

### E3. QA halaman 2
- [x] Smoke: skenario API hidup (payload dari server) · 404 problem+json → error page · API mati → fallback mock · E2E live `npm test` (saat itu 111/111; kini **175/175**).
- [x] Chromium headless: `product-api.html` `data-status="api"`, details JSON sesuai response API, 0 console error, overflow 375px = 0.

**Ref:** Guidance Mini Project (2 halaman detail) · PRD §14 · **Verifikasi:** `npm test` + Chromium headless.

---

## Blok F — Cart panel + Halaman Orders (CRUD via API) ✅

> Permintaan: *“bisa melihat apa yang dipesan, CRUD, database + API yang
> menghubungkan front end, backend, dan database.”* Cart panel menjadi titik
> checkout; `orders.html` menjadi layar baca/ubah/hapus pesanan.

### F1. Cart panel (semua halaman)
- [x] `src/components/cart-panel.js`: panel `role="dialog"` + overlay, focus trap, tutup via ×/Esc/klk overlay, body scroll-lock; badge count, item ± qty, hapus item, subtotal (ikut market).
- [x] Di-wire di `renderHeader`/`initHeader`/`syncHeader` → tampil di **ketiga halaman** (styling di `components.css`).
- [x] Signature keanggotaan baris (`itemId` fallback `productId:variant`) → re-render hanya saat item masuk/keluar; qty disinkron per baris (tanpagang focus).
- [x] `state/cart.js`: `updateCartItem`/`removeCartItem` menerima objek item (identitas `itemId` atau `productId+variant`) → optimistik lokal + PATCH/DELETE server bila sudah punya `itemId`.

### F2. Checkout → `POST /api/orders`
- [x] Form checkout (nama/email/note) dengan validasi klien (min 2 karakter, pola email) + `aria-invalid`.
- [x] `placeOrder()` di `state/cart.js`: `POST /api/orders {cartToken, customerName, email, note}` → feedback nomor pesanan, cart dibersihkan (lokal + server), error problem+json ditampilkan apa adanya (mis. 409 `CART_EMPTY`).

### F3. Halaman Orders
- [x] `orders.html` + `src/main-orders.js` + `src/orders-app.js` (entry ke-3 di `vite.config.js`), `src/components/orders-view.js`.
- [x] Boot: skeleton → `GET /api/orders?limit=50` → kartu pesanan (nomor, badge status, item snapshot nama·warna·qty·line total, total, customer, note, details **response API mentah**).
- [x] Strip **sumber data** `data-status="api"` / `"error"` konsisten dengan halaman detail; breadcrumb + nav/footer link **Orders**/**My Orders** dari `data/product.js`.

### F4. Aksi CRUD di UI
- [x] **Update**: select status (5 enum) + `Update status` → `PATCH /api/orders/:id` → badge & pesan kartu + feedback global diperbarui (elemen diambil ulang setelah render ulang).
- [x] **Delete**: konfirmasi **2 langkah** (label berubah + `is-danger`) → `DELETE /api/orders/:id` → kartu hilang; kegagalan mengembalikan tombol ke semula + pesan error.
- [x] **Empty state** (link “Mulai belanja”) & **error state** (HTTP + code + tombol `Coba lagi` → retry).

### F5. QA halaman Orders
- [x] Smoke stub: loading skeleton → list (nomor/badge/item/total/customer/details/select 5 opsi) · PATCH terpanggil + badge berubah · DELETE 2-langkah + kartu hilang · empty · error `NO_FETCH` + retry pulih.
- [x] E2E live (`npm test`, API+DB hidup): isi cart → `POST /api/orders` 201 + stok Black −2 + cart kosong → order tampil di halaman → PATCH lewat UI → DELETE lewat UI → `GET` detail 404 + **stok kembali penuh** · 0 console error.
- [x] Chromium headless: `orders.html` desktop menampilkan kartu pesanan; viewport 375px → **overflow 0** (`cards=2` terukur di iframe 375).

**Ref:** TASK-BACKEND Fase 9 · api-produk/docs/openapi.yaml (`/api/orders`) · **Verifikasi:** `npm test` → **175/175** · `cd api-produk && npm run smoke` → 60 PASS.

---

## Blok C — Lanjutan Opsional (di luar MVP saat ini)

- [ ] List produk (`GET /api/products?search=&limit=&offset=`) → dipakai panel search (kini dari `src/data/suggested.js`).
- [ ] Halaman cart / checkout (simulasi → hitung backend).
- [ ] Halaman `/products` bila katalog bertambah >1 produk.
- [ ] Surface field baru begitu backend menambah `availability` / `category` / `specs` (lihat `TASK-BACKEND.md` T-7.2).

**Ref:** PRD §7.11 (US-10) · architecture §14 · **Verifikasi:** per kasus.

---

## Dependensi Antar-Tugas

```
A1 (drawer) → A2 (finalisasi TASK.md)
B1 → B2 → B3 → B4 → B5
D1 → D2 → D3  (D2–D3 butuh TASK-BACKEND Fase 8 untuk sinkron penuh)
E1 → E2 → E3  (E memakai B1 API client + B3 pemetaan payload; halaman 1 tetap hardcode)
F1 → F2 (checkout butuh panel) · F3 → F4 → F5  (F memakai API client B1 + backend Fase 9)
A1 independen dengan Blok B → bisa paralel
B* butuh backend Fase 1 (DB hidup) untuk verifikasi penuh → lihat TASK-BACKEND.md
C menunggu B, D & E selesai
```

---

## Definition of Done (DoD) Frontend

1. Blok A tercentang: drawer mobile berfungsi, `TASK.md` Fase 6 & 9 penuh, `npm test` 175/175.
2. Blok B tercentang: halaman render dari API dengan fallback mock yang andal (API up & down), 0 console error.
3. Blok E tercentang: `product-api.html` menampilkan konten dari response API, halaman 1 tetap hardcode.
4. Blok F tercentang: cart panel bisa checkout ke `POST /api/orders`, `orders.html` bisa lihat/ubah/hapus pesanan dari database, E2E membuktikan stok ikut berubah.
5. `npm run build` + `npm run preview` tanpa error; tidak ada horizontal overflow di 375px (ketiga halaman).
6. Data single-source: konten yang tidak datang dari API tetap hanya di `src/data/product.js`.
7. Keyboard navigation, focus visible, dan ARIA inti tetap lulus (AC-16, AC-17) — termasuk dialog cart panel.
8. Hierarki visual terjaga: purchase → value prop → story → specs → package → support → footer.
