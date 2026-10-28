import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const buildLimiter = ({ windowMs, max, message, code }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Disabled while running the automated test suite.
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        code,
        message,
      });
    },
  });

/** Protects register/login from credential stuffing and brute force. */
export const authLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: env.rateLimitAuthMax,
  code: 'RATE_LIMITED',
  message: 'Too many authentication attempts. Please try again in a few minutes.',
});

/** Protects issue creation, uploads, upvotes and notification mutations. */
export const writeLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: env.rateLimitWriteMax,
  code: 'RATE_LIMITED',
  message: 'You are doing that too often. Please slow down and try again shortly.',
});

export default { authLimiter, writeLimiter };
