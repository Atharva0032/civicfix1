import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowBigUp, Clock, MapPin, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../ui';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_STYLES } from '../../lib/constants';
import { timeAgo, truncate } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import api, { resolveAssetUrl } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

/**
 * Complaint card used on the landing page, Explore feed and dashboards, with
 * an inline community upvote button.
 */
export function IssueCard({ issue, onUpvoted, showActions = false, onDeleted }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [vote, setVote] = useState({
    count: issue.upvoteCount ?? 0,
    hasUpvoted: issue.hasUpvoted ?? false,
  });

  const accent = CATEGORY_STYLES[issue.category]?.accent || '#3562e6';
  const thumbnail = resolveAssetUrl(issue.photos?.[0]?.url);

  const handleUpvote = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Sign in to support this complaint.', { title: 'Authentication required' });
      return;
    }

    const nextVoted = !vote.hasUpvoted;
    // Optimistic update so the button feels instant.
    setVote({
      count: Math.max(0, vote.count + (nextVoted ? 1 : -1)),
      hasUpvoted: nextVoted,
    });
    setIsVoting(true);

    try {
      const { data } = nextVoted
        ? await api.post(`/issues/${issue.id}/upvote`)
        : await api.delete(`/issues/${issue.id}/upvote`);
      setVote({ count: data.data.upvoteCount, hasUpvoted: data.data.hasUpvoted });
      onUpvoted?.(issue.id, data.data);
    } catch (error) {
      setVote({ count: issue.upvoteCount ?? 0, hasUpvoted: issue.hasUpvoted ?? false });
      toast.error(error.message);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <article className="group surface flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-stretch">
        <span className="w-1 shrink-0" style={{ backgroundColor: accent }} aria-hidden="true" />

        {thumbnail ? (
          <Link to={`/issues/${issue.id}`} className="relative w-28 shrink-0 overflow-hidden sm:w-36">
            <img
              src={thumbnail}
              alt={issue.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </Link>
        ) : (
          <div
            className="grid w-20 shrink-0 place-items-center bg-slate-50 text-slate-300"
            aria-hidden="true"
          >
            <CategoryIcon category={issue.category} className="h-7 w-7" />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            <CategoryBadge category={issue.category} />
          </div>

          <h3 className="mt-2.5 text-base font-bold leading-snug text-navy-900">
            <Link
              to={`/issues/${issue.id}`}
              className="transition hover:text-primary-700 focus-visible:text-primary-700"
            >
              {issue.title}
            </Link>
          </h3>

          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {truncate(issue.description, 140)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{issue.location?.area || issue.location?.address}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {timeAgo(issue.createdAt)}
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-400">
              {issue.complaintId}
            </span>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {(issue.reportedBy?.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="truncate">
                {issue.reportedBy?.name || 'Citizen'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {showActions && onDeleted && (
                <button
                  type="button"
                  onClick={() => onDeleted(issue)}
                  aria-label="Delete complaint"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleUpvote}
                disabled={isVoting}
                aria-pressed={vote.hasUpvoted}
                aria-label={vote.hasUpvoted ? 'Remove your support' : 'Support this complaint'}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition',
                  vote.hasUpvoted
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  isVoting && 'opacity-70',
                )}
              >
                <ArrowBigUp
                  className={cn('h-4 w-4', vote.hasUpvoted && 'fill-current')}
                  strokeWidth={2.4}
                />
                {vote.count}
              </button>

              {(issue.statusHistory?.length ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {issue.statusHistory.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default IssueCard;
