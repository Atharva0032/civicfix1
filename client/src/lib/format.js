const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const NUMBER_FORMAT = new Intl.NumberFormat('en-IN');

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMAT.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME_FORMAT.format(date);
};

export const formatNumber = (value) => NUMBER_FORMAT.format(Number(value) || 0);

/** "3 days ago", "in 2 hours" — enough precision for a status timeline. */
export const timeAgo = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);

  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (absolute >= secondsInUnit || unit === 'second') {
      return formatter.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return 'just now';
};

/** Turns an average resolution time in hours into a friendly label. */
export const formatDuration = (hours) => {
  const value = Number(hours) || 0;
  if (value < 1) return 'under an hour';
  if (value < 24) return `${value.toFixed(1).replace(/\.0$/, '')} hours`;
  const days = value / 24;
  return `${days.toFixed(1).replace(/\.0$/, '')} days`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const toTitleCase = (value = '') =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const truncate = (value = '', length = 120) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;

export const percent = (value) => `${(Number(value) || 0).toFixed(1)}%`;

export const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export default {
  formatDate,
  formatDateTime,
  formatNumber,
  timeAgo,
  formatDuration,
  initials,
  toTitleCase,
  truncate,
  percent,
  formatBytes,
};
