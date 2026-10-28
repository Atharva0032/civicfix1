import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ISSUE_STATUS, ROLES, STATUS_LABELS } from '../utils/constants.js';

const TYPE_BY_STATUS = {
  [ISSUE_STATUS.SUBMITTED]: 'submission',
  [ISSUE_STATUS.ACKNOWLEDGED]: 'acknowledged',
  [ISSUE_STATUS.IN_PROGRESS]: 'in_progress',
  [ISSUE_STATUS.RESOLVED]: 'resolved',
  [ISSUE_STATUS.REJECTED]: 'rejected',
};

/** Creates a single in-app notification. */
export async function notify({
  recipient,
  title,
  message,
  type = 'system',
  issue = null,
  session = null,
}) {
  if (!recipient) return null;
  const [created] = await Notification.create(
    [
      {
        recipient,
        title,
        message,
        type,
        issue: issue?._id ?? null,
        issueComplaintId: issue?.complaintId ?? '',
        issueTitle: issue?.title ?? '',
      },
    ],
    session ? { session } : undefined,
  );
  return created;
}

/** Notifies the citizen who filed a complaint about a status transition. */
export function notifyStatusChange({ issue, actorName, note }) {
  const label = STATUS_LABELS[issue.status] || issue.status;
  const parts = [`Complaint ${issue.complaintId} is now "${label}".`];
  if (note) parts.push(note);
  if (actorName) parts.push(`— ${actorName}`);

  const titles = {
    [ISSUE_STATUS.ACKNOWLEDGED]: 'Complaint acknowledged',
    [ISSUE_STATUS.IN_PROGRESS]: 'Work has started',
    [ISSUE_STATUS.RESOLVED]: 'Complaint resolved',
    [ISSUE_STATUS.REJECTED]: 'Complaint rejected',
    [ISSUE_STATUS.SUBMITTED]: 'Complaint received',
  };

  return notify({
    recipient: issue.reportedBy,
    title: titles[issue.status] || `Status updated to ${label}`,
    message: parts.join(' '),
    type: TYPE_BY_STATUS[issue.status] || 'note',
    issue,
  });
}

/** Fan-out helper: tells every administrator about a brand new complaint. */
export async function notifyAdministrators({ issue, citizenName }) {
  const admins = await User.find({ role: ROLES.ADMIN }).select('_id').lean();
  if (!admins.length) return [];

  return Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin._id,
      title: `New ${issue.category} report`,
      message: `${citizenName} reported "${issue.title}" (${issue.complaintId}).`,
      type: 'system',
      issue: issue._id,
      issueComplaintId: issue.complaintId,
      issueTitle: issue.title,
    })),
  );
}

export default { notify, notifyStatusChange, notifyAdministrators };
