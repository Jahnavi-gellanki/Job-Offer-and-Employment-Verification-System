import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Inbox, 
  Building2, 
  ExternalLink 
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import OfferCard from '../../components/OfferCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CandidateDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalOffers: 0,
    accepted: 0,
    pending: 0,
  });
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, offersRes] = await Promise.allSettled([
        api.get('/candidate/stats', token),
        api.get('/candidate/offers', token),
      ]);

      if (offersRes.status === 'fulfilled' && offersRes.value) {
        const list = Array.isArray(offersRes.value)
          ? offersRes.value
          : offersRes.value.offers || offersRes.value.data || [];
        setOffers(list);

        // Compute candidate stats
        const total = list.length;
        const accepted = list.filter((o) => o.status === 'accepted').length;
        const pending = list.filter((o) => o.status === 'issued' || o.status === 'pending').length;

        setStats({
          totalOffers: total,
          accepted,
          pending,
        });
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value.stats || statsRes.value.data || statsRes.value;
        // Backend returns: { total, pending, accepted, rejected, revoked }
        setStats((prev) => ({
          totalOffers: s.total ?? s.totalOffers ?? prev.totalOffers,
          accepted: s.accepted ?? prev.accepted,
          pending: s.pending ?? prev.pending,
        }));
      }
    } catch (err) {
      console.error('Candidate data error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRespond = async (offer, responseType) => {
    // Always use UUID offerId for the respond endpoint
    const id = offer.offerId || offer._id;
    try {
      await api.put(`/candidate/offers/${id}/respond`, { response: responseType }, token);
      toast.success(`Job offer ${responseType} successfully!`);
      fetchData();
    } catch (err) {
      console.error('Failed to respond to offer:', err);
      toast.error(err.message || `Failed to update offer status`);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading candidate portal..." />;
  }

  const filteredOffers = offers.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      (o.jobTitle || '').toLowerCase().includes(q) ||
      (o.companyId?.name || o.companyName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Candidate Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Hello, {user?.name || 'Candidate'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Review, cryptographically verify, and accept or decline your official employment offers.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition self-start sm:self-center"
          title="Refresh Offers"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={FileCheck}
          value={stats.totalOffers}
          label="Offers Received"
          color="blue"
          subtitle="Issued to your email"
        />
        <StatsCard
          icon={CheckCircle2}
          value={stats.accepted}
          label="Offers Accepted"
          color="emerald"
          subtitle="Accepted contracts"
        />
        <StatsCard
          icon={Clock}
          value={stats.pending}
          label="Action Required"
          color="amber"
          subtitle="Pending candidate decision"
        />
      </div>

      {/* Offers List & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Received Job Offers</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {filteredOffers.length}
            </span>
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title or company..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
        </div>

        {filteredOffers.length === 0 ? (
          <div className="rounded-3xl bg-[#1e293b]/50 border border-white/10 p-12 text-center">
            <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-white">No Offers Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Employers issue offers matching your registered email address ({user?.email}). Any newly registered offers will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer._id || offer.offerId}
                offer={offer}
                isCandidateView={true}
                onAccept={() => handleRespond(offer, 'accepted')}
                onReject={() => handleRespond(offer, 'rejected')}
                customActions={
                  <a
                    href={`/verify/result/${offer.offerId || offer._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-400 transition"
                  >
                    <span>Verify Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
