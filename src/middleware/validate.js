import { validationResult } from 'express-validator';

// Runs after express-validator check(...) middlewares. Collects any errors
// into the standard { success:false, message, errors:[{field,message}] } shape.
export default function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}
