import {
  Construction,
  Droplets,
  HelpCircle,
  ShieldAlert,
  Trash2,
  Waves,
  Zap,
} from 'lucide-react';

const ICONS = {
  roads: Construction,
  garbage: Trash2,
  water: Droplets,
  electricity: Zap,
  drainage: Waves,
  public_safety: ShieldAlert,
  other: HelpCircle,
};

/** Maps an issue category to its Lucide icon. */
export const categoryIcon = (category) => ICONS[category] || HelpCircle;

export function CategoryIcon({ category, className = 'h-4 w-4' }) {
  const Icon = categoryIcon(category);
  return <Icon className={className} aria-hidden="true" />;
}

export default CategoryIcon;
