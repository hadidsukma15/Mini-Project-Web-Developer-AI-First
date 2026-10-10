'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { spec, yamlText } = require('./docs/loadSpec');
const { pool } = require('./config/db');
const productsRouter = require('./routes/products.route');
const cartRouter = require('./routes/cart.route');
const ordersRouter = require('./routes/order.route');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
// CSP dimatikan agar aset Swagger UI (inline) tidak diblokir helmet
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

app.use(express.json({ limit: '100kb' })); // body >100kb → 413 problem+json

// — Health Check —
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (_err) {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

// — Dokumentasi API —
app.get('/openapi.yaml', (_req, res) => {
  res.type('application/yaml').send(yamlText);
});
app.get('/openapi.json', (_req, res) => {
  res.json(spec);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(spec, {
    customSiteTitle: 'API Produk — Swagger UI',
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

// — Routes —
app.use(productsRouter);
app.use(cartRouter);
app.use(ordersRouter);

// — 404 path tak dikenal → 5. errorHandler global (problem+json) —
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
