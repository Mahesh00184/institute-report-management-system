import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AuditLog } from '../../types';
import { History, Filter, Search, ShieldCheck } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);
      if (emailFilter) params.append('user_email', emailFilter);

      const res = await api.get<AuditLog[]>(`/audit-logs/?${params.toString()}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    let color = 'bg-slate-100 text-slate-700';
    if (action === 'LOGIN') color = 'bg-blue-100 text-blue-800';
    else if (action === 'CREATE') color = 'bg-emerald-100 text-emerald-800';
    else if (action === 'UPDATE') color = 'bg-amber-100 text-amber-800';
    else if (action === 'SUBMIT' || action === 'RESUBMITTED') color = 'bg-indigo-100 text-indigo-800';
    else if (action === 'APPROVE') color = 'bg-emerald-100 text-emerald-800 font-bold';
    else if (action === 'REJECT' || action === 'CORRECTION_REQUIRED') color = 'bg-rose-100 text-rose-800';
    else if (action === 'PUBLISH') color = 'bg-purple-100 text-purple-800 font-bold';
    else if (action === 'GENERATE_PDF') color = 'bg-sky-100 text-sky-800';

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail & Security Logs</h2>
        <p className="text-xs text-slate-500">
          Immutable historical audit log tracking administrative reviews, status transitions, report revisions, and user logins
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="SUBMIT">SUBMIT</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="CORRECTION_REQUIRED">CORRECTION_REQUIRED</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="GENERATE_PDF">GENERATE_PDF</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          >
            <option value="">All Entities</option>
            <option value="REPORT">REPORT</option>
            <option value="USER">USER</option>
            <option value="DEPARTMENT">DEPARTMENT</option>
            <option value="ACADEMIC_YEAR">ACADEMIC_YEAR</option>
            <option value="TEMPLATE">TEMPLATE</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading audit log entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No audit log records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor Email</th>
                  <th className="py-3 px-6">Event Details</th>
                  <th className="py-3 px-4 text-right">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {log.entity} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
                      {log.user_email || 'System / Anonymous'}
                    </td>
                    <td className="py-3 px-6 text-slate-600 max-w-md">{log.details || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] text-right whitespace-nowrap">
                      {log.ip_address || 'Localhost'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
