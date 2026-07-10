import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { socket } = useSocket();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state - Create Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Member Management State
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Modal state - Add Member
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'VIEWER' });
  const [addingMember, setAddingMember] = useState(false);

  // Current authenticated user context (mocked via token if possible, or assumed from actions)
  // For UI safety, we assume the backend enforces permissions.
  // We can derive if the current user is an OWNER/ADMIN from the projects array (it returns role).

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/projects');
      setProjects(res.data.data || []);
      
      // If we have a selected project, update it to get latest roles
      if (selectedProject) {
        const updated = (res.data.data || []).find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
        else setSelectedProject(null);
      }
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (!socket) return;
    const handleEvent = () => fetchProjects();
    socket.on('PROJECT_CREATED', handleEvent);
    socket.on('PROJECT_UPDATED', handleEvent);
    return () => {
      socket.off('PROJECT_CREATED', handleEvent);
      socket.off('PROJECT_UPDATED', handleEvent);
    };
  }, [socket, fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchMembers(selectedProject.id);
    } else {
      setMembers([]);
    }
  }, [selectedProject]);


  const fetchMembers = async (projectId) => {
    try {
      setLoadingMembers(true);
      const res = await api.get(`/api/projects/${projectId}/members`);
      setMembers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/api/projects', newProject);
      toast.success('Project created');
      setNewProject({ name: '', description: '' });
      setIsModalOpen(false);
      await fetchProjects();
      setSelectedProject(res.data.data); // Auto-select new project
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setAddingMember(true);
    try {
      await api.post(`/api/projects/${selectedProject.id}/members`, newMember);
      toast.success('Member added successfully');
      setNewMember({ email: '', role: 'VIEWER' });
      setIsMemberModalOpen(false);
      fetchMembers(selectedProject.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    if (!selectedProject) return;
    try {
      await api.put(`/api/projects/${selectedProject.id}/members/${memberId}`, { role: newRole });
      toast.success('Role updated');
      fetchMembers(selectedProject.id);
      fetchProjects(); // Update our own role just in case
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedProject) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await api.delete(`/api/projects/${selectedProject.id}/members/${memberId}`);
      toast.success('Member removed');
      fetchMembers(selectedProject.id);
      fetchProjects(); // In case we removed ourselves
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const renderRoleBadge = (role) => {
    if (role === 'OWNER') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary text-[12px] uppercase tracking-widest font-semibold border border-primary/20">
          Owner
        </span>
      );
    } else if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[12px] uppercase tracking-widest font-semibold border border-secondary/20">
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold border border-outline-variant">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Viewer
      </span>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">
      {/* Projects Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface">Projects</h2>
          <p className="text-[14px] text-on-surface-variant mt-1">Manage your projects and access distributed job scheduling resources.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Project
        </button>
      </div>

      {/* Bento Grid Layout for Projects */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col h-[240px] animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded bg-surface-container-high"></div>
                  <div className="h-6 bg-surface-container-high rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-surface-container-high rounded w-full"></div>
                <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
              </div>
              <div className="mt-auto space-y-4">
                <div className="h-6 bg-surface-container-high rounded w-16"></div>
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                  <div className="h-4 bg-surface-container-high rounded w-24"></div>
                  <div className="h-4 bg-surface-container-high rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest border border-outline-variant rounded-lg border-dashed mb-8">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="text-[16px] font-semibold text-on-surface mb-2">No projects yet</h3>
          <p className="text-[14px] text-on-surface-variant text-center max-w-md">Create your first project to start managing distributed workloads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {projects.map((project) => {
            const isSelected = selectedProject?.id === project.id;
            return (
              <div 
                key={project.id} 
                className={`bg-surface-container-lowest border rounded-lg p-6 hover:border-primary transition-colors group relative flex flex-col h-[240px] cursor-pointer ${isSelected ? 'border-primary shadow-[0_0_0_1px_rgba(174,198,255,1)]' : 'border-outline-variant'}`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded bg-surface-container-high border flex items-center justify-center transition-colors ${isSelected ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant group-hover:text-primary'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-[16px] font-semibold transition-colors ${isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                        {project.name}
                      </h3>
                    </div>
                  </div>
                </div>
                <p className="text-[14px] text-on-surface-variant mb-6 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between">
                    {renderRoleBadge(project.role)}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                    <div className="font-mono text-[11px] text-outline">
                      Created {new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <button className="text-primary hover:text-primary-fixed-dim text-[13px] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {isSelected ? 'Managing' : 'Manage'} 
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Management Section */}
      <div className="mt-8 pt-8 border-t border-outline-variant flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-2">Member Management</h2>
            <p className="text-[14px] text-on-surface-variant">
              {selectedProject ? `Selected Project: ${selectedProject.name}` : 'Select a project above to manage members'}
            </p>
          </div>
          {selectedProject && ['OWNER', 'ADMIN'].includes(selectedProject.role) && (
            <button 
              onClick={() => setIsMemberModalOpen(true)}
              className="bg-surface-container-high hover:bg-surface-700 text-on-surface border border-outline-variant px-4 py-2 rounded-lg text-[16px] font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Add Member
            </button>
          )}
        </div>

        {/* Data Table for Members */}
        {selectedProject ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex-1">
            {loadingMembers ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background border-b border-outline-variant">
                    <th className="py-3 px-4 text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold w-1/2">Member</th>
                    <th className="py-3 px-4 text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold w-1/4">Role</th>
                    <th className="py-3 px-4 text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold text-right w-1/4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {members.map(member => (
                    <tr key={member.id} className="border-b border-outline-variant hover:bg-surface-container-high transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface font-mono text-sm uppercase">
                            {member.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-on-surface font-medium">{member.name}</div>
                            <div className="text-on-surface-variant font-mono text-[12px]">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {selectedProject.role === 'OWNER' || (selectedProject.role === 'ADMIN' && member.role !== 'OWNER') ? (
                          <select 
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="bg-surface-container-high text-on-surface text-[12px] uppercase tracking-widest font-semibold border border-outline-variant rounded px-2 py-1 outline-none focus:border-primary"
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        ) : (
                          renderRoleBadge(member.role)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(selectedProject.role === 'OWNER' || (selectedProject.role === 'ADMIN' && member.role !== 'OWNER')) ? (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-error hover:text-error px-2 py-1 rounded text-sm font-medium border border-transparent hover:border-error/30 hover:bg-error/10"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity text-outline text-sm">
                             No Access
                           </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-on-surface-variant text-sm">No members found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest border border-outline-variant rounded-lg border-dashed flex-1 min-h-[200px]">
             <svg className="w-8 h-8 text-outline mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.952-3.138zm1.5-9.128a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm-1.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p className="text-[14px] text-on-surface-variant text-center max-w-md">Click 'Manage' on a project above to view and edit its members.</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
              <h2 className="text-[16px] font-semibold text-on-surface">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="p-6 space-y-6 bg-background">
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Project Name</label>
                  <input 
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600" 
                    placeholder="e.g. Production Data Pipeline" 
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600 resize-none" 
                    placeholder="Briefly describe the purpose of this project..." 
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMemberModalOpen(false)}></div>
          <div className="relative bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
              <h2 className="text-[16px] font-semibold text-on-surface">Add Member</h2>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="p-6 space-y-6 bg-background">
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Email Address</label>
                  <input 
                    required
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all placeholder-surface-600" 
                    placeholder="colleague@company.com" 
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-widest font-semibold text-on-surface-variant mb-2">Role</label>
                  <select
                    value={newMember.role}
                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-on-surface focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none transition-all"
                  >
                    <option value="VIEWER">Viewer (Read-only)</option>
                    <option value="ADMIN">Admin (Manage queues & jobs)</option>
                    {selectedProject?.role === 'OWNER' && (
                      <option value="OWNER">Owner (Full control)</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[16px] font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={addingMember}
                  className="bg-primary hover:bg-primary-container text-on-surface px-4 py-2 rounded-lg text-[16px] font-semibold transition-colors disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
