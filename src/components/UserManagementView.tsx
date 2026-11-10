import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Lock,
  Phone,
  Mail,
  Building2,
  MapPin,
  RefreshCw,
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  password_hint: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'EXTENSION_OFFICER' | 'COOPERATIVE_AGRONOMIST' | 'INSURER_UNDERWRITER' | 'FIELD_SCOUT';
  role_title: string;
  county_code: '026' | '027' | 'ALL';
  county_name: string;
  organization: string;
  phone_number: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  two_factor_enabled: boolean;
  last_login_at: string;
  created_at: string;
}

export default function UserManagementView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [countyFilter, setCountyFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('EXTENSION_OFFICER');
  const [newCounty, setNewCounty] = useState<string>('026');
  const [newOrg, setNewOrg] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('+254 7');
  const [newPassword, setNewPassword] = useState<string>('Mavuno@2026!');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('EXTENSION_OFFICER');
  const [editCounty, setEditCounty] = useState<string>('026');
  const [editOrg, setEditOrg] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');

  const fetchUsers = () => {
    setIsLoading(true);
    let url = '/api/v1/users';
    fetch(url)
      .then((res) => res.json())
      .then((data: UserRecord[]) => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: UserRecord) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const res = await fetch(`/api/v1/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setNotification({
        message: `Account status for ${user.full_name} updated to ${newStatus}.`,
        type: newStatus === 'ACTIVE' ? 'success' : 'info',
      });
      fetchUsers();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating status', type: 'error' });
    }
  };

  const handleResetPassword = async (user: UserRecord) => {
    try {
      const res = await fetch(`/api/v1/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Password reset failed');
      setNotification({
        message: `Password reset successfully for ${user.full_name}! Temporary credential: ${data.temporary_password}`,
        type: 'success',
      });
      fetchUsers();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error resetting password', type: 'error' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newFullName,
          email: newEmail,
          role: newRole,
          county_code: newCounty,
          organization: newOrg,
          phone_number: newPhone,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setNotification({
        message: `User ${newFullName} successfully added to MavunoSense AI directory!`,
        type: 'success',
      });
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewOrg('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditRole(user.role);
    setEditCounty(user.county_code);
    setEditOrg(user.organization);
    setEditPhone(user.phone_number);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editFullName,
          role: editRole,
          county_code: editCounty,
          organization: editOrg,
          phone_number: editPhone,
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');

      setNotification({
        message: `Account details for ${editFullName} updated successfully!`,
        type: 'success',
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error updating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesCounty = countyFilter === 'ALL' || u.county_code === countyFilter || u.county_code === 'ALL';
    return matchesSearch && matchesRole && matchesCounty;
  });

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Governance & User Administration
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-600">KDPA 2019 Compliant Access</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional User Directory & Account Management
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Manage authenticated agricultural extension agronomists, cooperative leads, parametric insurers, and field scouts across Trans Nzoia and Uasin Gishu counties.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchUsers}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Refresh user list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User Account</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across 2 counties & national</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Status</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Verified & operational</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspended</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{suspendedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Deactivated access</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trained Personnel</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">142</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Extension & Coop Staff</div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Users Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, organization..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Role:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-emerald-600"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
              <option value="EXTENSION_OFFICER">Extension Officer</option>
              <option value="COOPERATIVE_AGRONOMIST">Cooperative Agronomist</option>
              <option value="INSURER_UNDERWRITER">Parametric Insurer</option>
              <option value="FIELD_SCOUT">Field Scout</option>
            </select>

            <span className="text-slate-300">|</span>

            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-emerald-600"
            >
              <option value="ALL">All Regions</option>
              <option value="026">Trans Nzoia (026)</option>
              <option value="027">Uasin Gishu (027)</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Role & Privilege</th>
                <th className="py-3 px-4">County Station</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.map((u) => {
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                if (u.role === 'SUPER_ADMIN') badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                else if (u.role === 'EXTENSION_OFFICER') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                else if (u.role === 'COOPERATIVE_AGRONOMIST') badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                else if (u.role === 'INSURER_UNDERWRITER') badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                else if (u.role === 'FIELD_SCOUT') badgeClass = 'bg-teal-100 text-teal-800 border-teal-200';

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    {/* User & Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{u.phone_number}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{u.role_title}</div>
                    </td>

                    {/* County Station */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{u.county_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.county_code === 'ALL' ? 'Dual County (026 & 027)' : `Code: ${u.county_code}`}
                      </span>
                    </td>

                    {/* Organization */}
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium text-slate-800 truncate max-w-xs">{u.organization}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {u.last_login_at}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit user details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors"
                          title="Reset user password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account'}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Provision New Institutional Account</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Kiprono Koech"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. k.koech@agri.go.ke"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="EXTENSION_OFFICER">Extension Officer (County Agronomist)</option>
                    <option value="COOPERATIVE_AGRONOMIST">Cooperative Agronomist</option>
                    <option value="INSURER_UNDERWRITER">Parametric Insurer Underwriter</option>
                    <option value="FIELD_SCOUT">Field Scout (EotG Network)</option>
                    <option value="SUPER_ADMIN">Super Administrator (Governance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned County Station</label>
                  <select
                    value={newCounty}
                    onChange={(e) => setNewCounty(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="026">Trans Nzoia County (Kitale)</option>
                    <option value="027">Uasin Gishu County (Eldoret)</option>
                    <option value="ALL">Dual Counties (Trans Nzoia & Uasin Gishu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Department</label>
                  <input
                    type="text"
                    required
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    placeholder="e.g. Trans Nzoia Agriculture Dept"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (SMS Alert Auth)</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono focus:outline-emerald-600"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">User will be prompted to reset upon first login.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit User Account</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="EXTENSION_OFFICER">Extension Officer</option>
                    <option value="COOPERATIVE_AGRONOMIST">Cooperative Agronomist</option>
                    <option value="INSURER_UNDERWRITER">Parametric Insurer</option>
                    <option value="FIELD_SCOUT">Field Scout</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">County Station</label>
                  <select
                    value={editCounty}
                    onChange={(e) => setEditCounty(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="026">Trans Nzoia County (026)</option>
                    <option value="027">Uasin Gishu County (027)</option>
                    <option value="ALL">All Counties</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization</label>
                <input
                  type="text"
                  value={editOrg}
                  onChange={(e) => setEditOrg(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Update Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
