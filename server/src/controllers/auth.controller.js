import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signAuthToken } from '../utils/token.js';
import { ROLES } from '../utils/constants.js';
import { notify } from '../services/notification.service.js';

const authPayload = (user) => ({
  user: user.toJSON(),
  token: signAuthToken(user),
});

/** POST /api/auth/register — public sign-up. Always creates a CITIZEN. */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.valid.body;

  const existing = await User.findOne({ email }).select('_id').lean();
  if (existing) {
    throw ApiError.conflict('An account with that email address already exists.', {
      code: 'EMAIL_IN_USE',
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: ROLES.CITIZEN, // hard-coded: role is never taken from client input
  });

  await notify({
    recipient: user._id,
    title: 'Welcome to CivicFix',
    message:
      'Your citizen account is ready. Report your first civic issue and track it to resolution.',
    type: 'system',
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: authPayload(user),
  });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;

  const user = await User.findByCredentials(email);
  // Same message for "unknown email" and "wrong password" so the endpoint
  // cannot be used to enumerate registered accounts.
  const invalid = ApiError.unauthorized('Incorrect email or password.', {
    code: 'INVALID_CREDENTIALS',
  });
  if (!user) throw invalid;

  const matches = await user.comparePassword(password);
  if (!matches) throw invalid;

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `Welcome back, ${user.name.split(' ')[0]}.`,
    data: authPayload(user),
  });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } });
});

/** PATCH /api/auth/me */
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.valid.body };

  // Citizens must never be able to set their own department; only admins have
  // an organisational department.
  if (req.user.role !== ROLES.ADMIN) delete updates.department;

  Object.assign(req.user, updates);
  await req.user.save();

  res.json({
    success: true,
    message: 'Profile updated.',
    data: { user: req.user.toJSON() },
  });
});

/** POST /api/auth/logout — stateless JWT, so this is a client-side concern. */
export const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Signed out.' });
});

export default { register, login, me, updateProfile, logout };
