import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import * as issues from '../controllers/issues.controller.js';
import {
  createIssueSchema,
  identifierParamSchema,
  listIssuesQuerySchema,
  updateIssueSchema,
} from '../validators/issue.validators.js';

const router = Router();

// --- Discovery (public, viewer-aware when a token is supplied) -------------
router.get('/', optionalAuth, validate({ query: listIssuesQuerySchema }), issues.getIssues);

router.get(
  '/map',
  optionalAuth,
  validate({ query: listIssuesQuerySchema }),
  issues.getMapIssues,
);

router.get('/stats/me', authenticate, issues.getMyStats);

// --- Creation --------------------------------------------------------------
router.post(
  '/',
  authenticate,
  writeLimiter,
  uploadImages,
  validate({ body: createIssueSchema }),
  issues.postIssue,
);

// --- Single complaint ------------------------------------------------------
router.get(
  '/:id',
  optionalAuth,
  validate({ params: identifierParamSchema }),
  issues.getIssue,
);

router.patch(
  '/:id',
  authenticate,
  writeLimiter,
  validate({ params: identifierParamSchema, body: updateIssueSchema }),
  issues.patchIssue,
);

router.delete(
  '/:id',
  authenticate,
  writeLimiter,
  validate({ params: identifierParamSchema }),
  issues.deleteIssueById,
);

// --- Community support -----------------------------------------------------
router.post(
  '/:id/upvote',
  authenticate,
  writeLimiter,
  validate({ params: identifierParamSchema }),
  issues.upvoteIssue,
);

router.delete(
  '/:id/upvote',
  authenticate,
  writeLimiter,
  validate({ params: identifierParamSchema }),
  issues.removeUpvote,
);

export default router;
