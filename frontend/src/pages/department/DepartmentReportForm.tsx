import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  DepartmentReport,
  Faculty,
  Research,
  Project,
  Event,
  Achievement,
  Placement,
  IndustryCollaboration,
  Infrastructure,
  SupportingDocument
} from '../../types';
import {
  Save,
  Send,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
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
  ShieldAlert,
  Upload,
  ExternalLink
} from 'lucide-react';

export default function DepartmentReportForm() {
  const navigate = useNavigate();
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [deptInfo, setDeptInfo] = useState({
    overview: '',
    vision: '',
    mission: '',
    head_of_department: '',
    email: '',
    phone: '',
    hod_message: '',
  });
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState({
    total_students: 0,
    male_students: 0,
    female_students: 0,
    ug_students: 0,
    pg_students: 0,
    graduating_students: 0,
  });
  const [research, setResearch] = useState<Research[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [placement, setPlacement] = useState<Placement>({
    eligible_students: 0,
    placed_students: 0,
    highest_package: 0,
    average_package: 0,
    lowest_package: 0,
    companies_visited: 0,
  });
  const [collaborations, setCollaborations] = useState<IndustryCollaboration[]>([]);
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
  const [documents, setDocuments] = useState<SupportingDocument[]>([]);

  // Feedback & Save states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get<DepartmentReport>('/reports/my-report');
      const rep = res.data;
      setReport(rep);

      if (rep.department_info) {
        setDeptInfo({
          overview: rep.department_info.overview || '',
          vision: rep.department_info.vision || '',
          mission: rep.department_info.mission || '',
          head_of_department: rep.department_info.head_of_department || '',
          email: rep.department_info.email || '',
          phone: rep.department_info.phone || '',
          hod_message: rep.department_info.hod_message || '',
        });
      }
      setFaculty(rep.faculty || []);
      if (rep.student_statistics) {
        setStudents({
          total_students: rep.student_statistics.total_students || 0,
          male_students: rep.student_statistics.male_students || 0,
          female_students: rep.student_statistics.female_students || 0,
          ug_students: rep.student_statistics.ug_students || 0,
          pg_students: rep.student_statistics.pg_students || 0,
          graduating_students: rep.student_statistics.graduating_students || 0,
        });
      }
      setResearch(rep.research || []);
      setProjects(rep.projects || []);
      setEvents(rep.events || []);
      setAchievements(rep.achievements || []);
      if (rep.placement) {
        setPlacement(rep.placement);
      }
      setCollaborations(rep.collaborations || []);
      setInfrastructures(rep.infrastructures || []);
      setDocuments(rep.supporting_documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const isReadOnly =
    report?.status === 'APPROVED' || report?.status === 'SUBMITTED' || report?.status === 'UNDER_REVIEW';

  const handleSaveDraft = async (silent = false) => {
    if (!report || isReadOnly) return;
    setSaveStatus('saving');
    try {
      const payload = {
        department_info: {
          ...report.department_info,
          ...deptInfo,
        },
        faculty: faculty.map((f) => ({
          name: f.name,
          designation: f.designation,
          qualification: f.qualification,
          specialization: f.specialization,
          experience_years: Number(f.experience_years) || 0,
        })),
        student_statistics: {
          total_students: Number(students.total_students) || 0,
          male_students: Number(students.male_students) || 0,
          female_students: Number(students.female_students) || 0,
          ug_students: Number(students.ug_students) || 0,
          pg_students: Number(students.pg_students) || 0,
          graduating_students: Number(students.graduating_students) || 0,
        },
        research: research.map((r) => ({
          title: r.title,
          authors: r.authors,
          publication_type: r.publication_type,
          journal_or_conference_name: r.journal_or_conference_name,
          year: Number(r.year) || new Date().getFullYear(),
          doi_link: r.doi_link,
        })),
        projects: projects.map((p) => ({
          title: p.title,
          project_type: p.project_type,
          student_names: p.student_names,
          faculty_guide: p.faculty_guide,
          funding_amount: Number(p.funding_amount) || 0,
          description: p.description,
        })),
        events: events.map((e) => ({
          event_name: e.event_name,
          event_type: e.event_type,
          venue: e.venue,
          organizer: e.organizer,
          participants_count: Number(e.participants_count) || 0,
          description: e.description,
        })),
        achievements: achievements.map((a) => ({
          title: a.title,
          person_or_team: a.person_or_team,
          category: a.category,
          level: a.level,
          description: a.description,
        })),
        placement: {
          eligible_students: Number(placement.eligible_students) || 0,
          placed_students: Number(placement.placed_students) || 0,
          highest_package: Number(placement.highest_package) || 0,
          average_package: Number(placement.average_package) || 0,
          lowest_package: Number(placement.lowest_package) || 0,
          companies_visited: Number(placement.companies_visited) || 0,
        },
        collaborations: collaborations.map((c) => ({
          company_name: c.company_name,
          mou_signed: Boolean(c.mou_signed),
          collaborative_activities: c.collaborative_activities,
        })),
        infrastructures: infrastructures.map((inf) => ({
          facility_name: inf.facility_name,
          lab_type: inf.lab_type,
          major_equipment: inf.major_equipment,
          cost: Number(inf.cost) || 0,
          area_sqft: Number(inf.area_sqft) || 0,
        })),
      };

      await api.put(`/reports/${report.id}/draft`, payload);
      setSaveStatus('saved');
      if (!silent) setStatusMessage('Draft saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err.response?.data?.detail || 'Failed to save draft.');
      setTimeout(() => setSaveStatus('idle'), 3500);
    }
  };

  const handleSubmitReport = async () => {
    if (!report) return;
    if (!window.confirm('Are you ready to submit your annual report for administrative review?')) return;

    try {
      await handleSaveDraft(true);
      const res = await api.post<DepartmentReport>(`/reports/${report.id}/submit`);
      setReport(res.data);
      alert('Report successfully submitted for administrative verification!');
      navigate('/department/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit report.');
    }
  };

  // Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !docFile || !docTitle) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('title', docTitle);
      formData.append('document_type', 'Supporting Proof');

      const res = await api.post<SupportingDocument>(`/reports/${report.id}/upload-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments([...documents, res.data]);
      setDocTitle('');
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!report) return;
    try {
      await api.delete(`/reports/${report.id}/documents/${docId}`);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  const steps = [
    { title: 'Department Info', icon: Building2 },
    { title: 'Faculty', icon: Users },
    { title: 'Student Statistics', icon: GraduationCap },
    { title: 'Research & Publications', icon: BookOpen },
    { title: 'Projects', icon: FolderGit2 },
    { title: 'Events', icon: Calendar },
    { title: 'Achievements', icon: Award },
    { title: 'Placements', icon: Briefcase },
    { title: 'Collaborations', icon: Network },
    { title: 'Infrastructure', icon: Cpu },
    { title: 'Documents', icon: Paperclip },
    { title: 'Review & Submit', icon: CheckCircle2 },
  ];

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Save Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {report.department_name} Annual Report
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                report.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : report.status === 'SUBMITTED'
                  ? 'bg-blue-100 text-blue-800'
                  : report.status === 'CORRECTION_REQUIRED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {report.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Step {currentStep + 1} of {steps.length}: <span className="font-semibold text-slate-800">{steps[currentStep].title}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-indigo-600 font-medium animate-pulse">Saving draft...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          {!isReadOnly && (
            <button
              onClick={() => handleSaveDraft(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
          )}

          {currentStep === steps.length - 1 && !isReadOnly && (
            <button
              onClick={handleSubmitReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Send className="w-4 h-4" /> {report.status === 'CORRECTION_REQUIRED' ? 'Resubmit Report' : 'Submit Report'}
            </button>
          )}
        </div>
      </div>

      {/* Read-Only Notice Banner if already submitted */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p>
            This report has been <span className="font-bold">{report.status}</span>. Editing is locked while under administrative review or approval.
          </p>
        </div>
      )}

      {/* Correction Feedback Notice */}
      {report.status === 'CORRECTION_REQUIRED' && (
        <div className="bg-rose-50 border border-rose-300 p-4 rounded-xl space-y-1 text-xs text-rose-900">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" /> Admin Feedback / Correction Requested:
          </div>
          <p className="font-medium bg-white/80 p-2.5 rounded-lg border border-rose-200 text-rose-950">
            "{report.admin_feedback || 'Please update the highlighted sections.'}"
          </p>
        </div>
      )}

      {/* Steps Navigation Stepper Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex overflow-x-auto gap-1 text-xs font-medium">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === idx;
          const isDone = currentStep > idx;
          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : isDone
                  ? 'text-indigo-700 hover:bg-indigo-50 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : isDone ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {idx + 1}
              </span>
              <span>{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs min-h-[450px]">
        {/* STEP 1: Department Info */}
        {currentStep === 0 && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Step 1: Department Profile & Leadership</h3>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Head of Department (HOD)</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={deptInfo.head_of_department}
                onChange={(e) => setDeptInfo({ ...deptInfo, head_of_department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  disabled={isReadOnly}
                  value={deptInfo.email}
                  onChange={(e) => setDeptInfo({ ...deptInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={deptInfo.phone}
                  onChange={(e) => setDeptInfo({ ...deptInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Department Overview</label>
              <textarea
                rows={3}
                disabled={isReadOnly}
                placeholder="Comprehensive description of department initiatives, thrust areas, and curriculum..."
                value={deptInfo.overview}
                onChange={(e) => setDeptInfo({ ...deptInfo, overview: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Vision Statement</label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  placeholder="Departmental vision for next 5-10 years..."
                  value={deptInfo.vision}
                  onChange={(e) => setDeptInfo({ ...deptInfo, vision: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Mission Statement</label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  placeholder="Key educational missions and ethical pillars..."
                  value={deptInfo.mission}
                  onChange={(e) => setDeptInfo({ ...deptInfo, mission: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Faculty */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 2: Full-Time Faculty Details</h3>
                <p className="text-slate-500">Add all professors, associate professors, and assistant professors</p>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setFaculty([
                      ...faculty,
                      { name: '', designation: 'Assistant Professor', qualification: '', specialization: '', experience_years: 0 },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Faculty Member
                </button>
              )}
            </div>

            <div className="space-y-3">
              {faculty.map((f, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Name</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={f.name}
                      onChange={(e) => {
                        const copy = [...faculty];
                        copy[idx].name = e.target.value;
                        setFaculty(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Designation</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={f.designation}
                      onChange={(e) => {
                        const copy = [...faculty];
                        copy[idx].designation = e.target.value;
                        setFaculty(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Qualification</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={f.qualification || ''}
                      onChange={(e) => {
                        const copy = [...faculty];
                        copy[idx].qualification = e.target.value;
                        setFaculty(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Specialization</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={f.specialization || ''}
                      onChange={(e) => {
                        const copy = [...faculty];
                        copy[idx].specialization = e.target.value;
                        setFaculty(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Exp (Yrs)</label>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={f.experience_years}
                        onChange={(e) => {
                          const copy = [...faculty];
                          copy[idx].experience_years = Number(e.target.value);
                          setFaculty(copy);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setFaculty(faculty.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition mb-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {faculty.length === 0 && (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  No faculty members recorded yet. Click "Add Faculty Member" above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Student Statistics */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Step 3: Student Statistics</h3>
            <p className="text-slate-500">Provide verified headcounts for academic auditing</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Total Enrolled Students</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={students.total_students}
                  onChange={(e) => setStudents({ ...students, total_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Graduating Batch Count</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={students.graduating_students}
                  onChange={(e) => setStudents({ ...students, graduating_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Male Students</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={students.male_students}
                  onChange={(e) => setStudents({ ...students, male_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Female Students</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={students.female_students}
                  onChange={(e) => setStudents({ ...students, female_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Undergraduate (UG)</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={students.ug_students}
                  onChange={(e) => setStudents({ ...students, ug_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Postgraduate (PG)</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={students.pg_students}
                  onChange={(e) => setStudents({ ...students, pg_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Research */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 4: Research Papers & Patents</h3>
                <p className="text-slate-500">Record publications in indexed journals, conferences, and patents</p>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setResearch([
                      ...research,
                      { title: '', authors: '', publication_type: 'Journal', year: new Date().getFullYear() },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Publication
                </button>
              )}
            </div>

            <div className="space-y-3">
              {research.map((r, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Paper Title</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={r.title}
                      onChange={(e) => {
                        const copy = [...research];
                        copy[idx].title = e.target.value;
                        setResearch(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Authors</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={r.authors}
                      onChange={(e) => {
                        const copy = [...research];
                        copy[idx].authors = e.target.value;
                        setResearch(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                    <select
                      disabled={isReadOnly}
                      value={r.publication_type}
                      onChange={(e) => {
                        const copy = [...research];
                        copy[idx].publication_type = e.target.value;
                        setResearch(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Journal">Journal</option>
                      <option value="Conference">Conference</option>
                      <option value="Patent">Patent</option>
                      <option value="Book Chapter">Book Chapter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Year</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={r.year || ''}
                      onChange={(e) => {
                        const copy = [...research];
                        copy[idx].year = Number(e.target.value);
                        setResearch(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="DOI Link"
                      value={r.doi_link || ''}
                      onChange={(e) => {
                        const copy = [...research];
                        copy[idx].doi_link = e.target.value;
                        setResearch(copy);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setResearch(research.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Placements */}
        {currentStep === 7 && (
          <div className="space-y-4 max-w-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Step 8: Placement & Corporate Recruitment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Eligible Students</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={placement.eligible_students}
                  onChange={(e) => setPlacement({ ...placement, eligible_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Placed Students</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={placement.placed_students}
                  onChange={(e) => setPlacement({ ...placement, placed_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Highest Package (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isReadOnly}
                  value={placement.highest_package}
                  onChange={(e) => setPlacement({ ...placement, highest_package: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Average Package (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isReadOnly}
                  value={placement.average_package}
                  onChange={(e) => setPlacement({ ...placement, average_package: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Recruiting Companies Visited</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={placement.companies_visited}
                  onChange={(e) => setPlacement({ ...placement, companies_visited: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 11: Documents */}
        {currentStep === 10 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Step 11: Supporting Documents & Verification Files</h3>
            {!isReadOnly && (
              <form onSubmit={handleUploadDocument} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., NBA Accreditation Proof / MoUs"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">File Attachment *</label>
                  <input
                    type="file"
                    required
                    ref={fileInputRef}
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {uploadingDoc ? 'Uploading...' : 'Upload File'}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                    <p className="text-[11px] text-slate-400">{doc.file_name} ({Math.round(doc.file_size / 1024)} KB)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${doc.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Download/View"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 12: Review & Submit */}
        {currentStep === 11 && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 12: Review Summary & Submission</h3>
              <p className="text-slate-500 mt-0.5">Check all entered numbers before formal transmission</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">Department:</span>
                <span className="font-bold text-slate-900">{report.department_name} ({report.department_code})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">Faculty Members:</span>
                <span className="font-bold text-slate-900">{faculty.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">Total Enrolled Students:</span>
                <span className="font-bold text-slate-900">{students.total_students}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">Research Publications:</span>
                <span className="font-bold text-slate-900">{research.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">Placement Record:</span>
                <span className="font-bold text-slate-900">
                  {placement.placed_students} / {placement.eligible_students} ({placement.highest_package} LPA Max)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Uploaded Verified Files:</span>
                <span className="font-bold text-slate-900">{documents.length}</span>
              </div>
            </div>

            {!isReadOnly ? (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                <p className="text-indigo-900 font-medium">
                  By submitting this report, you verify that all faculty, publications, statistics, and placements have been certified by the Head of Department.
                </p>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {report.status === 'CORRECTION_REQUIRED' ? 'Confirm & Resubmit Report' : 'Submit Final Report'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                This report is formally submitted with status: {report.status}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" /> Previous Section
        </button>

        <button
          type="button"
          disabled={currentStep === steps.length - 1}
          onClick={() => {
            handleSaveDraft(true);
            setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-40"
        >
          Next Section <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
