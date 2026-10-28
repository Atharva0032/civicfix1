import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import * as admin from '../controllers/admin.controller.js';
import {
  assignIssueSchema,
  identifierParamSchema,
  listIssuesQuerySchema,
  updateStatusSchema,
} from '../validators/issue.validators.js';
import { statsQuerySchema } from '../validators/notification.validators.js';

const router = Router();

// Every route below this line is admin-only. `authenticate` loads the role
// from the database and `requireAdmin` enforces it — client input is ignored.
router.use(authenticate, requireAdmin);

router.get('/stats', validate({ query: statsQuerySchema }), admin.getStats);

router.get('/issues', validate({ query: listIssuesQuerySchema }), admin.getAdminIssues);

router.patch(
  '/issues/:id/status',
  writeLimiter,
  uploadImages,
  validate({ params: identifierParamSchema, body: updateStatusSchema }),
  admin.patchStatus,
);

router.patch(
  '/issues/:id/assign',
  writeLimiter,
  validate({ params: identifierParamSchema, body: assignIssueSchema }),
  admin.patchAssign,
);

router.delete(
  '/issues/:id',
  writeLimiter,
  validate({ params: identifierParamSchema }),
  admin.deleteAdminIssue,
);

router.get('/administrators', admin.getAdministrators);
router.get('/departments', admin.getDepartments);
router.get('/citizens', admin.getCitizens);

export default router;
