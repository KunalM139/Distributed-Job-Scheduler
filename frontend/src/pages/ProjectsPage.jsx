import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('viewer');
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  
  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (projectId) => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/api/projects/${projectId}/members`);
      setMembers(res.data.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Only owners and admins can view members');
      } else {
        toast.error('Failed to load members');
      }
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    fetchMembers(project.id);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    try {
      await api.post(`/api/projects/${selectedProject.id}/members`, {
        email: newMemberEmail,
        role: newMemberRole,
      });
      toast.success('Member added');
      setNewMemberEmail('');
      fetchMembers(selectedProject.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.patch(`/api/projects/${selectedProject.id}/members/${userId}`, { role: newRole });
      toast.success('Role updated');
      fetchMembers(selectedProject.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/api/projects/${selectedProject.id}/members/${userId}`);
      toast.success('Member removed');
      fetchMembers(selectedProject.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/projects/${projectId}`);
      toast.success('Project deleted');
      setSelectedProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/api/projects', {
        name: createForm.name,
        description: createForm.description,
      });
      toast.success('Project created');
      setCreateModalOpen(false);
      setCreateForm({ name: '', description: '' });
      fetchProjects();
      handleSelectProject(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Projects & Members</h1>
        <button
          onClick={() => {
            setCreateForm({ name: '', description: '' });
            setCreateModalOpen(true);
          }}
          className="rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent-500/25 transition hover:from-accent-600 hover:to-accent-700"
        >
          + Create Project
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects List */}
        <div className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
            <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Your Projects</h2>
          </div>
          <ul className="divide-y divide-surface-100 dark:divide-surface-800 max-h-[600px] overflow-y-auto">
            {projects.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-surface-400">No projects found.</li>
            ) : (
              projects.map((p) => (
                <li
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`cursor-pointer px-5 py-4 transition hover:bg-surface-50 dark:hover:bg-surface-800/40 ${
                    selectedProject?.id === p.id ? 'bg-accent-50 dark:bg-accent-900/10' : ''
                  }`}
                >
                  <p className="font-semibold text-surface-900 dark:text-white">{p.name}</p>
                  {p.description && <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{p.description}</p>}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Members Management */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900 p-5">
          {!selectedProject ? (
            <div className="flex h-full items-center justify-center text-sm text-surface-400 py-20">
              Select a project to view and manage members
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
                    Members of {selectedProject.name}
                  </h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Manage access and roles for this project.
                  </p>
                </div>
                {selectedProject.user_role === 'owner' && (
                  <button
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="rounded-lg bg-danger-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger-600"
                  >
                    Delete Project
                  </button>
                )}
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="flex gap-3 items-end p-4 rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/30">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="w-40">
                  <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
                >
                  Add Member
                </button>
              </form>

              {/* Members List */}
              {membersLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-800/50">
                      <tr>
                        <th className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">User</th>
                        <th className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">Role</th>
                        <th className="px-5 py-3 font-medium text-surface-500 dark:text-surface-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                      {members.map((m) => (
                        <tr key={m.user_id} className="transition hover:bg-surface-50 dark:hover:bg-surface-800/40">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-surface-900 dark:text-white">{m.name}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">{m.email}</p>
                          </td>
                          <td className="px-5 py-3">
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                              className="rounded-lg border border-surface-300 bg-white px-2 py-1 text-xs font-medium dark:border-surface-700 dark:bg-surface-900 dark:text-white"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="rounded-lg bg-danger-400/10 px-3 py-1.5 text-xs font-semibold text-danger-500 transition hover:bg-danger-400/20 dark:text-danger-400"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Project Modal ────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-700 dark:bg-surface-900">
            <h2 className="mb-5 text-lg font-bold text-surface-900 dark:text-white">Create Project</h2>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Project Name</label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white"
                  placeholder="My awesome project"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Description (Optional)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-white resize-none"
                  placeholder="A brief description..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-600 transition hover:bg-surface-100 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
