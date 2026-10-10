# Design Document
## Product Detail Page — MW75 TUMI (Master & Dynamic-inspired)

| Informasi | Keterangan |
|-----------|-----------|
| Dokumen | DESIGN.md (Langkah 2 dari 3: Requirements → Design → Task) |
| Versi | 1.0 |
| Input | `REQUIREMENTS.md` v1.0 (FR-01…FR-25, BHV-01…BHV-14, AC-01…AC-20, NFR-01…NFR-05) |
| Output untuk | `TASK.md` (breakdown implementasi) |
| Stack | Vite + Vanilla HTML/CSS/JavaScript |
| Karakter visual | Premium, minimal, editorial, banyak whitespace, tipografi tegas |

Dokumen ini menerjemahkan requirements menjadi keputusan desain konkret: information architecture, wireframe, design tokens, spesifikasi per komponen (termasuk state & accessibility), strategi responsive, serta struktur file/asset agar bisa langsung di-eksekusi di `TASK.md`.

---

## 1. Information Architecture (IA)

### 1.1 Urutan Section Halaman (sesuai Hierarki Visual — Success Criteria #9)

```
[Header / Global Navigation]                     FR-01, FR-02, FR-03
│
├─ [Search Panel (overlay)]                      FR-03, BHV-06
│
└─ <main>
   ├─ 1. Product Hero / Purchase Area            FR-04…FR-12
   │    ├─ Product Gallery (prev/next/thumbs)    FR-04, FR-05, BHV-01
   │    └─ Purchase Panel                        FR-06…FR-11, BHV-02/03/04
   │         ├─ Identity (h1 + kategori)
   │         ├─ Price + Availability badge
   │         ├─ Color Variant selector
   │         ├─ Add to Cart CTA
   │         └─ Purchase protection (opsional)
   │
   ├─ 2. USP Strip (6 highlights)                FR-13
   │
   ├─ 3. Trust / Benefit Cards                   FR-14, FR-15, FR-16
   │    (Shipping · Returns · Warranty)
   │
   ├─ 4. TUMI Collaboration (story)              FR-17
   │
   ├─ 5. Product Description (MW75)              FR-18
   │
   ├─ 6. Tech Specs (grid)                       FR-19
   │
   ├─ 7. In The Box (visual list)                FR-20
   │
   └─ 8. Support CTA                             FR-21, BHV-10
│
├─ [Newsletter]                                  FR-22
└─ [Footer]                                      FR-23, BHV-11
```

Urutan section ini mewujudkan **BHV-09** (Scroll Content): pengguna dapat membaca halaman vertikal dari purchase area → storytelling → specification → support → footer tanpa konten tersembunyi di balik interaksi.

### 1.2 Screening Order (prioritas perhatian)

1. Gambar produk + nama + harga + CTA (area pembelian — harus terlihat tanpa scroll panjang pada desktop ≥1024px, idealnya sebagian terlihat di fold pertama).
2. USP strip (justifikasi cepat).
3. Trust cards (mengurangi keraguan).
4. Story TUMI + description (emosional/editorial).
5. Tech specs (evaluasi teknis).
6. In the box (nilai tambah).
7. Support → Newsletter → Footer.

---

## 2. Wireframe

### 2.1 Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER  [logo M&D]  Headphones  Earphones  Accessories  Collaborations  Blog │
│                   [🌐 US/USD ▾]  [Search]  [Account]  [Cart (0)]            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  [<]   MAIN IMAGE  (1:1, fixed AR)  [>]│  │ MW75 TUMI                   │ │
│  │                                       │  │ Noise-Cancelling Wireless…  │ │
│  │                                       │  │ US$750.00                   │ │
│  │                                       │  │ [● Sold out / Pre-Order]    │ │
│  ├───────────────────────────────────────┤  │                             │ │
│  │ (1/5)  [t] [t] [t] [t] [t]  thumbnails│  │ COLOR: Black  Silver        │ │
│  └───────────────────────────────────────┘  │  (●) swatch  (○) swatch     │ │
│                                             │  [   ADD TO CART   ]        │ │
│                                             │  ─────────────────────      │ │
│                                             │  🛡 Enhance your purchase…  │ │
│                                             └──────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  USP STRIP — 6 item (grid 6 kolom desktop / 3×2 tablet / 2×3 mobile)         │
│  [icon] ANC  │  [icon] Material  │  [icon] 40mm Driver │  Battery │ BT │ MIC │
├──────────────────────────────────────────────────────────────────────────────┤
│  TRUST CARDS — 3 kolom: 🚚 Free Shipping  │ ↩ Free Returns  │ 🛡 Warranty    │
├──────────────────────────────────────────────────────────────────────────────┤
│  TUMI COLLABORATION — 2 kolom: [image editorial]  |  Heading + paragraf      │
├──────────────────────────────────────────────────────────────────────────────┤
│  DESCRIPTION MW75 — heading + 2 paragraf (max-width ~ 65ch)                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  TECH SPECS — 2 kolom grid (label kiri / value kanan per kelompok)           │
│  [Build]              [Audio]                                               │
│  Material … Value     Ear coupling … Value                                   │
│  [Microphone]         [Power]                                               │
│  [Connectivity]       [Accessories]                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  IN THE BOX — grid 7 item: [gambar] + label                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  SUPPORT — "Need help?" + [SUPPORT CENTER →]                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEWSLETTER — heading + input email + [SIGN UP]                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  FOOTER — 4–5 kolom link + baris legal + copyright                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile (≤767px, uji 375px)

```
┌────────────────────────────────┐
│ [≡]  M&D LOGO        🔍 🛒(0)  │  ← hamburger + search + cart
├────────────────────────────────┤
│  MAIN IMAGE          [<] [>]   │  ← control menyatu di bawah/atas gambar
│  (1/5) [t][t][t][t]            │
├────────────────────────────────┤
│  MW75 TUMI                     │
│  Noise-Cancelling Wireless …   │
│  US$750.00                     │
│  [● Sold out / Pre-Order]      │
│  COLOR  (● Black) (○ Silver)   │
│  [      ADD TO CART       ]    │  ← full-width, sticky bottom (opsional)
│  🛡 Enhance your purchase …    │
├────────────────────────────────┤
│  USP 2×3 grid                  │
│  TRUST 1 kolom (stack)         │
│  TUMI story (gambar → teks)    │
│  DESCRIPTION                   │
│  SPECS 1 kolom                 │
│  IN THE BOX grid 2–3 kolom     │
│  SUPPORT                       │
│  NEWSLETTER                    │
│  FOOTER (accordion / stack)    │
└────────────────────────────────┘
```

**Aturan mobile:**
- Tidak ada horizontal scroll (AC-15): semua container `max-width: 100%`, `overflow-x: clip` pada body bila perlu, tabel spec dirender sebagai list, bukan tabel lebar.
- Gallery & purchase panel bertumpuk vertikal (BHV-12).
- CTA minimal setinggi 48px, lebar penuh.

---

## 3. Design Tokens

### 3.1 Warna (Premium minimal — hitam/putih/abu netral + 1 aksen)

| Token | Nilai | Penggunaan |
|-------|-------|-----------|
| `--color-bg` | `#FFFFFF` | Latar halaman |
| `--color-surface` | `#F6F5F3` | Section alternatif (story, newsletter) |
| `--color-surface-dark` | `#111111` | Footer, CTA utama |
| `--color-text` | `#111111` | Teks utama (kontras ~19:1) |
| `--color-text-muted` | `#5C5C5C` | Teks sekunder (kontras ≥4.5:1 di #FFF) |
| `--color-border` | `#E3E1DE` | Divider, garis spec |
| `--color-accent` | `#111111` | CTA, active border |
| `--color-focus` | `#1D4ED8` | `:focus-visible` outline (kontras tinggi) |
| `--color-success` | `#166534` | Feedback cart berhasil |
| `--color-danger` | `#B42318` | Error form (newsletter) |
| `--color-disabled-bg` | `#D9D9D9` | CTA disabled |
| `--color-disabled-text` | `#767676` | Label CTA disabled |

Aturan: **jangan** membedakan active state hanya dengan warna → selalu tambah outline/teks/ikon (NFR-02).

### 3.2 Tipografi

| Token | Nilai | Penggunaan |
|-------|-------|-----------|
| `--font-sans` | `"Inter", "Helvetica Neue", Arial, sans-serif` | Semua teks |
| `--fs-display` | `clamp(2rem, 4vw, 3rem)` (32–48px) | `h1` product name |
| `--fs-h2` | `clamp(1.5rem, 2.5vw, 2rem)` (24–32px) | Judul section |
| `--fs-h3` | `1.125rem` (18px) | Judul kartu/kelompok spec |
| `--fs-body` | `1rem` (16px) | Paragraf |
| `--fs-small` | `0.875rem` (14px) | Meta, label, footer |
| `--fs-price` | `clamp(1.25rem, 2vw, 1.5rem)` | Harga |
| `--fs-eyebrow` | `0.75rem`, `letter-spacing: 0.12em`, uppercase | Kategori/label kecil |
| `--fw-regular` | 400 | Body |
| `--fw-medium` | 500 | Label, nav |
| `--fw-bold` | 600–700 | Heading, harga, CTA |

Hierarki: product name > price > section heading > card heading > body > meta.

### 3.3 Spacing, Radius, Shadow, Layout

| Token | Nilai |
|-------|-------|
| `--space-1…8` | 4, 8, 12, 16, 24, 32, 48, 80 (px) |
| `--section-padding-y` | 80px desktop / 48px mobile |
| `--container-max` | 1280px, padding inline 24px (16px mobile) |
| `--radius-sm` | 4px (badge, input) |
| `--radius-md` | 8px (kartu) |
| `--radius-pill` | 999px (CTA opsional) |
| `--shadow-pop` | `0 8px 24px rgba(0,0,0,.12)` (dropdown/panel) |
| `--gap-hero` | 48px (kolom gallery ↔ purchase) |
| Tap target min | 44×44px (NFR-01) |

### 3.4 Breakpoints

| Nama | Range | Behavior |
|------|-------|----------|
| `mobile` | ≤767px (uji 375px) | Single column, drawer nav, stack hero, spec 1 kolom |
| `tablet` | 768–1023px | Hero masih 1 kolom atau 2 kolom sempit; USP 3 kolom |
| `desktop` | ≥1024px | Hero 2 kolom (gallery 55–60% / panel 40–45%), spec 2 kolom, USP 6 kolom |
| `wide` | ≥1440px | Container tetap 1280px (jangan melebar tak terbatas) |

---

## 4. Struktur File & Aset

```
latihan1/
├─ index.html                  # shell: <div id="app">, meta viewport, title, lang="id"
├─ src/
│  ├─ main.js                  # bootstrap: render page, init state, init listeners
│  ├─ data/
│  │  ├─ product.js            # single source of truth (§1.1 REQUIREMENTS)
│  │  ├─ markets.js            # daftar country/currency (FR-02)
│  │  └─ suggested.js          # saran search mock (FR-03)
│  ├─ state/
│  │  ├─ store.js              # createStore sederhana (state + subscribe + render)
│  │  ├─ variant.js            # state varian + URL sync (BHV-03)
│  │  └─ cart.js               # cart simulasi + count (BHV-05)
│  ├─ components/
│  │  ├─ header.js             # nav, search trigger, account, cart badge, market (FR-01/02)
│  │  ├─ search-panel.js       # overlay search + suggested (FR-03, BHV-06)
│  │  ├─ gallery.js            # main img, prev/next, thumbs, counter (FR-04/05, BHV-01)
│  │  ├─ purchase-panel.js     # identity, price, badge, variant, CTA, protection (FR-06…12)
│  │  ├─ variant-selector.js   # radiogroup Black/Silver (FR-09, FR-10, BHV-02)
│  │  ├─ usp-strip.js          # 6 USP (FR-13)
│  │  ├─ trust-cards.js        # shipping/returns/warranty (FR-14/15/16)
│  │  ├─ story-tumi.js         # kolaborasi TUMI (FR-17)
│  │  ├─ description.js        # deskripsi MW75 (FR-18)
│  │  ├─ tech-specs.js         # grid spec dari data (FR-19)
│  │  ├─ in-the-box.js         # isi paket (FR-20)
│  │  ├─ support.js            # support CTA (FR-21)
│  │  ├─ newsletter.js         # form + validasi simulasi (FR-22)
│  │  └─ footer.js             # link groups + legal (FR-23)
│  ├─ styles/
│  │  ├─ tokens.css            # design tokens (§3)
│  │  ├─ base.css              # reset, typography, container, focus
│  │  ├─ layout.css            # header/footer/section grid, breakpoints
│  │  └─ components.css        # gaya per komponen (atau per-file bila file besar)
│  ├─ assets/                  # gambar produk (per varian) + ikon
│  └─ utils/
│     ├─ dom.js                # helper createElement/format
│     └─ format.js             # formatCurrency(price, market)
├─ public/
│  └─ (favicon, icons.svg)
├─ REQUIREMENTS.md
├─ DESIGN.md
└─ TASK.md
```

**Catatan migrasi:** `src/main.js`, `src/style.css`, `src/counter.js` saat ini masih template Vite → akan diganti/dibersihkan pada Tugas 0 (`TASK.md`).

### 4.1 Skema Data Kunci

```js
// src/data/product.js (ilustrasi)
export const product = {
  id: 'mw75-tumi',
  name: 'MW75 TUMI',
  category: 'Noise-Cancelling Wireless Headphones',
  price: 750,                    // formatCurrency → "US$750.00"
  availability: 'sold_out',      // 'sold_out' | 'pre_order' | 'in_stock'
  cta: { label: 'ADD TO CART', enabled: false },  // diturunkan dari availability (satu config)
  variants: [
    {
      id: 'black', label: 'Black', swatch: '#111111', default: true,
      images: [
        { src: '/img/mw75-black-1.jpg', alt: 'MW75 TUMI headphones in Black — three-quarter view' },
        // … 3–5 gambar
      ],
    },
    { id: 'silver', label: 'Silver', swatch: '#C9C9C9', images: [ /* … */ ] },
  ],
  usps:   [ { icon, title, desc } × 6 ],
  specs:  [ { group: 'Build', items: [{ label, value }] }, /* … */ ],
  inTheBox: [ { name, img, alt } × 7 ],
  policies: { shipping: '…', returns: '…', warranty: '…' },
  story: { heading, paragraphs[] },
  description: { heading, paragraphs[] },
};

export const markets = [
  { code: 'US', label: 'United States', currency: 'USD', symbol: '$', rate: 1 },
  // … beberapa market untuk simulasi FR-02
];
```

```js
// state global (src/state/store.js)
{
  variantId: 'black',
  galleryIndex: 0,
  cart: { count: 0, items: [] },
  ui: { searchOpen: false, menuOpen: false, marketOpen: false, market: 'US' },
  toast: null | { message, tone }
}
```

---

## 5. Spesifikasi Komponen

Setiap komponen: **FR/BHV yang dilayani → struktur → state → interaksi → a11y → AC yang diverifikasi**.

### 5.1 Header (`header.js`) — FR-01, FR-02, BHV-07, BHV-08, BHV-11

- **Struktur:** `<header>` → `<a class="brand">` (logo/wordmark "Master & Dynamic") · `<nav aria-label="Primary">` (Headphones, Earphones, Accessories, Collaborations, Blog) · actions: country selector `<button aria-expanded aria-haspopup="listbox">`, Search `<button>`, Account `<a>`, Cart `<button>` + badge `<span class="cart-count" aria-live="polite">`.
- **State:** `menuOpen` (mobile), `marketOpen`, `cartCount`, `market`.
- **Interaksi:** hamburger toggle drawer; klik item menu → tutup drawer; Esc menutup drawer/market; klik market → ganti market → update label + harga (formatCurrency).
- **A11y:** `aria-label="Cart, 0 items"` pada cart; drawer = `role="dialog"` + fokus terkunci sederhana; nav punya `aria-label`.
- **AC:** AC-01, AC-14, AC-15, AC-16, AC-19.

### 5.2 Search Panel (`search-panel.js`) — FR-03, BHV-06, AC-13

- **Struktur:** panel `role="dialog" aria-modal="true" aria-label="Search"` berisi `<input type="search">` + `<ul>` Suggested + tombol Close.
- **State:** `searchOpen`, `query`.
- **Interaksi:** buka (fokus ke input) → filter `suggested.js` sederhana (startsWith/includes, case-insensitive) → pilih saran = placeholder link → tutup (button/Esc/overlay) → fokus kembali ke trigger.
- **A11y:** trigger `aria-expanded` + `aria-controls="search-panel"`; hasil dalam `<ul>`; pesan jumlah hasil via `aria-live="polite"`.
- **AC:** AC-13, AC-16.

### 5.3 Gallery (`gallery.js`) — FR-04, FR-05, BHV-01, BHV-12, BHV-14

- **Struktur:**
  ```html
  <section class="gallery" aria-roledescription="carousel" aria-label="MW75 TUMI product images">
    <div class="gallery__stage"> <!-- aspect-ratio: 1/1 -->
      <img class="gallery__image" src alt="…" fetchpriority="high" width height>
    </div>
    <div class="gallery__controls">
      <button type="button" class="gallery__btn" data-dir="prev" aria-label="Previous image">‹</button>
      <p class="gallery__counter" aria-live="polite">1 / 5</p>
      <button type="button" class="gallery__btn" data-dir="next" aria-label="Next image">›</button>
    </div>
    <ul class="gallery__thumbs"> <!-- role="tablist" opsional; minimal li + button -->
      <li><button type="button" aria-current="true" aria-label="View image 1"><img …></button></li>
      …
    </ul>
  </section>
  ```
- **State:** `variantId`, `galleryIndex` (per varian mulai dari 0).
- **Interaksi:** prev/next **wrap-around** (konsisten — lihat §6.1 REQUIREMENTS); thumbnail langsung ke index; ganti varian → reset index 0; render hanya tukar `src`/`alt` (pre-load gambar berikutnya opsional) → tanpa layout shift (AC-20).
- **A11y:** tombol punya `aria-label`; counter `aria-live`; thumb aktif `aria-current="true"` + outline; gambar alt dari data varian (BHV-14).
- **AC:** AC-02, AC-03, AC-04, AC-18, AC-20.

### 5.4 Purchase Panel (`purchase-panel.js`) — FR-06…FR-12, BHV-02…BHV-05

**Struktur:**

```html
<div class="purchase">
  <p class="purchase__category">Noise-Cancelling Wireless Headphones</p>  <!-- eyebrow -->
  <h1 class="purchase__title">MW75 TUMI</h1>                              <!-- AC-01 -->
  <p class="purchase__price">US$750.00</p>                                <!-- FR-07 -->
  <p class="purchase__availability" role="status">Sold out / Pre-Order</p> <!-- badge, FR-08 -->

  <fieldset class="variant">
    <legend>Color: <span data-selected>Black</span></legend>
    <div role="radiogroup" aria-label="Color">
      <button type="button" role="radio" aria-checked="true"  data-variant="black">
        <span class="swatch" style="--sw:#111"></span> Black
      </button>
      <button type="button" role="radio" aria-checked="false" data-variant="silver">
        <span class="swatch" style="--sw:#C9C9C9"></span> Silver
      </button>
    </div>
  </fieldset>

  <button class="btn btn--cta" type="button" disabled aria-disabled="true">
    ADD TO CART
  </button>
  <p class="purchase__feedback" aria-live="polite"></p>   <!-- feedback cart -->

  <aside class="protection">…Enhance your purchase with protection…</aside>
</div>
```

- **State:** `variantId`, `availability`, `cartCount`, `toast`.
- **Interaksi (BHV-04/05):** klik varian → update `aria-checked`, legend, gallery, URL; klik CTA:
  - disabled → tidak ada aksi (opsional tooltip/pesan "This product is currently unavailable").
  - enabled → `cart.add(variantId)` → count +1 → feedback "Added to cart — MW75 TUMI, Black" (live region) selama ~2.5s.
- **A11y:** `role="radio"` + `aria-checked` (hanya satu `true`); keyboard ←/→ pada radiogroup (roving tabindex — opsional, minimal Tab tetap masuk); CTA `disabled` **dan** `aria-disabled`; badge `role="status"`.
- **AC:** AC-01, AC-05, AC-06, AC-07, AC-08, AC-17, AC-18, AC-20.

**Matriks CTA ↔ availability (design):**

| `availability` | Badge | CTA label | CTA state | Feedback |
|----------------|-------|-----------|-----------|----------|
| `sold_out` | Sold out | ADD TO CART | disabled, abu-abu | "Currently unavailable" |
| `pre_order` | Pre-Order | PRE-ORDER | aktif, gelap | "Pre-order added to cart" |
| `in_stock` | In stock | ADD TO CART | aktif, gelap | "Added to cart" |

### 5.5 USP Strip (`usp-strip.js`) — FR-13, AC-09

- Grid: desktop 6 kolom (atau 3×2 bila teks panjang), tablet 3 kolom, mobile 2 kolom.
- Item: ikon (SVG inline, `aria-hidden="true"`) + `<h3>` singkat + `<p>` 1 baris. Teks 100% dari `product.usps`.
- AC-09: keenam item terlihat tanpa navigasi tambahan.

### 5.6 Trust Cards (`trust-cards.js`) — FR-14, FR-15, FR-16

- 3 kartu: Free Shipping (US$99+), Free Returns (14 hari), Manufacturer Warranty.
- Layout: 3 kolom desktop → stack mobile. Konten dari `product.policies` (konfigurasi, bukan hard-code — Constraints).

### 5.7 Story TUMI (`story-tumi.js`) — FR-17

- 2 kolom: gambar editorial (kiri) + heading "Master & Dynamic for TUMI" & paragraf 19 Degree (kanan). Mobile: gambar di atas teks.
- Section background `--color-surface` untuk pemisah ritme visual.

### 5.8 Description (`description.js`) — FR-18

- `h2` + 2 paragraf (Adaptive ANC, acoustics, 40mm Beryllium, anodized aluminum, lambskin leather, all-day listening). `max-width: 65ch`.

### 5.9 Tech Specs (`tech-specs.js`) — FR-19, AC-10

- Render: per group → `<h3>` + `<dl>` (`<dt>` label, `<dd>` value).
- Layout: `grid-template-columns: 1fr 1fr` (≥1024px) → 1 kolom (<768px). `dt` muted + `dd` ink; divider `border-bottom` tipis.
- Data dari `product.specs`; **dilarang** mengetik ulang value (NFR-04).

### 5.10 In The Box (`in-the-box.js`) — FR-20, AC-11

- Grid item: `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`; tiap item = gambar placeholder (`aspect-ratio: 1`, `object-fit: contain`) + `<p>` nama item + alt deskriptif.
- 7 item persis seperti requirements (AC-11 = hitung/ceklist).

### 5.11 Support (`support.js`) — FR-21, BHV-10, AC-12

- Blok dengan `h2` "Support" + kalimat singkat + `<a class="btn btn--secondary" href="/support">SUPPORT CENTER</a>` (atau URL placeholder `#support` + `aria-describedby` petunjuk). Link harus bisa diklik dan punya target jelas (BHV-11).

### 5.12 Newsletter (`newsletter.js`) — FR-22

- `<form>` + `<label for="email">` + `<input type="email" required>` + `<button>SIGN UP</button>`.
- Interaksi: submit → `preventDefault` → validasi native/custum → pesan sukses via `aria-live` (tanpa backend). Error styling `--color-danger`.

### 5.13 Footer (`footer.js`) — FR-23, BHV-11, AC-19

- Grid kolom: **Product** (Comparisons, Support) · **Shopping Info** (Shipping, Returns, Gift Card) · **Company** (About, News, Contact, Corporate Gifting, Digital Gift Card) · **Legal** (Privacy, Terms, Accessibility, Data Requests).
- `<footer>` → `<nav aria-label="Footer">`; link `#`/placeholder dengan target jelas; baris copyright.
- Mobile: kolom stack atau `<details>`/accordion per grup (pilih accordion bila panjang).

---

## 6. State Design (Ringkasan)

| State | Sumber | Ditampilkan di | Transisi |
|-------|--------|----------------|----------|
| `variantId` | URL `?variant=` → default `black` | selector, gallery, alt, URL | klik radio varian (BHV-02/03) |
| `galleryIndex` | 0 | main image, counter, thumbs | prev/next/thumb; reset saat varian ganti (BHV-01) |
| `availability` | `product.availability` (satu config) | badge + CTA | tidak berubah runtime (static config) |
| `cart.count` | `state/cart.js` (opsional localStorage) | header badge, feedback | klik CTA aktif (BHV-05) |
| `ui.searchOpen` | false | search panel | trigger / close / Esc (BHV-06) |
| `ui.menuOpen` | false | drawer mobile | hamburger / close / Esc |
| `ui.marketOpen` | false | dropdown market | trigger / close / Esc (BHV-08) |
| `ui.market` | `US` | label negara + format harga | pilih market (simulasi) |
| `toast` | null | feedback CTA | muncul ~2.5s → hilang |

**URL sync:** `history.replaceState(null, '', '?variant=' + id)` — tidak memicu reload; membuka URL dengan varian valid → langsung set state varian; varian tidak dikenal → fallback `black` tanpa error (BHV-03).

---

## 7. Responsive Design (FR-24)

| Area | Desktop ≥1024 | Tablet 768–1023 | Mobile ≤767 (uji 375) |
|------|---------------|------------------|------------------------|
| Header | Nav horizontal penuh | Nav ringkas / hamburger | Hamburger + drawer; logo tengah/kiri; search & cart ikon |
| Hero | 2 kolom: gallery ~57% / purchase ~43%, gap 48px | 1 kolom (gallery di atas) atau 50/50 jika cukup | 1 kolom stack; thumbs horizontal scroll snap |
| Controls gallery | Prev/next overlay di sisi gambar | Sama | Tombol di bawah gambar, tap target 44px |
| USP | 6 kolom (atau 3×2) | 3 kolom | 2 kolom |
| Trust cards | 3 kolom | 3 kolom | 1 kolom (stack) |
| Story | 2 kolom image+text | 2 kolom sempit | 1 kolom (image → text) |
| Tech specs | 2 kolom group | 2 kolom | 1 kolom |
| In the box | auto-fit minmax(140px) | 3–4 kolom | 2–3 kolom |
| Footer | 4–5 kolom | 3 kolom | stack / accordion |
| CTA | lebar kolom panel | lebar penuh panel | lebar penuh (tinggi ≥48px) |

**Anti-polusi layout:**
- Semua gambar: `max-width: 100%; height: auto` + `aspect-ratio` container → tidak ada CLS (AC-20).
- Cek 375px: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (AC-15).
- Tabel spec tidak dipakai → pakai `dl`/list agar tidak overflow.

---

## 8. Accessibility Design (NFR-02 → AC-16, AC-17)

| Aspek | Keputusan desain |
|-------|------------------|
| Landmarks | `header`, `nav` (± `aria-label`), `main`, `section` (dengan `aria-labelledby` bila perlu), `footer` |
| Headings | Satu `h1` (nama produk). Section = `h2`; kartu/kelompok spec = `h3`. Tidak lompat level. |
| Interactive elements | Semua aksi = `<button>`/`<a>`; **tidak** ada `div` beronClick |
| Focus | `:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px }` — terlihat di semua kontrol & link (BHV-13) |
| Keyboard | Tab order = urutan DOM (visual). Esc menutup search/drawer/market. Enter/Space pada button default. |
| Variant | `role="radiogroup"` + `role="radio"` + `aria-checked`; label teks selain swatch warna |
| Gallery | `aria-label` per tombol, `aria-live` counter, `aria-current` thumb, alt per varian (BHV-14) |
| Availability/CTA | badge `role="status"`; CTA `disabled` + `aria-disabled`; pesan "unavailable" terbaca SR |
| Cart feedback | `aria-live="polite"` region |
| Images | Alt deskriptif; ikon dekoratif `aria-hidden="true"` / `alt=""` |
| Color contrast | Teks utama ≥4.5:1; fokus/border kontrol ≥3:1; status tidak hanya warna (ikon/teks "✓"/outline) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` matikan transisi carousel |
| Zoom/reaflow | Tidak mematikan zoom viewport; teks tetap terbaca pada 320–375px |

---

## 9. Performance Design (NFR-03)

- Gambar: format `webp` (fallback jpg), dimensi ditentukan (`width`/`height` atribut), gambar pertama `fetchpriority="high"` + `loading="eager"`, sisanya `loading="lazy"`.
- Set varian kedua (Silver) dimuat lazy/di-preload saat idle agar ganti varian terasa cepat.
- Render awal dari module JS tunggal; hindari re-render seluruh halaman → update targeted (patch node gallery/CTA/badge saja) agar tidak ada layout shift.
- Tidak ada library eksternal (kecuali opsional); menjaga `build` Vite tetap kecil.
- Verifikasi: `npm run build` tanpa error; `npm run preview` jalan; console tanpa error (AC-20 / Success #7).

---

## 10. Konvensi Kode

- ES module, naming `kebab-case` file, fungsi komponen: `export function renderX(state) → HTMLElement|string`.
- Satu subscriber store → fungsi `update()` per bagian yang berubah (gallery, purchase, cart badge, url).
- Komentar hanya bila perlu; tanpa komentar dekoratif.
- Konsistensi ID: setiap komponen diuji terhadap AC yang tercantum di §5 (traceability ke `REQUIREMENTS.md`).
- CSS: satu file `tokens.css` sebagai satu-satunya tempat nilai hard-coded warna/spasi.

---

## 11. Definition of Done (Desain)

Desain dianggap selesai dan siap ke `TASK.md` bila:

1. Semua FR-01…FR-25 punya komponen tujuan (tercantum di §5 / tabel §1.1–§1.2).
2. Semua BHV-01…BHV-14 punya keputusan interaksi (§5–§6).
3. Semua AC-01…AC-20 dapat diverifikasi dari desain (kolom AC per komponen + §7 + §8).
4. Struktur file & data (§4) menjamin single source of truth (NFR-04).
5. Breakpoint & token (§3) mencakup uji 375px dan a11y WCAG AA.
