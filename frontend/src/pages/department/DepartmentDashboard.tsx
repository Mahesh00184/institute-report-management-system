import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { DepartmentReport, AcademicYear } from '../../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Users,
  BookOpen,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

export default function DepartmentDashboard() {
  const navigate = useNavigate();
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReport();
  }, []);

  const fetchMyReport = async () => {
    try {
      setLoading(true);
      const res = await api.get<DepartmentReport>('/reports/my-report');
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const status = report?.status || 'DRAFT';

  // Calculate completion percentage based on filled sections
  const sectionsFilled = [
    Boolean(report?.department_info?.overview),
    (report?.faculty?.length || 0) > 0,
    Boolean(report?.student_statistics?.total_students),
    (report?.research?.length || 0) > 0,
    (report?.projects?.length || 0) > 0,
    (report?.events?.length || 0) > 0,
    (report?.achievements?.length || 0) > 0,
    Boolean(report?.placement?.eligible_students),
    (report?.collaborations?.length || 0) > 0,
    (report?.infrastructures?.length || 0) > 0,
  ];
  const progressPct = Math.round(
    (sectionsFilled.filter(Boolean).length / sectionsFilled.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Dept Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <Building2 className="w-4 h-4" />
            <span>{report?.department_name} ({report?.department_code})</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Annual Report Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reporting Session: <span className="font-semibold text-slate-700">{report?.academic_year_name}</span>
          </p>
        </div>

        <Link
          to="/department/report"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition"
        >
          <FileText className="w-4 h-4" />
          {status === 'DRAFT'
            ? 'Continue Editing Report'
            : status === 'CORRECTION_REQUIRED'
            ? 'Make Required Corrections'
            : 'View Submitted Report'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Admin Correction Notice Alert Banner */}
      {status === 'CORRECTION_REQUIRED' && (
        <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-2xl shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-rose-900 text-sm">Action Required: Correction Requested by Administration</h4>
              <p className="text-rose-800">
                The institutional review team has reviewed your submission and requested adjustments before final approval:
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-rose-950 font-medium mt-2">
                "{report?.admin_feedback || 'Please review required sections and resubmit.'}"
              </div>
              <p className="text-[11px] text-rose-600 pt-1">
                Click "Make Required Corrections" above to update the data and resubmit your report.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status & Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Report Status</p>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'SUBMITTED'
                  ? 'bg-blue-100 text-blue-800'
                  : status === 'UNDER_REVIEW'
                  ? 'bg-amber-100 text-amber-800'
                  : status === 'CORRECTION_REQUIRED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {status === 'SUBMITTED' && <Clock className="w-3.5 h-3.5" />}
              {status === 'CORRECTION_REQUIRED' && <AlertCircle className="w-3.5 h-3.5" />}
              {status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {status === 'DRAFT' && 'Your report is currently in draft state. Save progress anytime.'}
            {status === 'SUBMITTED' && 'Report submitted. Awaiting administrative review.'}
            {status === 'UNDER_REVIEW' && 'The review team is currently auditing your submission.'}
            {status === 'APPROVED' && 'Your departmental report is approved for the official institute publication!'}
            {status === 'CORRECTION_REQUIRED' && 'Corrections requested. Please update and resubmit.'}
          </p>
        </div>

        {/* Completion Progress Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Completion</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{progressPct}%</span>
            <span className="text-xs font-medium text-slate-400">10 Core Sections</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Submission Date / Deadline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission Record</p>
          <div className="text-xs space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted On:</span>
              <span className="font-semibold text-slate-800">
                {report?.submission_date ? new Date(report.submission_date).toLocaleDateString() : 'Not submitted yet'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Auto-saved:</span>
              <span className="font-semibold text-slate-800">
                {report?.last_updated ? new Date(report.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Faculty Roster</p>
            <p className="text-lg font-bold text-slate-900">{report?.faculty?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Publications</p>
            <p className="text-lg font-bold text-slate-900">{report?.research?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Placed Students</p>
            <p className="text-lg font-bold text-slate-900">{report?.placement?.placed_students || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Organized Events</p>
            <p className="text-lg font-bold text-slate-900">{report?.events?.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
