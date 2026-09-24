import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AcademicYear } from '../../types';
import { Printer, Download, Eye, FileCheck2, Building2, BookOpen, Users, CheckCircle2 } from 'lucide-react';

export default function AdminReportBuilder() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | undefined>();
  const [aggregateData, setAggregateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Customization
  const [instituteName, setInstituteName] = useState('National Institute of Technology & Engineering');
  const [reportTitle, setReportTitle] = useState('ANNUAL PERFORMANCE & ACCREDITATION REPORT');
  const [selectedDepts, setSelectedDepts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchAggregateData(selectedYearId);
    }
  }, [selectedYearId]);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get<AcademicYear[]>('/academic-years/');
      setAcademicYears(res.data);
      const active = res.data.find((y) => y.status === 'OPEN') || res.data[0];
      if (active) setSelectedYearId(active.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAggregateData = async (ayId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/aggregate/${ayId}`);
      setAggregateData(res.data);
      // default select all approved departments
      const initialMap: Record<number, boolean> = {};
      res.data.departments?.forEach((d: any) => {
        initialMap[d.department_id] = true;
      });
      setSelectedDepts(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDept = (id: number) => {
    setSelectedDepts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadPDF = async () => {
    if (!selectedYearId) return;
    try {
      setDownloading(true);
      const res = await api.get(`/reports/generate-pdf/${selectedYearId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Institute_Annual_Report_${aggregateData?.academic_year_name || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to generate PDF. Ensure there are approved reports.');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const totals = aggregateData?.institute_totals || {};
  const visibleDepartments = aggregateData?.departments?.filter(
    (d: any) => selectedDepts[d.department_id] !== false
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Annual Report Builder & Publisher</h2>
          <p className="text-xs text-slate-500">
            Customize cover details, select verified department sections, preview and generate high-fidelity PDF
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading || !aggregateData || visibleDepartments.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Compiling PDF...' : 'Download Official PDF'}
        </button>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <select
              value={selectedYearId || ''}
              onChange={(e) => setSelectedYearId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} ({ay.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institute Title</label>
            <input
              type="text"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Report Subtitle</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Department Toggles */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Include Approved Departments ({visibleDepartments.length} of {aggregateData?.approved_departments_count || 0})
          </label>
          <div className="flex flex-wrap gap-2">
            {aggregateData?.departments?.map((d: any) => {
              const isChecked = selectedDepts[d.department_id] !== false;
              return (
                <button
                  key={d.department_id}
                  onClick={() => toggleDept(d.department_id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isChecked ? 'text-indigo-600' : 'text-slate-300'}`} />
                  {d.department_name} ({d.department_code})
                </button>
              );
            })}
          </div>
          {aggregateData?.approved_departments_count === 0 && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              No departmental reports are currently marked APPROVED for this academic year. Please approve submissions in the Review tab first.
            </p>
          )}
        </div>
      </div>

      {/* Document-Style Live Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden max-w-4xl mx-auto">
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-indigo-600" /> Document Preview (Print Simulation)
          </span>
          <span>A4 Letter Layout • ReportLab Vector Engine</span>
        </div>

        <div className="p-12 space-y-12 text-slate-800 font-serif">
          {/* COVER PAGE PREVIEW */}
          <div className="border border-slate-200 p-12 text-center rounded-lg bg-gradient-to-b from-slate-50/50 to-white min-h-[480px] flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md mb-6 font-sans">
                NIT
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-wider uppercase font-sans">
                {instituteName}
              </h1>
              <p className="text-sm font-semibold text-indigo-700 mt-3 tracking-wide font-sans">
                {reportTitle}
              </p>
              <div className="w-24 h-0.5 bg-indigo-600 mx-auto my-6" />
              <p className="text-base font-bold text-slate-800 font-sans">
                ACADEMIC YEAR: {aggregateData?.academic_year_name}
              </p>
            </div>

            <div className="text-xs text-slate-500 font-sans space-y-1">
              <p>Approved Institutional Performance Compilation</p>
              <p>Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            </div>
          </div>

          {/* EXECUTIVE SUMMARY PREVIEW */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-indigo-900 border-b border-indigo-900 pb-2 font-sans">
              Executive Institutional Summary
            </h2>
            <p className="text-xs text-slate-600 font-sans">
              Aggregated institutional statistics compiled exclusively from verified and approved departmental reports.
            </p>

            <table className="w-full text-xs text-left border border-slate-300 font-sans">
              <thead className="bg-indigo-900 text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Key Institutional Metric</th>
                  <th className="py-2.5 px-4 text-right">Consolidated Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50">
                  <td className="py-2 px-4 font-medium">Approved Departments Included</td>
                  <td className="py-2 px-4 text-right font-bold text-indigo-600">{visibleDepartments.length}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Full-Time Faculty</td>
                  <td className="py-2 px-4 text-right font-bold">{totals.total_faculty || 0}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-4 font-medium">Enrolled Students (UG + PG)</td>
                  <td className="py-2 px-4 text-right font-bold">{totals.total_students || 0}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Research Publications (Journals/Patents)</td>
                  <td className="py-2 px-4 text-right font-bold">{totals.total_publications || 0}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-4 font-medium">Student Projects & Innovations</td>
                  <td className="py-2 px-4 text-right font-bold">{totals.total_projects || 0}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Placement Offers Secured</td>
                  <td className="py-2 px-4 text-right font-bold">{totals.total_placed || 0}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-4 font-medium">Highest Compensation Package</td>
                  <td className="py-2 px-4 text-right font-bold text-emerald-600">₹{totals.highest_package || 0} LPA</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DEPARTMENT BREAKDOWN PREVIEW */}
          <div className="space-y-8">
            <h2 className="text-lg font-bold text-indigo-900 border-b border-indigo-900 pb-2 font-sans">
              Departmental Section Compilations
            </h2>

            {visibleDepartments.map((dept: any) => (
              <div key={dept.department_id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-sans">
                      Department of {dept.department_name} ({dept.department_code})
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">HOD: {dept.head_of_department}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                    APPROVED
                  </span>
                </div>

                <p className="text-xs text-slate-700 italic">
                  "{dept.department_info?.overview || 'Department dedicated to academic and research excellence.'}"
                </p>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-sans">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-slate-400 text-[10px]">Faculty</p>
                    <p className="font-bold text-slate-900">{dept.faculty?.length || 0}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-slate-400 text-[10px]">Students</p>
                    <p className="font-bold text-slate-900">{dept.student_statistics?.total_students || 0}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-slate-400 text-[10px]">Publications</p>
                    <p className="font-bold text-slate-900">{dept.research?.length || 0}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-slate-400 text-[10px]">Placed</p>
                    <p className="font-bold text-slate-900">{dept.placement?.placed_students || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
