import { ValidationError as SequelizeValidationError } from 'sequelize';

// Central error handler. Every thrown/next(err) error ends up here.
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  if (err instanceof SequelizeValidationError) {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ success: false, message: 'Validation failed', code: 'VALIDATION_ERROR', errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: `${e.path} already exists` }));
    return res.status(409).json({ success: false, message: 'Duplicate value', code: 'DUPLICATE', errors });
  }

  if (err.isAppError) {
    const body = { success: false, message: err.message, code: err.code };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message, code: 'UPLOAD_ERROR' });
  }

  if (err.name === 'SequelizeDatabaseError') {
    // eslint-disable-next-line no-console
    console.error('SequelizeDatabaseError:', err.original || err);
    return res.status(422).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Invalid data format' : err.message,
      code: 'DATABASE_ERROR',
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}
