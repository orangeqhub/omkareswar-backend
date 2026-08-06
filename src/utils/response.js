export function sendSuccess(res, { message = 'Success', data = null, statusCode = 200 } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendList(res, { items, total, page, pageSize, message = 'Success' } = {}) {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return res.status(200).json({
    success: true,
    message,
    data: { items, total, page, pageSize, totalPages },
  });
}

export function sendError(res, { message = 'Something went wrong', code = 'ERROR', statusCode = 400, errors } = {}) {
  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}
