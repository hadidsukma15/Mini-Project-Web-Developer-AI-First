# Requirements Document
## Product Detail Page — MW75 TUMI Active Noise-Cancelling Wireless Headphones

| Informasi | Keterangan |
|-----------|-----------|
| Dokumen | REQUIREMENTS.md (Langkah 1 dari 3: Requirements → Design → Task) |
| Versi | 1.0 |
| Status | Draft untuk exercise / implementasi frontend |
| Konteks | Pembelajaran Front-End Development |
| Stack proyek | Vite + Vanilla HTML/CSS/JavaScript (`package.json`: `dev`, `build`, `preview`) |
| Referensi UI/UX | Master & Dynamic — MW75 TUMI Product Detail Page |
| URL Referensi | https://www.masterdynamic.com/products/mw75-tumi?variant=45871965307072 |
| Scope | Satu halaman detail produk kategori headphones/audio, data lokal/mock, tanpa backend |
| Dokumen terkait | `DESIGN.md` (spesifikasi desain), `TASK.md` (breakdown implementasi) |

**Traceability:** setiap requirement memakai ID tetap (FR-xx, BHV-xx, US-xx, AC-xx, NFR-xx) yang akan dirujuk silang oleh `DESIGN.md` (komponen) dan `TASK.md` (tugas + checklist verifikasi).

---

## 1. Product Overview

Halaman detail produk MW75 TUMI berfungsi sebagai halaman product detail untuk membantu pengguna memahami produk headphone premium, melihat visual produk dari beberapa sudut, memilih varian warna, memahami nilai jual utama, membaca informasi kolaborasi TUMI, melihat spesifikasi teknis, isi paket pembelian, serta melanjutkan ke tindakan pembelian.

Halaman referensi menampilkan: identitas produk, harga, status ketersediaan/pre-order, pilihan warna Black dan Silver, galeri gambar dengan kontrol Previous/Next, tombol ADD TO CART, benefit/USP produk, informasi pengiriman/pengembalian/perlindungan produk, konten kolaborasi TUMI, deskripsi MW75, tech specs, isi kotak, support center, newsletter, dan footer.

### 1.1 Data Produk (Single Source of Truth)

Seluruh section (hero, USP, specs, in-the-box) wajib membaca dari **satu sumber data** (module `src/data/product.js` atau setara). Dilarang menduplikasi nilai harga/spec di banyak tempat.

| Field | Nilai | Ditampilkan di |
|-------|-------|----------------|
| `name` | MW75 TUMI | Hero, gallery alt, footer/product links |
| `category` | Noise-Cancelling Wireless Headphones | Hero (subjudul) |
| `price` | 750.00 (USD) → display `US$750.00` | Hero, meta |
| `currency` | USD (default market US) | Format harga |
| `variants` | `black` (Black, default), `silver` (Silver) | Variant selector, gallery, URL |
| `availability` | `sold_out` \| `pre_order` \| `in_stock` (state referensi: Sold out / Pre-Order) | Badge + CTA |
| `material` | Lambskin leather, anodized aluminum, tempered glass | USP, Description, Tech Specs |
| `driver` | 40mm beryllium | USP, Description, Tech Specs |
| `battery` | Up to 32 hours; up to 28 hours with ANC enabled | USP, Tech Specs |
| `bluetooth` | Bluetooth 5.1, hingga 100 ft / 30 m | USP, Tech Specs |
| `microphone` | 4 microphone talk solution dengan wind protection | USP, Tech Specs |
| `weight` | 338 g | Tech Specs |
| `type` | Over-ear | Tech Specs (ear coupling) |

### 1.2 State Katalog (Availability)

Availability adalah **state terkontrol**, bukan teks hard-coded:

| `availability` | Badge | Label CTA | Perilaku CTA |
|----------------|-------|-----------|--------------|
| `sold_out` | "Sold out" | ADD TO CART | `disabled` + `aria-disabled="true"`, tidak memberi kesan transaksi instan pasti bisa |
| `pre_order` | "Pre-Order" | PRE-ORDER / ADD TO CART (sesuai konfigurasi) | Aktif; menambahkan item ke cart simulasi dengan status pre-order |
| `in_stock` | "In stock" (opsional) | ADD TO CART | Aktif, menambahkan item ke cart simulasi |

State referensi saat dokumentasi: **Sold out / Pre-Order tampil bersamaan dengan CTA ADD TO CART** → implementasi harus memastikan badge dan CTA **tidak kontradiktif** (satu config menentukan keduanya).

---

## 2. Problem + Target User

### 2.1 Problem

Pengguna produk audio premium membutuhkan informasi lengkap namun terstruktur sebelum membeli. Halaman harus menjawab: produk apa ini, berapa harganya, pilihan warnanya apa, tampilannya bagaimana, keunggulan teknisnya apa, apa isi paketnya, dan bagaimana mendapatkan bantuan.

Kebutuhan spesifik yang menjadi dasar requirement:

- Visual produk harus dapat dieksplorasi tanpa kehilangan konteks produk.
- Pilihan warna harus memiliki state aktif yang jelas (bukan hanya warna).
- Harga dan status ketersediaan harus mudah ditemukan.
- USP (ANC, material, driver, battery life, Bluetooth, microphone) harus dipahami cepat.
- Spesifikasi teknis panjang harus tetap mudah dipindai (scannable).
- Informasi pengiriman, retur, product protection terlihat sebelum keputusan.
- Pengguna membutuhkan akses ke support tanpa mencari manual.

### 2.2 Target User

Calon pembeli headphone premium yang mempertimbangkan kualitas audio, active noise cancellation, kenyamanan, material, durasi baterai, konektivitas, dan kebutuhan perjalanan. Juga relevan untuk pengguna yang tertarik pada kolaborasi Master & Dynamic × TUMI.

---

## 3. Goals + Non-Goals

### 3.1 Goals

| # | Goal | Requirement |
|---|------|-------------|
| G-01 | Menampilkan identitas dan positioning produk dengan jelas | FR-06, FR-07 |
| G-02 | Menyediakan galeri visual produk yang dapat dinavigasi | FR-04, FR-05 |
| G-03 | Memungkinkan pengguna memilih varian warna | FR-09, FR-10 |
| G-04 | Menampilkan harga dan status pembelian secara jelas | FR-07, FR-08, FR-11 |
| G-05 | Menjelaskan USP produk secara ringkas | FR-13 |
| G-06 | Menyediakan informasi benefit pembelian (shipping, returns, protection) | FR-14, FR-15, FR-16 |
| G-07 | Menjelaskan kolaborasi TUMI dan karakter desain produk | FR-17, FR-18 |
| G-08 | Menyediakan spesifikasi teknis lengkap | FR-19 |
| G-09 | Menampilkan isi paket pembelian | FR-20 |
| G-10 | Menyediakan akses ke product support | FR-21 |
| G-11 | Menyediakan navigasi utama, search, account, cart, country selector | FR-01, FR-02, FR-03 |
| G-12 | Menyediakan pengalaman responsif dan aksesibel | FR-24, FR-25 |

### 3.2 Non-Goals

- Implementasi backend e-commerce lengkap.
- Pengelolaan inventori/admin.
- Sistem pembayaran dan checkout lengkap.
- Review/rating pengguna.
- Personalisasi rekomendasi berbasis machine learning.
- Sistem CMS untuk mengubah konten produk.

---

## 4. User Flow

### 4.1 Flow Utama

1. Pengguna membuka halaman detail MW75 TUMI.
2. Header dan navigasi global ditampilkan.
3. Galeri produk menampilkan gambar utama dan thumbnail/slide.
4. Pengguna menekan Previous/Next untuk berpindah gambar.
5. Pengguna melihat nama produk, kategori, harga US$750.00, status ketersediaan, pilihan warna.
6. Pengguna memilih Black atau Silver.
7. State warna aktif diperbarui dan visual produk mengikuti varian.
8. Pengguna melihat CTA ADD TO CART sesuai status produk.
9. Pengguna membaca USP: ANC, material, driver, battery, Bluetooth, microphone.
10. Pengguna membaca Free Shipping, Free Returns, Product Protection.
11. Pengguna membaca kolaborasi TUMI dan deskripsi MW75.
12. Pengguna membaca Tech Specs.
13. Pengguna melihat daftar isi kotak.
14. Pengguna menuju Product Support/FAQ bila butuh bantuan.
15. Pengguna memakai footer untuk navigasi tambahan, newsletter, privacy, terms, info perusahaan.

### 4.2 Kondisi Awal (Initial State)

- Varian yang ditampilkan: **Black**.
- Galeri berada pada state awal produk (index gambar pertama).
- Harga ditampilkan **US$750.00**.
- Halaman menunjukkan state **Sold out / Pre-Order** pada area CTA (kondisi teramati).
- Country selector menunjukkan **US** dan menyediakan pilihan negara/mata uang.
- Cart count = 0 (atau nilai awal dari state lokal).

### 4.3 State Transitions

| Aksi Pengguna | State Sebelum | State Sesudah | Elemen Terdampak |
|---------------|---------------|---------------|------------------|
| Klik Next | `galleryIndex = n` | `galleryIndex = n+1` (wrap atau clamp, lihat BHV-01) | Main image, counter/thumbnail active |
| Klik Previous | `galleryIndex = n` | `galleryIndex = n-1` | Main image, counter/thumbnail active |
| Klik thumbnail `i` | `galleryIndex = n` | `galleryIndex = i` | Main image, thumbnail active |
| Pilih varian Silver | `variant = black` | `variant = silver` | Variant selector, gallery set, alt text, URL `?variant=silver` |
| Pilih varian Black | `variant = silver` | `variant = black` | Kembali ke set gambar Black, URL `?variant=black` |
| Klik CTA (aktif) | `cartCount = n` | `cartCount = n+1` | Cart badge, feedback toast/inline |
| Klik CTA (disabled) | — | tidak ada perubahan | CTA tetap disabled, tidak ada error |
| Buka Search | `searchOpen = false` | `searchOpen = true` | Search overlay/panel, focus pindah ke input |
| Tutup Search | `searchOpen = true` | `searchOpen = false` | Focus kembali ke trigger |
| Buka country selector | `marketMenuOpen = false` | `marketMenuOpen = true` | Dropdown market |
| Pilih market | `market = US` | `market = <pilihan>` | Label negara, format currency, konteks shipping |

---

## 5. Features + Requirements (Functional)

### 5.1 Tabel FR Lengkap

| ID | Fitur | Requirement Detail | Acceptance Criteria |
|----|-------|--------------------|---------------------|
| FR-01 | Header & Navigation | Brand **Master & Dynamic**; menu Headphones, Earphones, Accessories, Collaborations, Blog; ikon Account, Search, Cart (dengan jumlah); country selector. Mobile: berubah menjadi drawer/menu hamburger tanpa kehilangan fungsi. | AC-01, AC-15, AC-16 |
| FR-02 | Country Selector | Daftar negara/market + mata uang; default United States (USD); pemilihan market mengubah konteks currency/shipping (boleh simulasi). | AC-14 |
| FR-03 | Search | Input pencarian; area **Suggested** saat dibuka; dapat dibuka dan ditutup; fokus terkelola. | AC-13 |
| FR-04 | Product Gallery | Gambar utama MW75 TUMI + thumbnail/slide yang dapat dipilih; gambar proporsional, tidak terdistorsi (`object-fit`), alt text per varian. | AC-02 |
| FR-05 | Gallery Navigation | Kontrol **Previous** dan **Next** berupa `<button>`; muncul juga pada thumbnail; state index konsisten. | AC-03, AC-04 |
| FR-06 | Product Identity | `h1`: **MW75 TUMI**; kategori: **Noise-Cancelling Wireless Headphones**. | AC-01 |
| FR-07 | Price | **US$750.00** pada state referensi; format mengikuti market/currency aktif. | AC-07 |
| FR-08 | Availability | Badge **Sold out** / **Pre-Order** sesuai state katalog; satu sumber config dengan CTA. | AC-08 |
| FR-09 | Color Variant | Pilihan **Black** (default) dan **Silver**; single-select; active state jelas (bukan warna saja): outline/terpilih + teks "Black"/"Silver" + `aria-pressed`/`aria-checked`. | AC-05, AC-06, AC-17 |
| FR-10 | Variant Sync | Perubahan varian memperbarui: state produk, set gambar gallery, alt text, dan URL (`?variant=`). | AC-18 |
| FR-11 | Add to Cart | CTA **ADD TO CART** mengikuti availability; label, disabled state, dan hover/focus/disabled jelas; kontras memadai. | AC-08, AC-20 |
| FR-12 | Purchase Protection | Area "Enhance your purchase with protection" bila tersedia (bisa disembunyikan jika tidak dikonfigurasi). | AC-01 |
| FR-13 | USP Strip | 6 highlight: (1) ANC, (2) Anodized aluminum/tempered glass/lambskin leather, (3) 40mm beryllium drivers, (4) 32 hours listening, (5) Bluetooth 5.1, (6) 4 beamforming microphones. | AC-09 |
| FR-14 | Shipping Benefit | Free ground shipping untuk pesanan **US$99+** (market US). | AC-01 |
| FR-15 | Return Benefit | Free returns, periode **14 hari**. | AC-01 |
| FR-16 | Product Protection | Informasi manufacturer warranty. | AC-01 |
| FR-17 | TUMI Collaboration | Cerita kolaborasi Master & Dynamic × TUMI, desain **19 Degree**. | AC-01 |
| FR-18 | Product Description | Adaptive ANC, serious acoustics, 40mm Beryllium, lightweight anodized aluminum, lambskin leather, all-day listening. | AC-01 |
| FR-19 | Tech Specs | Spec groups: Build (Material, Dimensions, Weight), Audio (Ear coupling, Ear pads, Drivers, Impedance), Microphone (Talk microphones, ANC microphones, Voice assistant), Power (Battery), Connectivity (Bluetooth, Wired digital, Analog), Accessories (Cables, Antenna). Label/value mudah dibedakan; grid 2 kolom desktop, 1 kolom mobile. | AC-10 |
| FR-20 | In The Box | 7 item: Wireless Headphones; USB-C to USB-C cable; USB-C to 3.5mm cable; USB-C to USB-A adapter; 3.5mm to 1/4 adapter; Flight adapter; Hard shell travel case. Visual item + label. | AC-11 |
| FR-21 | Support | Link **Support Center** + FAQ/product documentation; target jelas. | AC-12 |
| FR-22 | Newsletter | Form sign-up (early access, news, exclusive offers); validasi input email sederhana; submit simulasi. | AC-01 |
| FR-23 | Footer | Product Comparisons, Product Support, Shopping Info, About, News, Contact, Corporate Gifting, Digital Gift Card; legal: Privacy, Terms, Accessibility, Data Requests. | AC-19 |
| FR-24 | Responsive | Desktop ≥1024px, Tablet 768–1023px, Mobile ≤767px; fungsi inti utuh pada 375px; tanpa horizontal scroll. | AC-15 |
| FR-25 | Accessibility | Focus state, accessible name, keyboard interaction, alt text gambar produk. | AC-16, AC-17 |

### 5.2 Detail per Modul

#### FR-01 — Header & Navigation
- Struktur: brand (kiri) · nav utama (tengah) · Search/Account/Cart/Country (kanan).
- Cart menampilkan indikator jumlah (badge) yang diperbarui oleh BHV-05.
- Mobile: hamburger membuka drawer; drawer bisa ditutup (tombol ×, Esc, klik overlay).
- Link kategori bersifat tautan (boleh `#` / placeholder) dengan `target` yang jelas (BHV-11).

#### FR-02 — Country Selector
- Bentuk: tombol dengan label negara aktif (`US / USD`) + dropdown daftar market.
- Daftar minimal: United States (USD), dan beberapa market lain (mis. Europe/EUR, United Kingdom/GBP, Japan/JPY) — daftar dikonfigurasi di satu tempat.
- Efek: mengubah label negara dan format harga (simulasi cukup, sesuai Constraints).

#### FR-03 — Search
- Tombol Search membuka panel/overlay berisi input + area "Suggested" (daftar produk saran, boleh statis/mock).
- Dapat ditutup dengan tombol close, `Esc`, atau klik di luar.
- Focus berpindah ke input saat dibuka dan kembali ke trigger saat ditutup (`aria-expanded`).

#### FR-04 / FR-05 — Gallery & Navigation
- Minimal 3–5 gambar per varian (mock asset boleh placeholder berkualitas).
- Komponen: main image (dengan alt), prev/next buttons, thumbnail list, index indicator (mis. "1 / 5").
- Perubahan gambar tidak menggeser layout secara ekstrem (area gambar berukuran tetap/aspect-ratio).
- `loading="lazy"` untuk gambar di luar viewport pertama; gambar pertama `fetchpriority="high"`.

#### FR-09 / FR-10 — Variant
- Data varian memuat: `id`, `label`, `swatchColor`, `images[]`, `altText`.
- Sinkronisasi: selector → gallery set → URL query `?variant=silver`.
- Saat halaman dibuka dengan `?variant=` tidak dikenal → fallback ke default (Black) tanpa error (BHV-03).

#### FR-11 — Add to Cart
- Satu CTA, perilaku ditentukan `availability` (tabel §1.2).
- Feedback saat berhasil: badge cart bertambah + pesan singkat (toast/`aria-live="polite"`).
- Cart disimpan di state lokal (module `src/state/cart.js`); opsional `localStorage`.

#### FR-13 — USP Strip
- Enam item, masing-masing: ikon/gambar kecil + label singkat + deskripsi 1 baris.
- Sumber teks dari data produk (lihat §1.1).

#### FR-19 — Tech Specs
- Struktur data: array of `{ group, items: [{ label, value }] }`.
- Render sebagai `<dl>` per group (label = `<dt>`, value = `<dd>`).
- Nilai numerik/berat diperoleh dari data produk, bukan diketik ulang.

#### FR-20 — In The Box
- Array of `{ name, icon/image, alt }`, dirender sebagai daftar visual (grid gambar + label).

---

## 6. Behavior / Interaction Detail (BHV)

| ID | Area | Perilaku | Ditangani oleh |
|----|------|----------|----------------|
| BHV-01 | Gallery | Memilih thumbnail atau menekan Previous/Next mengubah gambar utama ke gambar terkait; kontrol tidak menghilangkan konteks produk (identitas tetap terlihat). | `components/gallery.js` |
| BHV-02 | Color Selection | Black dipilih → Black active; Silver dipilih → Silver active; **hanya satu warna aktif** pada satu waktu. | `components/variant-selector.js` |
| BHV-03 | Variant URL | State varian direpresentasikan pada URL (`?variant=<id>`); halaman dapat dibuka langsung pada varian tertentu; `history.replaceState` saat ganti varian. | `state/variant.js` |
| BHV-04 | Add to Cart | CTA merespons availability: sold out → disabled & tidak menjanjikan transaksi instan; pre-order → label/perilaku mengikuti konfigurasi katalog. | `components/purchase-panel.js` |
| BHV-05 | Cart | CTA aktif ditekan → item/variant dikirim ke cart (state lokal) → indikator jumlah cart diperbarui. | `state/cart.js` |
| BHV-06 | Search | Search dibuka → field tampil + area Suggested; pengguna dapat menutup search. | `components/search.js` |
| BHV-07 | Account | Klik Account mengarahkan/membuka halaman account (link/placeholder sesuai implementasi). | `components/header.js` |
| BHV-08 | Country Selector | Klik → daftar market terbuka; pemilihan market mengubah konteks currency/shipping. | `components/country-selector.js` |
| BHV-09 | Scroll Content | Halaman dapat dibaca vertikal: purchase area → storytelling → specification → support → footer. | Urutan section di `main` |
| BHV-10 | Support | Klik Support Center → pusat bantuan/dokumentasi. | `components/support.js` |
| BHV-11 | External/Secondary Nav | Link Learn more, collaboration, product comparisons, news, privacy, terms, accessibility punya target jelas (URL/anchor/`#` + `rel` bila eksternal). | Footer + header |
| BHV-12 | Responsive Gallery | Layar kecil: gallery & product info vertikal; kontrol tetap mudah disentuh (min tap target ~44px). | CSS breakpoint |
| BHV-13 | Focus | Kontrol keyboard punya focus indicator terlihat; urutan Tab logis sesuai urutan visual. | CSS `:focus-visible` + DOM order |
| BHV-14 | Image Accessibility | Setiap gambar produk memiliki alt yang menjelaskan produk/varian (mis. "MW75 TUMI headphones in Black — three-quarter view"). | Data varian `altText` |

### 6.1 Aturan Gallery (detail BHV-01)

- Navigasi: **clamp** di awal/akhir **atau** wrap-around — pilih salah satu dan konsisten; rekomendasi: **wrap-around** agar tombol selalu aktif, dengan index indicator sebagai penanda posisi.
- Perubahan gambar: hanya `<img src>`/`srcset` yang berubah; container memakai `aspect-ratio` agar tidak ada layout shift (AC-20).
- Thumbnail aktif ditandai outline + `aria-current="true"` (bukan warna saja).

### 6.2 Aturan Variant (detail BHV-02, BHV-03)

- Kontrol varian berupa `<button role="radio">` dalam `role="radiogroup"` **atau** `<button aria-pressed>`; pilih salah satu pola dan konsisten.
- Saat varian berubah: (1) update `state.variant`, (2) tukar set gambar gallery ke index 0 varian baru, (3) update alt text, (4) `history.replaceState` URL `?variant=`, (5) umumkan perubahan ke live region (`aria-live="polite"`): "Varian dipilih: Silver".
- Jika availability per varian berbeda, badge + CTA ikut diperbarui dari config varian.

### 6.3 Aturan CTA (detail BHV-04, BHV-05)

- `disabled`/`aria-disabled` + penjelasan status (badge) di atas CTA.
- Saat aktif: optimistik update cart count, tampilkan konfirmasi inline/toast selama ~2–3 detik, nonaktifkan duplikasi klik selama proses (opsional, simulasi sinkron).
- Tidak ada permintaan jaringan; semua di memori.

### 6.4 Aturan Search & Overlay (detail BHV-06)

- `aria-expanded` pada trigger, `role="dialog"` `aria-modal="true"` untuk panel (bila overlay penuh).
- Tutup dengan tombol, `Esc`, dan klik overlay.
- Suggested items dari data mock (`src/data/suggested.js`).

---

## 7. User Stories

| ID | Sebagai | Saya ingin | Agar | Acceptance Criteria |
|----|---------|-----------|------|---------------------|
| US-01 | Calon pembeli | melihat foto produk dari beberapa sudut | memahami desain headphone | AC-02, AC-03, AC-04 |
| US-02 | Calon pembeli | mengetahui nama, kategori, dan harga | mengevaluasi produk sebelum membeli | AC-01, AC-07 |
| US-03 | Calon pembeli | memilih warna Black atau Silver | melihat varian yang saya inginkan | AC-05, AC-06, AC-18 |
| US-04 | Calon pembeli | melihat status ketersediaan | tidak salah mengira produk selalu tersedia | AC-08 |
| US-05 | Calon pembeli | mengetahui keunggulan ANC, driver, battery, Bluetooth, microphone | membandingkan produk | AC-09 |
| US-06 | Calon pembeli | membaca spesifikasi teknis lengkap | memastikan kompatibilitas dan kebutuhan | AC-10 |
| US-07 | Calon pembeli | mengetahui isi paket | tahu aksesori yang diterima | AC-11 |
| US-08 | Calon pembeli | mengetahui kebijakan shipping, return, warranty | merasa yakin sebelum membeli | AC-01 |
| US-09 | Pengguna produk | menemukan Support Center | mencari bantuan setelah pembelian | AC-12 |
| US-10 | Pengguna mobile | halaman tetap mudah digunakan | tanpa horizontal scrolling | AC-15 |

---

## 8. Acceptance Criteria

| ID | Skenario | Hasil yang Diharapkan | FR/BHV |
|----|----------|-----------------------|--------|
| AC-01 | Pengguna membuka halaman | Header, gallery, nama, kategori, harga, variant, CTA, USP, benefit, description, specs, in-the-box, support, footer tampil. | FR-01…FR-23 |
| AC-02 | Gallery ditampilkan | Gambar produk tampil proporsional dan tidak terdistorsi. | FR-04 |
| AC-03 | Pengguna menekan Next | Gallery berpindah ke gambar berikutnya. | FR-05, BHV-01 |
| AC-04 | Pengguna menekan Previous | Gallery berpindah ke gambar sebelumnya. | FR-05, BHV-01 |
| AC-05 | Pengguna memilih Black | Black menjadi active state dan visual produk mengikuti Black. | FR-09, BHV-02 |
| AC-06 | Pengguna memilih Silver | Silver menjadi active state dan visual produk mengikuti Silver. | FR-09, BHV-02 |
| AC-07 | Pengguna melihat harga | Harga tampil sebagai **US$750.00** pada state referensi. | FR-07 |
| AC-08 | Produk unavailable | Status Sold out/Pre-Order tampil konsisten dengan katalog dan CTA tidak menyesatkan. | FR-08, FR-11, BHV-04 |
| AC-09 | Pengguna membaca USP | Enam USP utama ditemukan tanpa membuka halaman lain. | FR-13 |
| AC-10 | Pengguna membaca specs | Seluruh kelompok spesifikasi utama terbaca; label/value mudah dibedakan. | FR-19 |
| AC-11 | Pengguna membaca In The Box | Seluruh 7 item paket ditemukan. | FR-20 |
| AC-12 | Pengguna membuka Support | Link Support Center dapat diakses dan mengarah ke resource support. | FR-21, BHV-10 |
| AC-13 | Pengguna menggunakan Search | Search field dapat dibuka, digunakan, dan ditutup. | FR-03, BHV-06 |
| AC-14 | Pengguna membuka country selector | Daftar market tersedia dan dapat dipilih. | FR-02, BHV-08 |
| AC-15 | Lebar 375 px | Tidak ada horizontal scroll tidak disengaja; CTA, gallery, text, navigation tetap usable. | FR-24, BHV-12 |
| AC-16 | Keyboard navigation | Semua kontrol utama terjangkau dengan Tab dan focus terlihat. | FR-25, BHV-13 |
| AC-17 | Screen reader | Nama kontrol dan status varian dapat dikenali melalui semantic/accessibility attributes. | FR-25, BHV-14 |
| AC-18 | Perubahan variant | State variant, gambar, dan URL/state internal tetap konsisten. | FR-10, BHV-03 |
| AC-19 | Footer | Link legal, support, company, gifting, shopping dapat ditemukan. | FR-23, BHV-11 |
| AC-20 | Tidak ada interaksi | Halaman stabil; tidak ada layout shift yang membuat konten utama sulit digunakan. | FR-11, NFR-03 |

**Cara verifikasi AC** (dipakai di `TASK.md`):
- AC-01…AC-12, AC-19: inspeksi visual + pastikan elemen ada (manual/DOM check).
- AC-13, AC-14: interaksi klik + tutup.
- AC-15: DevTools responsive 375×667, cek `document.documentElement.scrollWidth <= clientWidth`.
- AC-16: navigasi Tab manual dari atas ke bawah; `:focus-visible` tampil.
- AC-17: inspect ARIA (`aria-pressed`, `aria-expanded`, `aria-current`, live region) + screen reader bila tersedia.
- AC-18: ubah varian, cek UI + `location.search`.
- AC-20: toggle/devtools, ukur layout shift (CLS ~0) pada transisi state.

---

## 9. Non-Functional Requirements

| ID | Kategori | Requirement |
|----|----------|-------------|
| NFR-01 | Responsive | Breakpoints: Desktop ≥1024px, Tablet 768–1023px, Mobile ≤767px; target uji **375px**; tidak ada horizontal scroll tidak disengaja; gallery & info vertikal pada mobile; kontrol sentuh ≥44×44px. |
| NFR-02 | Accessibility | Semantic HTML (`header, nav, main, section, footer, button`); heading hierarchy h1→h2→h3; button untuk aksi interaktif (bukan div); alt text deskriptif; focus terlihat (`:focus-visible`); keyboard nav lengkap; accessible name & status varian; kontras memadai (WCAG 2.1 AA: teks ≥4.5:1, non-teks ≥3:1); jangan mengandalkan warna saja untuk active state. |
| NFR-03 | Performance | Optimasi ukuran gambar; `loading="lazy"` untuk asset di bawah fold; gambar pertama diprioritaskan; tidak ada layout shift ekstrem saat perubahan state; tidak ada error JavaScript pada alur utama. |
| NFR-04 | Data Consistency | Single source of truth untuk harga, variant, availability, spec; tidak ada inkonsistensi antar bagian (hero, USP, specs, in-the-box). |
| NFR-05 | Maintainability | Struktur modular (`src/components`, `src/data`, `src/state`, `src/styles`); ID requirement dapat ditelusuri ke komponen (lihat `DESIGN.md`) dan tugas (lihat `TASK.md`); konten berubah (availability, policy) dikonfigurasi, bukan hard-coded di banyak tempat. |

---

## 10. Content & Data Specification

| Kelompok | Konten wajib |
|----------|-------------|
| Product Hero | MW75 TUMI; Noise-Cancelling Wireless Headphones; US$750.00; Black/Silver; availability; Add to Cart |
| USP | ANC; anodized aluminum/tempered glass/lambskin leather; 40mm beryllium drivers; 32 hours; Bluetooth 5.1; 4 beamforming microphones |
| TUMI Story | Master & Dynamic for TUMI; collaboration; 19 Degree design details |
| Description | Adaptive ANC; serious acoustics; 40mm Beryllium; lightweight anodized aluminum; lambskin leather; all-day listening |
| Tech Specs | Material, dimensions, weight, ear coupling, ear pads, drivers, impedance, talk microphones, ANC microphones, voice assistant, battery, Bluetooth, wired digital, analog, cables, antenna |
| In The Box | Headphones, USB-C to USB-C cable, USB-C to 3.5mm cable, USB-C to USB-A adapter, 3.5mm to 1/4 adapter, flight adapter, hard shell travel case |
| Support | Support Center, FAQ/product documentation |
| Newsletter | Headline early access, news, exclusive offers; input email; tombol sign-up |
| Footer | Product Comparisons, Product Support, Shopping Info, About, News, Contact, Corporate Gifting, Digital Gift Card; privacy, terms, accessibility, data requests |

---

## 11. Constraints

- Implementasi memakai **HTML, CSS, JavaScript murni dalam Vite** (proyek ini belum memakai framework); PRD mendefinisikan perilaku, bukan mewajibkan framework.
- Data produk disimpan sebagai **data lokal/mock**.
- Asset gambar berkualitas cukup untuk gallery, tidak boleh terdistorsi.
- Harga, variant, availability, specification berasal dari **satu sumber data**.
- Checkout/payment backend tidak wajib.
- Perubahan market/currency dapat disimulasikan.
- Cart dapat simulasi frontend (state lokal).
- Konten yang berubah dari waktu ke waktu (availability, shipping, policy) diperlakukan sebagai **konfigurasi**, bukan hard-coded di banyak tempat.

---

## 12. Success Criteria

1. Seluruh acceptance criteria (AC-01…AC-20) lulus pada desktop dan mobile.
2. Pengguna memahami produk, harga, variant, availability, USP, specifications, dan isi paket tanpa kebingungan.
3. Gallery dan color selection menghasilkan state yang konsisten.
4. CTA pembelian selalu konsisten dengan availability.
5. Tidak ada horizontal overflow pada viewport mobile (375px).
6. Navigasi keyboard dan accessible labels tersedia pada kontrol interaktif.
7. Tidak ada error JavaScript pada alur utama.
8. Data produk tidak saling bertentangan antara hero, USP, specs, dan in-the-box.
9. Hierarki visual jelas: purchase area → value proposition → product story → technical specifications → package contents → support → footer.

---

## 13. Reference Behavior Mapping

| Area | Observed Behavior | PRD Implementation |
|------|-------------------|--------------------|
| Global Header | Navigation, search, account, cart, country selector | Header responsif dengan drawer/dropdown pada mobile |
| Gallery | Multiple product images + Previous/Next | Interactive carousel/gallery |
| Variant | Black dan Silver | Single-select variant control |
| Price/CTA | US$750.00 + Sold out/Pre-Order + Add to Cart | Availability-aware purchase module |
| USP | Six concise product highlights | Feature/benefit strip |
| Policy | Shipping, returns, warranty | Trust/benefit cards |
| Story | TUMI collaboration + MW75 description | Editorial product storytelling section |
| Specs | Grouped technical specifications | Structured specification grid/list |
| Package | Visual in-the-box items | Package contents gallery/list |
| Support | Support Center | Support CTA/link |
| Footer | Newsletter + company/help/legal navigation | Structured footer |

---

## 14. Notes & Assumptions

- PRD mempertahankan pola dokumen acuan: Product Overview, Problem + Target User, Goals + Non-Goals, User Flow, Features + Requirements, User Stories, Acceptance Criteria, Constraints + Success Criteria.
- Perilaku transaksi (hasil ADD TO CART, checkout, perubahan harga/currency) tidak dapat dipastikan dari representasi teks halaman; PRD mendefinisikan expected behavior yang aman untuk frontend dan membedakan state katalog vs. yang membutuhkan backend.
- Pada halaman ditinjau, status **Sold out** dan **Pre-Order** bersamaan dengan CTA ADD TO CART → implementasi menjadikan availability sebagai state terkontrol agar label dan CTA tidak kontradiktif.
- Aset gambar resmi Master & Dynamic tidak disertakan; implementasi memakai placeholder lokal dengan rasio/alt yang sama, mudah diganti.
- Jika di kemudian hari ditambahkan halaman lain (cart, checkout), struktur `src/state` dan `src/data` dirancang agar dapat dipakai ulang.
