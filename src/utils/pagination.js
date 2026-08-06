// Normalizes page/pageSize query params into Sequelize limit/offset.
export function getPagination(query, defaultPageSize = 20, maxPageSize = 100) {
  let page = parseInt(query.page, 10);
  let pageSize = parseInt(query.pageSize, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = defaultPageSize;
  if (pageSize > maxPageSize) pageSize = maxPageSize;

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  return { page, pageSize, limit, offset };
}
