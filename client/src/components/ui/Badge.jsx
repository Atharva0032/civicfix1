import { cn } from '../../lib/cn';
import { useMeta } from '../../context/MetaContext';
import { CATEGORY_STYLES, PRIORITY_STYLES, STATUS_STYLES } from '../../lib/constants';

/** Neutral pill used for counts, tags and metadata. */
export function Badge({ className, children, dot, dotClass }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClass || dot)} />}
      {children}
    </span>
  );
}

/** Colour-coded complaint status. */
export function StatusBadge({ status, showDot = true, className }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.submitted;
  return (
    <Badge className={cn(style.chip, className)} dot={showDot ? style.dot : undefined}>
      {style.label}
    </Badge>
  );
}

/** Colour-coded priority indicator. */
export function PriorityBadge({ priority, showDot = true, className }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <Badge className={cn(style.chip, className)} dot={showDot ? style.dot : undefined}>
      {style.label}
    </Badge>
  );
}

/** Category chip; the label always comes from the shared API metadata. */
export function CategoryBadge({ category, className, children }) {
  const { categoryLabel } = useMeta();
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.other;
  return (
    <Badge className={cn(style.chip, className)}>{children || categoryLabel(category)}</Badge>
  );
}

export default Badge;
