# API Produk — Back-End Service

Layanan API katalog produk berbasis **Node.js 18+**, **Express 4**, **MySQL 8**, **Zod**, dan **Swagger (OpenAPI 3.0)**.

---

## 1. Arsitektur & Struktur Direktori

Arsitektur berlapis (*layered architecture*) dengan pemisahan tanggung jawab yang ketat:
```
api-produk/
├── src/
│   ├── config/          # Konfigurasi pool database (mysql2/promise)
│   ├── controllers/     # HTTP handler & response serialization
│   ├── services/        # Logika bisnis & orkestrasi data tanpa N+1
│   ├── repositories/    # Query SQL mentah & transaksi database
│   ├── routes/          # Definisi rute Express & Allow methods
│   ├── middlewares/     # Error handler RFC 9457 & validasi Zod
│   ├── schemas/         # Skema validasi Zod untuk request body/query
│   ├── docs/            # Loader spesifikasi OpenAPI
│   ├── errors.js        # Kelas AppError & error factories
│   ├── app.js           # Express app instance & middleware global
│   └── server.js        # Entry point server HTTP & graceful shutdown
├── db/
│   ├── migrations/      # Berkas DDL migrasi (001_init.sql, 002_cart.sql, 003_orders.sql)
│   └── seed.sql         # Data seed awal (produk, varian, foto, pesanan contoh, reset cart)
├── docs/
│   └── openapi.yaml     # Kontrak spesifikasi OpenAPI 3.0.3 lengkap
├── scripts/
│   ├── dev-db.js        # MySQL server lokal untuk development
│   ├── integration.js   # Integration test otomatis (ephemeral MySQL)
│   ├── run-sql.js       # Runner berkas SQL menggunakan koneksi .env
│   ├── smoke.js         # Smoke test suite API
│   └── validate-openapi.js # Validasi sintaks & kelengkapan OpenAPI
├── docker-compose.yml   # Konfigurasi container MySQL 8
└── package.json
```

---

## 2. Cara Setup dari Nol

### Langkah 1: Pasang Dependensi
```bash
npm install
```

### Langkah 2: Konfigurasi Environment
Salin berkas template environment:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi di `.env` jika diperlukan:
```ini
PORT=3000
CORS_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=app
DB_PASS=app_secret
DB_NAME=api_produk
```

### Langkah 3: Menjalankan Database

Pilih salah satu metode berikut:

#### Opsi A: Menggunakan Docker (Rekomendasi jika Docker tersedia)
```bash
docker compose up -d
npm run db:migrate
npm run db:seed
```

#### Opsi B: Menggunakan Dev Database Mandiri (Tanpa Docker / WSL)
Jika Docker tidak tersedia di lingkungan Anda, gunakan runner database bawaan:
```bash
npm run db:dev
```
Perintah ini akan menyalakan server MySQL lokal pada port 3306, menjalankan migrasi, dan menyisipkan data seed secara otomatis. Biarkan proses ini berjalan di satu terminal.

### Langkah 4: Menjalankan Server Aplikasi
Buka terminal baru lalu jalankan:

**Mode Pengembangan (dengan auto-reload):**
```bash
npm run dev
```

**Mode Produksi:**
```bash
npm start
```

Server akan aktif di `http://localhost:3000`.

---

## 3. Dokumentasi API & Swagger UI

Spesifikasi dan dokumentasi interaktif tersedia secara langsung saat server berjalan:
- **Swagger UI Interactive**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI YAML**: [http://localhost:3000/openapi.yaml](http://localhost:3000/openapi.yaml)
- **OpenAPI JSON**: [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

---

## 4. Daftar Endpoint API

| Method | Endpoint | Deskripsi | Status Sukses |
|--------|----------|-----------|---------------|
| `GET` | `/health` | Cek ketersediaan aplikasi & status koneksi DB | `200` / `503` |
| `GET` | `/api/products` | Mendapatkan daftar produk (mendukung `search`, `limit`, `offset`) | `200` |
| `POST` | `/api/products` | Membuat produk baru (lengkap dengan varian & foto) | `201` + `Location` |
| `GET` | `/api/products/:id` | Mengambil detail 1 produk berdasarkan slug ID | `200` |
| `PUT` | `/api/products/:id` | Mengganti seluruh data produk (transaksional) | `200` |
| `DELETE` | `/api/products/:id` | Menghapus produk beserta seluruh varian & fotonya | `204` |
| `POST` | `/api/cart/items` | Tambah item ke cart (digabung bila produk + warna sama); dibatasi stok varian | `200` |
| `GET` | `/api/cart/:cartToken` | Ambil isi cart (`count`, `subtotal`, `items[]`) — token baru → cart kosong | `200` |
| `PATCH` | `/api/cart/:cartToken/items/:itemId` | Ganti jumlah satu item cart | `200` |
| `DELETE` | `/api/cart/:cartToken/items/:itemId` | Hapus satu item cart | `200` |
| `DELETE` | `/api/cart/:cartToken` | Kosongkan seluruh cart (idempoten) | `200` |
| `GET` | `/api/orders` | Daftar pesanan + item-nya (filter `cartToken`, `status`, `limit`, `offset`) | `200` |
| `POST` | `/api/orders` | **Checkout** — ubah isi cart jadi pesanan (validasi & potong stok, snapshot harga, cart dikosongkan) | `201` + `Location` |
| `GET` | `/api/orders/:orderId` | Detail pesanan beserta item yang dipesan | `200` |
| `PATCH` | `/api/orders/:orderId` | Ubah status (`pending`/`paid`/`shipped`/`delivered`/`cancelled`) / data pembeli | `200` |
| `DELETE` | `/api/orders/:orderId` | Hapus pesanan (item ikut CASCADE, stok dikembalikan bila belum `cancelled`) | `204` |

**Cart token** adalah UUID (client) yang disimpan di tabel `carts` — tanpa autentikasi.
Error cart: `409 INSUFFICIENT_STOCK` (melebihi `product_variants.quantity`),
`404 VARIANT_NOT_FOUND`, `404 PRODUCT_NOT_FOUND`, `404 CART_ITEM_NOT_FOUND`.

**Pesanan** disimpan di tabel `orders` + `order_items` (nama & harga di-*snapshot* saat checkout —
riwayat tetap akurat walau produk berubah). Efek stok: dibuat → dipotong; masuk `cancelled` →
dikembalikan; keluar `cancelled` → dipotong lagi; `DELETE` → dikembalikan.
Error pesanan: `409 CART_EMPTY`, `409 INSUFFICIENT_STOCK`, `404 ORDER_NOT_FOUND`.
Contoh pesanan seed: `MD-261001-A11C` (delivered) & `MD-261005-B22D` (pending).

---

## 5. Konvensi Respons & Error Handling

- **Respons Sukses**: dibungkus dalam envelope `{ "data": ... }` atau `{ "data": [...], "meta": { ... } }` dengan `Content-Type: application/json; charset=utf-8`.
- **Respons Gagal**: mengikuti standar **RFC 9457 Problem Details** dengan `Content-Type: application/problem+json; charset=utf-8`:
```json
{
  "type": "https://errors.api.produk/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Input tidak valid",
  "instance": "/api/products/MW75",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "id",
      "rule": "regex",
      "value": "MW75",
      "message": "Slug hanya huruf kecil, angka, dan strip"
    }
  ]
}
```

---

## 6. Pengujian & QA

Jalankan skrip pengujian untuk memverifikasi fungsionalitas dan kepatuhan kontrak:

```bash
# 1. Validasi spesifikasi OpenAPI (OpenAPI 3.0.3, struktur path, resolusi $ref)
npm run docs:openapi

# 2. Integration test penuh (ephemeral MySQL, migrasi 001+002+003, seed, 60 test assertions)
npm run test:integration

# 3. Smoke test terhadap server yang sedang berjalan
npm run smoke
```
