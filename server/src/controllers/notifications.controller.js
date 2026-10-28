import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

/** GET /api/notifications — always scoped to the authenticated recipient. */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.valid.query);
  const filter = { recipient: req.user._id };
  if (req.valid.query.unreadOnly === 'true') filter.read = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { ...buildMeta({ page, limit, total }), unread },
  });
});

/** GET /api/notifications/unread-count — used by the navbar bell badge. */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });
  res.json({ success: true, data: { unread } });
});

/** PATCH /api/notifications/:id/read */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.valid.params.id, recipient: req.user._id },
    { read: true, readAt: new Date() },
    { new: true },
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found.');
  }

  res.json({ success: true, data: notification });
});

/** PATCH /api/notifications/read-all */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true, readAt: new Date() },
  );

  res.json({
    success: true,
    message:
      result.modifiedCount > 0
        ? `${result.modifiedCount} notification(s) marked as read.`
        : 'You are all caught up.',
    data: { updated: result.modifiedCount },
  });
});

/** DELETE /api/notifications/:id */
export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({
    _id: req.valid.params.id,
    recipient: req.user._id,
  });
  if (!result.deletedCount) throw ApiError.notFound('Notification not found.');
  res.json({ success: true, message: 'Notification deleted.' });
});

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
