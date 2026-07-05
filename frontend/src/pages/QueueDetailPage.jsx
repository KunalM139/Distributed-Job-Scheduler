import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import JobDetailModal from '../components/JobDetailModal';
import useSocketEvent from '../hooks/useSocketEvent';
import toast from 'react-hot-toast';

const EMPTY_JOB = { type: '', payload: '{}', priority: 0, scheduled_at: '', cron_expression: '' };

export default function QueueDetailPage() {
  const { id } = useParams();
  const [queueInfo, setQueueInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'create'
  const [form, setForm] = useState({ ...EMPTY_JOB });
  const [creating, setCreating] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const limit = 20;

  const fetchJobs = useCallback(async () => {
    try {
      let url = `/api/queues/${id}/jobs?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const [jobsRes, statsRes] = await Promise.all([
        api.get(url),
        api.get(`/api/queues/${id}/stats`),
      ]);

      setJobs(jobsRes.data.data);
      setTotal(jobsRes.data.total);
      setStats(statsRes.data.data.stats);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [id, page, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Re-fetch when socket events indicate job state changes
  useSocketEvent('job:created', () => fetchJobs());
  useSocketEvent('job:updated', () => fetchJobs());
  useSocketEvent('job:deleted', () => fetchJobs());

  // Fetch queue config once
  useEffect(() => {
    (async () => {
      try {
        // We can get queue info from any project — just list queues from stats endpoint
        // Actually we'll grab it from the jobs response context. For now, set id.
        setQueueInfo({ id });
      } catch {
        /* ignore */
      }
    })();
  }, [id]);

  const handleCreateJob = async () => {
    if (!form.type.trim()) {
      toast.error('Job type is required');
      return;
    }
    let payload;
    try {
      payload = JSON.parse(form.payload);
    } catch {
      toast.error('Invalid JSON payload');
      return;
    }

    setCreating(true);
    try {
      const body = {
        type: form.type,
        payload,
        priority: form.priority,
      };
      if (form.scheduled_at) body.scheduled_at = new Date(form.scheduled_at).toISOString();
      if (form.cron_expression.trim()) body.cron_expression = form.cron_expression.trim();

      await api.post(`/api/queues/${id}/jobs`, body);
      toast.success(form.cron_expression ? 'Scheduled job created' : 'Job created');
      setForm({ ...EMPTY_JOB });
      setActiveTab('jobs');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await api.post(`/api/jobs/${jobId}/retry`);
      toast.success('Job re-queued');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    }
  };

  const handleDelete = async (jobId) => {
    try {
      await api.delete(`/api/jobs/${jobId}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
      {/* Header */}
      <div>
        <Link to="/queues" className="text-xs font-medium text-accent-500 hover:underline dark:text-accent-400">
          ← Back to Queues
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">Queue Detail</h1>
        <p className="mt-0.5 font-mono text-xs text-surface-400">{id}</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 dark:border-surface-800 dark:bg-surface-900">
              <StatusBadge status={status} />
              <span className="text-lg font-bold text-surface-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'jobs'
              ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-white'
              : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
          }`}
        >
          Jobs
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'create'
              ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-white'
              : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
          }`}
        >
          Create Job
        </button>
      </div>

      {/* ── Jobs Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
            >
              <option value="">All</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/50">
                  <tr>
                    {['ID', 'Type', 'Status', 'Priority', 'Created At', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-surface-400">No jobs found</td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="transition cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/40"
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-surface-500 dark:text-surface-400" title={job.id}>
                          {job.id.slice(0, 8)}…
                        </td>
                        <td className="px-5 py-3 font-medium text-surface-900 dark:text-white">{job.type}</td>
                        <td className="px-5 py-3"><StatusBadge status={job.status} /></td>
                        <td className="px-5 py-3 text-surface-600 dark:text-surface-300">{job.priority}</td>
                        <td className="px-5 py-3 text-xs text-surface-500 dark:text-surface-400">
                          {new Date(job.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            {['failed', 'dead'].includes(job.status) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRetry(job.id); }}
                                className="rounded-lg bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-600 transition hover:bg-accent-500/20 dark:text-accent-400"
                              >
                                Retry
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                              className="rounded-lg bg-danger-400/10 px-2.5 py-1 text-xs font-semibold text-danger-500 transition hover:bg-danger-400/20"
                            >
                              Delete
                            </button>
                          </div>
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
                  Page {page} of {totalPages} · {total} total jobs
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
        </>
      )}

      {/* ── Create Job Tab ────────────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <h3 className="mb-5 text-sm font-semibold text-surface-700 dark:text-surface-300">New Job</h3>

          <div className="space-y-4">
            {/* Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Type</label>
              <input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                placeholder="send-email"
              />
            </div>

            {/* Payload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Payload (JSON)</label>
              <textarea
                rows={4}
                value={form.payload}
                onChange={(e) => setForm({ ...form, payload: e.target.value })}
                className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 font-mono text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                placeholder='{"to": "user@example.com", "subject": "Hello"}'
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Priority */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                />
              </div>

              {/* Scheduled at */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Scheduled At <span className="text-xs text-surface-400">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                />
              </div>

              {/* Cron expression */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Cron Expression <span className="text-xs text-surface-400">(optional)</span>
                </label>
                <input
                  value={form.cron_expression}
                  onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 font-mono text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                  placeholder="*/5 * * * *"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateJob}
            disabled={creating}
            className="mt-6 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent-500/25 transition hover:from-accent-600 hover:to-accent-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Job'}
          </button>
        </div>
      )}

      {/* Modal */}
      <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
    </div>
  );
}
