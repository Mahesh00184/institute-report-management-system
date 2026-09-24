import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  Users,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  UserCheck,
  History,
  ArrowRight,
  ShieldCheck,
  Send,
  Calendar
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { StatusBadge } from '../../components/common/StatusBadge';

interface AcademicYear {
  id: number;
  name: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedYearId]);

  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/academic-years/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAcademicYears(res.data);
      const active = res.data.find((y: any) => y.status === 'OPEN') || res.data[0];
      if (active) setSelectedYearId(active.id);
    } catch (err) {
      console.error('Failed to load academic years', err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedYearId
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dashboard/stats?academic_year_id=${selectedYearId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dashboard/stats`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/${userId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStats();
    } catch (err) {
      console.error('Quick approve failed', err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const statusDist = stats?.status_distribution || [];
  const deptMetrics = stats?.department_metrics || [];
  const recentRegistrations = stats?.recent_registrations || [];
  const recentAudit = stats?.recent_audit || [];
  const recentActivity = stats?.recent_activity || [];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Session Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Institutional Authority Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, Administrator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status overview of annual report submissions across all institute departments.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <Calendar className="w-4 h-4 text-indigo-600 ml-2" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Session</span>
            <select
              value={selectedYearId || ''}
              onChange={(e) => setSelectedYearId(Number(e.target.value))}
              className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} ({ay.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Departments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Departments</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{kpis.total_departments || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Academic units active</p>
        </div>

        {/* Registered Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Users</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{kpis.total_users || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Coordinators & faculty</p>
        </div>

        {/* Pending Registrations */}
        <Link
          to="/admin/registrations"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-amber-300 transition group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-700">
              Registrations
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900">{kpis.pending_registrations || 0}</p>
            {kpis.pending_registrations > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse">
                Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium group-hover:text-indigo-600 flex items-center gap-1">
            Review requests <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Report Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completion</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{kpis.completion_percentage || 0}%</p>
          <p className="text-[11px] text-slate-400 font-medium">Session compilation rate</p>
        </div>

        {/* Approved Reports */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{kpis.approved_reports || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Ready for publication</p>
        </div>

        {/* Reports Awaiting Review */}
        <Link
          to="/admin/reports"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-indigo-300 transition group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-indigo-700">
              Needs Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{kpis.reports_awaiting_review || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium group-hover:text-indigo-600 flex items-center gap-1">
            Open review queue <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise Completion Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Report Submission Progress</h3>
              <p className="text-xs text-slate-500">Department-wise completion percentage based on audited sections</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Completion Progress']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="progress_percentage" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Status Distribution Donut Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Report Status Pipeline</h3>
            <p className="text-xs text-slate-500">Draft / Submitted / Review / Correction / Approved</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {statusDist.map((s: any) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 truncate">{s.name}:</span>
                <span className="font-bold text-slate-900 ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Streams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Registrations</h3>
            </div>
            <Link to="/admin/registrations" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All Queue
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent user registrations.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRegistrations.slice(0, 4).map((u: any) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-xs">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{u.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={u.status} size="sm" />
                    {u.status === 'PENDING' && (
                      <button
                        onClick={() => handleQuickApprove(u.id)}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Department Activity Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Department Activity & Audits</h3>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-indigo-600 hover:underline">
              Audit Trail
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent submission activities recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-2xl text-xs">
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.department}</span>
                      <span className="text-[10px] text-slate-400">
                        {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      <span className="font-semibold text-indigo-600">{act.action}:</span> {act.notes || 'Status changed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
