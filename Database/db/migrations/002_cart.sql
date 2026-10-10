-- 002_cart.sql — tabel cart (MySQL 8 / InnoDB / utf8mb4)
-- Menyimpan keranjang belanja per "cart token" (UUID yang dipegang client,
-- tanpa autentikasi — lihat architecture §14 / TASK-BACKEND fase cart).
-- Aman dijalankan berulang (IF NOT EXISTS) dan idempoten terhadap 001_init.sql.

-- 1. Cart: satu baris per token client
CREATE TABLE IF NOT EXISTS carts (
  id         CHAR(36)    NOT NULL,                 -- UUID v4 dari client (cart token)
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Item cart: satu baris per (cart, produk, warna) — jumlah dipecah per baris
CREATE TABLE IF NOT EXISTS cart_items (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  cart_id    CHAR(36)     NOT NULL,
  product_id VARCHAR(50)  NOT NULL,
  color      VARCHAR(30)  NOT NULL,                -- warna varian ('Black', 'Silver')
  quantity   INT UNSIGNED NOT NULL DEFAULT 1,
  added_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_product_color (cart_id, product_id, color),
  KEY idx_cart_items_cart (cart_id),
  CONSTRAINT fk_item_cart
    FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
  CONSTRAINT fk_item_variant
    FOREIGN KEY (product_id, color)
    REFERENCES product_variants (product_id, color) ON DELETE CASCADE,
  CONSTRAINT chk_item_quantity CHECK (quantity >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
