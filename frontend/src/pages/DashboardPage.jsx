import { useState, useRef } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import usePolling from '../hooks/usePolling';

const STATUS_COLORS = {
  queued: '#aec6ff',
  running: '#f59e0b',
  completed: '#85d19b',
  failed: '#ffb4ab',
  scheduled: '#dbb8ff',
};

export default function DashboardPage() {
  const [throughputHistory, setThroughputHistory] = useState([]);
  const lastStatsRef = useRef({ completed: null, failed: null });

  const fetchStats = async () => {
    const res = await api.get('/api/stats');
    const data = res.data.data;

    setThroughputHistory((prev) => {
      const next = [
        ...prev,
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          completed: data.throughput_last_hour ?? 0,
          failed: data.failed_last_hour ?? 0,
        },
      ];
      return next.slice(-30); 
    });

    return data;
  };

  const { data: stats, loading } = usePolling(fetchStats, 10_000, ['DASHBOARD_STATS_UPDATED']);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-on-surface-variant p-6">Failed to load dashboard stats.</p>;
  }

  const jobsByStatusData = Object.entries(stats.jobs_by_status || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: STATUS_COLORS[status] || '#8b90a0',
  }));

  // Reusable formatting
  const numFmt = (num) => num > 999 ? (num/1000).toFixed(1) + 'k' : num;

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface">System Overview</h2>
          <p className="text-[14px] text-on-surface-variant mt-1">Real-time monitoring of distributed jobs, queues, and workers.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard 
          label="Total Jobs" 
          value={numFmt(stats.total_jobs)} 
          icon={<svg className="w-4 h-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>} 
        />
        <StatCard 
          label="Queued" 
          value={numFmt(stats.jobs_by_status?.queued || 0)} 
          icon={<svg className="w-4 h-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} 
        />
        <StatCard 
          label="Running" 
          value={numFmt(stats.jobs_by_status?.running || 0)} 
          active={true}
          color="text-primary"
          icon={<span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(174,198,255,0.7)]"></span>} 
        />
        <StatCard 
          label="Completed" 
          value={numFmt(stats.jobs_by_status?.completed || 0)} 
          color="text-[#85d19b]"
          valueColor="text-[#85d19b]"
          icon={<svg className="w-4 h-4 text-[#85d19b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
        />
        <StatCard 
          label="Active Workers" 
          value={stats.active_workers} 
          icon={<svg className="w-4 h-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>} 
        />
        <StatCard 
          label="Throughput (1h)" 
          value={<>{numFmt(stats.throughput_last_hour)}<span className="text-[16px] text-outline font-normal">/h</span></>} 
          icon={<svg className="w-4 h-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
        />
        <StatCard 
          label="Failed (1h)" 
          value={numFmt(stats.failed_last_hour)} 
          color="text-error"
          valueColor="text-error"
          icon={<svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
        />
      </div>

      {/* Bento Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex-1 flex flex-col relative overflow-hidden min-h-[350px]">
            <div 
              className="absolute inset-0 opacity-[0.25] pointer-events-none"
              style={{
                backgroundSize: '20px 20px',
                backgroundImage: 'linear-gradient(to right, rgba(139, 144, 160, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 144, 160, 0.15) 1px, transparent 1px)'
              }}
            ></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-[16px] font-semibold text-on-surface">Throughput (Live)</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#85d19b] animate-pulse"></span>
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-outline">Polling every 10s</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative z-10 w-full h-full">
              {throughputHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={throughputHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#414754" strokeOpacity={0.4} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b90a0' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8b90a0' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #414754', borderRadius: '0.5rem', color: '#e3e2e2' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="completed" stroke="#85d19b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Completed (1h)" />
                    <Line type="monotone" dataKey="failed" stroke="#ffb4ab" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Failed (1h)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-outline-variant">Collecting data… next point in 10 s</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel: Status & Queues */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Job Status Radial */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col min-h-[300px]">
            <h3 className="text-[16px] font-semibold text-on-surface mb-4">Job Status Distribution</h3>
            <div className="flex-1 w-full h-full min-h-[200px]">
              {jobsByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobsByStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {jobsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #414754', borderRadius: '0.5rem', color: '#e3e2e2' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-outline-variant">No job data yet</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-outline-variant">
              {jobsByStatusData.map(status => (
                <div key={status.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.fill }}></div>
                  <span className="text-[13px] text-on-surface">{status.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Queue Summary */}
          {stats.queues_summary?.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <h3 className="text-[16px] font-semibold text-on-surface">Queue Summary</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant">
                      <th className="text-[12px] uppercase tracking-widest font-semibold text-outline px-4 py-2">Queue</th>
                      <th className="text-[12px] uppercase tracking-widest font-semibold text-outline px-4 py-2 text-right">Total</th>
                      <th className="text-[12px] uppercase tracking-widest font-semibold text-outline px-4 py-2 text-right">Pending</th>
                      <th className="text-[12px] uppercase tracking-widest font-semibold text-outline px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-mono">
                    {stats.queues_summary.map((q, i) => (
                      <tr key={i} className="border-b border-outline-variant hover:bg-[#161616] transition-colors">
                        <td className="px-4 py-3 text-on-surface font-sans font-medium">{q.queue_name}</td>
                        <td className="px-4 py-3 text-outline-variant text-right">{numFmt(q.total_jobs)}</td>
                        <td className="px-4 py-3 text-outline-variant text-right">{numFmt(q.pending)}</td>
                        <td className="px-4 py-3 text-center flex justify-center">
                          <QueueStatusBadge pending={q.pending} running={q.running} failed={q.failed} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-outline', valueColor = 'text-on-surface', active = false }) {
  return (
    <div className={`flex flex-col justify-between bg-surface-container-lowest border rounded-lg p-4 transition-all duration-200 hover:border-primary hover:shadow-[0_0_8px_rgba(174,198,255,0.2)] ${active ? 'border-primary/50 relative overflow-hidden' : 'border-outline-variant'}`}>
      {active && <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>}
      <div className="flex items-center gap-2 mb-2 relative z-10">
        {icon}
        <span className={`text-[12px] font-semibold uppercase tracking-widest ${color}`}>{label}</span>
      </div>
      <div className={`text-[32px] font-bold leading-[40px] tracking-tight relative z-10 ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function QueueStatusBadge({ pending, failed }) {
  if (failed > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container/20 text-error border border-error-container/50">
        <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Critical
      </div>
    );
  }
  if (pending > 1000) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary border border-tertiary-container/50">
        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Backlogged
      </div>
    );
  }
  if (pending === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#85d19b]/10 text-[#85d19b] border border-[#85d19b]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#85d19b]"></span> Idle
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#85d19b]/10 text-[#85d19b] border border-[#85d19b]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#85d19b]"></span> Healthy
    </div>
  );
}
