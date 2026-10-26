import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CompanySetup() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    industry: '',
    website: '',
    description: '',
    walletAddress: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zip: '',
  });

  // If company already exists, redirect to dashboard
  useEffect(() => {
    api.get('/employer/company', token)
      .then(() => navigate('/employer/dashboard', { replace: true }))
      .catch(() => {}) // 404 means no company — stay on this page
      .finally(() => setChecking(false));
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.registrationNumber || !formData.industry) {
      toast.error('Company name, registration number, and industry are required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/employer/company', {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        industry: formData.industry,
        website: formData.website || '',
        description: formData.description || '',
        walletAddress: formData.walletAddress || undefined,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zip: formData.zip,
        },
      }, token);

      toast.success('Company profile created! Pending admin approval.');
      navigate('/employer/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to create company profile');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/employer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-purple-900/40 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Set Up Company Profile</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Required before you can issue job offers. Submitted for admin approval.
            </p>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>After submission, an admin must approve your company before you can register offers on the blockchain. You can still create draft offers immediately.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-6 space-y-5 shadow-xl">

        {/* Company Info */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. TechCorp Solutions Ltd."
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registration Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. CIN-2024-001"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Industry <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Technology, Finance, Healthcare"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourcompany.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief description of your company..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                MetaMask Wallet Address
                <span className="ml-1 text-slate-500 font-normal">(recommended — needed for blockchain offer registration)</span>
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The admin will whitelist this address on the smart contract when approving your company.
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="pt-4 border-t border-white/10">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-4">Address (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Street address"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition" />
            <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State / Province"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition" />
            <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition" />
            <input type="text" name="zip" value={formData.zip} onChange={handleChange} placeholder="ZIP / Postal Code"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition" />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <Link
            to="/employer/dashboard"
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /><span>Submit Company Profile</span></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
