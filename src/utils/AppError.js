// Custom application error used across services/controllers.
// Thrown errors of this type are converted into proper JSON error responses
// by the central error-handling middleware (src/middleware/errorHandler.js).
export default class AppError extends Error {
  constructor(message, statusCode = 400, code = 'ERROR', errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isAppError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
