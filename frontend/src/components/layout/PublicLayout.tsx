import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, LogIn, ShieldAlert } from 'lucide-react';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
              AR
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">National Institute Portal</span>
              <span className="block text-[11px] text-slate-500 font-medium leading-none">Annual Performance Publications</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/public/reports"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                location.pathname.startsWith('/public/reports')
                  ? 'text-indigo-600 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published Reports
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" /> Portal Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Institute Annual Report Portal. Official Transparency & Accreditation Repository.</p>
          <p className="mt-1 text-slate-400">Strictly verified data published under institutional governance.</p>
        </div>
      </footer>
    </div>
  );
}
