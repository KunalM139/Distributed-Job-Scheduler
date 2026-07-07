/**
 * Reusable status badge with colour coding.
 */

const STATUS_STYLES = {
  active:    'bg-success-500/15 text-success-600 dark:bg-success-400/15 dark:text-success-400 border border-success-500/20',
  idle:      'bg-success-500/15 text-success-600 dark:bg-success-400/15 dark:text-success-400 border border-success-500/20',
  completed: 'bg-success-500/15 text-success-600 dark:bg-success-400/15 dark:text-success-400 border border-success-500/20',
  running:   'bg-info-500/15 text-info-600 dark:bg-info-400/15 dark:text-info-400 border border-info-500/20',
  busy:      'bg-info-500/15 text-info-600 dark:bg-info-400/15 dark:text-info-400 border border-info-500/20',
  queued:    'bg-warning-500/15 text-warning-600 dark:bg-warning-400/15 dark:text-warning-400 border border-warning-500/20',
  scheduled: 'bg-warning-500/15 text-warning-600 dark:bg-warning-400/15 dark:text-warning-400 border border-warning-500/20',
  paused:    'bg-warning-500/15 text-warning-600 dark:bg-warning-400/15 dark:text-warning-400 border border-warning-500/20',
  failed:    'bg-danger-500/15 text-danger-600 dark:bg-danger-400/15 dark:text-danger-400 border border-danger-500/20',
  dead:      'bg-danger-500/15 text-danger-600 dark:bg-danger-400/15 dark:text-danger-400 border border-danger-500/20',
  offline:   'bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-300 dark:border-surface-700',
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
