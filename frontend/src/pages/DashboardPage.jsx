import { useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import usePolling from '../hooks/usePolling';
import useSocketEvent from '../hooks/useSocketEvent';
import StatusBadge from '../components/StatusBadge';

const STATUS_COLORS = {
  queued: '#3b82f6',
  running: '#f59e0b',
  completed: '#22c55e',
  failed: '#ef4444',
  scheduled: '#8b5cf6',
};

export default function DashboardPage() {
  const [throughputHistory, setThroughputHistory] = useState([]);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Listen for real-time nudges from Socket.IO
  useSocketEvent('stats:refresh', () => {
    setRefreshSignal((n) => n + 1);
  });

  const fetchStats = async () => {
    const res = await api.get('/api/stats');
    const data = res.data.data;

    // Append to throughput time-series
    setThroughputHistory((prev) => {
      const next = [
        ...prev,
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          completed: data.throughput_last_hour ?? 0,
          failed: data.failed_last_hour ?? 0,
        },
      ];
      return next.slice(-30); // keep last 30 data points (~5 min at 10 s)
    });

    return data;
  };

  const { data: stats, loading } = usePolling(fetchStats, 10_000, refreshSignal);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-surface-500 dark:text-surface-400">Failed to load dashboard stats.</p>;
  }

  // ── Bar chart data: jobs by status ──────────────────────────────────────
  const jobsByStatusData = Object.entries(stats.jobs_by_status || {}).map(([status, count]) => ({
    status,
    count,
    fill: STATUS_COLORS[status] || '#64748b',
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Dashboard</h1>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Jobs"
          value={stats.total_jobs}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
          iconBg="bg-accent-500/10 text-accent-500 dark:bg-accent-400/10 dark:text-accent-400"
        />
        <StatCard
          label="Active Workers"
          value={stats.active_workers}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
          }
          iconBg="bg-info-400/10 text-info-500 dark:bg-info-400/10 dark:text-info-400"
        />
        <StatCard
          label="Completed / hr"
          value={stats.throughput_last_hour}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-success-400/10 text-success-500 dark:bg-success-400/10 dark:text-success-400"
          valueColor="text-success-500"
        />
        <StatCard
          label="Failed / hr"
          value={stats.failed_last_hour}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
          iconBg="bg-danger-400/10 text-danger-500 dark:bg-danger-400/10 dark:text-danger-400"
          valueColor="text-danger-500"
        />
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs by Status — BarChart */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold text-surface-700 dark:text-surface-300">Jobs by Status</h2>
          {jobsByStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={jobsByStatusData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.15} />
                <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#334155', strokeOpacity: 0.2 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: '#f1f5f9', fontSize: '0.8rem' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Jobs">
                  {jobsByStatusData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-surface-400">No job data yet</p>
          )}
        </div>

        {/* Throughput over time — LineChart */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Throughput (Live)</h2>
            <span className="flex items-center gap-1.5 text-xs text-surface-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success-400" />
              Polling every 10s
            </span>
          </div>
          {throughputHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={throughputHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#334155', strokeOpacity: 0.2 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: '#f1f5f9', fontSize: '0.8rem' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Completed / hr" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Failed / hr" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-surface-400">Collecting data… next point in 10 s</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Queues Summary Table ──────────────────────────────────────────── */}
      {stats.queues_summary?.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Queues Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-t border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/50">
                <tr>
                  {['Queue Name', 'Total', 'Pending', 'Running', 'Failed'].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {stats.queues_summary.map((q, i) => (
                  <tr key={i} className="transition hover:bg-surface-50 dark:hover:bg-surface-800/40">
                    <td className="px-5 py-3 font-medium text-surface-900 dark:text-white">{q.queue_name}</td>
                    <td className="px-5 py-3 text-surface-600 dark:text-surface-300">{q.total_jobs}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5"><StatusBadge status="queued" />{q.pending}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5"><StatusBadge status="running" />{q.running}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5"><StatusBadge status="failed" />{q.failed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stat Card component ──────────────────────────────────────────────────── */

function StatCard({ label, value, icon, iconBg, valueColor }) {
  return (
    <div className="glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-500/10 dark:hover:shadow-accent-500/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-3xl font-extrabold tracking-tight ${valueColor ?? 'text-surface-900 dark:text-white'}`}>
        {value ?? 0}
      </p>
    </div>
  );
}
