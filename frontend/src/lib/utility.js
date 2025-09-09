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

/**
 * Safely handle redirect parameters to prevent infinite loops
 * @param {string} redirectParam - The redirect parameter from URL
 * @param {string} fallbackPath - Fallback path if redirect is malformed
 * @returns {string} Safe redirect path
 */
export function sanitizeRedirect(redirectParam, fallbackPath = '/dashboard') {
  if (!redirectParam) return fallbackPath;

  try {
    // First level of decoding
    let decoded = decodeURIComponent(redirectParam);

    // Handle potential multiple encodings that might happen with GitHub Pages
    let safetyCounter = 0;
    while (decoded.includes('%2F') && safetyCounter < 5) {
      decoded = decodeURIComponent(decoded);
      safetyCounter++;
    }

    // Prevent redirect loops by checking for redirect parameters
    if (
      decoded.includes('redirect=') ||
      decoded.includes('%3Fredirect%3D') ||
      decoded.includes('%2Fredirect%2F') ||
      decoded.includes('redirect%3D')
    ) {
      return fallbackPath;
    }

    // Extract just the path part if there are query parameters
    if (decoded.includes('?')) {
      decoded = decoded.split('?')[0];
    }

    // Ensure it's a valid path (starts with /)
    if (!decoded.startsWith('/')) {
      return fallbackPath;
    }

    // Prevent very long URLs that might indicate parameter accumulation
    if (decoded.length > 100) {
      return fallbackPath;
    }

    // Clean up any duplicate slashes
    decoded = decoded.replace(/\/+/g, '/');

    // Remove trailing slash for consistent routing
    if (decoded !== '/' && decoded.endsWith('/')) {
      decoded = decoded.slice(0, -1);
    }

    return decoded;
  } catch {
    return fallbackPath;
  }
}

/**
 * Create a clean redirect parameter without causing loops
 * @param {string} currentPath - Current path to redirect to
 * @returns {string} Encoded redirect parameter
 */
export function createRedirectParam(currentPath) {
  if (!currentPath) {
    return encodeURIComponent('/dashboard');
  }

  try {
    // Create a clean path without any query parameters
    let cleanPath = currentPath;

    // If current path already has redirect params, extract just the base path
    if (currentPath.includes('redirect=')) {
      try {
        const url = new URL(currentPath, window.location.origin);
        cleanPath = url.pathname;
      } catch {
        cleanPath = '/dashboard';
      }
    } else if (currentPath.includes('?')) {
      // If the path contains query parameters, remove them
      try {
        const url = new URL(currentPath, window.location.origin);
        cleanPath = url.pathname;
      } catch {
        cleanPath = '/dashboard';
      }
    }

    // Clean up any duplicate slashes
    cleanPath = cleanPath.replace(/\/+/g, '/');

    // Remove trailing slash for consistent routing
    if (cleanPath !== '/' && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }

    // Only encode the path, no query parameters
    return encodeURIComponent(cleanPath);
  } catch {
    return encodeURIComponent('/dashboard');
  }
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
  sanitizeRedirect,
  createRedirectParam,
};
