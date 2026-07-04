import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DeadLetterPage() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchDLQ = useCallback(async () => {
    try {
      const res = await api.get(`/api/dlq?page=${page}&limit=${limit}`);
      setEntries(res.data.data);
      setTotal(res.data.total);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchDLQ(); }, [fetchDLQ]);

  const handleRetry = async (id) => {
    try {
      await api.post(`/api/dlq/${id}/retry`);
      toast.success('Job re-queued from dead-letter queue');
      fetchDLQ();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Dead Letter Queue</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Jobs that exhausted all retry attempts
          </p>
        </div>
        <span className="rounded-full bg-danger-400/15 px-3.5 py-1.5 text-sm font-bold text-danger-500 dark:text-danger-400">
          {total} {total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/50">
              <tr>
                {['Job ID', 'Type', 'Queue', 'Total Attempts', 'Failure Reason', 'Failed At', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-surface-400">
                    <span className="text-2xl">🎉</span>
                    <p className="mt-2">No dead-letter entries — all clear!</p>
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="transition hover:bg-surface-50 dark:hover:bg-surface-800/40">
                    <td className="px-5 py-3 font-mono text-xs text-surface-500 dark:text-surface-400" title={e.job_id}>
                      {e.job_id?.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 font-medium text-surface-900 dark:text-white">
                      {e.job_type || '—'}
                    </td>
                    <td className="px-5 py-3 text-surface-600 dark:text-surface-300">
                      {e.queue_name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-danger-400/10 px-2 py-0.5 text-xs font-bold text-danger-500 dark:text-danger-400">
                        {e.total_attempts}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-xs text-danger-500 dark:text-danger-400" title={e.failure_reason}>
                      {e.failure_reason}
                    </td>
                    <td className="px-5 py-3 text-xs text-surface-500 dark:text-surface-400">
                      {new Date(e.failed_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleRetry(e.id)}
                        className="rounded-lg bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-600 transition hover:bg-accent-500/20 dark:text-accent-400"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3 dark:border-surface-800">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-surface-300 px-3 py-1 text-xs font-medium transition hover:bg-surface-100 disabled:opacity-40 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-surface-300 px-3 py-1 text-xs font-medium transition hover:bg-surface-100 disabled:opacity-40 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
