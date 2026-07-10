import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const LOG_LEVEL_STYLES = {
  info:  'bg-info-400/15 text-secondary dark:bg-info-400/10 dark:text-info-400',
  warn:  'bg-warning-400/15 text-tertiary dark:bg-warning-400/10 dark:text-warning-400',
  error: 'bg-danger-400/15 text-error dark:bg-danger-400/10 dark:text-error',
};

export default function JobDetailModal({ jobId, onClose }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/api/jobs/${jobId}`);
        setJob(res.data.data);
      } catch {
        /* interceptor handles 401, rest is silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-outline-variant dark:bg-surface-container-lowest">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4 dark:border-outline-variant">
          <h2 className="text-lg font-bold text-surface-900 dark:text-on-surface">Job Detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-container-high dark:hover:text-surface-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !job ? (
          <div className="px-6 py-10 text-center text-on-surface-variant">Failed to load job details.</div>
        ) : (
          <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
            {/* ── Job Info ──────────────────────────────────────────────── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline dark:text-on-surface-variant">
                Job Info
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <InfoItem label="ID" value={job.id} mono />
                <InfoItem label="Type" value={job.type} />
                <InfoItem label="Status">
                  <StatusBadge status={job.status} />
                </InfoItem>
                <InfoItem label="Attempts" value={job.attempt_count} />
                <InfoItem label="Priority" value={job.priority} />
                <InfoItem label="Created" value={fmt(job.created_at)} />
                {job.scheduled_at && <InfoItem label="Scheduled" value={fmt(job.scheduled_at)} />}
              </div>
            </section>

            {/* ── Payload ──────────────────────────────────────────────── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline dark:text-on-surface-variant">
                Payload
              </h3>
              <pre className="max-h-52 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-xs leading-relaxed text-surface-700 dark:border-outline-variant dark:bg-surface-container-high dark:text-on-surface-variant">
                {job.payload ? JSON.stringify(job.payload, null, 2) : '(empty)'}
              </pre>
            </section>

            {/* ── Execution History ────────────────────────────────────── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline dark:text-on-surface-variant">
                Execution History
              </h3>
              {job.executions?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-outline-variant">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-50 dark:bg-surface-container-high/50">
                      <tr>
                        {['Attempt #', 'Worker', 'Status', 'Started', 'Finished', 'Error'].map((h) => (
                          <th key={h} className="px-4 py-2.5 font-medium text-outline dark:text-on-surface-variant">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                      {job.executions.map((ex) => (
                        <tr key={ex.id} className="transition hover:bg-surface-50 dark:hover:bg-surface-container-high/40">
                          <td className="px-4 py-2.5 font-semibold text-surface-900 dark:text-on-surface">{ex.attempt_number}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px] text-outline dark:text-on-surface-variant">
                            {ex.worker_id ? `${ex.worker_id.slice(0, 8)}…` : '—'}
                          </td>
                          <td className="px-4 py-2.5"><StatusBadge status={ex.status} /></td>
                          <td className="px-4 py-2.5 text-outline dark:text-on-surface-variant">{fmt(ex.started_at)}</td>
                          <td className="px-4 py-2.5 text-outline dark:text-on-surface-variant">{fmt(ex.finished_at)}</td>
                          <td className="max-w-[200px] truncate px-4 py-2.5 text-error dark:text-error" title={ex.error_message}>
                            {ex.error_message || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No executions yet.</p>
              )}
            </section>

            {/* ── Logs ─────────────────────────────────────────────────── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline dark:text-on-surface-variant">
                Logs
              </h3>
              {job.logs?.length > 0 ? (
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-outline-variant dark:bg-surface-container-high">
                  {job.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          LOG_LEVEL_STYLES[log.level] ?? LOG_LEVEL_STYLES.info
                        }`}
                      >
                        {log.level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-relaxed text-surface-700 dark:text-on-surface-variant">{log.message}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">{fmt(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No log entries.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────────────────────────── */

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function InfoItem({ label, value, mono, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-outline dark:text-on-surface-variant">{label}</p>
      {children ?? (
        <p className={`mt-0.5 text-sm text-surface-900 dark:text-on-surface ${mono ? 'font-mono text-xs break-all' : ''}`}>
          {value ?? '—'}
        </p>
      )}
    </div>
  );
}
