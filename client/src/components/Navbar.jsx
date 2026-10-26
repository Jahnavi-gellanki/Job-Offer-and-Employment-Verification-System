import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Blocks, 
  ShieldCheck, 
  PlusCircle, 
  LayoutDashboard, 
  History, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  Wallet,
  CheckCircle,
  ExternalLink,
  Search
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, logout, walletAddress, connectWallet } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      const address = await connectWallet();
      if (address) {
        toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to connect MetaMask');
    } finally {
      setConnecting(false);
    }
  };

  const navLinkStyle = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
      isActive
        ? 'bg-blue-600/20 text-cyan-400 border border-blue-500/30 shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Blocks className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                Veri<span className="text-cyan-400">Job</span>
                <span className="text-[10px] px-1.5 py-0.2 font-bold bg-blue-500/20 text-blue-300 rounded border border-blue-400/20">
                  dApp
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1 hidden sm:block">
                Blockchain Verification
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkStyle}>
              Home
            </NavLink>
            <NavLink to="/verify" className={navLinkStyle}>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Verify Offer
            </NavLink>
            <NavLink to="/verify/employment" className={navLinkStyle}>
              <Search className="w-4 h-4 text-purple-400" />
              Employment Check
            </NavLink>

            {/* Role-based Links */}
            {isAuthenticated && user?.role === 'employer' && (
              <>
                <NavLink to="/employer/dashboard" className={navLinkStyle}>
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  Dashboard
                </NavLink>
                <NavLink to="/employer/create-offer" className={navLinkStyle}>
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Create Offer
                </NavLink>
              </>
            )}

            {isAuthenticated && user?.role === 'candidate' && (
              <NavLink to="/candidate/dashboard" className={navLinkStyle}>
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                My Offers
              </NavLink>
            )}

            {isAuthenticated && user?.role === 'recruiter' && (
              <NavLink to="/recruiter/dashboard" className={navLinkStyle}>
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                Recruiter Portal
              </NavLink>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <>
                <NavLink to="/admin/dashboard" className={navLinkStyle}>
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  Admin Console
                </NavLink>
                <NavLink to="/admin/audit" className={navLinkStyle}>
                  <History className="w-4 h-4 text-purple-400" />
                  Audit Logs
                </NavLink>
              </>
            )}
          </nav>

          {/* Right section: Wallet + Auth actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* MetaMask Wallet Connection */}
            {walletAddress ? (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs font-mono text-cyan-300"
                title={`Connected: ${walletAddress}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{truncateAddress(walletAddress)}</span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={connecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-medium text-slate-200 transition"
                title="Connect MetaMask Wallet"
              >
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}

            {/* User Profile or Login/Register */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                      {user?.name || 'User'}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/20 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {walletAddress && (
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 border border-cyan-500/30 px-2 py-1 rounded-lg">
                {truncateAddress(walletAddress)}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0f172a] px-4 pt-3 pb-6 space-y-2">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Home
          </NavLink>
          <NavLink
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Verify Offer
          </NavLink>
          <NavLink
            to="/verify/employment"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Employment Verification
          </NavLink>

          {isAuthenticated && user?.role === 'employer' && (
            <>
              <NavLink
                to="/employer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-cyan-400 hover:bg-white/5"
              >
                Employer Dashboard
              </NavLink>
              <NavLink
                to="/employer/create-offer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-cyan-400 hover:bg-white/5"
              >
                Create Job Offer
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'candidate' && (
            <NavLink
              to="/candidate/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-cyan-400 hover:bg-white/5"
            >
              Candidate Dashboard
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'recruiter' && (
            <NavLink
              to="/recruiter/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-purple-400 hover:bg-white/5"
            >
              Recruiter Portal
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <>
              <NavLink
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-purple-400 hover:bg-white/5"
              >
                Admin Dashboard
              </NavLink>
              <NavLink
                to="/admin/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-purple-400 hover:bg-white/5"
              >
                Audit History
              </NavLink>
            </>
          )}

          <div className="pt-4 border-t border-white/10 space-y-2">
            {!walletAddress && (
              <button
                onClick={() => {
                  handleConnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-white/10"
              >
                <Wallet className="w-4 h-4 text-cyan-400" />
                Connect MetaMask
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center justify-between pt-2">
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-cyan-400 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-xs font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
