import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DeadLetterPage() {
  const { socket } = useSocket();
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [aiModalEntry, setAiModalEntry] = useState(null);
  const [search, setSearch] = useState('');
  
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

  useEffect(() => {
    if (!socket) return;
    const events = ['JOB_MOVED_TO_DLQ', 'JOB_REQUEUED'];
    const handleRefetch = () => fetchDLQ();
    events.forEach(e => socket.on(e, handleRefetch));
    return () => events.forEach(e => socket.off(e, handleRefetch));
  }, [socket, fetchDLQ]);

  const handleRetry = async (id) => {
    try {
      await api.post(`/api/dlq/${id}/retry`);
      toast.success('Job re-queued from dead-letter queue');
      fetchDLQ();
      setAiModalEntry(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    }
  };

  const handleRetrySelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      // Retry in parallel or sequentially. We will do it sequentially to avoid rate limiting for now.
      let successCount = 0;
      for (const id of selectedIds) {
        await api.post(`/api/dlq/${id}/retry`);
        successCount++;
      }
      toast.success(`${successCount} jobs re-queued successfully`);
      setSelectedIds(new Set());
      fetchDLQ();
    } catch (err) {
      toast.error('Some retries failed');
      fetchDLQ();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length && entries.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const totalPages = Math.ceil(total / limit);

  // Compute unique queues affected on this page
  const uniqueQueues = useMemo(() => {
    const qSet = new Set(entries.map(e => e.queue_name).filter(Boolean));
    return qSet.size;
  }, [entries]);

  // Filter entries locally based on search
  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const lower = search.toLowerCase();
    return entries.filter(e => 
      (e.job_id && e.job_id.toLowerCase().includes(lower)) || 
      (e.failure_reason && e.failure_reason.toLowerCase().includes(lower))
    );
  }, [entries, search]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 bg-background min-h-screen text-on-surface selection:bg-primary/20 selection:text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-1">Dead Letter Queue</h2>
        <p className="text-on-surface-variant text-[14px]">Inspect permanently failed jobs, analyze failure causes, and retry jobs when appropriate.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-2 shadow-sm">
          <span className="text-[12px] uppercase tracking-widest font-semibold text-outline">Total DLQ Jobs</span>
          <div className="flex items-end gap-3">
            <span className="text-[32px] font-bold text-on-surface leading-tight">{total}</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-2 shadow-sm">
          <span className="text-[12px] uppercase tracking-widest font-semibold text-outline">Queues Affected</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-bold text-on-surface leading-tight">{uniqueQueues}</span>
            <span className="text-outline text-[14px] mb-1.5">on this page</span>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex flex-col gap-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded border border-outline-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
              Filter
            </button>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input 
                className="bg-surface-container-lowest border border-outline-variant rounded pl-9 pr-3 py-1.5 text-[13px] text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-accent-500 outline-none transition-all w-full sm:w-64" 
                placeholder="Search ID or Error..." 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button 
                onClick={handleRetrySelected}
                className="text-[12px] uppercase tracking-widest font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1"
              >
                Retry Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-background border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant">
                  <th className="px-4 py-3 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-outline-variant bg-background text-primary focus:ring-accent-500 focus:ring-offset-surface-900 cursor-pointer" 
                      checked={entries.length > 0 && selectedIds.size === entries.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Job ID</th>
                  <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Queue</th>
                  <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline max-w-[300px]">Failure Reason</th>
                  <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Attempts</th>
                  <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline">Failed At</th>
                  <th className="px-4 py-3 text-[12px] uppercase tracking-widest font-semibold text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-on-surface">
                {loading ? (
                  <tr className="border-b border-outline-variant/50">
                    <td className="px-4 py-3" colSpan={7}>
                      <div className="h-6 w-full bg-surface-container-high animate-pulse rounded"></div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-outline">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-[16px] font-semibold text-on-surface mb-1">{search ? 'No matches found' : 'No failed jobs'}</h3>
                        <p className="text-[14px] text-on-surface-variant max-w-md">{search ? 'Try adjusting your search filter.' : 'Jobs that exhaust their retry attempts will appear here for review and recovery.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(e => (
                    <tr key={e.id} className="border-b border-outline-variant/50 hover:bg-surface-container-high/50 transition-colors group cursor-default">
                      <td className="px-4 py-3 text-center border-r border-transparent group-hover:border-primary/20">
                        <input 
                          type="checkbox" 
                          className="rounded border-outline-variant bg-background text-primary focus:ring-accent-500 focus:ring-offset-surface-900 cursor-pointer" 
                          checked={selectedIds.has(e.id)}
                          onChange={() => toggleSelect(e.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-primary-fixed-dim" title={e.job_id}>{e.job_id?.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <span className="bg-surface-container-lowest px-2 py-1 rounded text-on-surface-variant border border-outline-variant">{e.queue_name || 'unknown'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-error max-w-[300px] truncate" title={e.failure_reason}>
                        {e.failure_reason || 'Unknown error'}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{e.total_attempts}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{new Date(e.failed_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => setAiModalEntry(e)}
                            className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors flex items-center gap-1 group/btn relative p-1 rounded" 
                            title="Analyze Failure"
                          >
                            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.428-1.428L13.5 18.75l1.178-.394a2.25 2.25 0 001.428-1.428L16.5 15.75l.394 1.178a2.25 2.25 0 001.428 1.428l1.178.394-1.178.394a2.25 2.25 0 00-1.428 1.428z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleRetry(e.id)}
                            className="bg-transparent border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary-fixed-dim px-3 py-1.5 rounded text-[12px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 0 && (
            <div className="border-t border-outline-variant bg-surface-container-lowest px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] text-on-surface-variant">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <div className="px-3 py-1 rounded bg-surface-container-high border border-outline-variant text-on-surface font-semibold text-[13px]">{page}</div>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Failure Analysis Modal */}
      {aiModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiModalEntry(null)}></div>
          <div className="relative bg-[#1A1A1A] border border-[#444] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-background">
              <div className="flex items-center gap-3 text-primary-fixed-dim">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                <h3 className="text-[16px] font-semibold text-on-surface">Gemini AI Failure Analysis</h3>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors" onClick={() => setAiModalEntry(null)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="px-6 py-5 overflow-y-auto flex flex-col gap-6 bg-[#1A1A1A]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[13px] text-primary mb-1 block">Job ID: {aiModalEntry.job_id}</span>
                  <h4 className="text-[15px] font-semibold text-error break-all">{aiModalEntry.failure_reason || 'Unknown Error'}</h4>
                </div>
                <div className="flex items-center shrink-0 gap-1.5 bg-error/10 border border-error/30 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                  <span className="text-[12px] font-semibold text-error uppercase tracking-wide">Analysis</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <h5 className="text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant border-b border-outline-variant/50 pb-1">What Went Wrong</h5>
                <p className="text-[14px] text-on-surface-variant leading-relaxed bg-surface-container-lowest/50 p-3 rounded border border-outline-variant">
                  Gemini has analyzed the failure reason: <br/>
                  <code className="text-error bg-background px-1 py-0.5 rounded mt-2 block break-all font-mono text-[13px]">{aiModalEntry.failure_reason}</code><br/>
                  This indicates a potential issue with the job's payload or a transient failure in the downstream service. Check the worker logs for the exact execution context around {new Date(aiModalEntry.failed_at).toLocaleString()}.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <h5 className="text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant border-b border-outline-variant/50 pb-1">Suggested Fixes</h5>
                <div className="flex gap-3 items-start bg-surface-container-lowest border border-outline-variant p-3 rounded-lg">
                  <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <div>
                    <h6 className="text-[14px] font-semibold text-on-surface">Manual Retry</h6>
                    <p className="text-[13px] text-on-surface-variant mt-1">If this was a transient network error or rate limit, it is safe to retry this job now.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-surface-container-lowest border border-outline-variant p-3 rounded-lg">
                  <svg className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  <div>
                    <h6 className="text-[14px] font-semibold text-on-surface">Inspect Payload</h6>
                    <p className="text-[13px] text-on-surface-variant mt-1">Check the original job payload for malformed data or missing required fields.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant bg-background flex justify-end gap-3 shrink-0">
              <button 
                className="px-4 py-2 rounded text-[14px] font-medium text-on-surface-variant border border-transparent hover:bg-surface-container-high transition-colors" 
                onClick={() => setAiModalEntry(null)}
              >
                Close
              </button>
              <button 
                className="bg-primary text-on-surface px-4 py-2 rounded text-[14px] font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                onClick={() => handleRetry(aiModalEntry.id)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Retry Job Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
