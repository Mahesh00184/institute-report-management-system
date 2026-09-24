import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AcademicYear } from '../../types';
import { BookOpen, Download, Calendar, Building2, Users, GraduationCap, Award, Briefcase, ExternalLink, ShieldCheck } from 'lucide-react';

export default function PublicReports() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | undefined>();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPublishedYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchPublicReport(selectedYearId);
    }
  }, [selectedYearId]);

  const fetchPublishedYears = async () => {
    try {
      setLoading(true);
      const res = await api.get<AcademicYear[]>('/public/academic-years');
      setAcademicYears(res.data);
      if (res.data.length > 0) {
        setSelectedYearId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicReport = async (ayId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/public/reports/${ayId}`);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedYearId) return;
    try {
      setDownloading(true);
      const res = await api.get(`/public/reports/${selectedYearId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Institute_Annual_Report_${reportData?.academic_year_name || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download public report PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const totals = reportData?.institute_totals || {};

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Accreditation Repository
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Institutional Annual Performance Reports
          </h1>
          <p className="text-xs text-indigo-200">
            Verified compilations of academic advancements, faculty research, student achievements, and campus placements.
          </p>
        </div>

        {academicYears.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-3 min-w-[240px]">
            <label className="block text-xs font-semibold text-indigo-200">Select Academic Year</label>
            <select
              value={selectedYearId || ''}
              onChange={(e) => setSelectedYearId(Number(e.target.value))}
              className="w-full text-xs font-bold bg-white text-slate-900 rounded-xl px-3 py-2 outline-none shadow-xs"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  Session {ay.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download Official PDF'}
            </button>
          </div>
        )}
      </div>

      {academicYears.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Annual Reports Published Yet</h3>
          <p className="text-xs text-slate-400">
            Official annual reports will appear here once approved and published by institute authorities.
          </p>
        </div>
      ) : (
        <>
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Faculty Body</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totals.total_faculty || 0}</p>
              <span className="text-[11px] text-slate-400">Full-Time Academic Staff</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Enrollment</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{totals.total_students || 0}</p>
              <span className="text-[11px] text-slate-400">{totals.ug_students || 0} UG | {totals.pg_students || 0} PG</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Research Publications</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{totals.total_publications || 0}</p>
              <span className="text-[11px] text-slate-400">Peer-Reviewed & Indexed</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campus Placements</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{totals.total_placed || 0}</p>
              <span className="text-[11px] text-slate-400">Avg ₹{totals.average_package || 0} LPA</span>
            </div>
          </div>

          {/* Department Breakdown Cards */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Departmental Highlights & Outcomes ({reportData?.departments?.length || 0} Departments)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportData?.departments?.map((dept: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {dept.department_name} ({dept.department_code})
                      </h3>
                      <p className="text-xs text-slate-500">HOD: {dept.head_of_department}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      VERIFIED
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {dept.department_info?.overview || 'Department driving academic and technical innovations.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px]">Faculty</p>
                      <p className="font-bold text-slate-900">{dept.faculty_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Publications</p>
                      <p className="font-bold text-slate-900">{dept.publications_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Placed</p>
                      <p className="font-bold text-slate-900">{dept.placements?.placed || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
