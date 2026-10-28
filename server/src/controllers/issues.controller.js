import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import { ISSUE_STATUS, OPEN_STATUSES, PRIORITY_VALUES, ROLES, STATUS_VALUES } from '../utils/constants.js';
import {
  applyStatusChange,
  buildIssueFilter,
  buildIssueSort,
  canDeleteIssue,
  canEditIssue,
  createIssue,
  findIssueByIdentifier,
  listIssues,
  priorityWeightOf,
  serializeIssue,
  toggleUpvote,
} from '../services/issue.service.js';
import { deleteStoredFile } from '../services/storage.service.js';
import { notify } from '../services/notification.service.js';

const filesOf = (req, field) => req.files?.[field] || [];

/**
 * GET /api/issues
 * Public, paginated, filterable complaint feed used by "Explore Issues",
 * the citizen dashboard and the admin table.
 */
export const getIssues = asyncHandler(async (req, res) => {
  const result = await listIssues(req.valid.query, req.user);
  res.json({
    success: true,
    data: result.items,
    meta: buildMeta(result),
  });
});

/**
 * GET /api/issues/map
 * Trimmed payload that only contains what a marker needs — keeps the map fast
 * even with thousands of complaints.
 */
export const getMapIssues = asyncHandler(async (req, res) => {
  const filters = { ...req.valid.query, limit: req.valid.query.limit ?? 100 };
  const { limit } = parsePagination(filters);
  const filter = buildIssueFilter(filters, req.user);

  const docs = await Issue.find(filter)
    .select(
      'complaintId title category status priority location upvoteCount createdAt photos.url',
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: docs.map((doc) => ({
      id: String(doc._id),
      complaintId: doc.complaintId,
      title: doc.title,
      category: doc.category,
      status: doc.status,
      priority: doc.priority,
      lat: doc.location?.lat,
      lng: doc.location?.lng,
      address: doc.location?.address,
      area: doc.location?.area,
      upvoteCount: doc.upvoteCount ?? 0,
      thumbnail: doc.photos?.[0]?.url ?? '',
      createdAt: doc.createdAt,
    })),
  });
});

/**
 * GET /api/issues/stats/me
 * Counters for the citizen dashboard — all computed from real records.
 */
export const getMyStats = asyncHandler(async (req, res) => {
  const [statusRows, unreadNotifications, supportedAgg] = await Promise.all([
    Issue.aggregate([
      { $match: { reportedBy: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
    Issue.aggregate([
      { $match: { reportedBy: req.user._id } },
      { $group: { _id: null, supporters: { $sum: '$upvoteCount' } } },
    ]),
  ]);

  const countOf = (status) => statusRows.find((row) => row._id === status)?.count ?? 0;
  const total = statusRows.reduce((sum, row) => sum + row.count, 0);
  const resolved = countOf(ISSUE_STATUS.RESOLVED);

  res.json({
    success: true,
    data: {
      total,
      open: OPEN_STATUSES.reduce((sum, status) => sum + countOf(status), 0),
      submitted: countOf(ISSUE_STATUS.SUBMITTED),
      acknowledged: countOf(ISSUE_STATUS.ACKNOWLEDGED),
      inProgress: countOf(ISSUE_STATUS.IN_PROGRESS),
      resolved,
      rejected: countOf(ISSUE_STATUS.REJECTED),
      resolutionRate: total ? Number(((resolved / total) * 100).toFixed(1)) : 0,
      supportersReceived: supportedAgg[0]?.supporters ?? 0,
      unreadNotifications,
    },
  });
});

/** GET /api/issues/:id — accepts a Mongo id or a `CIV-…` complaint reference. */
export const getIssue = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id, { select: '+upvotes' });
  await issue.populate([
    { path: 'reportedBy', select: 'name email avatarUrl createdAt' },
    { path: 'assignedTo', select: 'name email department' },
  ]);

  res.json({
    success: true,
    data: serializeIssue(issue, req.user),
  });
});

/** POST /api/issues — citizens file a new complaint (photo upload supported). */
export const postIssue = asyncHandler(async (req, res) => {
  const issue = await createIssue({
    citizen: req.user,
    data: req.valid.body,
    files: filesOf(req, 'photos'),
  });

  await notify({
    recipient: req.user._id,
    title: 'Complaint submitted',
    message: `We received "${issue.title}". Your reference number is ${issue.complaintId}. You will be notified as it progresses.`,
    type: 'submission',
    issue,
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: `Complaint ${issue.complaintId} submitted successfully.`,
    data: serializeIssue(issue, req.user),
  });
});

/**
 * PATCH /api/issues/:id
 * Citizens may correct their own complaint while it is still "submitted".
 * Administrators may update any field, including status and priority.
 * Client supplied `status` from a non-admin is rejected outright.
 */
export const patchIssue = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id, { select: '+upvotes' });
  const isAdmin = req.user.role === ROLES.ADMIN;
  const body = req.valid.body;

  if (!isAdmin && !canEditIssue(issue, req.user)) {
    throw ApiError.forbidden(
      'You can only edit your own complaint, and only while it is still awaiting acknowledgement.',
      { code: 'EDIT_NOT_ALLOWED' },
    );
  }

  if (body.status !== undefined && !isAdmin) {
    throw ApiError.forbidden(
      'Only municipal administrators can change a complaint status.',
      { code: 'STATUS_CHANGE_FORBIDDEN' },
    );
  }
  if (body.priority !== undefined && !isAdmin && !PRIORITY_VALUES.includes(body.priority)) {
    throw ApiError.badRequest('Invalid priority.');
  }

  if (isAdmin && body.status !== undefined && body.status !== issue.status) {
    await applyStatusChange({
      issue,
      actor: req.user,
      status: body.status,
      note: body.note || 'Status updated by administrator.',
    });
  }

  const directFields = ['title', 'description', 'category', 'priority', 'note'];
  directFields.forEach((field) => {
    if (field === 'note') return;
    if (body[field] !== undefined) issue[field] = body[field];
  });

  if (body.priority !== undefined) {
    issue.priorityWeight = priorityWeightOf(body.priority);
  }

  const locationFields = ['address', 'area', 'city', 'pincode', 'lat', 'lng'];
  if (locationFields.some((field) => body[field] !== undefined)) {
    issue.location = {
      ...issue.location.toObject?.() ?? issue.location,
      ...Object.fromEntries(
        locationFields
          .filter((field) => body[field] !== undefined)
          .map((field) => [field, field === 'lat' || field === 'lng' ? Number(body[field]) : body[field]]),
      ),
    };
  }

  if (body.priority !== undefined || body.category !== undefined) {
    issue.addStatusEntry({
      status: issue.status,
      note: `Complaint details revised by ${req.user.name}.`,
      changedBy: req.user._id,
      changedByName: req.user.name,
    });
  }

  await issue.save();
  await issue.populate([
    { path: 'reportedBy', select: 'name email avatarUrl' },
    { path: 'assignedTo', select: 'name email department' },
  ]);

  res.json({
    success: true,
    message: 'Complaint updated.',
    data: serializeIssue(issue, req.user),
  });
});

/** DELETE /api/issues/:id — owner (while submitted) or administrator. */
export const deleteIssueById = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id);

  if (!canDeleteIssue(issue, req.user)) {
    throw ApiError.forbidden(
      'You can only withdraw your own complaint, and only before it is acknowledged.',
      { code: 'DELETE_NOT_ALLOWED' },
    );
  }

  await Promise.all((issue.photos || []).map((photo) => deleteStoredFile(photo)));
  await issue.deleteOne();

  res.json({ success: true, message: `Complaint ${issue.complaintId} deleted.` });
});

/** POST /api/issues/:id/upvote */
export const upvoteIssue = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id, { select: '+upvotes' });
  const result = await toggleUpvote(issue, req.user, true);

  res.json({
    success: true,
    message: result.hasUpvoted ? 'Thanks for your support.' : 'Support removed.',
    data: result,
  });
});

/** DELETE /api/issues/:id/upvote */
export const removeUpvote = asyncHandler(async (req, res) => {
  const issue = await findIssueByIdentifier(req.valid.params.id, { select: '+upvotes' });
  const result = await toggleUpvote(issue, req.user, false);
  res.json({ success: true, message: 'Support removed.', data: result });
});

export default {
  getIssues,
  getMapIssues,
  getMyStats,
  getIssue,
  postIssue,
  patchIssue,
  deleteIssueById,
  upvoteIssue,
  removeUpvote,
};
