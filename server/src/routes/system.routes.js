import { Router } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { getPublicStats } from '../services/stats.service.js';
import {
  CATEGORY_DEPARTMENT,
  CATEGORY_LABELS,
  DEPARTMENTS,
  ISSUE_CATEGORIES,
  PRIORITY_LABELS,
  PRIORITY_VALUES,
  STATUS_FLOW,
  STATUS_LABELS,
  STATUS_VALUES,
} from '../utils/constants.js';

const router = Router();

/** GET /api/health */
router.get('/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      database: states[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/meta
 * Single source of truth for enum values + display labels so the frontend
 * never hardcodes a category or status list.
 */
router.get('/meta', (_req, res) => {
  res.json({
    success: true,
    data: {
      categories: ISSUE_CATEGORIES.map((value) => ({
        value,
        label: CATEGORY_LABELS[value],
        department: CATEGORY_DEPARTMENT[value],
      })),
      statuses: STATUS_VALUES.map((value) => ({ value, label: STATUS_LABELS[value] })),
      statusFlow: STATUS_FLOW,
      priorities: PRIORITY_VALUES.map((value) => ({
        value,
        label: PRIORITY_LABELS[value],
      })),
      departments: DEPARTMENTS,
    },
  });
});

/** GET /api/stats — public landing-page counters from live data. */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await getPublicStats();
    res.json({ success: true, data: stats });
  }),
);

export default router;
