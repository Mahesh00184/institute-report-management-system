import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import {
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  PauseCircle,
  PlayCircle,
  Mail,
  Building2,
  Briefcase,
  IdCard,
  X,
  RotateCcw
} from 'lucide-react';

interface RegistrationUser {
  id: number;
  full_name: string;
  email: string;
  staff_id: string | null;
  department_id: number | null;
  department?: {
    id: number;
    name: string;
    short_code: string;
  };
  designation: string | null;
  role: string;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
  profile_image?: string | null;
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<RegistrationUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Dialog & Drawer states
  const [selectedUser, setSelectedUser] = useState<RegistrationUser | null>(null);
  const [viewUserModal, setViewUserModal] = useState<RegistrationUser | null>(null);
  const [rejectDialogUser, setRejectDialogUser] = useState<RegistrationUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/registrations?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRegistrations(res.data.registrations || []);
      setPendingCount(res.data.pending_count || 0);
    } catch (err: any) {
      addToast('error', 'Fetch Failed', err.response?.data?.detail || 'Failed to load registrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const handleApprove = async (user: RegistrationUser) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${user.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addToast('success', 'Registration Approved', `${user.full_name} is now ACTIVE and can log in.`);
      fetchRegistrations();
    } catch (err: any) {
      addToast('error', 'Approval Error', err.response?.data?.detail || 'Failed to approve registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialogUser) return;
    if (!rejectionReason.trim()) {
      addToast('error', 'Validation Error', 'Please specify a reason for rejecting this registration.');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${rejectDialogUser.id}/reject`,
        { reason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addToast('info', 'Registration Rejected', `Rejected ${rejectDialogUser.full_name} with recorded reason.`);
      setRejectDialogUser(null);
      setRejectionReason('');
      fetchRegistrations();
    } catch (err: any) {
      addToast('error', 'Rejection Error', err.response?.data?.detail || 'Failed to reject registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (user: RegistrationUser) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${user.id}/suspend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('info', 'Account Suspended', `Account for ${user.email} has been suspended.`);
      fetchRegistrations();
    } catch (err: any) {
      addToast('error', 'Action Error', err.response?.data?.detail || 'Failed to suspend account.');
    }
  };

  const handleActivate = async (user: RegistrationUser) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${user.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('success', 'Account Activated', `Account for ${user.email} is now ACTIVE.`);
      fetchRegistrations();
    } catch (err: any) {
      addToast('error', 'Action Error', err.response?.data?.detail || 'Failed to activate account.');
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registration Approvals</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, approve, or reject incoming Department Coordinator and Faculty registration requests.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {(['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === 'PENDING' ? `Pending (${pendingCount})` : st === 'ALL' ? 'All Registrations' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, staff ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
          />
        </form>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : registrations.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} registrations`}
          description={
            statusFilter === 'PENDING'
              ? 'Great news! All user registrations have been reviewed and processed.'
              : 'No applicant records found matching the selected filter criteria.'
          }
          icon={UserCheck}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Applicant Name</th>
                  <th className="py-3.5 px-6">Staff ID & Designation</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Requested Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date Registered</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {registrations.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                          {u.profile_image ? (
                            <img
                              src={
                                u.profile_image.startsWith('http')
                                  ? u.profile_image
                                  : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${u.profile_image}`
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{u.full_name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800">{u.designation || 'Academic Faculty'}</p>
                      <p className="text-[11px] font-mono text-slate-400">ID: {u.staff_id || 'N/A'}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{u.department?.short_code || `Dept #${u.department_id}`}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={u.status} size="sm" />
                      {u.rejection_reason && (
                        <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={u.rejection_reason}>
                          Reason: {u.rejection_reason}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setViewUserModal(u)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {u.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(u)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition flex items-center gap-1"
                              title="Approve User"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectDialogUser(u);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-lg text-[11px] transition flex items-center gap-1"
                              title="Reject Registration"
                            >
                              <UserX className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        {u.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleSuspend(u)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Suspend Account"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}

                        {u.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleActivate(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Reactivate Account"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Registration Modal */}
      {rejectDialogUser && (
        <ConfirmDialog
          isOpen={true}
          title="Reject User Registration"
          message={`Please provide an official justification for rejecting the registration request from ${rejectDialogUser.full_name} (${rejectDialogUser.email}).`}
          confirmLabel="Confirm Rejection"
          confirmVariant="danger"
          isLoading={actionLoading}
          onConfirm={handleReject}
          onCancel={() => setRejectDialogUser(null)}
        >
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Employee ID does not match institutional registry records."
              className="w-full p-3 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        </ConfirmDialog>
      )}

      {/* View User Details Drawer / Modal */}
      {viewUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Applicant Profile Dossier
                </span>
                <h3 className="text-lg font-black text-slate-900">{viewUserModal.full_name}</h3>
              </div>
              <button
                onClick={() => setViewUserModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500">Official Email</span>
                <p className="font-semibold text-slate-900 break-all">{viewUserModal.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500">Staff / Employee ID</span>
                <p className="font-semibold text-slate-900 font-mono">{viewUserModal.staff_id || 'Not Set'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500">Department</span>
                <p className="font-semibold text-slate-900">{viewUserModal.department?.name || 'Department'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500">Designation</span>
                <p className="font-semibold text-slate-900">{viewUserModal.designation || 'Faculty'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500">Requested Role</span>
                <p className="font-bold text-indigo-600">{viewUserModal.role}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500">Account Status</span>
                <div>
                  <StatusBadge status={viewUserModal.status} size="sm" />
                </div>
              </div>
            </div>

            {viewUserModal.rejection_reason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <span className="font-bold">Rejection Note:</span> {viewUserModal.rejection_reason}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              {viewUserModal.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(viewUserModal);
                      setViewUserModal(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => {
                      setRejectDialogUser(viewUserModal);
                      setViewUserModal(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Reject Application
                  </button>
                </>
              )}
              <button
                onClick={() => setViewUserModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
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
