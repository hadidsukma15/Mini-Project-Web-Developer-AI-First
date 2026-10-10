import { createOrdersStore, mountOrders } from './orders-app.js';

// Halaman Orders — daftar pesanan dari GET /api/orders (database → backend → frontend).
const store = createOrdersStore();

mountOrders(store);
