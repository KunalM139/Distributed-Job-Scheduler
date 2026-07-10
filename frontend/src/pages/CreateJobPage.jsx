import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CreateJobPage() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [queues, setQueues] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({
    queue_id: '',
    type: '',
    jobType: 'immediate', // immediate, delayed, scheduled, recurring, batch
    cron_expression: '0 12 * * ?',
    payload: '{\n  "action": "sync_customer_data",\n  "batch_size": 1000,\n  "parameters": {\n    "source_db": "legacy_sql_01",\n    "target_index": "es_customers_v3"\n  },\n  "notify_on_completion": true\n}'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const projRes = await api.get('/api/projects');
        const projs = projRes.data.data || [];
        setProjects(projs);
        
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }

        const allQueues = [];
        for (const p of projs) {
          const qRes = await api.get(`/api/projects/${p.id}/queues`);
          allQueues.push(...(qRes.data.data || []));
        }
        setQueues(allQueues);
      } catch (err) {
        toast.error('Failed to load projects/queues');
      }
    };
    loadData();
  }, []);

  const availableQueues = queues.filter(q => q.project_id === selectedProjectId);
  
  // Auto-select first available queue when project changes
  useEffect(() => {
    if (availableQueues.length > 0 && !availableQueues.find(q => q.id === form.queue_id)) {
      setForm(prev => ({ ...prev, queue_id: availableQueues[0].id }));
    }
  }, [selectedProjectId, availableQueues, form.queue_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.queue_id) return toast.error('Please select a target queue');
    if (!form.type.trim()) return toast.error('Job name/type is required');
    
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(form.payload);
    } catch {
      return toast.error('Invalid JSON payload');
    }

    setCreating(true);
    try {
      const body = {
        type: form.type,
        payload: parsedPayload,
        priority: 0,
      };
      
      const isCron = form.jobType === 'recurring' || form.jobType === 'scheduled';
      if (isCron && form.cron_expression.trim()) {
        body.cron_expression = form.cron_expression.trim();
      }

      await api.post(`/api/queues/${form.queue_id}/jobs`, body);
      toast.success(isCron ? 'Scheduled job created successfully' : 'Job created successfully');
      navigate('/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const showCron = form.jobType === 'recurring' || form.jobType === 'scheduled';

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-[800px] mx-auto pb-24">
        {/* Page Header */}
        <div className="mb-8 border-b border-outline-variant pb-4">
          <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface">Create New Job</h1>
          <p className="text-on-surface-variant mt-1 text-[14px]">Configure and submit a job for distributed execution.</p>
        </div>

        {/* Form */}
        <form id="createJobForm" className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Job Details */}
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6">
            <h2 className="text-[16px] font-semibold text-on-surface mb-4">Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-widest font-semibold text-outline">Project</label>
                <select 
                  className="bg-surface-container border border-outline-variant rounded py-2 px-3 text-on-surface text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none appearance-none cursor-pointer"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {projects.length === 0 && <option value="" disabled>No projects found</option>}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-widest font-semibold text-outline">Target Queue</label>
                <select 
                  className="bg-surface-container border border-outline-variant rounded py-2 px-3 text-on-surface text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none appearance-none cursor-pointer"
                  value={form.queue_id}
                  onChange={(e) => setForm({...form, queue_id: e.target.value})}
                  required
                >
                  {availableQueues.map(q => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                  {availableQueues.length === 0 && <option value="" disabled>No queues available</option>}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] uppercase tracking-widest font-semibold text-outline">Job Name / Type *</label>
              <input 
                className="bg-surface-container border border-outline-variant rounded py-2 px-3 text-on-surface font-mono text-[13px] focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" 
                placeholder="e.g., data-sync-pipeline" 
                type="text"
                required
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
              />
            </div>
          </div>

          {/* Execution Type */}
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6">
            <h2 className="text-[16px] font-semibold text-on-surface mb-4">Execution Type</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="jobType" 
                  value="immediate" 
                  className="sr-only peer"
                  checked={form.jobType === 'immediate'}
                  onChange={(e) => setForm({...form, jobType: e.target.value})}
                />
                <div className="h-full border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-2 peer-checked:border-primary-container peer-checked:bg-primary-container/10 transition-all hover:bg-surface-container-high">
                  <svg className="w-5 h-5 text-outline group-hover:text-on-surface peer-checked:text-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-[14px] text-on-surface">Immediate</span>
                </div>
              </label>
              
              <label className="relative cursor-pointer group opacity-50 cursor-not-allowed">
                <input 
                  type="radio" 
                  name="jobType" 
                  value="delayed" 
                  className="sr-only peer"
                  disabled
                />
                <div className="h-full border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-2 transition-all">
                  <svg className="w-5 h-5 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[14px] text-outline">Delayed</span>
                </div>
              </label>
              
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="jobType" 
                  value="scheduled" 
                  className="sr-only peer"
                  checked={form.jobType === 'scheduled'}
                  onChange={(e) => setForm({...form, jobType: e.target.value})}
                />
                <div className="h-full border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-2 peer-checked:border-primary-container peer-checked:bg-primary-container/10 transition-all hover:bg-surface-container-high">
                  <svg className="w-5 h-5 text-outline group-hover:text-on-surface peer-checked:text-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-[14px] text-on-surface">Scheduled</span>
                </div>
              </label>
              
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="jobType" 
                  value="recurring" 
                  className="sr-only peer"
                  checked={form.jobType === 'recurring'}
                  onChange={(e) => setForm({...form, jobType: e.target.value})}
                />
                <div className="h-full border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-2 peer-checked:border-primary-container peer-checked:bg-primary-container/10 transition-all hover:bg-surface-container-high">
                  <svg className="w-5 h-5 text-outline group-hover:text-on-surface peer-checked:text-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span className="text-[14px] text-on-surface">Recurring</span>
                </div>
              </label>
              
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="jobType" 
                  value="batch" 
                  className="sr-only peer"
                  checked={form.jobType === 'batch'}
                  onChange={(e) => setForm({...form, jobType: e.target.value})}
                />
                <div className="h-full border border-outline-variant rounded-lg p-3 flex flex-col items-center text-center gap-2 peer-checked:border-primary-container peer-checked:bg-primary-container/10 transition-all hover:bg-surface-container-high">
                  <svg className="w-5 h-5 text-outline group-hover:text-on-surface peer-checked:text-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <span className="text-[14px] text-on-surface">Batch</span>
                </div>
              </label>
            </div>
            
            {showCron && (
              <div className="flex flex-col gap-1.5 pt-4 border-t border-outline-variant/50">
                <label className="text-[12px] uppercase tracking-widest font-semibold text-outline">Cron Expression</label>
                <input 
                  className="bg-surface-container border border-outline-variant rounded py-2 px-3 text-on-surface font-mono text-[13px] focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" 
                  type="text" 
                  value={form.cron_expression}
                  onChange={(e) => setForm({...form, cron_expression: e.target.value})}
                />
              </div>
            )}
          </div>

          {/* Payload Editor */}
          <div className="bg-surface-container-low border border-outline-variant rounded-lg flex flex-col h-[320px]">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest/50 rounded-t-lg">
              <h2 className="text-[16px] font-semibold text-on-surface">Payload Configuration</h2>
              <span className="text-[10px] text-outline tracking-widest uppercase font-semibold border border-outline-variant rounded px-2 py-0.5">JSON</span>
            </div>
            <div className="flex-1 flex bg-surface-container-lowest rounded-b-lg overflow-hidden relative group">
              <div className="w-10 border-r border-outline-variant/30 flex flex-col items-end py-4 pr-2 font-mono text-xs text-outline select-none opacity-50">
                {form.payload.split('\n').map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <textarea 
                className="flex-1 bg-transparent border-none text-on-surface font-mono text-[13px] p-4 focus:ring-0 resize-none outline-none leading-relaxed" 
                spellCheck="false"
                value={form.payload}
                onChange={(e) => setForm({...form, payload: e.target.value})}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-surface border-t border-outline-variant p-4 z-20 flex justify-end items-center gap-3">
        <button 
          className="px-4 py-2 text-sm font-semibold text-on-surface border border-outline-variant rounded hover:bg-surface-container-high transition-colors" 
          type="button"
          onClick={() => navigate('/jobs')}
        >
          Cancel
        </button>
        <button 
          className="px-6 py-2 text-sm font-semibold bg-primary-container text-on-primary-container rounded hover:opacity-90 transition-opacity flex items-center gap-2" 
          form="createJobForm" 
          type="submit"
          disabled={creating}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          {creating ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </div>
  );
}
