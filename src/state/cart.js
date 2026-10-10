import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api.js';
import { getCartToken } from './cartToken.js';

const ITEMS_KEY = 'md:cart-items';
const FEEDBACK_MS = 2500;

/** Total jumlah item (Σ quantity) → nilai badge cart. */
export function countItems(items = []) {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/** Gabung entry ke daftar item (satu baris per produk + warna). */
function mergeItems(items, entry) {
  const existing = items.find(
    (item) => item.productId === entry.productId && item.variant === entry.variant
  );
  if (!existing) return [...items, { ...entry, addedAt: Date.now() }];
  return items.map((item) =>
    item === existing
      ? { ...item, quantity: item.quantity + entry.quantity, addedAt: Date.now() }
      : item
  );
}

function persist(items) {
  try {
    window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    /* localStorage diblokir → state lokal saja */
  }
}

function readPersistedItems() {
  try {
    const raw = window.localStorage.getItem(ITEMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Payload cart dari API → state `cart` milik store. */
function normalizeServerCart(data) {
  const items = Array.isArray(data?.items)
    ? data.items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        variant: item.color,
        quantity: item.quantity,
        itemId: item.id,
        unitPrice: item.unitPrice,
      }))
    : [];
  return { count: typeof data?.count === 'number' ? data.count : countItems(items), items };
}

function applyServerCart(store, data) {
  const cart = normalizeServerCart(data);
  store.setState({ cart });
  persist(cart.items);
}

let feedbackTimer;

function setFeedback(store, { message, tone }) {
  const { feedback } = store.getState();
  const key = feedback ? feedback.key + 1 : 1;
  store.setState({ feedback: { key, message, tone } });

  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    const current = store.getState();
    store.setState({ feedback: { ...current.feedback, message: '' } });
  }, FEEDBACK_MS);
}

/** Tarik cart dari server (bila API hidup) → jadi acuan state. */
export function syncCartFromServer(store) {
  if (typeof fetch !== 'function') return Promise.resolve(null);

  return apiGet(`/api/cart/${getCartToken()}`).then((res) => {
    if (res.ok) {
      applyServerCart(store, res.data);
      return res.data;
    }
    if (res.error?.code !== 'NO_FETCH') {
      console.warn('[cart] gagal ambil cart dari server — pakai state lokal', res.error);
    }
    return null;
  });
}

/**
 * Tambah item: optimistik ke state lokal (langsung terlihat) →
 * lalu sinkron ke database. Gagal jaringan → tetap lokal;
 * ditolak server (mis. stok habis) → feedback error + state disinkronkan ulang.
 */
export function addToCart(store, { productId, productName, variant, quantity = 1 }) {
  const { cart } = store.getState();
  const items = mergeItems(cart.items, { productId, productName, variant, quantity });
  const count = countItems(items);

  store.setState({ cart: { count, items } });
  persist(items);
  setFeedback(store, { message: `Added to cart — ${productName}, ${variant}`, tone: 'success' });

  if (typeof fetch !== 'function') return;

  apiPost('/api/cart/items', { cartToken: getCartToken(), productId, color: variant, quantity })
    .then((res) => {
      if (res.ok) {
        applyServerCart(store, res.data);
        return;
      }
      console.warn('[cart] server menolak item', res.error);
      if (res.error?.status) {
        // Server menjawab (mis. 409 stok) → state lokal harus mengikuti database
        setFeedback(store, { message: res.error.detail, tone: 'error' });
        syncCartFromServer(store);
      }
    })
    .catch((err) => console.warn('[cart] sinkronisasi gagal', err));
}

/** Boot: hydrate dari snapshot lokal, lalu tukar dengan cart server bila tersedia. */
export function restoreCart(store) {
  const localItems = readPersistedItems();
  if (localItems.length) {
    store.setState({ cart: { count: countItems(localItems), items: localItems } });
  }
  return syncCartFromServer(store);
}

function applyLocalItems(store, items) {
  const cart = { count: countItems(items), items };
  store.setState({ cart });
  persist(items);
}

/**
 * Cari baris cart dari referensi: objek item (itemId bila ada, else
 * productId+variant untuk item lokal) atau itemId langsung.
 */
function resolveItem(items, ref) {
  if (ref && typeof ref === 'object') {
    if (ref.itemId != null) return items.find((item) => item.itemId === ref.itemId);
    return items.find((item) => item.productId === ref.productId && item.variant === ref.variant);
  }
  if (ref == null) return undefined;
  return items.find((item) => item.itemId === ref);
}

/** Ganti jumlah satu item (panel cart): optimistik lokal → PATCH ke server. */
export function updateCartItem(store, ref, quantity) {
  const { cart } = store.getState();
  if (quantity < 1) return;

  const target = resolveItem(cart.items, ref);
  if (!target) return;

  const items = cart.items.map((item) => (item === target ? { ...item, quantity } : item));
  applyLocalItems(store, items);

  const itemId = target.itemId;
  if (typeof fetch !== 'function' || itemId === undefined || itemId === null) return;

  apiPatch(`/api/cart/${getCartToken()}/items/${itemId}`, { quantity }).then((res) => {
    if (res.ok) {
      applyServerCart(store, res.data);
      return;
    }
    console.warn('[cart] server menolak perubahan jumlah', res.error);
    if (res.error?.status) {
      setFeedback(store, { message: res.error.detail, tone: 'error' });
      syncCartFromServer(store);
    }
  });
}

/** Hapus satu item (panel cart): optimistik lokal → DELETE ke server. */
export function removeCartItem(store, ref) {
  const { cart } = store.getState();
  const target = resolveItem(cart.items, ref);
  if (!target) return;

  const items = cart.items.filter((item) => item !== target);
  applyLocalItems(store, items);
  setFeedback(store, { message: `Removed from cart — ${target.productName}`, tone: 'success' });

  const itemId = target.itemId;
  if (typeof fetch !== 'function' || itemId === undefined || itemId === null) return;

  apiDelete(`/api/cart/${getCartToken()}/items/${itemId}`).then((res) => {
    if (res.ok) {
      applyServerCart(store, res.data);
      return;
    }
    console.warn('[cart] server menolak penghapusan item', res.error);
    if (res.error?.status) syncCartFromServer(store);
  });
}

/**
 * Checkout: ubah isi cart menjadi pesanan (`POST /api/orders`).
 * Sukses → cart dibersihkan (lokal + server sudah mengosongkan) + feedback nomor pesanan.
 * Gagal → pesan error dari problem+json (mis. cart kosong / stok habis) dikembalikan ke UI.
 */
export function placeOrder(store, { customerName, email, note } = {}) {
  if (typeof fetch !== 'function') {
    return Promise.resolve({
      ok: false,
      error: { code: 'NO_FETCH', detail: 'fetch tidak tersedia — checkout butuh API' },
    });
  }

  return apiPost('/api/orders', {
    cartToken: getCartToken(),
    customerName,
    email,
    ...(note ? { note } : {}),
  }).then((res) => {
    if (res.ok) {
      applyLocalItems(store, []);
      setFeedback(store, {
        message: `Order placed — ${res.data.orderNumber}`,
        tone: 'success',
      });
      return { ok: true, order: res.data };
    }
    setFeedback(store, { message: res.error?.detail || 'Checkout gagal', tone: 'error' });
    return { ok: false, error: res.error };
  });
}
