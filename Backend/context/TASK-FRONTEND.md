# Task List — Frontend (Halaman Detail Produk)

| Informasi | Keterangan |
|-----------|-----------|
| Dokumen | TASK-FRONTEND.md (tasklist frontend — pasangan `TASK-BACKEND.md`) |
| Lokasi | Root project (`src/`, `public/`, `index.html`) |
| Stack | Vite + Vanilla HTML/CSS/JavaScript |
| Detail lengkap | Fase 0–9 per sub-task → `TASK.md` (dokumen induk, mayoritas sudah selesai) |
| Perintah | `npm run dev` · `npm run build` · `npm run preview` · `npm test` |
| Backend | `api-produk/` — Swagger UI `http://localhost:3000/api-docs`, spec `http://localhost:3000/openapi.yaml` |

**Cara pakai**
- Centang `[ ]` → `[x]` setelah diverifikasi (build lulus, console bersih, alur teruji).
- **Blok A** = sisa pekerjaan frontend murni · **Blok B** = integrasi backend API · **Blok C** = lanjutan opsional.
- Status terakhir diperbarui: **7 Okt 2026**.

---

## Status Implementasi (ringkas dari TASK.md)

| Bagian | Status | Keterangan |
|--------|--------|-----------|
| Fase 0 Setup · 1 Data & state · 2 Tokens & skeleton | ✅ selesai | Struktur `data/state/components/styles/utils` sesuai DESIGN §4 |
| Fase 3 Komponen inti · 4 Konten · 5 Newsletter/footer | ✅ selesai | Semua render dari `src/data/product.js` (single source of truth) |
| Fase 6 Responsive | 🟡 sebagian | T-6.2…T-6.4 lulus; **T-6.1 drawer mobile belum** (nav disembunyikan ≤1023px, tanpa hamburger) |
| Fase 7 A11y & perf | ✅ selesai | Focus visible, ARIA, lazy-load, reduced-motion |
| Fase 8 QA AC | ✅ selesai | `npm test` → 56/56 lulus (jsdom) · Playwright 0 console error, 0 overflow di 8 breakpoint |
| Fase 9 Finalisasi | 🟡 sebagian | T-9.1/T-9.2 selesai; T-9.3 menunggu T-6.1 |
| **Integrasi backend API** | ⬜ belum | Data masih 100% hardcode; belum ada `fetch` di `src/` |

---

## Blok A — Sisa Pekerjaan Frontend Murni

### A1. Drawer mobile (penghambat T-6.1 & T-9.3)
- [ ] Hamburger toggle di header (≤1023px) → drawer `role="dialog"` + overlay; tutup via × / Esc / klik overlay.
- [ ] Drawer memuat nav utama, country selector, account (yang kini disembunyikan di ≤640px).
- [ ] Tap target ≥44px; fokus masuk ke drawer dan kembali ke trigger saat ditutup (focus trap).
- [ ] `aria-expanded` pada trigger hamburger; body scroll di-lock saat drawer terbuka.
- [ ] Verifikasi: uji 375px buka/tutup; `scrollWidth <= clientWidth`; 0 console error.

**Ref:** TASK.md T-6.1 · FR-01, FR-24, AC-15 · **Verifikasi:** browser 375px.

### A2. Finalisasi
- [ ] T-6.1 lulus → centang T-9.3: arsipkan task, perbarui "known issues" di `TASK.md`.
- [ ] (Opsional) uji lintas browser Firefox/Safari bila tersedia.
- [ ] Pastikan `npm run build` + `npm test` tetap 56/56 setelah perubahan drawer.

**Ref:** TASK.md T-9.3 · **Verifikasi:** semua checklist TASK.md tercentang.

---

## Blok B — Integrasi Backend API (Langkah 2)

> Kontrak: `api-produk/context/prd.md` §8 (respons) dan §14.1 (pemetaan payload → komponen).
> Field yang **tersedia dari API**: `id`, `name`, `price`, `currency`, `description`, `images[]` (dengan `color`), `variants[]` (`color`, `swatch`, `quantity`).
> Field yang **belum ada di DB** (tetap dari `src/data/product.js`): `category`, `availability`, `usps[]`, `policies`, `story`, `specs[]`, `inTheBox[]`, `support`, `newsletter` → `api-produk` architecture §6.1/§14.

### B1. API client & konfigurasi
- [ ] `src/utils/api.js` — wrapper `fetch`: base URL dari `import.meta.env.VITE_API_URL` (default `http://localhost:3000`), timeout/abort, parse envelope `{data}`.
- [ ] Tangani `application/problem+json` (RFC 9457) → objek error terstruktur (`code`, `title`, `detail`, `errors[]`).
- [ ] `.env.example` front-end: `VITE_API_URL=http://localhost:3000`.
- [ ] Pastikan CORS backend mengizinkan origin `http://localhost:5173` (sudah di `api-produk/.env.example`).

**Ref:** PRD §14.3, US-07 · **Verifikasi:** panggil API dari halaman dev tanpa blokir CORS.

### B2. Boot: fetch payload detail
- [ ] Saat init, `GET /api/products/mw75-tumi` → render seluruh section dari `.data`.
- [ ] **Loading state**: skeleton/placeholder saat menunggu (tanpa layout shift, CLS tetap ~0).
- [ ] **Gagal jaringan / API mati** → fallback ke `src/data/product.js` + `console.error` + indikator halus (halaman tetap utuh).
- [ ] **400/404 (problem+json)** → tampilkan pesan fallback dari `detail`, **jangan** render konten setengah jalan.
- [ ] Ganti varian tetap **tanpa request baru** (state lokal + URL `?variant=`).

**Ref:** PRD §14.2, §14.3, §14.4 · **Verifikasi:** matikan API → halaman tetap tampil (mock); hidupkan API → data dari server.

### B3. Pemetaan payload → komponen
- [ ] `name`, `price`, `currency` → purchase panel (`formatCurrency` tetap `US$750.00`).
- [ ] `images[]` → **filter per warna** (`images.filter(i => i.color === varianWarna)`) → gallery (urutan `sort_order` sudah dari query); fallback ke set lokal bila varian tak punya foto.
- [ ] `variants[]` → variant selector (`color`, `swatch`); `quantity = 0` → pertimbangkan status habis.
- [ ] `description` → section description.
- [ ] Field tanpa sumber DB (`category`, `availability`, `usps`, `policies`, `story`, `specs`, `inTheBox`, `support`) → **merge fallback** dari `src/data/product.js` (satu fungsi `mergeProduct(apiData)`).
- [ ] Harga/spec **hanya** dari satu sumber (jangan duplikasi literal — NFR-04).

**Ref:** PRD §14.1 · TASK.md T-9.1 · **Verifikasi:** grep `750`/`338`/`40mm` hanya di `src/data/` dan payload API.

### B4. State aplikasi & resilience
- [ ] Tambah state `productStatus: 'loading' | 'ready' | 'fallback' | 'error'` di `src/state/store.js`.
- [ ] CTA/badge mengikuti `availability` (dari mock, selama kolom belum ada di DB) + `variants[].quantity` bila relevan.
- [ ] Tidak ada console error pada alur: buka → load → ganti varian → cart → search → newsletter (dengan API hidup & mati).

**Ref:** BHV-04, AC-08, AC-20 · **Verifikasi:** uji dua skenario (API up/down).

### B5. QA integrasi
- [ ] `npm run build` sukses; `npm test` tetap **56/56** (perbarui smoke test bila struktur boot berubah).
- [ ] Uji viewport 375 / 768 / 1024 / 1440: tidak ada overflow, 0 console error.
- [ ] Uji keyboard + ARIA ulang untuk area yang berubah (loading/live region baru).
- [ ] Verifikasi kontrak pakai `npm run smoke` di backend (pastikan endpoint yang dipakai FE lulus).

**Ref:** TASK.md Fase 8 · architecture §13 · **Verifikasi:** seluruh skrip lulus.

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
A1 independen dengan Blok B → bisa paralel
B* butuh backend Fase 1 (DB hidup) untuk verifikasi penuh → lihat TASK-BACKEND.md
C menunggu B selesai
```

---

## Definition of Done (DoD) Frontend

1. Blok A tercentang: drawer mobile berfungsi, `TASK.md` Fase 6 & 9 penuh, `npm test` 56/56.
2. Blok B tercentang: halaman render dari API dengan fallback mock yang andal (API up & down), 0 console error.
3. `npm run build` + `npm run preview` tanpa error; tidak ada horizontal overflow di 375px.
4. Data single-source: konten yang tidak datang dari API tetap hanya di `src/data/product.js`.
5. Keyboard navigation, focus visible, dan ARIA inti tetap lulus (AC-16, AC-17).
6. Hierarki visual terjaga: purchase → value prop → story → specs → package → support → footer.
