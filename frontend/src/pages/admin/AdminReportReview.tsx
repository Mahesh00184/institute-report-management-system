import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { DepartmentReport, ReportReviewComment } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  History,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  FolderGit2,
  Calendar,
  Award,
  Briefcase,
  Network,
  Cpu,
  Paperclip,
  FileCheck,
  XCircle,
  ExternalLink
} from 'lucide-react';

export default function AdminReportReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('info');

  // Review Action Form
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [feedback, setFeedback] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Comment Box
  const [newComment, setNewComment] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get<DepartmentReport>(`/reports/${id}`);
      setReport(res.data);
      if (res.data.admin_feedback) {
        setFeedback(res.data.admin_feedback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleReviewAction = async (statusToSet: string) => {
    if (statusToSet === 'CORRECTION_REQUIRED' && !feedback.trim()) {
      setReviewError('Please provide correction instructions / remarks before requesting corrections.');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const res = await api.post<DepartmentReport>(`/reports/${id}/review`, {
        status: statusToSet,
        admin_feedback: feedback,
      });
      setReport(res.data);
      setReviewSuccess(`Report status updated to ${statusToSet.replace('_', ' ')} successfully!`);
    } catch (err: any) {
      setReviewError(err.response?.data?.detail || 'Failed to submit review action.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/reports/${id}/comment`, {
        comment: newComment,
        section_name: activeTab.toUpperCase(),
      });
      setNewComment('');
      fetchReport();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: '1. Department Info', icon: Building2 },
    { id: 'faculty', label: '2. Faculty', count: report.faculty?.length || 0, icon: Users },
    { id: 'students', label: '3. Student Stats', icon: GraduationCap },
    { id: 'research', label: '4. Research & Pubs', count: report.research?.length || 0, icon: BookOpen },
    { id: 'projects', label: '5. Projects', count: report.projects?.length || 0, icon: FolderGit2 },
    { id: 'events', label: '6. Events', count: report.events?.length || 0, icon: Calendar },
    { id: 'achievements', label: '7. Achievements', count: report.achievements?.length || 0, icon: Award },
    { id: 'placements', label: '8. Placements', icon: Briefcase },
    { id: 'collaborations', label: '9. Collaborations', count: report.collaborations?.length || 0, icon: Network },
    { id: 'infrastructure', label: '10. Infrastructure', count: report.infrastructures?.length || 0, icon: Cpu },
    { id: 'documents', label: '11. Documents', count: report.supporting_documents?.length || 0, icon: Paperclip },
    { id: 'history', label: 'Timeline & Remarks', count: report.history?.length || 0, icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/reports')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Back to Reports"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {report.department_name} ({report.department_code})
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  report.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : report.status === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-800'
                    : report.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800'
                    : report.status === 'CORRECTION_REQUIRED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {report.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Annual Session: <span className="font-semibold text-slate-700">{report.academic_year_name}</span> |
              Last updated: {report.last_updated ? new Date(report.last_updated).toLocaleString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Review Decision Panel */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" /> Administrative Review Decision
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select status and provide formal administrative remarks to the department coordinator
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleReviewAction('UNDER_REVIEW')}
              disabled={submittingReview}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-50"
            >
              Mark Under Review
            </button>
            <button
              onClick={() => handleReviewAction('CORRECTION_REQUIRED')}
              disabled={submittingReview}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
            >
              Request Correction
            </button>
            <button
              onClick={() => handleReviewAction('APPROVED')}
              disabled={submittingReview}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
            >
              Approve Report
            </button>
            <button
              onClick={() => handleReviewAction('REJECTED')}
              disabled={submittingReview}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Formal Admin Remarks & Instructions:
          </label>
          <textarea
            rows={2}
            placeholder="Provide constructive review remarks, section-specific corrections required, or commendations..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500"
          />
        </div>

        {reviewSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg">
            {reviewSuccess}
          </div>
        )}
        {reviewError && (
          <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {reviewError}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 text-xs font-medium">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="p-6">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Department Overview & Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-700">Department:</span> {report.department_name} ({report.department_code})
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Head of Department:</span> {report.department_info?.head_of_department || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Email:</span> {report.department_info?.email || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Phone:</span> {report.department_info?.phone || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <span className="font-semibold text-slate-700">Overview:</span>
                <p className="text-slate-600 bg-white p-3 border border-slate-200 rounded-lg">
                  {report.department_info?.overview || 'No overview provided.'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-700">Vision:</span>
                  <p className="text-slate-600 bg-white p-3 border border-slate-200 rounded-lg mt-1">
                    {report.department_info?.vision || 'No vision stated.'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Mission:</span>
                  <p className="text-slate-600 bg-white p-3 border border-slate-200 rounded-lg mt-1">
                    {report.department_info?.mission || 'No mission stated.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACULTY */}
          {activeTab === 'faculty' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Full-Time Faculty Roster ({report.faculty?.length || 0})</h3>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Designation</th>
                      <th className="py-2.5 px-4">Qualification</th>
                      <th className="py-2.5 px-4">Specialization</th>
                      <th className="py-2.5 px-4">Experience</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.faculty?.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{f.name}</td>
                        <td className="py-2.5 px-4 text-slate-700">{f.designation}</td>
                        <td className="py-2.5 px-4 text-slate-600">{f.qualification || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{f.specialization || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{f.experience_years} yrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Student Statistics Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{report.student_statistics?.total_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Male Students</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{report.student_statistics?.male_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Female Students</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{report.student_statistics?.female_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Undergraduate (UG)</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{report.student_statistics?.ug_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Postgraduate (PG)</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{report.student_statistics?.pg_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Graduating Cohort</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{report.student_statistics?.graduating_students || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESEARCH */}
          {activeTab === 'research' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Research & Publications ({report.research?.length || 0})</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-4">Authors</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Journal / Conference</th>
                      <th className="py-2.5 px-4">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.research?.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 max-w-xs">{r.title}</td>
                        <td className="py-2.5 px-4 text-slate-700">{r.authors}</td>
                        <td className="py-2.5 px-4">
                          <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                            {r.publication_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{r.journal_or_conference_name || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{r.year || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Student & Sponsored Projects ({report.projects?.length || 0})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.projects?.map((p, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{p.title}</h4>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.project_type}</span>
                    </div>
                    <p className="text-slate-600">Students: {p.student_names || '—'}</p>
                    <p className="text-slate-600">Faculty Guide: {p.faculty_guide || '—'}</p>
                    <p className="text-emerald-700 font-semibold">Grant / Funding: ₹{p.funding_amount || 0}</p>
                    {p.description && <p className="text-slate-500 text-[11px] pt-1">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: PLACEMENTS */}
          {activeTab === 'placements' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Placement & Recruitment Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Eligible Students</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{report.placement?.eligible_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Placed Students</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{report.placement?.placed_students || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Companies Visited</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{report.placement?.companies_visited || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Highest Package</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">₹{report.placement?.highest_package || 0} LPA</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Average Package</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">₹{report.placement?.average_package || 0} LPA</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Lowest Package</p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">₹{report.placement?.lowest_package || 0} LPA</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Uploaded Supporting Documents ({report.supporting_documents?.length || 0})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.supporting_documents?.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                      <p className="text-[11px] text-slate-400">{doc.file_name} ({Math.round(doc.file_size / 1024)} KB)</p>
                    </div>
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${doc.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="View file"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Audit & Submission History</h3>
              <div className="space-y-3">
                {report.history?.map((h) => (
                  <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{h.action.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{h.notes || 'No remarks provided.'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Actor: {h.actor_name || 'System'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
