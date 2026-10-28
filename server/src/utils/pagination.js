export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

/** Normalises `?page=&limit=` query params into safe numbers. */
export function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const rawLimit = Number.parseInt(query.limit ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PAGE_SIZE),
  );
  return { page, limit, skip: (page - 1) * limit };
}

/** Builds the standard pagination envelope returned by list endpoints. */
export function buildMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export default parsePagination;
