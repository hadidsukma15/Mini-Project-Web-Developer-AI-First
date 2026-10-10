# Task Breakdown
## Product Detail Page — MW75 TUMI (Master & Dynamic-inspired)

| Informasi | Keterangan |
|-----------|-----------|
| Dokumen | TASK.md (Langkah 3 dari 3: Requirements → Design → Task) |
| Versi | 1.0 |
| Input | `REQUIREMENTS.md` v1.0, `DESIGN.md` v1.0 |
| Stack | Vite + Vanilla HTML/CSS/JavaScript |
| Perintah | `npm run dev` (dev) · `npm run build` (build) · `npm run preview` (uji build) |

**Cara pakai dokumen ini**
- Centang (`[ ]` → `[x]`) setiap sub-task setelah diverifikasi.
- Kolom **Ref** menunjuk FR/BHV/AC di `REQUIREMENTS.md` dan bagian desain di `DESIGN.md`.
- Urutan fase mengikuti dependensi; tugas dalam satu fase bisa dikerjakan paralel jika tidak saling menunggu.
- Definisi Umum Selesai (DoD) ada di §9; checklist final AC di §10.

---

## Status Implementasi (update terakhir)

| Fase | Status | Keterangan |
|------|--------|-----------|
| 0 Setup | ✅ selesai | Template Vite dibersihkan; struktur `data/state/components/styles/utils` sesuai DESIGN §4 |
| 1 Data & state | ✅ selesai | Single source of truth di `src/data/product.js` (terverifikasi: `750`, `338`, `40mm` tidak terduplikasi di luar data) |
| 2 Tokens & skeleton | ✅ selesai | `tokens/base/layout/components.css` |
| 3 Komponen inti | ✅ selesai | Header, search, gallery, purchase, variant, cart simulasi |
| 4 Konten | ✅ selesai | USP → support, semua render dari data |
| 5 Newsletter/footer | ✅ selesai | Validasi email simulasi |
| 6 Responsive | ✅ selesai | T-6.1 drawer mobile (hamburger ≤1023px, focus trap, Esc/overlay tutup) · T-6.2…T-6.4 lulus (0 overflow di 375/414/641/768/1024/1280/1440/1920) |
| 7 A11y & perf | ✅ selesai | Focus visible, ARIA (radiogroup/aria-current/aria-expanded/live region), lazy-load, reduced-motion |
| 8 QA AC | ✅ selesai | `npm test` → **175/175 check** lulus (jsdom + E2E API); browser: 0 console error, 0 overflow (375px diukur di Chromium) |
| 9 Finalisasi | ✅ selesai | T-9.1/T-9.2/T-9.3 selesai (T-6.1 lulus → T-9.3 dicentang) |
| Halaman detail ke-2 | ✅ selesai | `product-api.html` mengambil konten dari `GET /api/products/mw75-tumi` (syarat Mini Project: 2 halaman detail) |
| Cart panel + checkout | ✅ selesai | Panel cart (drawer kanan) di semua halaman: qty ±, hapus, subtotal, form checkout → `POST /api/orders` |
| Halaman Orders (CRUD) | ✅ selesai | `orders.html` — daftar dari `GET /api/orders`, ubah status `PATCH`, hapus 2-langkah `DELETE`, empty/error/retry |

**Verifikasi yang sudah dijalankan**
- `npm test` (`vite build` + `scripts/smoke.mjs`, jsdom): **175/175 pass** — mencakup AC-01, AC-03…AC-20 (struktur, gallery, varian+URL, search, country/currency, CTA disabled, ARIA, heading order, newsletter) + drawer mobile (T-6.1) + halaman 2 (loading → render API, 404 problem+json, fallback API mati, E2E ke API+MySQL hidup) + cart panel (buka/qty/validasi checkout/`POST /api/orders`) + halaman Orders (list, update status `PATCH`, delete 2-langkah, empty, error+retry) + E2E Orders live (checkout → stok terpotong → hapus → stok pulih).
- Playwright/Chromium: render desktop 1440 & mobile 375, **0 console error**, tidak ada horizontal overflow pada 8 breakpoint (ulang 8 Okt 2026 di Chromium headless: `scrollWidth - clientWidth = 0` pada viewport 375px untuk `index.html`, `product-api.html`, & `orders.html`).
- Asset: 21 gambar (gallery Black/Silver, ikon USP, feature, in-the-box, support) dimuat lokal dari `public/img`.

**Known issues / next step**
1. ~~**T-6.1** — hamburger + drawer mobile~~ → **selesai** (8 Okt 2026): toggle ≤1023px, drawer `role="dialog"` + overlay, tutup via ×/Esc/klik overlay, focus trap, body scroll-lock, uji 375px 0 overflow.
2. State katalog saat ini `availability: 'in_stock'` + `quantity` per varian (Black 12 / Silver 0, sama dengan seed DB) → badge “In stock”, CTA varian habis disabled. Ubah di `src/data/product.js` bila ingin mendemo-kan alur lain (BHV-05).
3. Belum diuji lintas browser (Firefox/Safari) bila tersedia.
4. Ide lanjutan sesuai Non-Goals/next step: list produk via `GET /api/products?search=` untuk panel search, halaman cart tersendiri (kini panel cart + `orders.html` sudah ada), surface field baru (`availability`/`category`/`specs`) begitu backend menambahnya.

---

## Peta Fase ↔ Goal PRD

| Fase | Isi | Goal |
|------|-----|------|
| 0 | Setup & cleanup template Vite | fondasi |
| 1 | Data produk + state | single source of truth (NFR-04) |
| 2 | Kerangka halaman & design tokens | hierarchy visual |
| 3 | Komponen inti (header, gallery, purchase) | G-01…G-04, G-11 |
| 4 | Komponen konten (USP → support) | G-05…G-10 |
| 5 | Komponen eksternal (newsletter, footer) | G-11 |
| 6 | Responsive & mobile polish | G-12 (FR-24) |
| 7 | Accessibility & performance polish | G-12 (FR-25, NFR-02/03) |
| 8 | QA menyeluruh (AC-01…AC-20) | Success Criteria |
| 9 | Finalisasi & handoff | dokumentasi |

---

## Fase 0 — Setup & Cleanup

### T-0.1 Bersihkan template Vite
- [x] Hapus/replace konten demo di `src/main.js` (hero logo, counter, docs section).
- [x] Hapus `src/counter.js` dan import-nya.
- [x] Kosongkan/isi ulang `src/style.css` (akan digantikan `src/styles/*`).
- [x] Ganti `index.html`: `<html lang="id">`, `<title>MW75 TUMI — Master & Dynamic</title>`, `<meta name="description">`, struktur `<div id="app">`.
- [x] Pastikan `src/assets/hero.png`, `javascript.svg`, `vite.svg` tidak lagi dipakai (hapus bila tidak dipakai).

**Ref:** DESIGN §4 · **Verifikasi:** `npm run dev` tanpa error; halaman kosong/rapi; console bersih.

### T-0.2 Buat struktur folder
- [x] `src/data/`, `src/state/`, `src/components/`, `src/styles/`, `src/utils/`.
- [x] (Bila perlu) `public/img/` untuk placeholder gambar produk.

**Ref:** DESIGN §4 · **Verifikasi:** struktur sesuai DESIGN §4.

---

## Fase 1 — Data & State (Single Source of Truth)

### T-1.1 Data produk `src/data/product.js`
- [x] Definisikan objek `product`: `id`, `name`, `category`, `price: 750`, `availability`, `cta`.
- [x] Definisikan `variants[]`: `black` (default) & `silver`, masing-masing `id`, `label`, `swatch`, `images[]` (3–5 gambar + `alt` deskriptif per varian).
- [x] Definisikan `usps[]` (6 item sesuai FR-13).
- [x] Definisikan `specs[]` per kelompok (Build, Audio, Microphone, Power, Connectivity, Accessories) → `{ label, value }` — nilai **338 g**, **40mm beryllium**, **Bluetooth 5.1**, battery 32h/28h ANC, dst.
- [x] Definisikan `inTheBox[]` (7 item persis FR-20).
- [x] Definisikan `policies` (shipping US$99+, returns 14 hari, warranty), `story` (TUMI/19 Degree), `description` (Adaptive ANC dll).

**Ref:** FR-06…FR-20, NFR-04 · DESIGN §4.1 · **Verifikasi:** satu module berisi semua konten hero/USP/spec/box; tidak ada nilai duplikat di tempat lain.

### T-1.2 Data pendukung
- [x] `src/data/markets.js` — daftar market + currency (US/USD default, + beberapa simulasi).
- [x] `src/data/suggested.js` — 4–6 produk saran untuk search.

**Ref:** FR-02, FR-03 · **Verifikasi:** data valid, ter-export.

### T-1.3 Store `src/state/store.js`
- [x] Implement `createStore(initialState)` dengan `getState()`, `setState(patch)`, `subscribe(listener)`.
- [x] State awal: `variantId`, `galleryIndex`, `cart`, `ui { searchOpen, menuOpen, marketOpen, market }`, `toast`.

**Ref:** DESIGN §4.1, §6 · **Verifikasi:** unit manual di console: setState memicu subscribe.

### T-1.4 Varian + URL sync `src/state/variant.js`
- [x] Baca `?variant=` dari `location.search` saat init; fallback `black` bila tidak valid (tanpa error).
- [x] `setVariant(id)` → update state, reset `galleryIndex` ke 0, `history.replaceState` `?variant=<id>`.

**Ref:** BHV-02, BHV-03, FR-10, AC-18 · DESIGN §6 · **Verifikasi:** ganti varian → URL berubah tanpa reload; buka `?variant=silver` langsung benar; `?variant=xxx` → fallback black.

### T-1.5 Cart simulasi `src/state/cart.js`
- [x] `addToCart(variantId)` → push item, `count++`; opsional persist ke `localStorage`.
- [x] Emit perubahan lewat store subscribe.

**Ref:** BHV-05, FR-11 · **Verifikasi:** tambah item → count naik; refresh (jika localStorage) tetap.

### T-1.6 Utilitas
- [x] `src/utils/format.js` → `formatCurrency(amount, market)` menghasilkan `US$750.00` (state referensi).
- [x] `src/utils/dom.js` → helper `el()`, `escapeHtml()` bila perlu.

**Ref:** FR-07, AC-07 · **Verifikasi:** `formatCurrency(750, US)` → `"US$750.00"`.

---

## Fase 2 — Kerangka Halaman & Design Tokens

### T-2.1 Design tokens `src/styles/tokens.css`
- [x] Variabel warna, tipografi (type scale + clamp), spacing, radius, shadow, container, tap-target 44px — sesuai DESIGN §3.

**Ref:** DESIGN §3 · **Verifikasi:** nilai terpakai lewat `var(--…)`.

### T-2.2 Base & layout `src/styles/base.css`, `src/styles/layout.css`
- [x] Reset ringan, `box-sizing`, gambar `max-width:100%`, `body` font & warna.
- [x] `.container` max-width 1280px + padding responsif.
- [x] Focus style global `:focus-visible` (outline biru, offset) — jangan dihapus.
- [x] Utility section padding (`--section-padding-y`) desktop/mobile.
- [x] Import semua stylesheet dari `src/main.js` (atau satu `styles/index.css`).

**Ref:** NFR-01, NFR-02 · DESIGN §3, §8 · **Verifikasi:** focus terlihat saat Tab; container center.

### T-2.3 Render skeleton halaman `src/main.js`
- [x] Render urutan section sesuai IA (DESIGN §1.1): header mount point → `<main>` (hero, usp, trust, story, description, specs, box, support) → newsletter → footer.
- [x] Heading hierarchy: 1× `h1` (di purchase panel), `h2` per section, `h3` per kartu.
- [x] Import & init store, varian dari URL, render awal semua section (konten bisa placeholder dulu).
- [x] Subscribe store → fungsi `update()` per bagian.

**Ref:** BHV-09, AC-01, Success #9 · **Verifikasi:** `npm run dev` menampilkan urutan section lengkap; tidak ada JS error; urutan visual = purchase → USP → story → specs → box → support → footer.

---

## Fase 3 — Komponen Inti

### T-3.1 Header `src/components/header.js`
- [x] Brand "Master & Dynamic", nav: Headphones, Earphones, Accessories, Collaborations, Blog.
- [x] Actions: country selector (button + `aria-expanded`), Search trigger, Account link, Cart + badge count.
- [x] Mobile: hamburger → drawer (`role="dialog"`), overlay, tutup dengan × / Esc / klik overlay.
- [x] Render ulang badge cart saat `cart.count` berubah; `aria-label` cart berisi jumlah.

**Ref:** FR-01, FR-07, BHV-07, BHV-08, AC-01, AC-14, AC-15, AC-16 · **Verifikasi:** nav tampil desktop; drawer berfungsi mobile; Esc menutup; badge ter-update.

### T-3.2 Country selector (bagian dari header)
- [x] Dropdown daftar market dari `markets.js`; default `US / USD`.
- [x] Pilih market → update label + format harga di purchase panel (simulasi cukup).

**Ref:** FR-02, BHV-08, AC-14 · **Verifikasi:** dropdown terbuka; pilih market → label & harga berubah format.

### T-3.3 Search panel `src/components/search-panel.js`
- [x] Panel dialog: input `type="search"`, area Suggested, tombol Close.
- [x] Filter `suggested.js` (case-insensitive), render `<ul>`.
- [x] Buka: fokus ke input, `aria-expanded=true` pada trigger; Tutup: button / Esc / overlay → fokus kembali ke trigger.

**Ref:** FR-03, BHV-06, AC-13, AC-16 · **Verifikasi:** buka → ketik → saran tersaring → tutup (3 cara) → fokus kembali.

### T-3.4 Gallery `src/components/gallery.js`
- [x] Stage `aspect-ratio: 1/1` + `<img>` (alt dari data varian, `fetchpriority="high"` untuk index 0).
- [x] Tombol Prev/Next (`<button>`, `aria-label`) dengan **wrap-around** + counter `aria-live` ("1 / 5").
- [x] Thumbnails: `aria-current="true"` + outline untuk aktif; klik → set index.
- [x] Subscribe state: `variantId` ganti → tukar set gambar + reset index 0; `galleryIndex` ganti → tukar `src`/`alt` saja (tanpa layout shift).

**Ref:** FR-04, FR-05, BHV-01, BHV-12, BHV-14, AC-02, AC-03, AC-04, AC-18, AC-20 · **Verifikasi:** next/prev/thumbnail berfungsi & wrap; gambar tidak terdistorsi (object-fit); alt berubah mengikuti varian; tidak ada layout shift.

### T-3.5 Purchase panel `src/components/purchase-panel.js`
- [x] Eyebrow kategori + `h1` "MW75 TUMI" + harga dari `formatCurrency`.
- [x] Badge availability (`role="status"`) dari config — satu sumber dengan CTA.
- [x] CTA dengan matriks DESIGN §5.3: `sold_out` → `disabled` + `aria-disabled`; label sesuai config.

**Ref:** FR-06, FR-07, FR-08, FR-11, BHV-04, AC-01, AC-07, AC-08 · **Verifikasi:** `US$750.00` tampil; badge & CTA konsisten; CTA sold out tidak bisa diklik & tidak menyesatkan.

### T-3.6 Variant selector `src/components/variant-selector.js`
- [x] `role="radiogroup"` + 2 `<button role="radio">` (Black default `aria-checked="true"`, Silver).
- [x] Swatch warna + **label teks** (jangan warna saja) + outline aktif.
- [x] Klik → `setVariant()` → seluruh subscriber update (gallery, alt, legend, URL); live region "Varian dipilih: …".

**Ref:** FR-09, FR-10, BHV-02, BHV-03, AC-05, AC-06, AC-17, AC-18 · **Verifikasi:** hanya satu radio `true`; ganti varian → gambar + URL + legend sinkron; screen reader/inspect ARIA benar.

### T-3.7 Add to cart behavior
- [x] Klik CTA aktif → `addToCart(variantId)` → badge header naik + feedback `aria-live` ("Added to cart — MW75 TUMI, Black") ~2.5s.
- [x] Klik CTA disabled → tanpa perubahan state (tanpa error).

**Ref:** BHV-04, BHV-05, FR-11, AC-08, AC-20 · **Verifikasi:** kedua skenario di atas; console bersih.

### T-3.8 Purchase protection (opsional/conditional)
- [x] Render area "Enhance your purchase with protection" hanya jika dikonfigurasi `product.protection`.

**Ref:** FR-12 · **Verifikasi:** tampil/hilang mengikuti config.

---

## Fase 4 — Komponen Konten

### T-4.1 USP strip `src/components/usp-strip.js`
- [x] Render 6 item dari `product.usps` (ikon `aria-hidden` + `h3` + deskripsi).
- [x] Grid 6/3/2 kolom sesuai breakpoint.

**Ref:** FR-13, AC-09 · **Verifikasi:** 6 USP terlihat (ANC, material, 40mm, 32h, BT 5.1, 4 mic) tanpa navigasi lain.

### T-4.2 Trust cards `src/components/trust-cards.js`
- [x] 3 kartu dari `product.policies`: Free Shipping (US$99+), Free Returns (14 hari), Warranty.

**Ref:** FR-14, FR-15, FR-16, AC-01 · **Verifikasi:** teks kebijakan sesuai requirements.

### T-4.3 Story TUMI `src/components/story-tumi.js`
- [x] 2 kolom: gambar editorial + heading & paragraf kolaborasi/19 Degree; mobile stack.

**Ref:** FR-17, AC-01 · **Verifikasi:** konten TUMI tampil; layout benar di 375px.

### T-4.4 Description `src/components/description.js`
- [x] `h2` + paragraf dari `product.description` (Adaptive ANC, acoustics, 40mm Beryllium, aluminum, lambskin, all-day).

**Ref:** FR-18, AC-01 · **Verifikasi:** konten sesuai; `max-width` ~65ch.

### T-4.5 Tech specs `src/components/tech-specs.js`
- [x] Render per kelompok → `<h3>` + `<dl>/<dt>/<dd>`; grid 2 kolom desktop / 1 kolom mobile; label muted, value ink, divider tipis.
- [x] Nilai **hanya** dari `product.specs`.

**Ref:** FR-19, AC-10, NFR-04 · **Verifikasi:** semua kelompok tampil (Material, dimensions, weight, ear coupling, ear pads, drivers, impedance, talk/ANC mic, voice assistant, battery, bluetooth, wired digital, analog, cables, antenna); label ≠ value kontras jelas.

### T-4.6 In the box `src/components/in-the-box.js`
- [x] Grid visual gambar + label untuk 7 item dari `product.inTheBox`.

**Ref:** FR-20, AC-11 · **Verifikasi:** 7 item persis (headphones, USB-C→C, USB-C→3.5mm, USB-C→USB-A, 3.5mm→1/4, flight adapter, hard shell case).

### T-4.7 Support `src/components/support.js`
- [x] `h2` + tombol/link **SUPPORT CENTER** dengan target jelas (placeholder `#support` atau URL eksternal + keterangan).

**Ref:** FR-21, BHV-10, BHV-11, AC-12 · **Verifikasi:** link bisa diklik, punya `href` valid/anchor, target jelas.

---

## Fase 5 — Newsletter & Footer

### T-5.1 Newsletter `src/components/newsletter.js`
- [x] Form email + label + tombol SIGN UP; `preventDefault`; validasi email; pesan sukses/error via `aria-live`.

**Ref:** FR-22, AC-01, AC-16 · **Verifikasi:** submit kosong/salah → error; valid → sukses; tanpa navigasi pindah halaman.

### T-5.2 Footer `src/components/footer.js`
- [x] Grid kolom: Product Comparisons, Product Support, Shopping Info, About, News, Contact, Corporate Gifting, Digital Gift Card.
- [x] Baris legal: Privacy, Terms, Accessibility, Data Requests + copyright.
- [x] `<nav aria-label="Footer">`; mobile stack/accordion.

**Ref:** FR-23, BHV-11, AC-19 · **Verifikasi:** semua link legal/support/company/gifting/shopping ada & punya target.

---

## Fase 6 — Responsive & Mobile Polish

### T-6.1 Header mobile
- [x] Hamburger + drawer berfungsi; search & cart tetap aksesibel; tap target ≥44px.

**Ref:** FR-01, FR-24, AC-15 · **Verifikasi:** uji 375px — buka/tutup drawer (8 Okt 2026: smoke T-6.1 lulus; Chromium headless 375px → 0 overflow, 0 console error; search & cart tetap di header).

### T-6.2 Hero mobile
- [x] Gallery & purchase stack vertikal; thumbs bisa di-scroll-snap bila lebih; prev/next tetap mudah disentuh; CTA full-width ≥48px.

**Ref:** BHV-12, AC-15 · **Verifikasi:** uji 375px.

### T-6.3 Section responsif
- [x] USP 6→3→2 kolom; trust 3→1; story 2→1; specs 2→1; in-the-box auto-fit; footer kolom→stack/accordion.

**Ref:** FR-24, AC-15 · **Verifikasi:** uji 375 / 768 / 1024 / 1440.

### T-6.4 Cek anti-overflow global
- [x] Tidak ada elemen melebihi viewport: periksa `scrollWidth <= clientWidth` pada 375px (DevTools atau snippet console).
- [x] Gambar, tabel/spec, teks panjang tidak menyebabkan horizontal scroll.

**Ref:** AC-15, NFR-01 · **Verifikasi:** snippet console = `true` pada 375px.

---

## Fase 7 — Accessibility & Performance Polish

### T-7.1 Keyboard & focus
- [x] Tab dari atas ke bawah mengikuti urutan visual; semua kontrol terjangkau (nav, market, search, gallery prev/next/thumbs, varian, CTA, support, newsletter, footer link pertama per grup).
- [x] `:focus-visible` terlihat di setiap kontrol; tidak ada focus trap kecuali dialog (search/drawer yang terbuka).
- [x] Esc menutup search/drawer/market.

**Ref:** FR-25, BHV-13, AC-16 · **Verifikasi:** uji keyboard manual penuh.

### T-7.2 Screen reader / ARIA
- [x] `h1` tunggal; landmarks benar; `aria-expanded` (trigger), `aria-checked` (varian), `aria-current` (thumb), `role="status"` (badge), `aria-live` (counter, cart feedback, variant announcement).
- [x] Semua `<img>` produk punya alt deskriptif; ikon dekoratif `aria-hidden`.

**Ref:** FR-25, BHV-14, AC-17 · **Verifikasi:** inspect ARIA (ceklist §10) / screen reader bila tersedia.

### T-7.3 Contrast & non-color status
- [x] Kontras teks ≥4.5:1, kontrol/non-teks ≥3:1 (cek palet DESIGN §3.1).
- [x] Active state varian/thumb punya outline/label, bukan hanya warna.
- [x] CTA disabled tetap terbaca (label vs background).

**Ref:** NFR-02, AC-17 · **Verifikasi:** devtools contrast checker / WebAIM.

### T-7.4 Performance
- [x] Gambar: `width`/`height` atau `aspect-ratio` (anti-CLS), gambar pertama eager+priority, sisanya `loading="lazy"`.
- [x] Set gambar varian kedua di-preload saat idle (opsional).
- [x] Tidak ada library eksternal yang tidak perlu.

**Ref:** NFR-03, AC-20 · **Verifikasi:** CLS ~0 saat ganti gambar/varian.

### T-7.5 Reduced motion
- [x] `@media (prefers-reduced-motion: reduce)` mematikan transisi carousel/animasi.

**Ref:** NFR-02 · **Verifikasi:** simulasi reduced motion di devtools.

---

## Fase 8 — QA Menyeluruh (Acceptance Criteria)

> Jalankan setelah Fase 0–7 selesai. Centang hanya bila lulus.

### T-8.1 Fungsional (AC-01…AC-14, AC-18…AC-19)
- [x] **AC-01** Semua section tampil: header, gallery, nama, kategori, harga, variant, CTA, USP, benefit, description, specs, in-the-box, support, footer.
- [x] **AC-02** Gambar proporsional, tidak terdistorsi.
- [x] **AC-03** Next → gambar berikutnya.
- [x] **AC-04** Previous → gambar sebelumnya.
- [x] **AC-05** Pilih Black → active + visual Black.
- [x] **AC-06** Pilih Silver → active + visual Silver.
- [x] **AC-07** Harga `US$750.00`.
- [x] **AC-08** Badge Sold out/Pre-Order konsisten & CTA tidak menyesatkan.
- [x] **AC-09** 6 USP ditemukan tanpa buka halaman lain.
- [x] **AC-10** Seluruh kelompok spec terbaca; label/value mudah dibedakan.
- [x] **AC-11** 7 item In The Box ditemukan.
- [x] **AC-12** Support Center link berfungsi & jelas targetnya.
- [x] **AC-13** Search: buka → pakai → tutup.
- [x] **AC-14** Country selector: daftar market tampil & bisa dipilih.
- [x] **AC-18** Ganti variant → state, gambar, URL konsisten.
- [x] **AC-19** Footer: legal, support, company, gifting, shopping ada.

### T-8.2 Layout & UX (AC-15, AC-20)
- [x] **AC-15** Pada 375px: tidak ada horizontal scroll; CTA, gallery, teks, nav tetap usable.
- [x] **AC-20** Tanpa interaksi: halaman stabil, tidak ada layout shift mengganggu; **tidak ada error JavaScript** di console pada alur utama (buka, gallery, varian, cart, search, market, newsletter).

### T-8.3 Accessibility (AC-16, AC-17)
- [x] **AC-16** Semua kontrol utama terjangkau Tab; focus terlihat.
- [x] **AC-17** Nama kontrol & status varian terbaca via semantic/ARIA attributes.

### T-8.4 Build & cross-viewport
- [x] `npm run build` sukses tanpa error/warning berarti.
- [x] `npm run preview` berjalan; halaman utuh.
- [x] Uji viewport: 375, 768, 1024, 1440 — layout sesuai DESIGN §7.
- [x] (Opsional) Chrome + Firefox/Safari bila tersedia.

---

## Fase 9 — Finalisasi & Handoff

### T-9.1 Konsistensi dokumen
- [x] Semua FR-01…FR-25, BHV-01…BHV-14, AC-01…AC-20 terpenuhi atau ada catatan known-issue.
- [x] Data hero/USP/spec/in-the-box bersumber dari `product.js` (tidak ada duplikasi).
- [x] Tidak ada hard-coded availability/policy di banyak tempat (config terpusat).

**Ref:** NFR-04, NFR-05, Constraints · **Verifikasi:** grep nilai (`750`, `338`, `40mm`) — hanya di `src/data/`.

### T-9.2 Kebersihan repo
- [x] Tidak ada file template sisa yang tidak dipakai.
- [x] `README` singkat (opsional): cara `npm run dev/build/preview`, struktur folder, tautan ke REQUIREMENTS/DESIGN/TASK.

### T-9.3 Serah terima
- [x] Task ini diarsip/centang penuh; daftar known-issue / next step dicatat bila ada. (Tercatat & kini **selesai**: integrasi backend, cart panel + checkout, halaman Orders — lihat §Status.)

---

## Dependensi Antar-Tugas

```
T-0.1 → T-0.2 → T-1.1 → T-1.3 → T-1.4, T-1.5
                 T-1.2 ↗
                 T-1.6 ↗
T-1.* → T-2.1 → T-2.2 → T-2.3
T-2.3 → T-3.1 → T-3.2, T-3.3
       → T-3.4
       → T-3.5 → T-3.6 → T-3.7, T-3.8
T-3.* → T-4.1 … T-4.7 (paralel)
T-4.* → T-5.1, T-5.2
T-3.* + T-4.* + T-5.* → T-6.* → T-7.* → T-8.* → T-9.*
```

## Estimasi Relatif

| Fase | Bobot (S/M/L) | Catatan |
|------|---------------|---------|
| 0 Setup | S | bersih template |
| 1 Data & state | M | paling menentukan konsistensi |
| 2 Tokens & skeleton | M | fondasi visual |
| 3 Komponen inti | L | gallery + variant + CTA = inti PRD |
| 4 Konten | M | render-from-data |
| 5 Newsletter/footer | S | |
| 6 Responsive | M | uji 375px |
| 7 A11y & perf | M | |
| 8 QA AC | M | checklist §10 |
| 9 Finalisasi | S | |

---

## Definition of Done (DoD) Proyek

1. Semua checkbox pada Fase 0–7 tercentang.
2. Seluruh AC-01…AC-20 lulus (Fase 8 tercentang).
3. `npm run build` dan `npm run preview` berjalan tanpa error; console bersih pada alur utama.
4. Tidak ada horizontal overflow pada 375px (ketiga halaman: `index.html`, `product-api.html`, `orders.html`).
5. Data produk single-source; harga/spec tidak terduplikasi.
6. Keyboard navigation + focus visible + ARIA inti (variant, gallery, badge, live region) berfungsi.
7. Hierarki visual sesuai Success Criteria #9: purchase → value prop → story → specs → package → support → footer.
