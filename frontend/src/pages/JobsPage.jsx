import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import JobDetailModal from '../components/JobDetailModal';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const { socket } = useSocket();
  const [jobs, setJobs] = useState([]);
  const [queues, setQueues] = useState([]); // for filters & create modal
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [queueFilter, setQueueFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(''); // client-side

  // Modal
  const [selectedJobId, setSelectedJobId] = useState(null);

  const limit = 20;

  const fetchJobs = useCallback(async () => {
    try {
      let url = `/api/jobs?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (queueFilter) url += `&queue_id=${queueFilter}`;
      if (search) url += `&search=${search}`;

      const res = await api.get(url);
      setJobs(res.data.data);
      setTotal(res.data.total);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, queueFilter, search]);

  useEffect(() => {
    // Fetch all queues for the filter dropdown
    (async () => {
      try {
        const projRes = await api.get('/api/projects');
        const projs = projRes.data.data;
        const allQueues = [];
        for (const p of projs) {
          const qRes = await api.get(`/api/projects/${p.id}/queues`);
          allQueues.push(...qRes.data.data);
        }
        setQueues(allQueues);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!socket) return;
    const events = ['JOB_CREATED', 'JOB_CLAIMED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_FAILED', 'JOB_RETRIED', 'JOB_MOVED_TO_DLQ', 'JOB_REQUEUED', 'JOB_UPDATED'];
    const handleRefetch = () => fetchJobs();
    events.forEach(e => socket.on(e, handleRefetch));
    return () => events.forEach(e => socket.off(e, handleRefetch));
  }, [socket, fetchJobs]);

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

  // Client side filtering for priority since we didn't add it to backend
  const filteredJobs = jobs.filter(j => {
    if (!priorityFilter) return true;
    if (priorityFilter === 'P0' && j.priority > 5) return true;
    if (priorityFilter === 'P1' && j.priority > 0 && j.priority <= 5) return true;
    if (priorityFilter === 'P2' && j.priority <= 0) return true;
    return false;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 bg-background min-h-screen text-on-surface selection:bg-primary/20 selection:text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-1">Jobs</h2>
          <p className="text-[14px] text-on-surface-variant">Monitor and manage distributed job execution.</p>
        </div>
        <Link 
          to="/jobs/new"
          className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Job
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-accent-500 transition-all text-[14px] placeholder-surface-500" 
            placeholder="Search by Job ID or Type..." 
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={e => { if (e.key === 'Enter') fetchJobs(); }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-[14px] outline-none"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Status: All</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select 
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-[14px] outline-none max-w-[200px] truncate"
            value={queueFilter}
            onChange={e => { setQueueFilter(e.target.value); setPage(1); }}
          >
            <option value="">Queue: All</option>
            {queues.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
          <select 
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-[14px] outline-none"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="">Priority: All</option>
            <option value="P0">P0 - Critical (&gt;5)</option>
            <option value="P1">P1 - High (1-5)</option>
            <option value="P2">P2 - Normal (0)</option>
          </select>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-background border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-lowest">
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Job ID</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Queue</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Type</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Status</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Priority</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline text-right">Attempts</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Worker</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Created At</th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody className="animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant"><td className="p-4" colSpan={9}><div className="h-5 bg-surface-container-high rounded w-full"></div></td></tr>
                ))}
              </tbody>
            ) : (
              <tbody className="text-[14px]">
                {filteredJobs.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-on-surface-variant border-b border-outline-variant">No jobs found.</td></tr>
                ) : (
                  filteredJobs.map(job => {
                    const isFailed = job.status === 'failed' || job.status === 'dead';
                    return (
                      <tr 
                        key={job.id} 
                        className={`border-b border-outline-variant transition-colors group cursor-pointer ${isFailed ? 'hover:bg-error/5 bg-error/5' : 'hover:bg-surface-container-high'}`}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <td className="px-4 py-3 font-mono text-[13px] text-on-surface" title={job.id}>{job.id.slice(0,8)}…</td>
                        <td className="px-4 py-3 text-on-surface-variant">{job.queue_name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-on-surface">{job.type}</td>
                        <td className="px-4 py-3">
                          {job.status === 'running' ? (
                            <div className="inline-flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded text-primary text-[12px] font-medium border border-primary/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Running
                            </div>
                          ) : job.status === 'queued' || job.status === 'scheduled' ? (
                            <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded text-on-surface-variant text-[12px] font-medium border border-outline-variant">
                              <div className="w-1.5 h-1.5 rounded-full bg-surface-500"></div> {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </div>
                          ) : isFailed ? (
                            <div className="inline-flex items-center gap-1.5 bg-error/10 px-2 py-1 rounded text-error text-[12px] font-medium border border-error/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-error"></div> {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 bg-[#85d19b]/10 px-2 py-1 rounded text-[#85d19b] text-[12px] font-medium border border-[#85d19b]/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#85d19b]"></div> Completed
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-on-surface">P{job.priority > 5 ? 0 : job.priority > 0 ? 1 : 2}</td>
                        <td className={`px-4 py-3 text-right ${isFailed ? 'text-error' : 'text-on-surface-variant'}`}>{job.attempts || 0}</td>
                        <td className="px-4 py-3 font-mono text-[13px] text-outline">-</td>
                        <td className="px-4 py-3 text-on-surface-variant">{new Date(job.created_at).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isFailed && (
                              <button onClick={(e) => { e.stopPropagation(); handleRetry(job.id); }} className="p-1 rounded text-outline hover:text-primary hover:bg-primary/20 transition-colors" title="Retry">
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }} className="p-1 rounded text-outline hover:text-error hover:bg-error/20 transition-colors" title="Delete">
                               <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>
        
        {/* Table Footer / Pagination */}
        {totalPages > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-on-surface-variant text-[14px]">
            <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-50">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 rounded hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-50">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Detail Modal */}
      <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
    </div>
  );
}
