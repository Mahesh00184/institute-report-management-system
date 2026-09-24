import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  IdCard,
  Building2,
  Calendar,
  Clock,
  Shield,
  Upload,
  Lock,
  CheckCircle2,
  Save,
  Loader2
} from 'lucide-react';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'password'>('details');

  // Edit fields state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [staffId, setStaffId] = useState(user?.staff_id || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setDesignation(user.designation || '');
      setStaffId(user.staff_id || '');
      setProfileImage(user.profile_image || '');
    }
  }, [user]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile/me`,
        {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          designation: designation.trim() || null,
          staff_id: staffId.trim() || null,
          profile_image: profileImage || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser(res.data);
      addToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err: any) {
      addToast('error', 'Update Failed', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile/avatar`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      setProfileImage(res.data.profile_image);
      updateUser({ profile_image: res.data.profile_image });
      addToast('success', 'Avatar Uploaded', 'New profile image updated successfully.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.response?.data?.detail || 'Failed to upload photo.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('error', 'Validation Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      addToast('error', 'Validation Error', 'New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addToast('success', 'Password Changed', 'Your password has been updated securely.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('details');
    } catch (err: any) {
      addToast('error', 'Change Failed', err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 font-bold text-2xl flex items-center justify-center overflow-hidden shadow-xs">
              {profileImage ? (
                <img
                  src={
                    profileImage.startsWith('http')
                      ? profileImage
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${profileImage}`
                  }
                  alt={user?.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.full_name?.charAt(0) || 'U'
              )}
            </div>
            <label className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{user?.full_name}</h1>
              <StatusBadge status={user?.status || 'ACTIVE'} size="sm" />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>{user?.designation || 'Faculty'}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{user?.department?.name || 'Department'}</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">Staff ID: {user?.staff_id || 'Not Set'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'details'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'password'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security & Password
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Read-Only System Identity Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Account Security & Role
          </h2>

          <div className="space-y-3.5 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500">System Role</span>
              <span className="font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                {user?.role}
              </span>
            </div>

            <div className="pt-3.5 flex justify-between items-center">
              <span className="text-slate-500">Account Status</span>
              <StatusBadge status={user?.status || 'ACTIVE'} size="sm" />
            </div>

            <div className="pt-3.5 flex justify-between items-center">
              <span className="text-slate-500">Institutional Email</span>
              <span className="font-medium text-slate-900 truncate max-w-[160px]">{user?.email}</span>
            </div>

            <div className="pt-3.5 flex justify-between items-center">
              <span className="text-slate-500">Department Code</span>
              <span className="font-bold text-indigo-600">{user?.department?.short_code || 'N/A'}</span>
            </div>

            <div className="pt-3.5 flex justify-between items-center">
              <span className="text-slate-500">Member Since</span>
              <span className="text-slate-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="pt-3.5 flex justify-between items-center">
              <span className="text-slate-500">Last Session Login</span>
              <span className="text-slate-700 font-mono text-[11px]">
                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Active session'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
            * Note: Account status, institutional email, and designated authority role can only be altered by a system administrator.
          </div>
        </div>

        {/* Right Area: Profile Edit Form or Change Password Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          {activeTab === 'details' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact identity, academic title, and phone number.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Employee / Staff ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Academic Title / Designation
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Associate Professor"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Profile Photo URL (or use upload icon above)
                </label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Change Account Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protect your account with a secure passphrase.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
