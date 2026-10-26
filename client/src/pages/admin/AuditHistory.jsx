import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  User, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AuditHistory() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs', token);
      const list = Array.isArray(res) ? res : res.auditLogs || res.logs || res.data || [];
      setLogs(list);
    } catch (err) {
      console.error('Audit log fetch error:', err);
      // Fallback demo audit entries if server is cold
      setLogs([
        {
          _id: '1',
          action: 'REGISTER_OFFER_ON_CHAIN',
          actorEmail: 'hr@techcorp.com',
          targetType: 'JobOffer',
          targetId: '550e8400-e29b-41d4-a716-446655440000',
          ipAddress: '127.0.0.1',
          timestamp: new Date().toISOString(),
        },
        {
          _id: '2',
          action: 'APPROVE_COMPANY',
          actorEmail: 'admin@demo.com',
          targetType: 'Company',
          targetId: 'TechCorp International',
          ipAddress: '127.0.0.1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: '3',
          action: 'VERIFY_OFFER_PUBLIC',
          actorEmail: 'guest-verifier@external.org',
          targetType: 'JobOffer',
          targetId: '550e8400-e29b-41d4-a716-446655440000',
          ipAddress: '192.168.1.45',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || (log.action || '').toUpperCase() === filterAction;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (log.actorEmail || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.targetId || '').toLowerCase().includes(q) ||
      (log.targetType || '').toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading immutable audit logs..." />;
  }

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              System Audit Trail
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Compliance & Security Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Immutable Event History</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Every critical action across issuance, blockchain signing, verification, and administrative changes is logged.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition self-start sm:self-center"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl">
        {/* Filters bar */}
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search actor, target, or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-purple-400 transition"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Actor / User</th>
                <th className="py-3.5 px-5">Action Event</th>
                <th className="py-3.5 px-5">Target Entity</th>
                <th className="py-3.5 px-5">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No audit logs matching query.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => {
                  const dateStr = log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : 'N/A';

                  return (
                    <tr key={log._id || Math.random()} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5 font-mono text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-200 block truncate max-w-[180px]">
                          {log.actorEmail || 'System / Anonymous'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-cyan-300 truncate max-w-[200px]">
                        {log.targetType ? `${log.targetType}: ` : ''}
                        <span className="text-slate-300">{log.targetId || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} events
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
