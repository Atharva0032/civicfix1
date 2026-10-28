import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../utils/constants.js';

const extractToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (header && /^Bearer\s+/i.test(header)) {
    return header.replace(/^Bearer\s+/i, '').trim();
  }
  return null;
};

const resolveUser = async (token) => {
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Your session is no longer valid.');
  return user;
};

/**
 * Hard authentication: rejects the request when no valid token is supplied.
 * The role on `req.user` always comes from the database — never from the token
 * payload or the request body — so a tampered client cannot escalate itself.
 */
export const authenticate = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Authentication token is missing.');
    req.user = await resolveUser(token);
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Your session has expired. Please sign in again.'));
    }
    return next(ApiError.unauthorized('Invalid authentication token.'));
  }
};

/** Soft authentication: attaches `req.user` when a token is present. */
export const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    req.user = undefined;
  }
  return next();
};

/** Role guard. Use after `authenticate`. */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('This area is restricted to municipal administrators.'),
      );
    }
    return next();
  };

export const requireAdmin = authorize(ROLES.ADMIN);
export const requireCitizen = authorize(ROLES.CITIZEN);

export default authenticate;
