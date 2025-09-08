// Small, pure helpers used by management tabs for sorting/filtering/pagination

// ===== FRONTEND INTERACTION =====
// Compare utility handling asc/desc
export function compare(a, b, direction = 'asc') {
  if (a < b) return direction === 'asc' ? -1 : 1;
  if (a > b) return direction === 'asc' ? 1 : -1;
  return 0;
}

export function sortByDate(items, field, direction = 'desc') {
  return [...items].sort((a, b) => {
    const aVal = a[field] ? new Date(a[field]) : new Date(0);
    const bVal = b[field] ? new Date(b[field]) : new Date(0);
    return compare(aVal, bVal, direction);
  });
}

export function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function totalPages(total, perPage) {
  return Math.ceil(Math.max(0, total) / Math.max(1, perPage));
}
