-- 001_init.sql — skema minimal API Produk (MySQL 8 / InnoDB / utf8mb4)
-- Database dibuat oleh docker-compose (MYSQL_DATABASE) atau manual:
--   CREATE DATABASE IF NOT EXISTS api_produk
--     DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
-- Koneksi memakai DB_NAME dari .env — file ini sengaja TANPA statement CREATE DATABASE/USE.

-- 1. Produk: nama, harga, deskripsi
CREATE TABLE IF NOT EXISTS products (
  id          VARCHAR(50)    NOT NULL,                -- slug (PRD §9.3)
  name        VARCHAR(120)   NOT NULL,
  price       DECIMAL(12,2)  NOT NULL,
  description TEXT           NOT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_products_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Variasi: warna + jumlah
CREATE TABLE IF NOT EXISTS product_variants (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  product_id VARCHAR(50)  NOT NULL,
  color      VARCHAR(30)  NOT NULL,                   -- 'Black', 'Silver'
  swatch     CHAR(7)      NULL,                       -- '#1b1b1b' (opsional)
  quantity   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variant_product_color (product_id, color),
  CONSTRAINT fk_variant_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT chk_variant_quantity CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Foto produk
CREATE TABLE IF NOT EXISTS product_images (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  product_id VARCHAR(50)  NOT NULL,
  url        VARCHAR(500) NOT NULL,                   -- '/img/...' atau 'https://...'
  alt        VARCHAR(160) NOT NULL DEFAULT '',
  color      VARCHAR(30)  NULL,                       -- foto milik varian warna tertentu (opsional)
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_images_product (product_id, sort_order),
  CONSTRAINT fk_image_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT chk_image_url CHECK (url REGEXP '^(https?://|/)')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
