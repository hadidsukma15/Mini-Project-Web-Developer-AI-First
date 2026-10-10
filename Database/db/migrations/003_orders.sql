-- 003_orders.sql — tabel pesanan (MySQL 8 / InnoDB / utf8mb4)
-- Menyimpan pesanan hasil checkout dari cart ("bisa lihat apa yang dipesan").
-- Semua harga & nama produk di-*snapshot* ke `order_items` saat pesanan dibuat,
-- sehingga riwayat tetap akurat walaupun data produk berubah (arsitektur §6.1).
-- Aman dijalankan berulang (IF NOT EXISTS) dan idempoten terhadap 001/002.

-- 1. Order: satu baris per pesanan
CREATE TABLE IF NOT EXISTS orders (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  order_number  VARCHAR(20)  NOT NULL,                 -- nomor unik tampilan (MD-YYMMDD-XXXX)
  cart_id       CHAR(36)     NOT NULL,                 -- cart token pembeli (UUID, tanpa autentikasi)
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  currency      CHAR(3)      NOT NULL DEFAULT 'USD',   -- konstanta aplikasi (belum ada kolom tarif)
  customer_name VARCHAR(80)  NULL,                     -- snapshot identitas saat checkout
  email         VARCHAR(120) NULL,
  note          VARCHAR(500) NULL,                     -- catatan pembeli (opsional)
  subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0,      -- Σ line_total dari order_items
  total         DECIMAL(10,2) NOT NULL DEFAULT 0,      -- subtotal + biaya masa depan (kini = subtotal)
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_cart (cart_id),
  KEY idx_orders_status (status),
  CONSTRAINT chk_orders_status CHECK
    (status IN ('pending','paid','shipped','delivered','cancelled')),
  CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_orders_total    CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Item order: snapshot (nama, harga, warna, jumlah) per baris produk yang dipesan
CREATE TABLE IF NOT EXISTS order_items (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  order_id     BIGINT       NOT NULL,
  product_id   VARCHAR(50)  NOT NULL,                  -- slug produk saat dipesan
  product_name VARCHAR(120) NOT NULL,                  -- snapshot nama (tidak ikut berubah)
  color        VARCHAR(30)  NOT NULL,                  -- warna varian yang dipesan
  unit_price   DECIMAL(10,2) NOT NULL,                 -- snapshot harga satuan (USD)
  quantity     INT UNSIGNED NOT NULL,
  line_total   DECIMAL(10,2) NOT NULL,                 -- unit_price * quantity
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT chk_order_items_quantity CHECK (quantity >= 1),
  CONSTRAINT chk_order_items_price    CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
