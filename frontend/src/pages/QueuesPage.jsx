import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

const EMPTY_QUEUE = {
  name: '',
  priority: 0,
  concurrency_limit: 5,
  retry_policy: {
    strategy: 'fixed',
    max_attempts: 3,
    delay_seconds: 5,
    backoff_multiplier: 2.0,
  },
};

export default function QueuesPage() {
  const { socket } = useSocket();
  const [projects, setProjects] = useState([]);
  const [queues, setQueues] = useState([]); // flat list
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({ ...EMPTY_QUEUE });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const projRes = await api.get('/api/projects');
      const projs = projRes.data.data;
      setProjects(projs);

      // Fetch queues for every project and flatten
      const allQueues = [];
      await Promise.all(
        projs.map(async (p) => {
          const qRes = await api.get(`/api/projects/${p.id}/queues`);
          qRes.data.data.forEach((q) => allQueues.push({ ...q, project_name: p.name, project_id: p.id }));
        })
      );
      setQueues(allQueues);

      // Default selected project
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    const handleEvent = () => fetchData();
    socket.on('QUEUE_CREATED', handleEvent);
    socket.on('QUEUE_UPDATED', handleEvent);
    return () => {
      socket.off('QUEUE_CREATED', handleEvent);
      socket.off('QUEUE_UPDATED', handleEvent);
    };
  }, [socket, fetchData]);

  const openModal = () => {
    setForm({ ...EMPTY_QUEUE });
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedProjectId) {
      toast.error('Select a project first');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Queue name is required');
      return;
    }

    setCreating(true);
    try {
      await api.post(`/api/projects/${selectedProjectId}/queues`, {
        name: form.name,
        priority: form.priority,
        concurrency_limit: form.concurrency_limit,
        retry_policy: form.retry_policy,
      });
      toast.success('Queue created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create queue');
    } finally {
      setCreating(false);
    }
  };

  const handlePause = async (id) => {
    try {
      await api.post(`/api/queues/${id}/pause`);
      toast.success('Queue paused');
      fetchData();
    } catch {
      toast.error('Failed to pause queue');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.post(`/api/queues/${id}/resume`);
      toast.success('Queue resumed');
      fetchData();
    } catch {
      toast.error('Failed to resume queue');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 bg-background min-h-screen text-on-surface">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">Queues</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">Manage and monitor job queues across your projects.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Queue
        </button>
      </div>

      {/* Queues table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-background border-b border-outline-variant">
              <tr>
                {['Name', 'Project', 'Priority', 'Concurrency', 'Retry', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {queues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-on-surface-variant">
                    No queues yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                queues.map((q) => (
                  <tr key={q.id} className="transition-colors hover:bg-surface-container-high">
                    <td className="px-5 py-3">
                      <Link
                        to={`/queues/${q.id}`}
                        className="font-semibold text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-2"
                      >
                        {q.name}
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-on-surface">{q.project_name}</td>
                    <td className="px-5 py-3 font-mono text-[13px] text-on-surface-variant">{q.priority}</td>
                    <td className="px-5 py-3 font-mono text-[13px] text-on-surface-variant">{q.concurrency_limit}</td>
                    <td className="px-5 py-3 font-mono text-[13px] text-on-surface-variant">
                      {q.strategy ? (
                        <span className="rounded bg-surface-container-high border border-outline-variant px-2 py-0.5">
                          {q.strategy} · {q.max_attempts}× · {q.delay_seconds}s
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className={`inline-flex items-center gap-1.5 border rounded-full px-2 py-0.5 ${
                        q.status === 'active' 
                          ? 'bg-surface-container-high border-outline-variant text-primary' 
                          : 'bg-tertiary/10 border-tertiary/20 text-tertiary'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${q.status === 'active' ? 'bg-primary animate-pulse' : 'bg-tertiary'}`}></div>
                        <span className="text-[11px] font-medium tracking-wide uppercase">
                          {q.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {q.status === 'active' ? (
                          <button
                            onClick={() => handlePause(q.id)}
                            className="rounded-lg border border-outline-variant bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-3 py-1 text-[13px] font-semibold transition-colors"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResume(q.id)}
                            className="rounded-lg border border-outline-variant bg-transparent text-on-surface hover:border-primary px-3 py-1 text-[13px] font-semibold transition-colors"
                          >
                            Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Queue Modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          {/* Panel */}
          <div className="relative bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
              <h2 className="text-[16px] font-semibold text-on-surface">Create New Queue</h2>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 bg-background">
              {/* Project selector */}
              <div>
                <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Queue Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600"
                  placeholder="email-notifications"
                />
              </div>

              {/* Priority + Concurrency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600"
                  />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Concurrency Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.concurrency_limit}
                    onChange={(e) => setForm({ ...form, concurrency_limit: Number(e.target.value) })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600"
                  />
                </div>
              </div>

              {/* Retry policy section */}
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  Retry Policy
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Strategy</label>
                    <select
                      value={form.retry_policy.strategy}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          retry_policy: { ...form.retry_policy, strategy: e.target.value },
                        })
                      }
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="linear">Linear</option>
                      <option value="exponential">Exponential</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Max Attempts</label>
                    <input
                      type="number"
                      min={1}
                      value={form.retry_policy.max_attempts}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          retry_policy: { ...form.retry_policy, max_attempts: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Delay (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.retry_policy.delay_seconds}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          retry_policy: { ...form.retry_policy, delay_seconds: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Queue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
