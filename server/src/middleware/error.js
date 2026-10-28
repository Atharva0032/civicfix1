import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/** 404 handler — mounted after every route. */
export const notFoundHandler = (req, _res, next) => {
  next(
    ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, {
      code: 'ROUTE_NOT_FOUND',
    }),
  );
};

/** Translates any thrown error into the standard API error envelope. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error instanceof multer.MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `Each image must be smaller than ${env.maxUploadMb}MB.`
        : `Upload failed: ${error.message}`;
  } else if (error.name === 'ValidationError' && error.errors) {
    // Mongoose schema validation
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    details = Object.values(error.errors).map((entry) => ({
      field: entry.path,
      message: entry.message,
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = `Invalid value for "${error.path}".`;
  } else if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use.`;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[civicfix] Unhandled error:', error);
  }

  const payload = { success: false, code, message };
  if (details) payload.details = details;
  if (!env.isProduction && statusCode >= 500) payload.stack = error.stack;

  res.status(statusCode).json(payload);
};

export default errorHandler;
