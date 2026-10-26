import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  PlusCircle, 
  FileCheck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EmployerDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalOffers: 0,
    onChainOffers: 0,
    acceptedOffers: 0,
    pendingOffers: 0,
  });
  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      const [statsRes, offersRes, companyRes] = await Promise.allSettled([
        api.get('/employer/stats', token),
        api.get('/employer/offers', token),
        api.get('/employer/company', token),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value.stats || statsRes.value.data || statsRes.value;
        setStats({
          totalOffers: s.totalOffers ?? s.total ?? 0,
          onChainOffers: s.onChainOffers ?? s.onChain ?? s.registeredOnChain ?? 0,
          acceptedOffers: s.acceptedOffers ?? s.accepted ?? 0,
          pendingOffers: s.pendingOffers ?? s.issued ?? s.issuedOffers ?? 0,
        });
      }

      if (companyRes.status === 'fulfilled' && companyRes.value?.company) {
        setCompany(companyRes.value.company);
      }

      if (offersRes.status === 'fulfilled' && offersRes.value) {
        const list = Array.isArray(offersRes.value)
          ? offersRes.value
          : offersRes.value.offers || offersRes.value.data || [];
        setOffers(list);

        if (statsRes.status !== 'fulfilled' && list.length > 0) {
          setStats({
            totalOffers: list.length,
            onChainOffers: list.filter(o => o.onChain).length,
            acceptedOffers: list.filter(o => o.status === 'accepted').length,
            pendingOffers: list.filter(o => o.status === 'issued' || o.status === 'pending').length,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching employer dashboard data:', err);
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

  const filteredOffers = offers.filter((o) => {
    const matchesQuery = 
      (o.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.offerId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesQuery && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading employer workspace..." />;
  }

  const isCompanyApproved = company?.verificationStatus === 'approved';
  const hasCompany = !!company;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Employer Console
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{company?.name || user?.companyId?.name || 'No Company'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name || 'Employer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage your employment pipeline, issue job contracts, and notarize on Ethereum.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <Link
            to={hasCompany ? '/employer/create-offer' : '/employer/company-setup'}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{hasCompany ? 'Create New Offer' : 'Set Up Company'}</span>
          </Link>
        </div>
      </div>

      {/* No company profile banner */}
      {!hasCompany && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 text-blue-200">
          <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <p className="font-bold text-sm text-blue-300">Company Profile Not Set Up</p>
            <p className="mt-0.5 text-slate-300">You need to create a company profile before you can issue job offers.</p>
          </div>
          <Link
            to="/employer/company-setup"
            className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
          >
            Set Up Now
          </Link>
        </div>
      )}

      {/* Verification Status Alert if company is pending */}
      {company && !isCompanyApproved && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm text-amber-300">Company Verification Pending</p>
            <p className="mt-0.5 text-slate-300">
              Your company profile is under review by the platform administrator. Once verified, your corporate wallet will be authorized to register offers on the Ethereum smart contract.
            </p>
          </div>
        </div>
      )}

      {/* Metric Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FileCheck}
          value={stats.totalOffers}
          label="Total Offers Created"
          color="blue"
          subtitle="All active & past offers"
        />
        <StatsCard
          icon={ShieldCheck}
          value={stats.onChainOffers}
          label="Secured On-Chain"
          color="emerald"
          trend={`${stats.totalOffers > 0 ? Math.round((stats.onChainOffers / stats.totalOffers) * 100) : 0}%`}
          subtitle="Ethereum registered"
        />
        <StatsCard
          icon={CheckCircle2}
          value={stats.acceptedOffers}
          label="Offers Accepted"
          color="cyan"
          subtitle="Signed by candidates"
        />
        <StatsCard
          icon={Clock}
          value={stats.pendingOffers}
          label="Pending Response"
          color="amber"
          subtitle="Awaiting candidate action"
        />
      </div>

      {/* Offers Table Section */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl">
        {/* Table Filters & Search Header */}
        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Job Offers Registry</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                {filteredOffers.length}
              </span>
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, role, or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="issued">Issued</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="revoked">Revoked</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Job Title & Role</th>
                <th className="py-3.5 px-5">Candidate</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Blockchain Proof</th>
                <th className="py-3.5 px-5">Offer Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="text-sm font-semibold text-slate-300">No job offers found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Click "Create New Offer" to issue your first offer.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => {
                  const id = offer.offerId || offer._id;
                  const dateStr = offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : 'N/A';

                  return (
                    <tr
                      key={id}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <Link to={`/employer/offer/${id}`} className="block">
                          <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {offer.jobTitle}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {offer.department || 'General'} • <span className="capitalize">{offer.employmentType || 'Full-time'}</span>
                          </p>
                        </Link>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-200">{offer.candidateName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{offer.candidateEmail}</p>
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={offer.status} size="small" />
                      </td>

                      <td className="py-4 px-5">
                        {offer.onChain ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Off-Chain</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-400">
                        {dateStr}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/employer/offer/${id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-cyan-400 font-semibold text-xs border border-blue-500/20 transition"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
