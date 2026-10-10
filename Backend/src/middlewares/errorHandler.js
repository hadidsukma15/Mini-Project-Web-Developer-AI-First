'use strict';

const { AppError, internalError, routeNotFound, badRequest, payloadTooLarge } = require('../errors');

const TITLES = {
  VALIDATION_ERROR: 'Validation Error',
  PRODUCT_NOT_FOUND: 'Product Not Found',
  VARIANT_NOT_FOUND: 'Variant Not Found',
  INSUFFICIENT_STOCK: 'Insufficient Stock',
  CART_ITEM_NOT_FOUND: 'Cart Item Not Found',
  ORDER_NOT_FOUND: 'Order Not Found',
  CART_EMPTY: 'Cart Empty',
  NOT_FOUND: 'Not Found',
  METHOD_NOT_ALLOWED: 'Method Not Allowed',
  DUPLICATE_ID: 'Duplicate Id',
  UNSUPPORTED_MEDIA_TYPE: 'Unsupported Media Type',
  PAYLOAD_TOO_LARGE: 'Payload Too Large',
  INTERNAL_ERROR: 'Internal Server Error',
};

/** Susun body Problem Details (RFC 9457) — field inti + ekstensi `code`/`errors`. */
function toProblem(err, req) {
  let appErr;
  if (err instanceof AppError) {
    appErr = err;
  } else if (err.type === 'entity.parse.failed') {
    appErr = badRequest('Body bukan JSON yang valid', [
      { field: '(body)', rule: 'json_parse', value: null, message: 'Perbaiki sintaks JSON' },
    ]);
  } else if (err.type === 'entity.too.large') {
    appErr = payloadTooLarge();
  } else {
    appErr = internalError();
  }

  const problem = {
    type: appErr.type,
    title: appErr.title || TITLES[appErr.code] || 'Error',
    status: appErr.status,
    detail: appErr.detail,
    instance: req.originalUrl || req.url,
    code: appErr.code,
  };
  if (appErr.errors && appErr.errors.length) problem.errors = appErr.errors;
  return { problem, headers: appErr.headers };
}

/** ErrorHandler global — semua error dibalas application/problem+json. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const { problem, headers } = toProblem(err, req);

  if (problem.status >= 500) {
    console.error('[error]', req.method, req.originalUrl, err); // stacktrace hanya di log server
  }

  if (headers) {
    for (const [k, v] of Object.entries(headers)) res.set(k, v);
  }
  res.status(problem.status).type('application/problem+json').json(problem);
}

/** Handler 404 path tak dikenal — dipasang setelah semua route. */
function notFoundHandler(req, _res, next) {
  next(routeNotFound(req.originalUrl || req.url));
}

module.exports = { errorHandler, notFoundHandler, toProblem };
