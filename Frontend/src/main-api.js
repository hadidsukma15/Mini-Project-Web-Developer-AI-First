import {
  createProductStore,
  mountApp,
  renderLoading,
  renderErrorPage,
} from './app.js';
import { setProduct } from './data/product.js';
import { mergeProduct } from './data/merge.js';
import { getVariantFromUrl } from './state/variant.js';
import { apiGet } from './utils/api.js';

const DEFAULT_PRODUCT_ID = 'mw75-tumi';

function readProductId() {
  const requested = new URLSearchParams(window.location.search).get('id');
  return (requested || DEFAULT_PRODUCT_ID).trim();
}

/** Alasan fallback → teks yang dibaca manusia untuk strip sumber data. */
function fallbackDetail(error) {
  switch (error.code) {
    case 'NO_FETCH':
      return 'fetch tidak tersedia (halaman dibuka tanpa dukungan jaringan) — memakai data lokal.';
    case 'TIMEOUT':
      return `${error.detail} — API tidak merespons, memakai data lokal.`;
    default:
      return `${error.detail || error.code || 'Permintaan gagal'} — memakai data lokal.`;
  }
}

const store = createProductStore({ productStatus: 'loading' });
const productId = readProductId();
const endpoint = `/api/products/${productId}`;

renderLoading(productId);

async function boot() {
  let res;
  try {
    res = await apiGet(endpoint);
  } catch (err) {
    res = { ok: false, error: { code: 'NETWORK_ERROR', detail: String(err?.message || err) } };
  }

  if (res.ok) {
    setProduct(mergeProduct(res.data));
    store.setState({
      variantId: getVariantFromUrl(),
      galleryIndex: 0,
      productStatus: 'ready',
    });
    mountApp(store, { source: { kind: 'api', endpoint, payload: res.data } });
    return;
  }

  const error = res.error ?? {};
  const httpStatus = Number(error.status) || 0;

  // 400/404 (problem+json) → halaman error utuh, jangan render konten setengah jalan.
  if (httpStatus >= 400 && httpStatus < 500) {
    store.setState({ productStatus: 'error' });
    renderErrorPage(store, error, productId);
    return;
  }

  // API mati / jaringan gagal / 5xx → halaman tetap utuh dari data lokal.
  console.error('[product-api] API tidak terjangkau — fallback ke data lokal:', error);
  store.setState({ productStatus: 'fallback' });
  mountApp(store, { source: { kind: 'fallback', detail: fallbackDetail(error) } });
}

boot();
