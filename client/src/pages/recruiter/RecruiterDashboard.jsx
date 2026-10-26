import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Search, Hash, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, ClipboardList,
  Building2, Loader2, ChevronRight, History, BarChart3
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const RESULT_CONFIG = {
  valid:     { icon: ShieldCheck,  color: 'emerald', label: 'Valid & Verified',        bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  invalid:   { icon: ShieldAlert,  color: 'rose',    label: 'Hash Mismatch / Invalid', bg: 'bg-rose-500/10 border-rose-500/30',       text: 'text-rose-400'    },
  revoked:   { icon: AlertTriangle,color: 'amber',   label: 'Offer Revoked',           bg: 'bg-amber-500/10 border-amber-500/30',     text: 'text-amber-400'   },
  not_found: { icon: XCircle,      color: 'slate',   label: 'Not Found',               bg: 'bg-slate-700/30 border-slate-600',        text: 'text-slate-400'   },
};

function ResultBanner({ result }) {
  if (!result) return null;
  const cfg = RESULT_CONFIG[result.result] || RESULT_CONFIG.not_found;
  const Icon = cfg.icon;
  return (
    <div className={`p-4 rounded-2xl border ${cfg.bg} flex items-start gap-3`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.text}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
        {result.offer && (
          <p className="text-xs text-slate-300 mt-0.5">
            <span className="font-semibold text-white">{result.offer.jobTitle}</span>
            {result.offer.company?.name && <> · {result.offer.company.name}</>}
            {result.offer.candidateName && <> · {result.offer.candidateName}</>}
          </p>
        )}
        {result.message && <p className="text-xs text-slate-400 mt-0.5">{result.message}</p>}
        {result.onChainData && (
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Block #{result.onChainData.issuedAt ? new Date(result.onChainData.issuedAt * 1000).toLocaleString() : 'N/A'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab]   = useState('verify-id');
  const [stats, setStats]           = useState({ total: 0, valid: 0, invalid: 0, revoked: 0, notFound: 0 });
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verify-by-ID state
  const [verifyId, setVerifyId]         = useState('');
  const [verifyIdResult, setVerifyIdResult] = useState(null);
  const [verifyingId, setVerifyingId]   = useState(false);

  // Verify-by-hash state
  const [hashOfferId, setHashOfferId]   = useState('');
  const [hashValue, setHashValue]       = useState('');
  const [hashResult, setHashResult]     = useState(null);
  const [verifyingHash, setVerifyingHash] = useState(false);

  // Employment confirm state
  const [confirmOfferId, setConfirmOfferId]   = useState('');
  const [confirmOrg, setConfirmOrg]           = useState('');
  const [confirmPurpose, setConfirmPurpose]   = useState('');
  const [confirmNotes, setConfirmNotes]       = useState('');
  const [confirming, setConfirming]           = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, histRes] = await Promise.allSettled([
        api.get('/recruiter/stats', token),
        api.get('/recruiter/history?limit=15', token),
      ]);
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.stats || {};
        setStats({ total: s.total ?? 0, valid: s.valid ?? 0, invalid: s.invalid ?? 0, revoked: s.revoked ?? 0, notFound: s.notFound ?? 0 });
      }
      if (histRes.status === 'fulfilled') {
        setHistory(histRes.value.logs || []);
      }
    } catch (err) {
      console.error('Recruiter fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleVerifyById = async (e) => {
    e.preventDefault();
    if (!verifyId.trim()) { toast.error('Enter an Offer ID'); return; }
    setVerifyingId(true);
    setVerifyIdResult(null);
    try {
      const res = await api.get(`/recruiter/verify/${verifyId.trim()}`, token);
      setVerifyIdResult(res);
      if (res.isValid) toast.success('Offer verified as valid!');
      else if (res.isRevoked) toast.error('Offer is revoked');
      else toast.error('Offer not valid');
      fetchData();
    } catch (err) {
      setVerifyIdResult({ result: 'not_found', message: err.message });
      toast.error(err.message || 'Verification failed');
    } finally {
      setVerifyingId(false);
    }
  };

  const handleVerifyByHash = async (e) => {
    e.preventDefault();
    if (!hashOfferId.trim() || !hashValue.trim()) { toast.error('Both Offer ID and hash are required'); return; }
    setVerifyingHash(true);
    setHashResult(null);
    try {
      const res = await api.post('/recruiter/verify-hash', { offerId: hashOfferId.trim(), documentHash: hashValue.trim() }, token);
      setHashResult(res);
      if (res.isValid) toast.success('Document hash verified — authentic!');
      else if (res.isRevoked) toast.error('Offer is revoked');
      else toast.error('Hash mismatch — document may be tampered');
      fetchData();
    } catch (err) {
      setHashResult({ result: 'not_found', message: err.message });
      toast.error(err.message || 'Hash verification failed');
    } finally {
      setVerifyingHash(false);
    }
  };

  const handleEmploymentConfirm = async (e) => {
    e.preventDefault();
    if (!confirmOfferId.trim() || !confirmOrg.trim()) { toast.error('Offer ID and organization are required'); return; }
    setConfirming(true);
    try {
      const res = await api.post(`/recruiter/employment-confirm/${confirmOfferId.trim()}`, {
        organization: confirmOrg,
        purpose: confirmPurpose,
        notes: confirmNotes,
      }, token);
      toast.success('Employment confirmation recorded on blockchain!');
      setConfirmOfferId(''); setConfirmOrg(''); setConfirmPurpose(''); setConfirmNotes('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to record employment confirmation');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading recruiter portal..." />;

  const tabs = [
    { id: 'verify-id',   label: 'Verify by ID',   icon: Search },
    { id: 'verify-hash', label: 'Verify by Hash',  icon: Hash },
    { id: 'confirm',     label: 'Confirm Employment', icon: CheckCircle2 },
    { id: 'history',     label: 'My History',      icon: History },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Recruiter Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Welcome, {user?.name || 'Recruiter'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically verify job offers and record employment confirmations on Ethereum.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={ClipboardList} value={stats.total}    label="Total Checks"    color="blue"    subtitle="All verifications" />
        <StatsCard icon={ShieldCheck}   value={stats.valid}    label="Valid"           color="emerald" subtitle="Authentic offers"   />
        <StatsCard icon={ShieldAlert}   value={stats.invalid}  label="Invalid/Mismatch" color="rose"  subtitle="Tamper detected"    />
        <StatsCard icon={AlertTriangle} value={stats.revoked}  label="Revoked"         color="amber"   subtitle="Revoked by issuer"  />
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-900/80 p-1.5 border border-white/10">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Verify by ID ── */}
      {activeTab === 'verify-id' && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" /> Verify Offer by ID
          </h2>
          <p className="text-xs text-slate-400">
            Enter the Offer UUID to check its status against the database and Ethereum blockchain.
          </p>
          <form onSubmit={handleVerifyById} className="flex gap-3">
            <input
              type="text"
              value={verifyId}
              onChange={e => setVerifyId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-400 transition"
            />
            <button
              type="submit"
              disabled={verifyingId}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              {verifyingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify</span>
            </button>
          </form>
          {verifyIdResult && <ResultBanner result={verifyIdResult} />}
        </div>
      )}

      {/* ── TAB: Verify by Hash ── */}
      {activeTab === 'verify-hash' && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" /> Verify by Document Hash
          </h2>
          <p className="text-xs text-slate-400">
            Provide the Offer ID and the SHA-256 hash of the document to detect any tampering.
          </p>
          <form onSubmit={handleVerifyByHash} className="space-y-3">
            <input
              type="text"
              value={hashOfferId}
              onChange={e => setHashOfferId(e.target.value)}
              placeholder="Offer ID (UUID)"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition"
            />
            <input
              type="text"
              value={hashValue}
              onChange={e => setHashValue(e.target.value)}
              placeholder="SHA-256 hash (64-char hex, no 0x prefix)"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition"
            />
            <button
              type="submit"
              disabled={verifyingHash}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {verifyingHash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              <span>Verify Document Hash</span>
            </button>
          </form>
          {hashResult && <ResultBanner result={hashResult} />}
        </div>
      )}

      {/* ── TAB: Confirm Employment ── */}
      {activeTab === 'confirm' && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Record Employment Confirmation
          </h2>
          <p className="text-xs text-slate-400">
            Formally record an employment verification on the Ethereum blockchain. The offer must be active and on-chain.
          </p>
          <form onSubmit={handleEmploymentConfirm} className="space-y-3">
            <input
              type="text"
              value={confirmOfferId}
              onChange={e => setConfirmOfferId(e.target.value)}
              placeholder="Offer ID (UUID) *"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-400 transition"
            />
            <input
              type="text"
              value={confirmOrg}
              onChange={e => setConfirmOrg(e.target.value)}
              placeholder="Your Organization Name *"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
            />
            <input
              type="text"
              value={confirmPurpose}
              onChange={e => setConfirmPurpose(e.target.value)}
              placeholder="Purpose (e.g. Background check, Reference verification)"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
            />
            <textarea
              value={confirmNotes}
              onChange={e => setConfirmNotes(e.target.value)}
              rows={2}
              placeholder="Additional notes (optional)"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
            />
            <button
              type="submit"
              disabled={confirming}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{confirming ? 'Recording on Blockchain...' : 'Record Employment Confirmation'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" /> My Verification History
            </h2>
            <span className="text-xs text-slate-400">{history.length} recent checks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-5">Offer ID</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Result</th>
                  <th className="py-3 px-5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No verification history yet. Start verifying offers above.
                    </td>
                  </tr>
                ) : (
                  history.map((log) => {
                    const cfg = RESULT_CONFIG[log.result] || RESULT_CONFIG.not_found;
                    const Icon = cfg.icon;
                    return (
                      <tr key={log._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-5 font-mono text-slate-300 max-w-[200px] truncate">
                          {log.offerId}
                        </td>
                        <td className="py-3 px-5 capitalize text-slate-400">{log.verificationType}</td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center gap-1 font-semibold ${cfg.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="capitalize">{log.result.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
