import { useState } from 'react';
import api from '../services/api';
import usePolling from '../hooks/usePolling';
import useSocketEvent from '../hooks/useSocketEvent';
import StatusBadge from '../components/StatusBadge';

export default function WorkersPage() {
  const [now, setNow] = useState(Date.now());
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Live tick for "X seconds ago" — runs every 1 s
  useState(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  });

  // Listen for real-time worker updates
  useSocketEvent('worker:updated', () => {
    setRefreshSignal((n) => n + 1);
  });
  useSocketEvent('stats:refresh', () => {
    setRefreshSignal((n) => n + 1);
  });

  const fetchWorkers = async () => {
    const res = await api.get('/api/workers');
    return res.data.data;
  };

  const { data: workers, loading } = usePolling(fetchWorkers, 10_000, refreshSignal);

  const timeAgo = (ts) => {
    if (!ts) return '—';
    const seconds = Math.floor((now - new Date(ts).getTime()) / 1000);
    if (seconds < 0) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  const list = workers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Workers</h1>
        <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-300">
          {list.length} registered
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white px-5 py-10 text-center dark:border-surface-800 dark:bg-surface-900">
          <p className="text-surface-500 dark:text-surface-400">
            No workers registered yet. Start one with{' '}
            <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs dark:bg-surface-800">npm run worker</code>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/50">
                <tr>
                  {['Hostname', 'Status', 'Current Jobs', 'Last Heartbeat', 'Registered At'].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {list.map((w) => {
                  const heartbeatAge = w.last_heartbeat_at
                    ? Math.floor((now - new Date(w.last_heartbeat_at).getTime()) / 1000)
                    : null;
                  const isStale = heartbeatAge !== null && heartbeatAge > 45;

                  return (
                    <tr key={w.id} className="transition hover:bg-surface-50 dark:hover:bg-surface-800/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              w.status === 'offline'
                                ? 'bg-surface-400'
                                : isStale
                                  ? 'bg-danger-400'
                                  : 'bg-success-400 animate-pulse'
                            }`}
                          />
                          <span className="font-semibold text-surface-900 dark:text-white">{w.hostname}</span>
                        </div>
                        <p className="mt-0.5 pl-5 font-mono text-[10px] text-surface-400 dark:text-surface-600">
                          {w.id}
                        </p>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={w.status} /></td>
                      <td className="px-5 py-3">
                        <span className={`text-lg font-bold ${w.current_job_count > 0 ? 'text-info-500' : 'text-surface-400'}`}>
                          {w.current_job_count}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm ${isStale ? 'font-medium text-danger-500' : 'text-surface-600 dark:text-surface-300'}`}>
                          {timeAgo(w.last_heartbeat_at)}
                        </span>
                        {isStale && (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-danger-400">stale</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-surface-500 dark:text-surface-400">
                        {new Date(w.registered_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
