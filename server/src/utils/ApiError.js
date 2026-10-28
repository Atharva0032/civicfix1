/**
 * Error type used across the API so every failure response shares the same
 * shape: `{ success: false, message, code, details }`.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || defaultCodeFor(statusCode);
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Invalid request.', options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = 'Authentication required.', options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = 'You are not allowed to perform this action.', options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = 'Resource not found.', options) {
    return new ApiError(404, message, options);
  }

  static conflict(message = 'Resource already exists.', options) {
    return new ApiError(409, message, options);
  }

  static tooManyRequests(message = 'Too many requests.', options) {
    return new ApiError(429, message, options);
  }
}

function defaultCodeFor(statusCode) {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 413:
      return 'PAYLOAD_TOO_LARGE';
    case 429:
      return 'RATE_LIMITED';
    default:
      return statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }
}

export default ApiError;
