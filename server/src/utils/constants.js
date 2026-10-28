/** Shared vocabulary for the whole application (API + UI labels). */

export const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.values(ROLES);

export const ISSUE_CATEGORIES = Object.freeze([
  'roads',
  'garbage',
  'water',
  'electricity',
  'drainage',
  'public_safety',
  'other',
]);

export const CATEGORY_LABELS = Object.freeze({
  roads: 'Roads',
  garbage: 'Garbage',
  water: 'Water',
  electricity: 'Electricity',
  drainage: 'Drainage',
  public_safety: 'Public Safety',
  other: 'Other',
});

export const ISSUE_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
});

export const STATUS_VALUES = Object.values(ISSUE_STATUS);

/** The happy-path workflow. `rejected` is a terminal side-exit. */
export const STATUS_FLOW = Object.freeze([
  ISSUE_STATUS.SUBMITTED,
  ISSUE_STATUS.ACKNOWLEDGED,
  ISSUE_STATUS.IN_PROGRESS,
  ISSUE_STATUS.RESOLVED,
]);

export const STATUS_LABELS = Object.freeze({
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
});

/** Statuses that count as "still open" for dashboards. */
export const OPEN_STATUSES = Object.freeze([
  ISSUE_STATUS.SUBMITTED,
  ISSUE_STATUS.ACKNOWLEDGED,
  ISSUE_STATUS.IN_PROGRESS,
]);

export const ISSUE_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const PRIORITY_VALUES = Object.values(ISSUE_PRIORITY);

export const PRIORITY_LABELS = Object.freeze({
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
});

/** Municipal departments a complaint can be routed to. */
export const DEPARTMENTS = Object.freeze([
  'Public Works Department',
  'Sanitation & Solid Waste',
  'Water Supply Board',
  'Electricity & Street Lighting',
  'Drainage & Sewerage',
  'Traffic & Public Safety',
  'General Administration',
]);

/** Default department suggested for each category (admin can override). */
export const CATEGORY_DEPARTMENT = Object.freeze({
  roads: 'Public Works Department',
  garbage: 'Sanitation & Solid Waste',
  water: 'Water Supply Board',
  electricity: 'Electricity & Street Lighting',
  drainage: 'Drainage & Sewerage',
  public_safety: 'Traffic & Public Safety',
  other: 'General Administration',
});

/**
 * Priority rules applied server-side when a citizen does not pick one, or when
 * an administrator wants the system to score a complaint by category.
 * Administrators may always override the result.
 */
export const CATEGORY_BASE_PRIORITY = Object.freeze({
  roads: 'high',
  garbage: 'medium',
  water: 'high',
  electricity: 'medium',
  drainage: 'high',
  public_safety: 'urgent',
  other: 'low',
});

export const NOTIFICATION_TYPES = Object.freeze([
  'submission',
  'acknowledged',
  'in_progress',
  'resolved',
  'rejected',
  'note',
  'system',
]);

export default {
  ROLES,
  ISSUE_CATEGORIES,
  CATEGORY_LABELS,
  ISSUE_STATUS,
  STATUS_FLOW,
  STATUS_LABELS,
  OPEN_STATUSES,
  ISSUE_PRIORITY,
  PRIORITY_LABELS,
  DEPARTMENTS,
  CATEGORY_DEPARTMENT,
  CATEGORY_BASE_PRIORITY,
};
