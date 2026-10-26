import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Blocks, User, Mail, Lock, Building2, GraduationCap, Search, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [role, setRole] = useState('candidate'); // 'employer' | 'candidate' | 'recruiter'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please provide all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'employer' && companyName ? { companyName } : {}),
      };

      await api.post('/auth/register', payload);
      toast.success('Registration successful! Please sign in with your credentials.');
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-gradient-to-tr from-cyan-600/15 via-blue-500/10 to-purple-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl">
          {/* Logo Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                <Blocks className="w-6 h-6" />
              </div>
            </Link>
            <h1 className="text-2xl font-black text-white">Create an Account</h1>
            <p className="text-xs text-slate-400 mt-1">
              Select your role to join the cryptographic verification network
            </p>
          </div>

          {/* Role Selector Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                role === 'candidate'
                  ? 'bg-blue-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <GraduationCap className={`w-6 h-6 ${role === 'candidate' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === 'candidate' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Candidate</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Receive & verify offers</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                role === 'employer'
                  ? 'bg-blue-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Building2 className={`w-6 h-6 ${role === 'employer' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === 'employer' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Employer</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Issue & notarize on-chain</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                role === 'recruiter'
                  ? 'bg-purple-600/20 border-purple-400 text-white shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Search className={`w-6 h-6 ${role === 'recruiter' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === 'recruiter' ? 'border-purple-400 bg-purple-400' : 'border-slate-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Recruiter</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Verify & confirm employment</p>
              </div>
            </button>
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'employer' ? 'Sarah Connor (HR Director)' : 'Alex Morgan'}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            {role === 'employer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corporation Ltd"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
              </div>
            )}

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
                  placeholder={role === 'employer' ? 'hr@company.com' : 'alex@email.com'}
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
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
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
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create {role === 'employer' ? 'Employer' : role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link to sign in */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
