'use strict';

/** Error aplikasi dengan format siap-saji RFC 9457 Problem Details. */
class AppError extends Error {
  constructor({ status, code, title, detail, type, errors, headers }) {
    super(detail);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.type = type || `/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    this.errors = errors;
    this.headers = headers;
    this.expose = true;
  }
}

const badRequest = (detail, errors, code = 'VALIDATION_ERROR') =>
  new AppError({
    status: 400,
    code,
    title: 'Validation Error',
    detail,
    type: '/problems/validation-error',
    errors,
  });

const productNotFound = (id) =>
  new AppError({
    status: 404,
    code: 'PRODUCT_NOT_FOUND',
    title: 'Product Not Found',
    detail: `Product dengan id '${id}' tidak ditemukan`,
    type: '/problems/product-not-found',
  });

const routeNotFound = (instance) =>
  new AppError({
    status: 404,
    code: 'NOT_FOUND',
    title: 'Not Found',
    detail: `Path '${instance}' tidak dikenal`,
    type: '/problems/not-found',
  });

const methodNotAllowed = (method, allow) =>
  new AppError({
    status: 405,
    code: 'METHOD_NOT_ALLOWED',
    title: 'Method Not Allowed',
    detail: `Method '${method}' tidak didukung untuk resource ini.`,
    type: '/problems/method-not-allowed',
    headers: { Allow: allow },
  });

const duplicateId = (id) =>
  new AppError({
    status: 409,
    code: 'DUPLICATE_ID',
    title: 'Duplicate Id',
    detail: `Product dengan id '${id}' sudah ada`,
    type: '/problems/duplicate-id',
  });

const variantNotFound = (productId, color) =>
  new AppError({
    status: 404,
    code: 'VARIANT_NOT_FOUND',
    title: 'Variant Not Found',
    detail: `Varian '${color}' pada product '${productId}' tidak ditemukan`,
    type: '/problems/variant-not-found',
  });

const insufficientStock = (productId, color, available) =>
  new AppError({
    status: 409,
    code: 'INSUFFICIENT_STOCK',
    title: 'Insufficient Stock',
    detail: `Stok '${color}' untuk product '${productId}' tinggal ${available} — jumlah di cart melebihi stok`,
    type: '/problems/insufficient-stock',
  });

const cartItemNotFound = (id) =>
  new AppError({
    status: 404,
    code: 'CART_ITEM_NOT_FOUND',
    title: 'Cart Item Not Found',
    detail: `Item cart dengan id '${id}' tidak ditemukan`,
    type: '/problems/cart-item-not-found',
  });

const orderNotFound = (id) =>
  new AppError({
    status: 404,
    code: 'ORDER_NOT_FOUND',
    title: 'Order Not Found',
    detail: `Pesanan dengan id '${id}' tidak ditemukan`,
    type: '/problems/order-not-found',
  });

const cartEmpty = (cartToken) =>
  new AppError({
    status: 409,
    code: 'CART_EMPTY',
    title: 'Cart Empty',
    detail: `Cart '${cartToken}' kosong — tambahkan item sebelum membuat pesanan`,
    type: '/problems/cart-empty',
  });

const unsupportedMediaType = (received) =>
  new AppError({
    status: 415,
    code: 'UNSUPPORTED_MEDIA_TYPE',
    title: 'Unsupported Media Type',
    detail: `Content-Type '${received}' tidak didukung — gunakan application/json`,
    type: '/problems/unsupported-media-type',
  });

const payloadTooLarge = () =>
  new AppError({
    status: 413,
    code: 'PAYLOAD_TOO_LARGE',
    title: 'Payload Too Large',
    detail: 'Ukuran body melebihi batas 100kb',
    type: '/problems/payload-too-large',
  });

const internalError = () =>
  new AppError({
    status: 500,
    code: 'INTERNAL_ERROR',
    title: 'Internal Server Error',
    detail: 'Terjadi kesalahan pada server',
    type: '/problems/internal-error',
  });

module.exports = {
  AppError,
  badRequest,
  productNotFound,
  routeNotFound,
  methodNotAllowed,
  duplicateId,
  variantNotFound,
  insufficientStock,
  cartItemNotFound,
  orderNotFound,
  cartEmpty,
  unsupportedMediaType,
  payloadTooLarge,
  internalError,
};
