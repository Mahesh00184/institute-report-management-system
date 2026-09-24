import { useState, useEffect } from 'react';
import api from '../../api/client';
import { ReportTemplate, ReportSection, AcademicYear } from '../../types';
import { Sliders, Plus, ArrowUp, ArrowDown, Trash2, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    title: '',
    description: '',
    section_type: 'TEXT',
    is_required: false,
    order_index: 10,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ayRes, tmplRes] = await Promise.all([
        api.get<AcademicYear[]>('/academic-years/'),
        api.get<ReportTemplate[]>('/templates/'),
      ]);
      setAcademicYears(ayRes.data);
      setTemplates(tmplRes.data);
      if (tmplRes.data.length > 0) {
        setSelectedTemplateId(tmplRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId);

  const toggleRequired = async (sec: ReportSection) => {
    try {
      await api.put(`/templates/sections/${sec.id}`, { is_required: !sec.is_required });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEnabled = async (sec: ReportSection) => {
    try {
      await api.put(`/templates/sections/${sec.id}`, { is_enabled: !sec.is_enabled });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const moveOrder = async (sec: ReportSection, delta: number) => {
    try {
      await api.put(`/templates/sections/${sec.id}`, { order_index: sec.order_index + delta });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSection = async (secId: number) => {
    if (!window.confirm('Are you sure you want to remove this section from the template?')) return;
    try {
      await api.delete(`/templates/sections/${secId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    try {
      await api.post(`/templates/${selectedTemplateId}/sections`, newSection);
      setIsAddSectionOpen(false);
      setNewSection({ title: '', description: '', section_type: 'TEXT', is_required: false, order_index: 10 });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const sortedSections = activeTemplate?.sections
    ? [...activeTemplate.sections].sort((a, b) => a.order_index - b.order_index)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Report Template Builder</h2>
          <p className="text-xs text-slate-500">
            Define mandatory and optional reporting sections, order, and titles for annual reporting cycles
          </p>
        </div>

        <button
          onClick={() => setIsAddSectionOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Custom Section
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center gap-3 text-xs text-indigo-900">
        <ShieldAlert className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <p>
          <span className="font-bold">Historical Integrity Safeguard:</span> Template updates modify future data entry definitions without altering or corrupting previously submitted and approved historical reports.
        </p>
      </div>

      {/* Template Selector & Section List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Active Template:</span>
            <select
              value={selectedTemplateId || ''}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              className="text-xs font-medium bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500">{sortedSections.length} configured sections</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-4">Section Title & Description</th>
                <th className="py-3 px-4">Section Type</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSections.map((sec, idx) => (
                <tr key={sec.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-6 font-mono font-bold text-slate-500">#{sec.order_index}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{sec.title}</p>
                    {sec.description && <p className="text-[11px] text-slate-400">{sec.description}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 font-medium">
                    {sec.section_type}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleRequired(sec)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                        sec.is_required
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sec.is_required ? 'MANDATORY' : 'OPTIONAL'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleEnabled(sec)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                        sec.is_enabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {sec.is_enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => moveOrder(sec, -1)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveOrder(sec, 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded ml-1"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Section Modal */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Report Section</h3>
              <button
                onClick={() => setIsAddSectionOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Patents & Commercialization"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Guidelines for department coordinators..."
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Section Type</label>
                  <select
                    value={newSection.section_type}
                    onChange={(e) => setNewSection({ ...newSection, section_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  >
                    <option value="TEXT">TEXT Form</option>
                    <option value="RESEARCH">RESEARCH Table</option>
                    <option value="PROJECTS">PROJECTS Table</option>
                    <option value="EVENTS">EVENTS Table</option>
                    <option value="ACHIEVEMENTS">ACHIEVEMENTS Table</option>
                    <option value="DOCUMENTS">DOCUMENTS Upload</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Requirement</label>
                  <select
                    value={newSection.is_required ? '1' : '0'}
                    onChange={(e) => setNewSection({ ...newSection, is_required: e.target.value === '1' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="0">Optional</option>
                    <option value="1">Mandatory</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
