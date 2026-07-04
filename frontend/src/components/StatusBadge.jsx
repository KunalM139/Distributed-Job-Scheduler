/**
 * Reusable status badge with colour coding.
 */

const STATUS_STYLES = {
  active:    'bg-success-400/15 text-success-500 dark:bg-success-400/10 dark:text-success-400',
  idle:      'bg-success-400/15 text-success-500 dark:bg-success-400/10 dark:text-success-400',
  completed: 'bg-success-400/15 text-success-500 dark:bg-success-400/10 dark:text-success-400',
  running:   'bg-info-400/15 text-info-500 dark:bg-info-400/10 dark:text-info-400',
  busy:      'bg-info-400/15 text-info-500 dark:bg-info-400/10 dark:text-info-400',
  queued:    'bg-warning-400/15 text-warning-500 dark:bg-warning-400/10 dark:text-warning-400',
  scheduled: 'bg-warning-400/15 text-warning-500 dark:bg-warning-400/10 dark:text-warning-400',
  paused:    'bg-warning-400/15 text-warning-500 dark:bg-warning-400/10 dark:text-warning-400',
  failed:    'bg-danger-400/15 text-danger-500 dark:bg-danger-400/10 dark:text-danger-400',
  dead:      'bg-danger-400/15 text-danger-500 dark:bg-danger-400/10 dark:text-danger-400',
  offline:   'bg-surface-200 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
};

export default function StatusBadge({ status }) {
  const s = (status ?? '').toLowerCase();
  const cls = STATUS_STYLES[s] ?? 'bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-400';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}
