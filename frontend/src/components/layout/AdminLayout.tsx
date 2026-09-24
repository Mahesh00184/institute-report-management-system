import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building,
  Calendar,
  LogOut,
  FileText,
  Sliders,
  Printer,
  History,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Settings,
  Search,
  User as UserIcon,
  ChevronDown,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/registrations?status=PENDING&limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPendingCount(res.data.pending_count || 0);
      } catch (err) {
        // silent fail
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Annual Reports', path: '/admin/reports', icon: FileText },
    { label: 'Registrations', path: '/admin/registrations', icon: UserCheck, badge: pendingCount },
    { label: 'Departments', path: '/admin/departments', icon: Building },
    { label: 'Users Directory', path: '/admin/users', icon: Users },
    { label: 'Academic Years', path: '/admin/academic-years', icon: Calendar },
    { label: 'Report Builder', path: '/admin/builder', icon: Printer },
    { label: 'Template Builder', path: '/admin/templates', icon: Sliders },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: History },
    { label: 'Portal Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Collapsible Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col fixed inset-y-0 z-20 transition-all duration-300`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shrink-0">
              AR
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-base font-black text-white tracking-tight block truncate">Annual Report</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block truncate">
                  Admin Authority
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden sm:block"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-900 animate-pulse">
                    {item.badge}
                  </span>
                ) : null}

                {isCollapsed && item.badge && item.badge > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-4">
            <Link
              to="/public/reports"
              target="_blank"
              title={isCollapsed ? 'Public Reports' : undefined}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-slate-800/40 rounded-xl transition"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Public Portal View</span>}
            </Link>
          </div>
        </nav>

        {/* User bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {!isCollapsed ? (
            <div className="space-y-3">
              <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0) || 'A'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate">{user?.full_name}</p>
                  <p className="text-[10px] text-indigo-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> System Admin
                  </p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-1.5 text-[11px] font-bold text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl transition gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-rose-400 hover:bg-rose-900/40 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content View */}
      <div className={`${isCollapsed ? 'pl-20' : 'pl-64'} flex-1 flex flex-col min-w-0 transition-all duration-300`}>
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs flex items-center justify-between px-6 sm:px-8">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-xs w-64 sm:w-80 text-left"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 truncate">Search portal records...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
              <Calendar className="w-3 h-3 text-indigo-600" /> Session 2025–2026
            </span>

            <NotificationBell />

            <div className="h-5 w-px bg-slate-200" />

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0) || 'A'
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-slate-900 leading-tight">{user?.full_name}</p>
                  <p className="text-[10px] text-slate-400">{user?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" /> My Profile
                  </Link>
                  <Link
                    to="/admin/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" /> Portal Settings
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
