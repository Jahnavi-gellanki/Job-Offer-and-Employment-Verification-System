import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Blocks, Mail, Lock, ArrowRight, AlertCircle, Loader2, Sparkles, Key } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.token || response.accessToken;
      const user = response.user || response.data?.user || response.data;

      if (!token || !user) {
        throw new Error('Invalid response received from server.');
      }

      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);

      // Redirect destination based on role or original redirect location
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'employer') {
        navigate('/employer/dashboard', { replace: true });
      } else if (user.role === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for demo convenience
  const quickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Background ambient decorative glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-purple-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                <Blocks className="w-6 h-6" />
              </div>
            </Link>
            <h1 className="text-2xl font-black text-white">Sign In to VeriJob</h1>
            <p className="text-xs text-slate-400 mt-1">
              Access your cryptographic employment verification portal
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo quick accounts */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3 flex items-center justify-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              Demo Quick-Fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickFill('admin@demo.com', 'Admin@1234')}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-purple-300 transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => quickFill('hr@techcorp.com', 'Password123!')}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-cyan-300 transition"
              >
                Employer
              </button>
              <button
                type="button"
                onClick={() => quickFill('alex.candidate@demo.com', 'Password123!')}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-emerald-300 transition"
              >
                Candidate
              </button>
            </div>
          </div>

          {/* Footer link to register */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
