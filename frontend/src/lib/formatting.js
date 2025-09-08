// Formatting utilities used across the frontend

/**
 * Safely coerce to Date instance. Returns null if invalid.
 */
function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date-like value to a locale date string.
 */
export function formatDate(value, locale, options) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString(locale, options);
}

/**
 * Format a date-like value to a locale time string.
 */
export function formatTime(value, locale, options) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleTimeString(locale, options);
}

/**
 * Format a date-like value to a locale datetime string.
 */
export function formatDateTime(value, locale, options) {
  const d = toDate(value);
  if (!d) return '';
  return `${d.toLocaleDateString(locale, options)} ${d.toLocaleTimeString(locale, options)}`.trim();
}

/**
 * Format a Date or date-like value to an input[type="datetime-local"] string.
 * Example: 2025-09-01T13:45
 */
export function formatDateTimeLocal(date) {
  const d = toDate(date);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse an input[type="datetime-local"] value into a Date.
 * Returns null if invalid/empty.
 */
export function parseDateTimeLocal(dateTimeString) {
  if (!dateTimeString) return null;
  const d = new Date(dateTimeString);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Convert a datetime-local string to ISO string WITHOUT timezone conversion.
 * Appends a 'Z' so the provided local time is treated as UTC.
 */
export function datetimeLocalToUTC(dateTimeString) {
  if (!dateTimeString) return null;
  return new Date(`${dateTimeString}Z`).toISOString();
}

/**
 * Convert a UTC ISO string back to datetime-local format without TZ conversion.
 * Removes trailing Z or timezone offset and formats as YYYY-MM-DDTHH:mm.
 */
export function utcToDatetimeLocal(utcString) {
  if (!utcString) return '';
  const localDatetimeString = utcString.replace(/[Z]|[+-]\d{2}:\d{2}$/g, '');
  const d = toDate(localDatetimeString);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a countdown in milliseconds to HH:MM:SS or MM:SS.
 */
export function formatCountdown(ms) {
  if (ms == null || Number.isNaN(ms) || ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Format a countdown in milliseconds to a human string like `1h 2m 3s`.
 */
export function formatCountdownVerbose(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateTimeLocal,
  parseDateTimeLocal,
  datetimeLocalToUTC,
  utcToDatetimeLocal,
  formatCountdown,
  formatCountdownVerbose,
};
