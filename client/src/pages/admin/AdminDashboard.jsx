import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  FileCheck, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Wallet, 
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'companies' | 'users'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    totalOffers: 0,
    totalVerifications: 0,
  });
  const [companies, setCompanies] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [employerWalletModal, setEmployerWalletModal] = useState({ open: false, wallet: '' });
  const [approveModal, setApproveModal] = useState({ open: false, company: null, wallet: '' });

  const fetchData = async () => {
    try {
      const [statsRes, compRes, usersRes] = await Promise.allSettled([
        api.get('/admin/stats', token),
        api.get('/admin/companies', token),
        api.get('/admin/users', token),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value.stats || statsRes.value.data || statsRes.value;
        setStats({
          totalUsers:          s.users?.total        ?? s.totalUsers        ?? 0,
          totalCompanies:      s.companies?.total    ?? s.totalCompanies    ?? 0,
          pendingCompanies:    s.companies?.pending  ?? s.pendingCompanies  ?? 0,
          totalOffers:         s.offers?.total       ?? s.totalOffers       ?? 0,
          totalVerifications:  s.verifications?.totalLogged ?? s.totalVerifications ?? 0,
        });
      }

      if (compRes.status === 'fulfilled' && compRes.value) {
        const cList = Array.isArray(compRes.value)
          ? compRes.value
          : compRes.value.companies || compRes.value.data || [];
        setCompanies(cList);
        if (statsRes.status !== 'fulfilled') {
          setStats((prev) => ({ ...prev, totalCompanies: cList.length }));
        }
      }

      if (usersRes.status === 'fulfilled' && usersRes.value) {
        const uList = Array.isArray(usersRes.value)
          ? usersRes.value
          : usersRes.value.users || usersRes.value.data || [];
        setUsersList(uList);
        if (statsRes.status !== 'fulfilled') {
          setStats((prev) => ({ ...prev, totalUsers: uList.length }));
        }
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
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

  const handleCompanyVerification = async (companyId, newStatus, walletAddress) => {
    try {
      const res = await api.put(
        `/admin/companies/${companyId}/verify`,
        { status: newStatus, walletAddress: walletAddress || undefined },
        token
      );
      const msg = res.blockchainTx?.alreadyRegistered
        ? `Company ${newStatus} (wallet already on-chain)`
        : res.blockchainTx?.txHash
        ? `Company ${newStatus} & wallet registered on blockchain!`
        : walletAddress
        ? `Company ${newStatus} (wallet saved — start Hardhat node to register on-chain)`
        : `Company marked as ${newStatus}`;
      toast.success(msg);
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === companyId
            ? { ...c, verificationStatus: newStatus, walletAddress: walletAddress || c.walletAddress }
            : c
        )
      );
      setApproveModal({ open: false, company: null, wallet: '' });
    } catch (err) {
      console.error('Company status update failed:', err);
      toast.error(err.message || 'Failed to update company verification status');
    }
  };

  const openApproveModal = (company) => {
    setApproveModal({
      open: true,
      company,
      wallet: company.walletAddress || company.adminUserId?.walletAddress || '',
    });
  };

  const handleRegisterEmployerWallet = async (e) => {
    e.preventDefault();
    if (!employerWalletModal.wallet) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    try {
      await api.post(
        '/admin/blockchain/register-employer',
        { walletAddress: employerWalletModal.wallet },
        token
      );
      toast.success('Employer wallet successfully registered on smart contract!');
      setEmployerWalletModal({ open: false, wallet: '' });
      fetchData();
    } catch (err) {
      console.error('Blockchain employer registration failed:', err);
      toast.error(err.message || 'Failed to register employer wallet on blockchain');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate / remove this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`, token);
      toast.success('User deactivated successfully');
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('User deactivation error:', err);
      toast.error(err.message || 'Failed to deactivate user');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading administrative command center..." />;
  }

  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Platform Administration
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Owner Privileges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Admin Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit system operations, authorize employer wallets on Ethereum, and manage accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEmployerWalletModal({ open: true, wallet: '' })}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition"
          >
            <Wallet className="w-4 h-4" />
            <span>Authorize Employer Wallet</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          value={stats.totalUsers}
          label="Total Registered Users"
          color="blue"
          subtitle="Employers & candidates"
        />
        <StatsCard
          icon={Building2}
          value={stats.totalCompanies}
          label="Total Companies"
          color="cyan"
          subtitle={`${stats.pendingCompanies} pending approval`}
        />
        <StatsCard
          icon={FileCheck}
          value={stats.totalOffers}
          label="Offers Issued"
          color="emerald"
          subtitle="Signed digital offers"
        />
        <StatsCard
          icon={ShieldCheck}
          value={stats.totalVerifications}
          label="Verifications Performed"
          color="purple"
          subtitle="Blockchain checks"
        />
      </div>

      {/* Tabs navigation */}
      <div className="flex rounded-2xl bg-slate-900/80 p-1.5 border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'companies'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Companies ({companies.length})</span>
          {stats.pendingCompanies > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {stats.pendingCompanies}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({usersList.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Smart Contract Architecture Status
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Solidity contract <strong className="text-white">JobOfferVerification.sol</strong> is actively running on the local Hardhat EVM environment. As the contract administrator, only you can register new employer wallet addresses onto the on-chain whitelist.
            </p>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Contract Address:</span>
                <span className="text-cyan-300 select-all">{import.meta.env.VITE_CONTRACT_ADDRESS}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network ID:</span>
                <span className="text-slate-200">31337 (Hardhat Localhost)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Admin Address:</span>
                <span className="text-purple-300 select-all">{user?.walletAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Pending Verification Requests
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                There are <strong className="text-amber-400">{companies.filter(c => c.verificationStatus === 'pending').length}</strong> company profiles pending administrative approval.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('companies')}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition text-center"
            >
              Review Company Applications →
            </button>
          </div>
        </div>
      )}

      {/* COMPANIES TAB */}
      {activeTab === 'companies' && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white">Registered Companies Directory</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                {companies.filter(c => c.verificationStatus === 'pending').length} Pending
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                {companies.filter(c => c.verificationStatus === 'approved').length} Approved
              </span>
              <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold">
                {companies.filter(c => c.verificationStatus === 'rejected').length} Rejected
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Company</th>
                  <th className="py-3.5 px-5">Employer</th>
                  <th className="py-3.5 px-5">Industry</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Wallet</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No companies registered yet.
                    </td>
                  </tr>
                ) : (
                  companies.map((c) => (
                    <tr key={c._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{c.registrationNumber}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-slate-200 font-semibold">{c.adminUserId?.name || '—'}</p>
                        <p className="text-[11px] text-slate-400">{c.adminUserId?.email || '—'}</p>
                      </td>
                      <td className="py-4 px-5 text-slate-300">{c.industry}</td>
                      <td className="py-4 px-5">
                        <StatusBadge status={c.verificationStatus} size="small" />
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-slate-400 max-w-[130px] truncate">
                        {c.walletAddress || c.adminUserId?.walletAddress || <span className="text-amber-400/70">Not set</span>}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        {c.verificationStatus !== 'approved' && (
                          <button
                            onClick={() => openApproveModal(c)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition"
                          >
                            Approve
                          </button>
                        )}
                        {c.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => handleCompanyVerification(c._id, 'rejected')}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl space-y-4">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">Platform Users Directory</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user or email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Name & Identity</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5 font-bold text-white">{u.name}</td>
                      <td className="py-4 px-5 text-slate-300 font-mono">{u.email}</td>
                      <td className="py-4 px-5">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-white/5 border border-white/10 text-cyan-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.isActive !== false ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeactivateUser(u._id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Deactivate User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Approve Company with Wallet Address */}
      {approveModal.open && approveModal.company && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Approve Company</h3>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-xs space-y-1">
              <p className="text-white font-semibold">{approveModal.company.name}</p>
              <p className="text-slate-400">{approveModal.company.adminUserId?.email}</p>
              <p className="text-slate-500">Reg: {approveModal.company.registrationNumber}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Employer MetaMask Wallet Address
                <span className="ml-1 text-slate-500 font-normal">(required for blockchain registration)</span>
              </label>
              <input
                type="text"
                value={approveModal.wallet}
                onChange={(e) => setApproveModal((prev) => ({ ...prev, wallet: e.target.value }))}
                placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This wallet will be whitelisted on the smart contract via <code>registerEmployer()</code>.
                Leave blank to approve without blockchain registration.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModal({ open: false, company: null, wallet: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCompanyVerification(approveModal.company._id, 'approved', approveModal.wallet.trim() || null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs text-white font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Authorize Employer Wallet on Smart Contract */}
      {employerWalletModal.open && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-400" />
              Register Employer on Blockchain
            </h3>
            <p className="text-xs text-slate-300">
              Enter the Ethereum wallet address of the approved employer. This signs an on-chain transaction calling <code>registerEmployer(address)</code> on the smart contract.
            </p>

            <form onSubmit={handleRegisterEmployerWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Ethereum Wallet Address
                </label>
                <input
                  type="text"
                  value={employerWalletModal.wallet}
                  onChange={(e) =>
                    setEmployerWalletModal((prev) => ({ ...prev, wallet: e.target.value }))
                  }
                  placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmployerWalletModal({ open: false, wallet: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs text-white font-bold transition shadow-lg shadow-purple-500/20"
                >
                  Authorize on Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
