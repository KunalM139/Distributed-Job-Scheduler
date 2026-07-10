import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import JobDetailModal from '../components/JobDetailModal';
import toast from 'react-hot-toast';

const EMPTY_JOB = { type: '', payload: '{}', priority: 0, scheduled_at: '', cron_expression: '' };

export default function QueueDetailPage() {
  const { id } = useParams();
  const [queueInfo, setQueueInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_JOB });
  const [creating, setCreating] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const limit = 20;

  const fetchJobs = useCallback(async () => {
    try {
      let url = `/api/queues/${id}/jobs?page=${page}&limit=${limit}`;
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
  }, [id, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Fetch full queue info by scanning projects
  useEffect(() => {
    (async () => {
      try {
        const projRes = await api.get('/api/projects');
        const projs = projRes.data.data;
        let found = null;
        for (const p of projs) {
          const qRes = await api.get(`/api/projects/${p.id}/queues`);
          const match = qRes.data.data.find(q => q.id === id);
          if (match) {
            found = { ...match, project_name: p.name };
            break;
          }
        }
        if (found) {
          setQueueInfo(found);
        } else {
          setQueueInfo({ id, name: 'Unknown Queue', status: 'unknown' });
        }
      } catch {
        setQueueInfo({ id, name: id, status: 'unknown' });
      }
    })();
  }, [id]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
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
      setIsCreateModalOpen(false);
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

  const handleTogglePause = async () => {
    if (!queueInfo) return;
    try {
      if (queueInfo.status === 'active') {
        await api.post(`/api/queues/${id}/pause`);
        toast.success('Queue paused');
        setQueueInfo({ ...queueInfo, status: 'paused' });
      } else {
        await api.post(`/api/queues/${id}/resume`);
        toast.success('Queue resumed');
        setQueueInfo({ ...queueInfo, status: 'active' });
      }
      fetchJobs();
    } catch {
      toast.error('Failed to toggle queue status');
    }
  };

  const totalPages = Math.ceil(total / limit);
  const filteredJobs = jobs.filter(j => j.id.toLowerCase().includes(search.toLowerCase()) || j.type.toLowerCase().includes(search.toLowerCase()));

  if (loading || !queueInfo) {
    return (
      <div className="flex flex-col p-6 max-w-[1600px] mx-auto w-full gap-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // Calculate active jobs for the concurrency bar
  const runningJobs = stats?.running || 0;
  const utilization = queueInfo.concurrency_limit ? Math.round((runningJobs / queueInfo.concurrency_limit) * 100) : 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 bg-background min-h-screen text-on-surface selection:bg-primary/20 selection:text-on-surface">
      {/* Queue Detail Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold mb-2">
            <Link className="hover:text-primary transition-colors" to="/queues">QUEUES</Link>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-on-surface">{queueInfo.name?.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">{queueInfo.name || id}</h1>
            {/* Live Indicator & Status Badge */}
            <div className={`flex items-center gap-2 border rounded-full px-3 py-1 ${
              queueInfo.status === 'active' 
                ? 'bg-surface-container-high border-outline-variant text-primary' 
                : 'bg-tertiary/10 border-tertiary/20 text-tertiary'
            }`}>
              <div className={`w-2 h-2 rounded-full ${queueInfo.status === 'active' ? 'bg-primary animate-pulse' : 'bg-tertiary'}`}></div>
              <span className="text-[12px] font-medium tracking-wide">
                {queueInfo.status === 'active' ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleTogglePause}
            className="px-4 py-2 rounded-lg border border-outline-variant bg-transparent text-on-surface text-[16px] font-semibold hover:border-primary transition-colors flex items-center gap-2"
          >
            {queueInfo.status === 'active' ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>
                Pause Queue
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                Resume Queue
              </>
            )}
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-on-surface text-[16px] font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Job
          </button>
        </div>
      </div>

      {/* Configuration Cards (Bento style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Card 1: Concurrency */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-surface-500 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(174,198,255,0.1)]" tabIndex="0">
          <div className="flex items-center gap-2 text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            CONCURRENCY
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[32px] leading-none font-bold text-on-surface">{runningJobs}</span>
            <span className="text-on-surface-variant text-[14px] mb-1">/ {queueInfo.concurrency_limit} max</span>
          </div>
          <div className="mt-auto w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${utilization > 90 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
          </div>
          <div className="text-xs text-on-surface-variant mt-1 text-right">{utilization}% utilization</div>
        </div>

        {/* Card 2: Priority */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-surface-500 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(174,198,255,0.1)]" tabIndex="0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              PRIORITY LEVEL
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-tertiary text-[24px] font-semibold">
              {queueInfo.priority > 5 ? 'High' : queueInfo.priority > 0 ? 'Medium' : 'Standard'} ({queueInfo.priority || 0})
            </span>
          </div>
          <div className="mt-auto text-xs text-on-surface-variant bg-surface-container-high p-2 rounded border border-outline-variant">
            Higher values indicate higher precedence in the scheduler.
          </div>
        </div>

        {/* Card 3: Retry Policy */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-surface-500 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(174,198,255,0.1)]" tabIndex="0">
          <div className="flex items-center gap-2 text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            RETRY POLICY
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-sm">Max Attempts:</span>
              <span className="text-[16px] font-semibold text-on-surface">{queueInfo.max_attempts || 3}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-sm">Strategy:</span>
              <span className="font-mono text-[13px] text-primary">{queueInfo.strategy || 'fixed'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-sm">Base Delay:</span>
              <span className="font-mono text-[13px] text-on-surface">{(queueInfo.delay_seconds || 5) * 1000}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job List Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col flex-1 overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-4 border-b border-outline-variant flex flex-wrap justify-between items-center bg-background gap-4">
          <h2 className="text-[16px] font-semibold text-on-surface flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            Jobs
            <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-xs ml-2">{total}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 border border-outline-variant rounded-lg bg-surface-container-lowest focus-within:border-primary transition-colors flex items-center px-3 py-1">
              <svg className="text-on-surface-variant mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm text-on-surface w-full placeholder-surface-500 p-0 m-0 outline-none" 
                placeholder="Search Job ID or Type..." 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="p-1.5 rounded-lg border border-outline-variant bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" title="Filter">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0">JOB ID</th>
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0">TYPE</th>
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0">STATUS</th>
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0">PRIORITY</th>
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0">ATTEMPTS</th>
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0">CREATED AT</th>
                <th className="py-3 px-4 text-[12px] uppercase tracking-widest font-semibold text-outline sticky top-0 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700 text-[14px]">
              {filteredJobs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No jobs found in this queue.</td></tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-surface-container-high transition-colors group cursor-pointer h-12" onClick={() => setSelectedJobId(job.id)}>
                    <td className="py-3 px-4 font-mono text-[13px] text-primary" title={job.id}>{job.id.slice(0, 8)}…</td>
                    <td className="py-3 px-4 text-on-surface">{job.type}</td>
                    <td className="py-3 px-4">
                      {job.status === 'running' ? (
                        <div className="inline-flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded text-primary text-[12px] font-medium border border-primary/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Running
                        </div>
                      ) : job.status === 'queued' || job.status === 'scheduled' ? (
                        <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded text-on-surface-variant text-[12px] font-medium border border-outline-variant">
                          <div className="w-1.5 h-1.5 rounded-full bg-surface-500"></div> {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </div>
                      ) : job.status === 'failed' || job.status === 'dead' ? (
                        <div className="inline-flex items-center gap-1.5 bg-error/10 px-2 py-1 rounded text-error text-[12px] font-medium border border-error/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-error"></div> {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-[#85d19b]/10 px-2 py-1 rounded text-[#85d19b] text-[12px] font-medium border border-[#85d19b]/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#85d19b]"></div> Completed
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono text-[13px]">{job.priority}</td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono text-[13px]">{job.attempts || 0}/{queueInfo.max_attempts || 3}</td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono text-[13px]">{new Date(job.created_at).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {['failed', 'dead'].includes(job.status) && (
                          <button onClick={(e) => { e.stopPropagation(); handleRetry(job.id); }} className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-700 transition-colors" title="Retry">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }} className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-surface-700 transition-colors" title="Delete">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-outline-variant bg-background flex justify-between items-center text-sm text-on-surface-variant">
            <div>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} jobs</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 text-on-surface transition-colors">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 text-on-surface transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-surface-container-lowest w-full max-w-xl rounded-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
              <h2 className="text-[16px] font-semibold text-on-surface">Create New Job</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="p-6 space-y-4 bg-background">
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Job Type</label>
                  <input 
                    required
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600" 
                    placeholder="e.g. DataIngestWorker" 
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Payload (JSON)</label>
                  <textarea 
                    required
                    value={form.payload}
                    onChange={e => setForm({...form, payload: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600 font-mono resize-y" 
                    placeholder="{}" 
                    rows="4"
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Priority</label>
                    <input 
                      type="number"
                      value={form.priority}
                      onChange={e => setForm({...form, priority: parseInt(e.target.value) || 0})}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Scheduled At <span className="lowercase font-normal text-outline">(opt)</span></label>
                    <input 
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={e => setForm({...form, scheduled_at: e.target.value})}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Cron <span className="lowercase font-normal text-outline">(opt)</span></label>
                    <input 
                      type="text"
                      value={form.cron_expression}
                      onChange={e => setForm({...form, cron_expression: e.target.value})}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600 font-mono" 
                      placeholder="*/5 * * * *"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
    </div>
  );
}
