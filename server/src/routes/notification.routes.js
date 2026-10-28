import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as notifications from '../controllers/notifications.controller.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../validators/notification.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  notifications.getNotifications,
);

router.get('/unread-count', notifications.getUnreadCount);

router.patch('/read-all', notifications.markAllAsRead);

router.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  notifications.markAsRead,
);

router.delete(
  '/:id',
  validate({ params: notificationIdParamSchema }),
  notifications.deleteNotification,
);

export default router;
