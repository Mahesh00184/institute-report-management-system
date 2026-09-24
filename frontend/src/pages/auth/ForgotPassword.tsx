import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`,
        { email: email.trim() }
      );

      setIsSuccess(true);
      if (res.data.dev_reset_token) {
        setDevResetToken(res.data.dev_reset_token);
        setDevResetLink(res.data.dev_reset_link);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
          </Link>

          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Forgot password?</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Enter your institutional email address and we will generate a secure reset link.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Reset Instructions Generated</p>
                <p className="mt-1">
                  A password reset token has been created for <span className="font-semibold">{email}</span>. Valid for 30 minutes.
                </p>
              </div>
            </div>

            {/* Development Environment Helper Banner */}
            {devResetLink && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Local Development Reset Helper</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  In this local environment without an external SMTP mail server, you can directly proceed with your generated reset token:
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 font-mono text-[10px] text-slate-700 break-all select-all">
                  {devResetToken}
                </div>
                <Link
                  to={devResetLink}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  Proceed to Reset Password <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@institute.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Token...
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
