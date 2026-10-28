import { Router } from 'express';
import authRoutes from './auth.routes.js';
import issueRoutes from './issue.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import systemRoutes from './system.routes.js';

const router = Router();

router.use('/', systemRoutes);
router.use('/auth', authRoutes);
router.use('/issues', issueRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

export default router;
