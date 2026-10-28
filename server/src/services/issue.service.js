import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateComplaintId } from '../utils/complaintId.js';
import { parsePagination } from '../utils/pagination.js';
import {
  CATEGORY_BASE_PRIORITY,
  CATEGORY_DEPARTMENT,
  ISSUE_CATEGORIES,
  ISSUE_PRIORITY,
  ISSUE_STATUS,
  OPEN_STATUSES,
  PRIORITY_VALUES,
  ROLES,
  STATUS_VALUES,
} from '../utils/constants.js';
import { deleteStoredFile, saveUploadedFiles } from './storage.service.js';
import { notifyAdministrators, notifyStatusChange } from './notification.service.js';

const PRIORITY_WEIGHT = {
  [ISSUE_PRIORITY.LOW]: 1,
  [ISSUE_PRIORITY.MEDIUM]: 2,
  [ISSUE_PRIORITY.HIGH]: 3,
  [ISSUE_PRIORITY.URGENT]: 4,
};

const SORTABLE_FIELDS = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  priority: 'priorityWeight',
  supporters: 'upvoteCount',
  status: 'status',
};

export const priorityWeightOf = (priority) => PRIORITY_WEIGHT[priority] ?? 2;

/** Escapes user supplied text before it is used inside a RegExp. */
export const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Attaches viewer-specific flags without leaking the raw `upvotes` array. */
export function serializeIssue(doc, viewer) {
  const raw = doc.toJSON ? doc.toJSON() : doc;
  const upvotes = doc.upvotes || [];
  return {
    ...raw,
    hasUpvoted: viewer ? upvotes.some((id) => String(id) === String(viewer._id)) : false,
    canEdit:
      Boolean(viewer) &&
      (viewer.role === ROLES.ADMIN || String(doc.reportedBy?._id ?? doc.reportedBy) === String(viewer._id)),
  };
}

/** Finds a complaint by Mongo id *or* human readable complaint ID. */
export async function findIssueByIdentifier(identifier, { select = '', lean = false } = {}) {
  const value = String(identifier || '').trim();
  if (!value) throw ApiError.badRequest('A complaint reference is required.');

  const conditions = [{ complaintId: value.toUpperCase() }];
  if (mongoose.isValidObjectId(value)) conditions.push({ _id: value });

  let query = Issue.findOne({ $or: conditions });
  if (select) query = query.select(select);
  if (lean) query = query.lean();

  const issue = await query;
  if (!issue) throw ApiError.notFound('That complaint could not be found.');
  return issue;
}

/** Translates query-string filters into a Mongo filter document. */
export function buildIssueFilter(query = {}, viewer = null) {
  const filter = {};

  if (query.status) {
    const statuses = String(query.status)
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => STATUS_VALUES.includes(entry));
    if (statuses.length) filter.status = { $in: statuses };
  }

  if (query.category) {
    const categories = String(query.category)
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => ISSUE_CATEGORIES.includes(entry));
    if (categories.length) filter.category = { $in: categories };
  }

  if (query.priority) {
    const priorities = String(query.priority)
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => PRIORITY_VALUES.includes(entry));
    if (priorities.length) filter.priority = { $in: priorities };
  }

  if (query.department) filter.assignedDepartment = query.department;

  if (query.mine === 'true' || query.mine === true) {
    if (!viewer) throw ApiError.unauthorized();
    filter.reportedBy = viewer._id;
  }

  if (query.assignedToMe === 'true') {
    if (!viewer) throw ApiError.unauthorized();
    filter.assignedTo = viewer._id;
  }

  if (query.open === 'true') filter.status = { $in: OPEN_STATUSES };

  if (query.onlyOpen === 'true') filter.status = { $in: OPEN_STATUSES };

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  if (query.search) {
    const term = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filter.$or = [
      { title: term },
      { description: term },
      { complaintId: term },
      { 'location.address': term },
      { 'location.area': term },
      { assignedDepartment: term },
    ];
  }

  return filter;
}

export function buildIssueSort(sortBy = 'createdAt', order = 'desc') {
  const field = SORTABLE_FIELDS[sortBy] || 'createdAt';
  const direction = String(order).toLowerCase() === 'asc' ? 1 : -1;
  return { [field]: direction, createdAt: -1 };
}

/** Paginated, filterable complaint list used by both dashboards and the map. */
export async function listIssues(rawQuery = {}, viewer = null) {
  const { page, limit, skip } = parsePagination(rawQuery);
  const filter = buildIssueFilter(rawQuery, viewer);
  const sort = buildIssueSort(rawQuery.sortBy, rawQuery.order);

  const [docs, total] = await Promise.all([
    Issue.find(filter)
      .select('+upvotes')
      .populate('reportedBy', 'name email avatarUrl')
      .populate('assignedTo', 'name email department')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Issue.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => serializeIssue(doc, viewer)),
    page,
    limit,
    total,
  };
}

/** Creates a complaint, retrying on the (very unlikely) ID collision. */
export async function createIssue({ citizen, data, files = [] }) {
  const photos = await saveUploadedFiles(files);
  const priority =
    data.priority && PRIORITY_VALUES.includes(data.priority)
      ? data.priority
      : CATEGORY_BASE_PRIORITY[data.category] || ISSUE_PRIORITY.MEDIUM;

  const base = {
    title: data.title,
    description: data.description,
    category: data.category,
    photos,
    location: {
      address: data.address,
      area: data.area || '',
      city: data.city || '',
      pincode: data.pincode || '',
      lat: Number(data.lat),
      lng: Number(data.lng),
    },
    reportedBy: citizen._id,
    status: ISSUE_STATUS.SUBMITTED,
    priority,
    priorityWeight: priorityWeightOf(priority),
    assignedDepartment: CATEGORY_DEPARTMENT[data.category] || '',
    statusHistory: [
      {
        status: ISSUE_STATUS.SUBMITTED,
        note: 'Complaint filed by citizen.',
        changedBy: citizen._id,
        changedByName: citizen.name,
        changedAt: new Date(),
      },
    ],
  };

  let issue;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      issue = await Issue.create({ ...base, complaintId: generateComplaintId() });
      break;
    } catch (error) {
      const isDuplicateId =
        error?.code === 11000 && Object.keys(error.keyPattern || {}).includes('complaintId');
      if (!isDuplicateId || attempt === 4) {
        // Roll back uploaded files so failed submissions do not leave orphans.
        await Promise.all(photos.map((photo) => deleteStoredFile(photo)));
        throw error;
      }
    }
  }

  await notifyAdministrators({ issue, citizenName: citizen.name }).catch(() => {});
  return issue;
}

/**
 * Applies an administrator-driven status change, keeping timestamps, the
 * resolution block, the timeline and the citizen notification in sync.
 */
export async function applyStatusChange({
  issue,
  actor,
  status,
  note = '',
  resolutionNote = '',
  rejectionReason = '',
  proofFiles = [],
}) {
  if (!STATUS_VALUES.includes(status)) {
    throw ApiError.badRequest(`"${status}" is not a valid complaint status.`, {
      code: 'INVALID_STATUS',
    });
  }
  if (issue.status === status && status !== ISSUE_STATUS.RESOLVED) {
    throw ApiError.badRequest(
      `This complaint is already marked as "${status}".`,
      { code: 'NO_STATUS_CHANGE' },
    );
  }

  const now = new Date();
  const proofPhotos = proofFiles.length ? await saveUploadedFiles(proofFiles) : [];

  issue.status = status;
  if (status === ISSUE_STATUS.ACKNOWLEDGED && !issue.acknowledgedAt) {
    issue.acknowledgedAt = now;
  }
  if (status === ISSUE_STATUS.IN_PROGRESS && !issue.startedAt) {
    issue.startedAt = now;
    issue.acknowledgedAt = issue.acknowledgedAt || now;
  }
  if (status === ISSUE_STATUS.RESOLVED) {
    issue.resolvedAt = now;
    issue.startedAt = issue.startedAt || now;
    issue.acknowledgedAt = issue.acknowledgedAt || now;
    issue.resolution = {
      note: resolutionNote || note || 'Marked as resolved by the municipal team.',
      proofPhotos: [...(issue.resolution?.proofPhotos || []), ...proofPhotos],
      resolvedBy: actor?._id ?? null,
      resolvedByName: actor?.name ?? '',
      resolvedAt: now,
    };
    issue.rejectionReason = '';
  }
  if (status === ISSUE_STATUS.REJECTED) {
    issue.rejectionReason = rejectionReason || note || 'Rejected by the municipal team.';
    issue.resolvedAt = null;
    issue.resolution = { note: '', proofPhotos: [], resolvedBy: null, resolvedByName: '', resolvedAt: null };
  }

  const historyNote =
    note ||
    (status === ISSUE_STATUS.RESOLVED
      ? 'Complaint resolved.'
      : status === ISSUE_STATUS.REJECTED
        ? issue.rejectionReason
        : '');

  issue.addStatusEntry({
    status,
    note: historyNote,
    changedBy: actor?._id ?? null,
    changedByName: actor?.name ?? 'Municipal team',
    at: now,
  });

  await issue.save();

  await notifyStatusChange({
    issue,
    actorName: actor?.name,
    note: historyNote,
  }).catch(() => {});

  return issue;
}

/** Assigns a complaint to a department and optionally to a specific admin. */
export async function applyAssignment({ issue, actor, department, assigneeId = null, note = '' }) {
  let assignee = null;
  if (assigneeId) {
    assignee = await User.findById(assigneeId);
    if (!assignee) throw ApiError.badRequest('The selected assignee does not exist.');
    if (assignee.role !== ROLES.ADMIN) {
      throw ApiError.badRequest('Complaints can only be assigned to administrators.');
    }
  }

  if (department !== undefined && department !== null && department !== '') {
    issue.assignedDepartment = department;
  }
  if (assignee) {
    issue.assignedTo = assignee._id;
  } else if (assigneeId === null && department !== undefined) {
    issue.assignedTo = issue.assignedTo ?? null;
  }

  const summary = [
    issue.assignedDepartment ? `Department: ${issue.assignedDepartment}` : null,
    assignee ? `Officer: ${assignee.name}` : null,
    note || null,
  ]
    .filter(Boolean)
    .join(' · ');

  issue.addStatusEntry({
    status: issue.status,
    note: `Assignment updated — ${summary}`,
    changedBy: actor?._id ?? null,
    changedByName: actor?.name ?? 'Municipal team',
    at: new Date(),
  });

  await issue.save();
  return issue;
}

/** Idempotent upvote toggle. One vote per citizen per complaint. */
export async function toggleUpvote(issue, user, shouldUpvote) {
  const already = issue.upvotes.some((id) => String(id) === String(user._id));
  const wantsUpvote = shouldUpvote ?? !already;

  if (wantsUpvote && !already) {
    issue.upvotes.push(user._id);
    issue.upvoteCount += 1;
  } else if (!wantsUpvote && already) {
    issue.upvotes = issue.upvotes.filter((id) => String(id) !== String(user._id));
    issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
  }

  await issue.save();
  return { upvoteCount: issue.upvoteCount, hasUpvoted: wantsUpvote };
}

export const canEditIssue = (issue, user) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return (
    String(issue.reportedBy?._id ?? issue.reportedBy) === String(user._id) &&
    issue.status === ISSUE_STATUS.SUBMITTED
  );
};

export const canDeleteIssue = (issue, user) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return (
    String(issue.reportedBy?._id ?? issue.reportedBy) === String(user._id) &&
    issue.status === ISSUE_STATUS.SUBMITTED
  );
};

export default {
  listIssues,
  createIssue,
  applyStatusChange,
  applyAssignment,
  toggleUpvote,
  findIssueByIdentifier,
  serializeIssue,
  buildIssueFilter,
  buildIssueSort,
  canEditIssue,
  canDeleteIssue,
  priorityWeightOf,
};
