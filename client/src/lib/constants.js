/**
 * Presentation-only metadata. The *values* always come from `GET /api/meta`
 * (single source of truth shared with the backend) — this file only adds the
 * colours, chip classes and map marker colours that the API cannot send.
 */

export const STATUS_STYLES = {
  submitted: {
    label: 'Submitted',
    chip: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
    marker: '#64748b',
    description: 'Waiting to be reviewed by the municipal team.',
  },
  acknowledged: {
    label: 'Acknowledged',
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    dot: 'bg-sky-500',
    bar: 'bg-sky-500',
    marker: '#0284c7',
    description: 'The complaint has been verified and forwarded to a department.',
  },
  in_progress: {
    label: 'In Progress',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    marker: '#f59e0b',
    description: 'A field team is working on this complaint.',
  },
  resolved: {
    label: 'Resolved',
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    marker: '#059669',
    description: 'The issue has been fixed and verified on site.',
  },
  rejected: {
    label: 'Rejected',
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    marker: '#e11d48',
    description: 'This complaint could not be actioned. See the reason below.',
  },
};

export const PRIORITY_STYLES = {
  low: {
    label: 'Low',
    chip: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    dot: 'bg-slate-400',
    order: 1,
  },
  medium: {
    label: 'Medium',
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    dot: 'bg-sky-500',
    order: 2,
  },
  high: {
    label: 'High',
    chip: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
    dot: 'bg-orange-500',
    order: 3,
  },
  urgent: {
    label: 'Urgent',
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    dot: 'bg-rose-500',
    order: 4,
  },
};

export const CATEGORY_STYLES = {
  roads: { chip: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200', accent: '#d97706' },
  garbage: { chip: 'bg-lime-50 text-lime-800 ring-1 ring-inset ring-lime-200', accent: '#65a30d' },
  water: { chip: 'bg-cyan-50 text-cyan-800 ring-1 ring-inset ring-cyan-200', accent: '#0891b2' },
  electricity: { chip: 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200', accent: '#ca8a04' },
  drainage: { chip: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200', accent: '#0d9488' },
  public_safety: { chip: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200', accent: '#e11d48' },
  other: { chip: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200', accent: '#64748b' },
};

/** Chart palette used by Recharts. */
export const CHART_COLORS = [
  '#3562e6',
  '#0d9488',
  '#d97706',
  '#e11d48',
  '#0891b2',
  '#65a30d',
  '#7c3aed',
];

/** Sensible fallbacks until `GET /api/meta` responds. */
export const FALLBACK_CATEGORIES = [
  { value: 'roads', label: 'Roads', department: 'Public Works Department' },
  { value: 'garbage', label: 'Garbage', department: 'Sanitation & Solid Waste' },
  { value: 'water', label: 'Water', department: 'Water Supply Board' },
  { value: 'electricity', label: 'Electricity', department: 'Electricity & Street Lighting' },
  { value: 'drainage', label: 'Drainage', department: 'Drainage & Sewerage' },
  { value: 'public_safety', label: 'Public Safety', department: 'Traffic & Public Safety' },
  { value: 'other', label: 'Other', department: 'General Administration' },
];

export const FALLBACK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const FALLBACK_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export const FALLBACK_DEPARTMENTS = [
  'Public Works Department',
  'Sanitation & Solid Waste',
  'Water Supply Board',
  'Electricity & Street Lighting',
  'Drainage & Sewerage',
  'Traffic & Public Safety',
  'General Administration',
];

/** Default centre for the map picker (Pune, Maharashtra). */
export const DEFAULT_MAP_CENTER = { lat: 18.5204, lng: 73.8567 };
export const DEFAULT_MAP_ZOOM = 12;

export const OPEN_STATUSES = ['submitted', 'acknowledged', 'in_progress'];

export default {
  STATUS_STYLES,
  PRIORITY_STYLES,
  CATEGORY_STYLES,
  CHART_COLORS,
};
