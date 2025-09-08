// Generic utilities shared by multiple features

/**
 * Debounce a function; returns a debounced wrapper.
 */
export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Throttle a function; leading-edge by default.
 */
export function throttle(fn, interval = 200) {
  let last = 0;
  let timer = null;
  return (...args) => {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Convert a data URL to a Blob object.
 */
export function dataURLToBlob(dataURL) {
  const [header, body] = dataURL.split(',');
  const mime = /data:(.*?);base64/.exec(header)?.[1] || 'application/octet-stream';
  const binary = atob(body);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Convert a Blob to a data URL.
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Try parse to float; returns null on failure.
 */
export function toFloat(value) {
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Try parse to int; returns null on failure.
 */
export function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Haversine distance in meters between two coordinates
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Simple client-side pagination helper
 */
export function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

/**
 * Build a stable, case-insensitive comparator for arrays.
 */
export function compare(a, b, direction = 'asc') {
  const order = direction === 'asc' ? 1 : -1;
  if (a < b) return -1 * order;
  if (a > b) return 1 * order;
  return 0;
}

export default {
  debounce,
  throttle,
  dataURLToBlob,
  blobToDataURL,
  toFloat,
  toInt,
  haversineDistance,
  paginate,
  compare,
};
