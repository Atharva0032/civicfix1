import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildMeta } from '../utils/pagination.js';
import { DEPARTMENTS, ROLES } from '../utils/constants.js';
import {
  applyAssignment,
  applyStatusChange,
  findIssueByIdentifier,
  listIssues,
  serializeIssue,
} from '../services/issue.service.js';
import { getAdminStats } from '../services/stats.service.js';
import { deleteStoredFile } from '../services/storage.service.js';

/** GET /api/admin/stats — every number is aggregated from MongoDB. */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await getAdminStats({ days: req.valid.query.days ?? 30 });
  res.json({ success: true, data: stats });
});

/** GET /api/admin/issues — same filter engine as the public feed, admin view. */
export const getAdminIssues = asyncHandler(async (req, res) => {
  const result = await listIssues(req.valid.query, req.user);
  res.json({ success: true, data: result.items, meta: buildMeta(result) });
});

/** PATCH /api/admin/issues/:id/status */
export const patchStatus = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id, { select: '+upvotes' });
  const { status, note, resolutionNote, rejectionReason } = req.valid.body;

  await applyStatusChange({
    issue,
    actor: req.user,
    status,
    note,
    resolutionNote,
    rejectionReason,
    proofFiles: req.files?.proof || [],
  });

  await issue.populate([
    { path: 'reportedBy', select: 'name email avatarUrl' },
    { path: 'assignedTo', select: 'name email department' },
  ]);

  res.json({
    success: true,
    message: `Complaint ${issue.complaintId} marked as "${status.replace('_', ' ')}".`,
    data: serializeIssue(issue, req.user),
  });
});

/** PATCH /api/admin/issues/:id/assign */
export const patchAssign = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id, { select: '+upvotes' });
  const { department, assignedTo, note } = req.valid.body;

  await applyAssignment({
    issue,
    actor: req.user,
    department,
    assigneeId: assignedTo ?? undefined,
    note,
  });

  await issue.populate([
    { path: 'reportedBy', select: 'name email avatarUrl' },
    { path: 'assignedTo', select: 'name email department' },
  ]);

  res.json({
    success: true,
    message: `Complaint ${issue.complaintId} assignment updated.`,
    data: serializeIssue(issue, req.user),
  });
});

/** DELETE /api/admin/issues/:id — administrators may remove any complaint. */
export const deleteAdminIssue = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id);
  await Promise.all((issue.photos || []).map((photo) => deleteStoredFile(photo)));
  await issue.deleteOne();
  res.json({ success: true, message: `Complaint ${issue.complaintId} deleted.` });
});

/** GET /api/admin/administrators — feeds the assignee dropdown. */
export const getAdministrators = asyncHandler(async (_req, res) => {
  const admins = await User.find({ role: ROLES.ADMIN })
    .select('name email department')
    .sort({ name: 1 });
  res.json({ success: true, data: admins });
});

/** GET /api/admin/departments */
export const getDepartments = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: DEPARTMENTS });
});

/** GET /api/admin/citizens — lightweight directory for admin insight. */
export const getCitizens = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const citizens = await User.find({ role: ROLES.CITIZEN })
    .select('name email phone createdAt lastLoginAt')
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ success: true, data: citizens });
});

export default {
  getStats,
  getAdminIssues,
  patchStatus,
  patchAssign,
  deleteAdminIssue,
  getAdministrators,
  getDepartments,
  getCitizens,
};
