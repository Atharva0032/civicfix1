/**
 * Wraps an async Express handler so rejected promises are forwarded to the
 * error middleware instead of crashing the process.
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export default asyncHandler;
