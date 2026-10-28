import Issue from '../models/Issue.js';
import { ISSUE_STATUS } from '../utils/constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const statusCount = (rows, status) =>
  rows.find((row) => row._id === status)?.count ?? 0;

/** Fills gaps so charts always render a continuous axis. */
function fillDailySeries(rows, since, days) {
  const map = new Map(rows.map((row) => [row._id, row.count]));
  const series = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(since.getTime() + index * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    series.push({ date: key, count: map.get(key) ?? 0 });
  }
  return series;
}

/**
 * Aggregates live dashboard metrics straight from MongoDB. Nothing here is
 * hardcoded — every number is derived from the complaint collection.
 */
export async function getAdminStats({ days = 30 } = {}) {
  const windowDays = Math.min(Math.max(Number(days) || 30, 7), 180);
  const since = new Date(Date.now() - (windowDays - 1) * DAY_MS);
  since.setHours(0, 0, 0, 0);

  const [
    statusRows,
    categoryRows,
    priorityRows,
    departmentRows,
    createdRows,
    resolvedRows,
    resolutionTimeRows,
  ] = await Promise.all([
    Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Issue.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Issue.aggregate([
      { $match: { assignedDepartment: { $nin: ['', null] } } },
      { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Issue.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Issue.aggregate([
      { $match: { resolvedAt: { $gte: since, $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Issue.aggregate([
      { $match: { status: ISSUE_STATUS.RESOLVED, resolvedAt: { $ne: null } } },
      {
        $project: {
          hours: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000],
          },
        },
      },
      { $group: { _id: null, avgHours: { $avg: '$hours' } } },
    ]),
  ]);

  const total = statusRows.reduce((sum, row) => sum + row.count, 0);
  const resolved = statusCount(statusRows, ISSUE_STATUS.RESOLVED);
  const rejected = statusCount(statusRows, ISSUE_STATUS.REJECTED);
  const submitted = statusCount(statusRows, ISSUE_STATUS.SUBMITTED);
  const acknowledged = statusCount(statusRows, ISSUE_STATUS.ACKNOWLEDGED);
  const inProgress = statusCount(statusRows, ISSUE_STATUS.IN_PROGRESS);

  const createdSeries = fillDailySeries(createdRows, since, windowDays);
  const resolvedSeries = fillDailySeries(resolvedRows, since, windowDays);
  const resolvedMap = new Map(resolvedSeries.map((row) => [row.date, row.count]));

  return {
    totals: {
      total,
      submitted,
      acknowledged,
      inProgress,
      resolved,
      rejected,
      pending: submitted + acknowledged,
      open: submitted + acknowledged + inProgress,
    },
    resolutionRate: total ? Number(((resolved / total) * 100).toFixed(1)) : 0,
    rejectionRate: total ? Number(((rejected / total) * 100).toFixed(1)) : 0,
    averageResolutionHours: Number(
      (resolutionTimeRows[0]?.avgHours ?? 0).toFixed(1),
    ),
    byStatus: Object.values(ISSUE_STATUS).map((status) => ({
      status,
      count: statusCount(statusRows, status),
    })),
    byCategory: categoryRows.map((row) => ({ category: row._id, count: row.count })),
    byPriority: priorityRows.map((row) => ({ priority: row._id, count: row.count })),
    byDepartment: departmentRows.map((row) => ({
      department: row._id,
      count: row.count,
    })),
    timeline: createdSeries.map((row) => ({
      date: row.date,
      created: row.count,
      resolved: resolvedMap.get(row.date) ?? 0,
    })),
    windowDays,
  };
}

/** Public, unauthenticated counters for the landing page hero. */
export async function getPublicStats() {
  const [total, resolved, inProgress, citizenRows] = await Promise.all([
    Issue.countDocuments({}),
    Issue.countDocuments({ status: ISSUE_STATUS.RESOLVED }),
    Issue.countDocuments({ status: ISSUE_STATUS.IN_PROGRESS }),
    Issue.distinct('reportedBy'),
  ]);

  return {
    totalIssues: total,
    resolvedIssues: resolved,
    inProgressIssues: inProgress,
    activeCitizens: citizenRows.length,
    resolutionRate: total ? Number(((resolved / total) * 100).toFixed(1)) : 0,
  };
}

export default { getAdminStats, getPublicStats };
