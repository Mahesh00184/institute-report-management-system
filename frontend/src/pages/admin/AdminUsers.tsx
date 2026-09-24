import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  KeyRound,
  Eye,
  PauseCircle,
  PlayCircle,
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface UserRecord {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  department_id: number | null;
  staff_id: string | null;
  phone: string | null;
  designation: string | null;
  profile_image: string | null;
  created_at: string;
  last_login?: string | null;
  department?: {
    id: number;
    name: string;
    short_code: string;
  };
}

interface DepartmentRecord {
  id: number;
  name: string;
  short_code: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRecord | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'DEPARTMENT',
    status: 'ACTIVE',
    department_id: null as number | null,
    staff_id: '',
    phone: '',
    designation: '',
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('skip', ((page - 1) * 20).toString());
      params.append('limit', '20');
      if (search.trim()) params.append('q', search.trim());
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (departmentFilter !== 'ALL') params.append('department_id', departmentFilter.toString());

      const [usersRes, deptsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/departments/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(usersRes.data.users || []);
      setTotalPages(usersRes.data.pages || 1);
      setTotalCount(usersRes.data.total || 0);
      setDepartments(deptsRes.data || []);
    } catch (err: any) {
      addToast('error', 'Load Error', err.response?.data?.detail || 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'DEPARTMENT',
      status: 'ACTIVE',
      department_id: departments[0]?.id || null,
      staff_id: '',
      phone: '',
      designation: '',
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      full_name: u.full_name,
      password: '',
      role: u.role,
      status: u.status,
      department_id: u.department_id,
      staff_id: u.staff_id || '',
      phone: u.phone || '',
      designation: u.designation || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        status: formData.status,
        department_id: formData.role === 'ADMIN' ? null : formData.department_id,
        staff_id: formData.staff_id.trim() || null,
        phone: formData.phone.trim() || null,
        designation: formData.designation.trim() || null,
      };

      if (!editingUser) {
        if (!formData.password) {
          addToast('error', 'Validation Error', 'Password is required when creating a new user.');
          setModalLoading(false);
          return;
        }
        payload.password = formData.password;
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addToast('success', 'User Created', `User ${formData.email} created successfully.`);
      } else {
        if (formData.password) {
          payload.password = formData.password;
        }
        await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${editingUser.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        addToast('success', 'User Updated', `Updated details for ${formData.email}.`);
      }

      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.response?.data?.detail || 'Failed to save user record.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${deleteConfirmUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('info', 'User Deleted', `User ${deleteConfirmUser.email} has been removed.`);
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.response?.data?.detail || 'Could not delete user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusToggle = async (u: UserRecord) => {
    const action = u.status === 'ACTIVE' ? 'suspend' : 'activate';
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${u.id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('success', 'Status Changed', `User status set to ${action === 'suspend' ? 'SUSPENDED' : 'ACTIVE'}.`);
      fetchUsers();
    } catch (err: any) {
      addToast('error', 'Status Change Failed', err.response?.data?.detail || 'Action failed.');
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordValue.trim()) return;
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${resetPasswordUser.id}/reset-password?new_password=${encodeURIComponent(newPasswordValue)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('success', 'Password Reset', `Password for ${resetPasswordUser.email} reset successfully.`);
      setResetPasswordUser(null);
      setNewPasswordValue('');
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional User Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative staff, department coordinators, faculty accounts, and access privileges.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Institutional User
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, designation, staff ID..."
              className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-medium text-slate-900 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="DEPARTMENT">Department Coordinator</option>
                <option value="FACULTY">Faculty</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-medium text-slate-900 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent font-medium text-slate-900 focus:outline-none max-w-[140px] truncate"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.short_code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No users match the specified search query and filter criteria."
          icon={Users}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setRoleFilter('ALL');
            setStatusFilter('ALL');
            setDepartmentFilter('ALL');
            setPage(1);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">User / Identity</th>
                  <th className="py-3.5 px-6">Designation & ID</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{u.full_name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-800">{u.designation || 'Staff'}</p>
                      <p className="text-[11px] font-mono text-slate-400">{u.staff_id || '—'}</p>
                    </td>

                    <td className="py-4 px-6">
                      {u.role === 'ADMIN' ? (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Central Admin
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          {u.department?.short_code || `Dept #${u.department_id}`}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={u.status || 'ACTIVE'} size="sm" />
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-[11px] font-mono">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setResetPasswordUser(u);
                            setNewPasswordValue('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleStatusToggle(u)}
                              className={`p-1.5 rounded-lg transition ${
                                u.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <PauseCircle className="w-3.5 h-3.5" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {users.length} of {totalCount} users
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingUser ? 'Edit Institutional User' : 'Create New Institutional User'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Staff / Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    placeholder="CSE-005"
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  >
                    <option value="DEPARTMENT">Department Coordinator</option>
                    <option value="FACULTY">Faculty / Staff</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                {formData.role !== 'ADMIN' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department_id || ''}
                      onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.short_code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9988776655"
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {modalLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {deleteConfirmUser && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Institutional Account"
          message={`Are you sure you want to permanently delete the account for "${deleteConfirmUser.full_name}" (${deleteConfirmUser.email})? This action cannot be reversed.`}
          confirmLabel="Delete Account"
          confirmVariant="danger"
          isLoading={modalLoading}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteConfirmUser(null)}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <ConfirmDialog
          isOpen={true}
          title="Administrative Password Reset"
          message={`Set a new temporary or permanent password for user "${resetPasswordUser.full_name}" (${resetPasswordUser.email}).`}
          confirmLabel="Save New Password"
          confirmVariant="primary"
          isLoading={modalLoading}
          onConfirm={handleAdminResetPassword as any}
          onCancel={() => setResetPasswordUser(null)}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
              placeholder="e.g. TempPass@2026"
              className="w-full px-3 py-2 text-xs font-mono text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </ConfirmDialog>
      )}

      {/* View User Profile Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Institutional Profile</span>
                <h3 className="text-base font-black text-slate-900">{viewingUser.full_name}</h3>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-900">{viewingUser.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Staff / Employee ID</span>
                <span className="font-mono text-slate-800">{viewingUser.staff_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-indigo-700">{viewingUser.department?.name || 'Central Administration'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Designation</span>
                <span className="text-slate-800">{viewingUser.designation || 'Faculty'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Role</span>
                <span className="font-bold text-slate-900">{viewingUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={viewingUser.status || 'ACTIVE'} size="sm" />
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Contact Phone</span>
                <span className="text-slate-800">{viewingUser.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Last Login</span>
                <span className="text-slate-600 font-mono text-[11px]">
                  {viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
