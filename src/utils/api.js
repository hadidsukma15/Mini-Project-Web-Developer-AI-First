/**
 * API client tipis untuk backend `api-produk`.
 * - Base URL: `VITE_API_URL` (default http://localhost:3000).
 * - Sukses → `{ ok: true, data }` (envelope `{data}` sudah dibongkar).
 * - Gagal  → `{ ok: false, error }` (`status`, `code`, `detail`, `errors[]`).
 *   Tidak pernah melempar exception → alur UI tetap jalan saat API mati.
 */

const DEFAULT_BASE_URL = 'http://localhost:3000';

function resolveBaseUrl() {
  try {
    const fromEnv = import.meta.env && import.meta.env.VITE_API_URL;
    if (fromEnv) return String(fromEnv).replace(/\/+$/, '');
  } catch {
    /* di luar konteks module (mis. eval pada smoke test) → pakai default */
  }
  return DEFAULT_BASE_URL;
}

export const API_BASE_URL = resolveBaseUrl();

const TIMEOUT_MS = 5000;

async function request(method, path, { body } = {}) {
  if (typeof fetch !== 'function') {
    return { ok: false, error: { code: 'NO_FETCH', detail: 'fetch tidak tersedia' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          status: res.status,
          code: json?.code || 'HTTP_ERROR',
          title: json?.title || 'Request Failed',
          detail: json?.detail || `HTTP ${res.status}`,
          errors: json?.errors,
        },
      };
    }

    return { ok: true, data: json && typeof json === 'object' && 'data' in json ? json.data : json };
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        detail: timedOut ? `Timeout ${TIMEOUT_MS}ms` : String(err?.message || err),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export const apiGet = (path) => request('GET', path);
export const apiPost = (path, body) => request('POST', path, { body });
export const apiPatch = (path, body) => request('PATCH', path, { body });
export const apiDelete = (path) => request('DELETE', path);
