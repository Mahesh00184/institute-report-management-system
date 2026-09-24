import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import UserProfile from "./pages/profile/UserProfile";

import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminAcademicYears from "./pages/admin/AdminAcademicYears";
import AdminReports from "./pages/admin/AdminReports";
import AdminReportReview from "./pages/admin/AdminReportReview";
import AdminReportBuilder from "./pages/admin/AdminReportBuilder";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";

import DepartmentLayout from "./components/layout/DepartmentLayout";
import DepartmentDashboard from "./pages/department/DepartmentDashboard";
import DepartmentReportForm from "./pages/department/DepartmentReportForm";

import PublicLayout from "./components/layout/PublicLayout";
import PublicReports from "./pages/public/PublicReports";
import { BookOpen, LogIn, ShieldCheck, ArrowRight, Building2, UserPlus } from "lucide-react";

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg">
            AR
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">Institutional Portal</span>
            <span className="block text-xs text-indigo-400 font-semibold">Institute Annual Report Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/public/reports"
            className="text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Public Reports
          </Link>
          <Link
            to="/register"
            className="text-xs font-semibold text-slate-300 hover:text-white transition hidden sm:inline"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </Link>
        </div>
      </header>

      {/* Hero Body */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> NAAC A++ & NIRF Institutional Reporting Platform
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Centralized Institutional Annual Report Management
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Multi-department academic reporting, document audit verification, user onboarding workflows, and ReportLab high-resolution PDF publication for higher education institutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/public/reports"
            className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" /> View Published Annual Reports
          </Link>

          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" /> Sign In to Portal <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" /> Register Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Department Submissions</h3>
            <p className="text-xs text-slate-400">
              Structured entry covering faculty, student statistics, publications, projects, events, and placements.
            </p>
          </div>

          <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Administrative Review</h3>
            <p className="text-xs text-slate-400">
              Multi-step approval pipeline with user registrations approval, correction feedback, and audit trails.
            </p>
          </div>

          <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Publication & PDF</h3>
            <p className="text-xs text-slate-400">
              Automated aggregation engine producing public web reports and official ReportLab print PDFs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        National Institute of Technology &amp; Management • Annual Report Portal
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Public Reports */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<PublicLayout />}>
            <Route path="/public/reports" element={<PublicReports />} />
          </Route>

          {/* User Profile (Accessible to both Admin & Department users) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DEPARTMENT', 'FACULTY']} />}>
            <Route path="/profile" element={<AdminLayout />}>
              <Route index element={<UserProfile />} />
            </Route>
          </Route>

          {/* Protected ADMIN Portal */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="registrations" element={<AdminRegistrations />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="academic-years" element={<AdminAcademicYears />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="reports/:id" element={<AdminReportReview />} />
              <Route path="builder" element={<AdminReportBuilder />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          {/* Protected DEPARTMENT Portal */}
          <Route element={<ProtectedRoute allowedRoles={['DEPARTMENT', 'FACULTY', 'ADMIN']} />}>
            <Route path="/department" element={<DepartmentLayout />}>
              <Route index element={<Navigate to="/department/dashboard" replace />} />
              <Route path="dashboard" element={<DepartmentDashboard />} />
              <Route path="report" element={<DepartmentReportForm />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
