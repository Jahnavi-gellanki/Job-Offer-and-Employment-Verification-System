import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, 
  User, 
  Mail, 
  DollarSign, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Layers, 
  Loader2, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateOffer() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: 'Engineering',
    employmentType: 'full-time',
    candidateName: '',
    candidateEmail: '',
    salaryAmount: '',
    salaryCurrency: 'USD',
    salaryPeriod: 'annual',
    offerDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    api.get('/employer/company', token)
      .then(res => setCompany(res.company || null))
      .catch(() => setCompany(null))
      .finally(() => setCompanyLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobTitle || !formData.candidateName || !formData.candidateEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        jobTitle: formData.jobTitle,
        department: formData.department,
        employmentType: formData.employmentType,
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        salary: {
          amount: Number(formData.salaryAmount) || 0,
          currency: formData.salaryCurrency,
          period: formData.salaryPeriod,
        },
        offerDate: formData.offerDate,
        expiryDate: formData.expiryDate || null,
        notes: formData.notes,
      };

      const res = await api.post('/employer/offers', payload, token);
      const createdOffer = res.offer || res.data || res;
      const offerId = createdOffer.offerId || createdOffer._id;

      toast.success('Job offer created successfully!');
      if (offerId) {
        navigate(`/employer/offer/${offerId}`);
      } else {
        navigate('/employer/dashboard');
      }
    } catch (err) {
      console.error('Failed to create offer:', err);
      toast.error(err.message || 'Failed to create job offer');
    } finally {
      setLoading(false);
    }
  };

  if (companyLoading) return null;

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Company Profile Required</h2>
        <p className="text-slate-400 text-sm">You must set up a company profile before creating job offers.</p>
        <Link
          to="/employer/company-setup"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
        >
          Set Up Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/employer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employer Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-purple-900/40 border border-white/10 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Issue New Job Offer</h1>
            <p className="text-xs text-slate-300">
              Draft official employment terms. Once created, you can attach the document hash and sign on Ethereum.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-6 md:p-8 space-y-6 shadow-xl">
        
        {/* Section 1: Role Details */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Role & Department
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Senior Smart Contract Engineer"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Engineering / Security"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Employment Type
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Candidate Info */}
        <div className="pt-4 border-t border-white/10">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Candidate Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Candidate Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="candidateName"
                  value={formData.candidateName}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Candidate Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="candidateEmail"
                  value={formData.candidateEmail}
                  onChange={handleChange}
                  placeholder="alex.candidate@demo.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Compensation & Dates */}
        <div className="pt-4 border-t border-white/10">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Compensation & Validity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Salary Amount
              </label>
              <input
                type="number"
                name="salaryAmount"
                value={formData.salaryAmount}
                onChange={handleChange}
                placeholder="120000"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Currency
              </label>
              <select
                name="salaryCurrency"
                value={formData.salaryCurrency}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pay Period
              </label>
              <select
                name="salaryPeriod"
                value={formData.salaryPeriod}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="annual">Per Year (Annual)</option>
                <option value="monthly">Per Month</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Offer Issue Date
              </label>
              <input
                type="date"
                name="offerDate"
                value={formData.offerDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Notes */}
        <div className="pt-4 border-t border-white/10">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Additional Terms or Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Contingent on standard background check. Reporting to VP of Engineering."
            className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
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
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Offer...</span>
              </>
            ) : (
              <>
                <span>Save & Continue to Blockchain</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
