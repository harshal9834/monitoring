import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Key,
  RotateCcw,
  Building2,
  Lock,
  Loader2,
  Power,
  RefreshCw,
  Mail,
  Edit
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

export const UserManagementView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [centreFilter, setCentreFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [users, setUsers] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [targetCentreId, setTargetCentreId] = useState('');

  // Add User Form
  const [formData, setFormData] = useState({
    centre_id: '',
    name: '',
    email: '',
    username: '',
    password: '',
    phone: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uData, cData] = await Promise.all([
        api.getUsers({
          search: searchQuery || undefined,
          centre_id: centreFilter !== 'ALL' ? centreFilter : undefined,
          status_filter: statusFilter !== 'ALL' ? statusFilter : undefined
        }),
        api.getAdminCentres()
      ]);
      setUsers(Array.isArray(uData) ? uData : []);
      setCentres(Array.isArray(cData) ? cData : []);
      if (Array.isArray(cData) && cData.length > 0 && !formData.centre_id) {
        setFormData((prev) => ({ ...prev, centre_id: cData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load user access data from MySQL:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [centreFilter, statusFilter, searchQuery]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCentreUserAccess(formData);
      alert('Centre Admin user created successfully.');
      setShowAddModal(false);
      setFormData({
        centre_id: centres[0]?.id || '',
        name: '',
        email: '',
        username: '',
        password: 'Centre@2026',
        phone: '+91 98220 12345'
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user access');
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const actionName = user.status === 'ACTIVE' ? 'deactivate' : 'activate';
      if (!confirm(`Are you sure you want to ${actionName} access for ${user.email}?`)) return;
      await api.toggleUserStatus(user.id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.resetUserPassword(selectedUser.id, newPassword);
      alert(`Password reset successfully for ${selectedUser.email}`);
      setShowResetModal(false);
      setNewPassword('Centre@2026');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const handleReassignCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !targetCentreId) return;
    try {
      await api.changeUserAssignedCentre(selectedUser.id, targetCentreId);
      alert(`User ${selectedUser.email} reassigned successfully.`);
      setShowReassignModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign centre');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Central Access Control & Credentials</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            User Access & Credential Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer training centre administrators, provision statutory login accounts, reset passwords, and bind Centre IDs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Create Centre Admin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Assigned Centre:</span>
            <select
              value={centreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.centre_code || c.code} - {c.centreName || c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Account Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm font-medium text-slate-600">Loading user accounts from MySQL...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No user accounts found.</p>
          <p className="text-xs text-slate-500">Create a new centre admin account using the button above.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Centre ID</th>
                  <th className="py-3 px-4">Centre Admin</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isActive = u.status === 'ACTIVE' || u.accountStatus === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {u.centreId || 'System Admin'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.centreName}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">{u.username || u.email.split('@')[0]}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status || u.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {u.lastLogin || 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowResetModal(true);
                            }}
                            title="Reset Password"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={isActive ? 'Deactivate User Account' : 'Activate User Account'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {u.role === 'CENTRE_ADMIN' && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setTargetCentreId(u.centre_id || centres[0]?.id || '');
                                setShowReassignModal(true);
                              }}
                              title="Reassign Assigned Centre"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Building2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {users.map((u) => {
              const isActive = u.status === 'ACTIVE' || u.accountStatus === 'ACTIVE';
              return (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-700 font-bold block">{u.centreId || 'System Admin'}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                      {u.centreName && <p className="text-[11px] text-slate-400">{u.centreName}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.status || u.accountStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                      <span className="font-mono text-slate-700 break-all">{u.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Username</span>
                      <span className="font-mono text-slate-700">{u.username || u.email.split('@')[0]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Login</span>
                      <span className="font-mono text-slate-700">{u.lastLogin || 'Never'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setShowResetModal(true);
                      }}
                      className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Reset Password</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors flex items-center gap-1 ${
                        isActive
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE CENTRE ADMIN */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Create Centre Admin Account</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign to Training Centre *</label>
                <select
                  required
                  value={formData.centre_id}
                  onChange={(e) => setFormData({ ...formData, centre_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.centre_code || c.code} - {c.centreName || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@apexskill.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh.admin"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs">Provision Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <p className="text-slate-600">
              Enter new temporary password for <strong>{selectedUser.email}</strong>:
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REASSIGN CENTRE */}
      {showReassignModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Reassign Centre</h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <p className="text-slate-600">
              Reassign <strong>{selectedUser.email}</strong> to a different accredited training centre:
            </p>
            <form onSubmit={handleReassignCentre} className="space-y-3">
              <select
                value={targetCentreId}
                onChange={(e) => setTargetCentreId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.centre_code || c.code} - {c.centreName || c.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowReassignModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
