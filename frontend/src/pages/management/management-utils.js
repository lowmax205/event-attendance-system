// Shared helpers for management tabs (events, users, attendance)
// Keep this small, clear, and UI-agnostic.

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function buildSortToggle(nextDir) {
  return nextDir === 'asc' ? 'desc' : 'asc';
}

export function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function computeTotalPages(total, perPage) {
  return Math.ceil(total / perPage);
}
