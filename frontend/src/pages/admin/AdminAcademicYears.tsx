import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AcademicYear } from '../../types';
import { Calendar, Plus, Edit2, Trash2, Globe, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminAcademicYears() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    submission_deadline: '',
    description: '',
    status: 'OPEN' as AcademicYear['status'],
  });
  const [error, setError] = useState('');

  const fetchYears = async () => {
    try {
      setLoading(true);
      const res = await api.get<AcademicYear[]>('/academic-years/');
      setAcademicYears(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const openAddModal = () => {
    setEditingYear(null);
    setFormData({
      name: '',
      start_date: '2025-07-01',
      end_date: '2026-06-30',
      submission_deadline: '2026-05-31',
      description: '',
      status: 'OPEN',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (ay: AcademicYear) => {
    setEditingYear(ay);
    setFormData({
      name: ay.name,
      start_date: ay.start_date,
      end_date: ay.end_date,
      submission_deadline: ay.submission_deadline,
      description: ay.description || '',
      status: ay.status,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingYear) {
        await api.put(`/academic-years/${editingYear.id}`, formData);
      } else {
        await api.post('/academic-years/', formData);
      }
      setIsModalOpen(false);
      fetchYears();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save academic year.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the academic year '${name}'?`)) return;
    try {
      await api.delete(`/academic-years/${id}`);
      fetchYears();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete academic year.');
    }
  };

  const getStatusBadge = (status: AcademicYear['status']) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">OPEN FOR SUBMISSION</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1"><Globe className="w-3 h-3" /> PUBLISHED PUBLICLY</span>;
      case 'SUBMISSION_CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">DEADLINE CLOSED</span>;
      case 'UNDER_COMPILATION':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">UNDER COMPILATION</span>;
      case 'ARCHIVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">ARCHIVED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Year & Reporting Cycles</h2>
          <p className="text-xs text-slate-500">Manage institutional reporting windows, submission deadlines, and publication states</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Academic Year
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading academic years...</div>
        ) : academicYears.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No academic years found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-6">Session Name</th>
                  <th className="py-3 px-4">Session Duration</th>
                  <th className="py-3 px-4">Submission Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {academicYears.map((ay) => (
                  <tr key={ay.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{ay.name}</span>
                          {ay.description && (
                            <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{ay.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {ay.start_date} <span className="text-slate-400">to</span> {ay.end_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium text-rose-600">
                        <Clock className="w-3.5 h-3.5" />
                        {ay.submission_deadline}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ay.status)}</td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ay)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ay.id, ay.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingYear ? 'Edit Academic Year' : 'Create Academic Year'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Academic Year Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2025-2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Department Submission Deadline *</label>
                <input
                  type="date"
                  required
                  value={formData.submission_deadline}
                  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Lifecycle Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DRAFT">DRAFT (Internal Preparation)</option>
                  <option value="OPEN">OPEN (Accepting Department Reports)</option>
                  <option value="SUBMISSION_CLOSED">SUBMISSION_CLOSED (Deadline Passed)</option>
                  <option value="UNDER_COMPILATION">UNDER_COMPILATION (Admin Review)</option>
                  <option value="PUBLISHED">PUBLISHED (Available on Public Portal)</option>
                  <option value="ARCHIVED">ARCHIVED (Historic Archive)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about reporting guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  {editingYear ? 'Save Changes' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
