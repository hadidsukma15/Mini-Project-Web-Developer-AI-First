'use strict';

const { z } = require('zod');
const { SLUG_PATTERN } = require('../middlewares/validateId');

const slug = z
  .string()
  .regex(SLUG_PATTERN, 'Harus berupa slug huruf kecil (a-z, 0-9, tanda hubung), tanpa - di awal/akhir');

const price = z
  .number({ invalid_type_error: 'Harga harus berupa number' })
  .min(0, 'Harga tidak boleh negatif')
  .refine((v) => Number.isFinite(v) && Math.round(v * 100) === v * 100, {
    message: 'Harga boleh maksimal 2 desimal',
  });

const color = z.string().trim().min(1, 'Warna wajib diisi').max(30, 'Warna maksimal 30 karakter');

const swatch = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Swatch harus format heksadesimal #RRGGBB')
  .nullable()
  .optional();

const variant = z
  .object({
    color,
    swatch,
    quantity: z
      .number({ invalid_type_error: 'Quantity harus berupa number' })
      .int('Quantity harus integer')
      .min(0, 'Quantity tidak boleh negatif'),
  })
  .strict();

const image = z
  .object({
    url: z
      .string()
      .max(500, 'URL maksimal 500 karakter')
      .regex(/^(\/|https:\/\/)/, 'URL harus diawali / atau https://'),
    alt: z.string().max(160, 'Alt maksimal 160 karakter').optional().default(''),
    color: color.optional().nullable(),
  })
  .strict();

/** Body POST/PUT — objek produk penuh (§9.2): additionalProperties false + warna unik. */
const productInput = z
  .object({
    id: slug,
    name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(120, 'Nama maksimal 120 karakter'),
    price,
    description: z
      .string()
      .trim()
      .min(10, 'Deskripsi minimal 10 karakter')
      .max(5000, 'Deskripsi maksimal 5000 karakter'),
    variants: z.array(variant).min(1, 'Minimal 1 varian').max(20, 'Maksimal 20 varian'),
    images: z.array(image).min(1, 'Minimal 1 foto').max(30, 'Maksimal 30 foto'),
  })
  .strict()
  .superRefine((val, ctx) => {
    const seen = new Set();
    val.variants.forEach((v, i) => {
      const key = v.color.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', i, 'color'],
          message: `Warna '${v.color}' duplikat dalam satu produk`,
        });
      }
      seen.add(key);
    });
  });

/** Query GET /api/products — param tak dikenal diabaikan (non-strict). */
const listQuery = z.object({
  search: z.string().trim().min(1, 'Search minimal 1 karakter').max(100, 'Search maksimal 100 karakter').optional(),
  limit: z.coerce
    .number({ invalid_type_error: 'Limit harus angka' })
    .int('Limit harus integer')
    .min(1, 'Limit minimal 1')
    .max(100, 'Limit maksimal 100')
    .optional()
    .default(10),
  offset: z.coerce
    .number({ invalid_type_error: 'Offset harus angka' })
    .int('Offset harus integer')
    .min(0, 'Offset tidak boleh negatif')
    .optional()
    .default(0),
});

module.exports = { slug, price, productInput, listQuery };
