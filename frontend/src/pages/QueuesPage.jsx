import { useEffect, useState } from 'react';
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
  const [projects, setProjects] = useState([]);
  const [queues, setQueues] = useState([]); // flat list
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({ ...EMPTY_QUEUE });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, []);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Queues</h1>
        <button
          onClick={openModal}
          className="rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent-500/25 transition hover:from-accent-600 hover:to-accent-700"
        >
          + Create Queue
        </button>
      </div>

      {/* Queues table */}
      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/50">
              <tr>
                {['Name', 'Project', 'Priority', 'Concurrency Limit', 'Retry', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {queues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-surface-400">
                    No queues yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                queues.map((q) => (
                  <tr key={q.id} className="transition hover:bg-surface-50 dark:hover:bg-surface-800/40">
                    <td className="px-5 py-3">
                      <Link
                        to={`/queues/${q.id}`}
                        className="font-semibold text-accent-600 hover:underline dark:text-accent-400"
                      >
                        {q.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-surface-500 dark:text-surface-400">{q.project_name}</td>
                    <td className="px-5 py-3 text-surface-600 dark:text-surface-300">{q.priority}</td>
                    <td className="px-5 py-3 text-surface-600 dark:text-surface-300">{q.concurrency_limit}</td>
                    <td className="px-5 py-3 text-xs text-surface-500 dark:text-surface-400">
                      {q.strategy ? (
                        <span className="rounded bg-surface-100 px-2 py-0.5 dark:bg-surface-800">
                          {q.strategy} · {q.max_attempts}× · {q.delay_seconds}s
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {q.status === 'active' ? (
                          <button
                            onClick={() => handlePause(q.id)}
                            className="rounded-lg bg-warning-400/15 px-3 py-1 text-xs font-semibold text-warning-500 transition hover:bg-warning-400/25"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResume(q.id)}
                            className="rounded-lg bg-success-400/15 px-3 py-1 text-xs font-semibold text-success-500 transition hover:bg-success-400/25"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-700 dark:bg-surface-900">
            <h2 className="mb-5 text-lg font-bold text-surface-900 dark:text-white">Create Queue</h2>

            <div className="space-y-4">
              {/* Project selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Queue Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                  placeholder="email-notifications"
                />
              </div>

              {/* Priority + Concurrency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Concurrency Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.concurrency_limit}
                    onChange={(e) => setForm({ ...form, concurrency_limit: Number(e.target.value) })}
                    className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Retry policy section */}
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Retry Policy
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Strategy</label>
                    <select
                      value={form.retry_policy.strategy}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          retry_policy: { ...form.retry_policy, strategy: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="linear">Linear</option>
                      <option value="exponential">Exponential</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Max Attempts</label>
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
                      className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Delay (seconds)</label>
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
                      className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-600 transition hover:bg-surface-100 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
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
