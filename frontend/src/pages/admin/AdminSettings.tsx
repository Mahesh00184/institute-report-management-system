import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import {
  Building2,
  FileText,
  Shield,
  Save,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface SettingsData {
  id?: number;
  institute_name: string;
  logo_url?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  default_academic_year_id?: number | null;
  submission_deadline?: string | null;
  report_naming_format: string;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'institute' | 'report' | 'security'>('institute');
  const [settings, setSettings] = useState<SettingsData>({
    institute_name: 'National Institute of Technology & Management',
    logo_url: '/logo.png',
    address: 'Academic Ridge, Knowledge City, New Delhi 110001',
    email: 'registrar@institute.edu',
    phone: '+91-11-23456789',
    website: 'https://institute.edu',
    report_naming_format: 'AR_{YEAR}_{DEPT}',
    submission_deadline: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/settings/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err: any) {
        addToast('error', 'Load Error', 'Failed to load institutional settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/settings/`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(res.data);
      addToast('success', 'Settings Saved', 'Institutional configuration updated successfully.');
    } catch (err: any) {
      addToast('error', 'Save Error', err.response?.data?.detail || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Portal Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure institute profile branding, annual report compilation guidelines, and security parameters.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs w-fit">
        <button
          onClick={() => setActiveTab('institute')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'institute'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" /> Institute Profile
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'report'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Report Configuration
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" /> Security & Policy
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === 'institute' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-900">Institutional Branding & Contact</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Institute Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.institute_name}
                    onChange={(e) => setSettings({ ...settings, institute_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto pointer-events-none" />
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto pointer-events-none" />
                    <input
                      type="tel"
                      value={settings.phone || ''}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Portal Website URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto pointer-events-none" />
                    <input
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="text"
                    value={settings.logo_url || ''}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Campus Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                    <textarea
                      rows={2}
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-900">Annual Report Deadlines & Naming</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Report File Naming Convention
                  </label>
                  <input
                    type="text"
                    value={settings.report_naming_format}
                    onChange={(e) => setSettings({ ...settings, report_naming_format: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Variables: &#123;YEAR&#125;, &#123;DEPT&#125;</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Submission Deadline
                  </label>
                  <input
                    type="date"
                    value={settings.submission_deadline ? settings.submission_deadline.split('T')[0] : ''}
                    onChange={(e) => setSettings({ ...settings, submission_deadline: e.target.value || null })}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs text-slate-600">
              <h2 className="text-sm font-bold text-slate-900">Security & Authentication Policy</h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Password Policy
                </div>
                <p>Passwords are securely hashed using industry-standard bcrypt algorithm with salted rounds.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Account Registration Gate
                </div>
                <p>
                  All newly registered department coordinators and faculty accounts must receive administrator approval before login is permitted.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Department Isolation Policy
                </div>
                <p>
                  Role-based access control enforces that Department Coordinators cannot access or modify reports belonging to another department.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
