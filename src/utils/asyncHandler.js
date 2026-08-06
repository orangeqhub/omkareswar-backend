// Wraps an async Express route handler so any rejected promise / thrown error
// is forwarded to next() and handled by the central error handler, instead of
// crashing the process or requiring a try/catch in every controller.
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
