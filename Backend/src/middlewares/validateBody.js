'use strict';

const { badRequest, unsupportedMediaType } = require('../errors');

/** Wajibkan Content-Type: application/json (415 sebelum validasi body — PRD §10.1). */
function requireJson(req, _res, next) {
  const raw = req.headers['content-type'];
  const mime = (raw || '').split(';')[0].trim().toLowerCase();
  if (mime !== 'application/json') {
    return next(unsupportedMediaType(raw || '(tanpa Content-Type)'));
  }
  next();
}

/** Validasi `req.body` dengan Zod → gagal: 400 + errors[] semua field. */
function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest('Body tidak lolos validasi', toErrorItems(result.error.issues, req.body)));
    }
    req.body = result.data;
    next();
  };
}

/** Validasi `req.query` dengan Zod (param tak dikenal diabaikan — V6). */
function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(badRequest('Query parameter tidak lolos validasi', toErrorItems(result.error.issues, req.query)));
    }
    req.query = result.data;
    next();
  };
}

function toErrorItems(issues, source) {
  return issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : '(root)',
    rule: issue.code,
    value: valueAt(source, issue.path),
    message: issue.message,
  }));
}

function valueAt(source, path) {
  try {
    let cur = source;
    for (const key of path) cur = cur[key];
    return cur === undefined ? null : cur;
  } catch {
    return null;
  }
}

module.exports = { requireJson, validateBody, validateQuery };
