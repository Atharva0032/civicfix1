import { z } from 'zod';
import {
  DEPARTMENTS,
  ISSUE_CATEGORIES,
  PRIORITY_VALUES,
  STATUS_VALUES,
} from '../utils/constants.js';

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

/**
 * The report form is submitted as `multipart/form-data`, so every scalar
 * arrives as a string. `z.coerce` normalises numbers without letting the
 * client inject arbitrary shapes.
 */
export const createIssueSchema = z.object({
  title: z
    .string({ required_error: 'Issue title is required.' })
    .trim()
    .min(5, 'Title must be at least 5 characters.')
    .max(140, 'Title must be at most 140 characters.'),
  description: z
    .string({ required_error: 'Description is required.' })
    .trim()
    .min(10, 'Please describe the issue in at least 10 characters.')
    .max(2000, 'Description must be at most 2000 characters.'),
  category: z.enum(ISSUE_CATEGORIES, {
    errorMap: () => ({ message: 'Please choose a valid category.' }),
  }),
  address: z
    .string({ required_error: 'Address is required.' })
    .trim()
    .min(5, 'Address must be at least 5 characters.')
    .max(240, 'Address must be at most 240 characters.'),
  area: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{0,10}$/, 'Pincode must contain digits only.')
    .max(12)
    .optional()
    .default(''),
  lat: z.coerce
    .number({ invalid_type_error: 'Latitude is required.' })
    .min(-90, 'Latitude must be between -90 and 90.')
    .max(90, 'Latitude must be between -90 and 90.'),
  lng: z.coerce
    .number({ invalid_type_error: 'Longitude is required.' })
    .min(-180, 'Longitude must be between -180 and 180.')
    .max(180, 'Longitude must be between -180 and 180.'),
  priority: z
    .enum(PRIORITY_VALUES, { errorMap: () => ({ message: 'Invalid priority.' }) })
    .optional(),
});

export const updateIssueSchema = z
  .object({
    title: z.string().trim().min(5).max(140).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    category: z.enum(ISSUE_CATEGORIES).optional(),
    priority: z.enum(PRIORITY_VALUES).optional(),
    status: z.enum(STATUS_VALUES).optional(),
    address: z.string().trim().min(5).max(240).optional(),
    area: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    pincode: z.string().trim().max(12).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    note: z.string().trim().max(600).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });

export const listIssuesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().trim().max(200).optional(),
  category: z.string().trim().max(200).optional(),
  priority: z.string().trim().max(200).optional(),
  department: z.string().trim().max(120).optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'supporters', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  mine: z.enum(['true', 'false']).optional(),
  assignedToMe: z.enum(['true', 'false']).optional(),
  open: z.enum(['true', 'false']).optional(),
  from: z.string().trim().max(40).optional(),
  to: z.string().trim().max(40).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUS_VALUES, {
    errorMap: () => ({ message: 'Choose one of: submitted, acknowledged, in_progress, resolved, rejected.' }),
  }),
  note: z.string().trim().max(600).optional().default(''),
  resolutionNote: z.string().trim().max(1000).optional().default(''),
  rejectionReason: z.string().trim().max(600).optional().default(''),
});

export const assignIssueSchema = z
  .object({
    department: z.enum(DEPARTMENTS).optional(),
    assignedTo: objectId.nullable().optional(),
    note: z.string().trim().max(600).optional().default(''),
  })
  .refine((value) => value.department !== undefined || value.assignedTo !== undefined, {
    message: 'Provide a department or an assignee.',
  });

export const identifierParamSchema = z.object({
  id: z.string().trim().min(1, 'A complaint reference is required.').max(60),
});

export const idParamSchema = z.object({ id: objectId });

export default {
  createIssueSchema,
  updateIssueSchema,
  listIssuesQuerySchema,
  updateStatusSchema,
  assignIssueSchema,
  identifierParamSchema,
  idParamSchema,
};
