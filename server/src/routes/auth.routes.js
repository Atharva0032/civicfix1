import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { authLimiter, writeLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import * as auth from '../controllers/auth.controller.js';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validators.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
router.post('/logout', auth.logout);

router.get('/me', authenticate, auth.me);
router.patch(
  '/me',
  authenticate,
  writeLimiter,
  validate({ body: updateProfileSchema }),
  auth.updateProfile,
);

// Health-check helper that also proves role-based access control is wired up.
router.get('/admin-check', authenticate, requireAdmin, (_req, res) =>
  res.json({ success: true, message: 'You are a municipal administrator.' }),
);

export default router;
