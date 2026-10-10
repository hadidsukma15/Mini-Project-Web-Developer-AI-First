-- seed.sql — data awal (1 produk, 2 varian, 8 foto, 2 pesanan contoh)
-- Aman dijalankan berulang: hapus dulu data terkait (FK CASCADE dari products).
-- Catatan: items cart ikut terhapus via FK CASCADE saat products dihapus;
--          baris carts yang tersisa dikosongkan agar state cart ikut reset.
--          Pesanan contoh ikut di-reset lalu di-insert ulang (urut: items → orders).

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM product_images  WHERE product_id = 'mw75-tumi';
DELETE FROM product_variants WHERE product_id = 'mw75-tumi';
DELETE FROM products        WHERE id = 'mw75-tumi';

INSERT INTO products (id, name, price, description) VALUES
  ('mw75-tumi', 'MW75 TUMI', 750.00,
   'TUMI x Master & Dynamic MW75 — headphone nirkabel dengan active noise-cancelling, bahan lambskin leather dan aluminium anodized, baterai hingga 32 jam.');

INSERT INTO product_variants (product_id, color, swatch, quantity) VALUES
  ('mw75-tumi', 'Black',  '#1b1b1b', 12),
  ('mw75-tumi', 'Silver', '#c0c0c0', 0);

INSERT INTO product_images (product_id, url, alt, color, sort_order) VALUES
  ('mw75-tumi', '/img/black-hero.png',      'Floating black TUMI MW75 Active Noise-Cancelling headphones — three-quarter view', 'Black',  1),
  ('mw75-tumi', '/img/black-front.png',     'Black TUMI MW75 headphones — front view',                                          'Black',  2),
  ('mw75-tumi', '/img/black-engraving.png', 'Close-up of TUMI 19 Degree engraving detail on black MW75 headphones',             'Black',  3),
  ('mw75-tumi', '/img/black-straight.png',  'Black TUMI MW75 headphones — straight side profile view',                          'Black',  4),
  ('mw75-tumi', '/img/silver-hero.png',     'Floating silver TUMI MW75 Active Noise-Cancelling headphones — three-quarter view', 'Silver', 1),
  ('mw75-tumi', '/img/silver-front.png',    'Silver TUMI MW75 headphones — front view',                                         'Silver', 2),
  ('mw75-tumi', '/img/silver-engraving.png','Close-up of TUMI 19 Degree engraving detail on silver MW75 headphones',            'Silver', 3),
  ('mw75-tumi', '/img/silver-straight.png', 'Silver TUMI MW75 headphones — straight side profile view',                         'Silver', 4);

-- — Pesanan contoh (riwayat) agar halaman Orders langsung terisi —
-- Nama & harga di-order_items adalah snapshot saat pesanan dibuat.
-- Kolom quantity di product_variants adalah stok tersisa saat ini (bukan sisa setelah pesanan ini).
INSERT INTO orders (order_number, cart_id, status, customer_name, email, note, subtotal, total) VALUES
  ('MD-261001-A11C', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'delivered',
   'Sari Wijaya', 'sari@example.com', 'Kirim ke kantor, jam kerja.', 1500.00, 1500.00),
  ('MD-261005-B22D', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'pending',
   'Andi Nugroho', 'andi@example.com', NULL, 1500.00, 1500.00);

INSERT INTO order_items (order_id, product_id, product_name, color, unit_price, quantity, line_total)
SELECT o.id, 'mw75-tumi', 'MW75 TUMI', 'Black', 750.00, 1, 750.00
FROM orders o WHERE o.order_number = 'MD-261001-A11C';

INSERT INTO order_items (order_id, product_id, product_name, color, unit_price, quantity, line_total)
SELECT o.id, 'mw75-tumi', 'MW75 TUMI', 'Silver', 750.00, 1, 750.00
FROM orders o WHERE o.order_number = 'MD-261001-A11C';

INSERT INTO order_items (order_id, product_id, product_name, color, unit_price, quantity, line_total)
SELECT o.id, 'mw75-tumi', 'MW75 TUMI', 'Black', 750.00, 2, 1500.00
FROM orders o WHERE o.order_number = 'MD-261005-B22D';

