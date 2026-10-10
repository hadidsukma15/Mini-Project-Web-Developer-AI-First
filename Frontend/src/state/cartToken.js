/**
 * Cart token — identitas cart tanpa autentikasi.
 * Disimpan di localStorage (bertahan refresh) dan dipakai sebagai primary key
 * tabel `carts` di backend.
 */

const STORAGE_KEY = 'md:cart-token';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function randomUuid() {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID();

  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex
    .slice(8, 10)
    .join('')}-${hex.slice(10, 16).join('')}`;
}

/** Ambil token tersimpan; buat & simpan bila belum ada / rusak. */
export function getCartToken() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && UUID_PATTERN.test(existing)) return existing;

    const token = randomUuid();
    window.localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    // localStorage diblokir (private mode / disabled) → token per-session saja
    return randomUuid();
  }
}
