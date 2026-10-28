import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Invalid notification identifier.'),
});

export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(180).optional(),
});

export default {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  statsQuerySchema,
};
