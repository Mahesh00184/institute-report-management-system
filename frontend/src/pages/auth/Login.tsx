import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/login`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const token = response.data.access_token;
      const user = response.data.user;

      login(token, user);

      if (rememberMe) {
        localStorage.setItem('remembered_email', email.trim());
      } else {
        localStorage.removeItem('remembered_email');
      }

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'DEPARTMENT') {
        navigate('/department/dashboard');
      } else {
        navigate('/department/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError("Network error: Unable to connect to the server. Please check if the backend is running.");
      } else if (err.response.status >= 500) {
        setError("An internal server error occurred. Please contact the administrator.");
      } else {
        const detail = err.response.data?.detail;
        setError(
          typeof detail === 'string'
            ? detail
            : 'Sign in failed. Please verify your credentials or check with the administrator.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Column: Institutional Brand & Metric Highlights */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-950/40 via-transparent to-slate-950/80 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-600/30">
              AR
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">Institute Portal</span>
              <span className="block text-xs text-indigo-400 font-semibold tracking-wide">
                National Institute of Technology & Management
              </span>
            </div>
          </div>

          <div className="mt-16 space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> NAAC A++ & NBA Accredited Institution
            </div>
            <h1 className="text-3xl font-black text-white leading-tight">
              Centralized Annual Report Management Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Unified governance, multi-department academic reporting, document audit verification, and ReportLab high-resolution compilation engine.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-4 max-w-md pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2 text-indigo-400">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-200">Department Audits</span>
            </div>
            <p className="text-[11px] text-slate-400">
              12 sections tracking faculty, R&D, placements, and achievements.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-200">Official Publication</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Print-ready automated PDF generation and public web archival.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6">
          <span>&copy; {new Date().getFullYear()} Annual Report Management Platform</span>
          <Link to="/public/reports" className="hover:text-indigo-400 transition flex items-center gap-1 font-semibold">
            <BookOpen className="w-3.5 h-3.5" /> Public Reports
          </Link>
        </div>
      </div>

      {/* Right Column: Clean Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
                AR
              </div>
              <span className="text-base font-bold text-slate-900">Institute Annual Report Portal</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your institutional credentials to access your departmental or administrative dashboard.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@institute.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 placeholder:text-slate-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 placeholder:text-slate-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-xs text-slate-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                Remember my email
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Registration link */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/80 text-center space-y-1.5">
            <p className="text-xs text-slate-600">New Department Coordinator or Faculty?</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              Register for Institutional Access <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Support help footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Need assistance? contact@institute.edu
            </span>
            <Link to="/public/reports" className="text-indigo-600 hover:underline">
              Public Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
