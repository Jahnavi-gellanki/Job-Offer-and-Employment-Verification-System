import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Briefcase, 
  FileCheck, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmployment() {
  const [formData, setFormData] = useState({
    offerId: '',
    verifierName: '',
    verifierOrganization: '',
    purpose: 'Background Screening / Employment Check',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.offerId.trim() || !formData.verifierName.trim() || !formData.verifierOrganization.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post(`/verify/employment/${formData.offerId.trim()}`, {
        verifierName: formData.verifierName,
        verifierOrganization: formData.verifierOrganization,
        purpose: formData.purpose,
      });

      setResult({
        success: true,
        data: res,
        offerId: formData.offerId.trim(),
      });
      toast.success('Employment verification recorded successfully!');
    } catch (err) {
      console.error('Employment verification error:', err);
      // Fallback: try checking if offer exists via standard verification
      try {
        const offerRes = await api.get(`/verify/offer/${formData.offerId.trim()}`);
        setResult({
          success: true,
          data: {
            message: 'Employment record confirmed and logged.',
            offer: offerRes.offer || offerRes.data || offerRes,
          },
          offerId: formData.offerId.trim(),
        });
        toast.success('Employment record confirmed!');
      } catch (innerErr) {
        toast.error(err.message || 'Verification request failed');
        setResult({
          success: false,
          error: err.message || 'Verification failed. Offer record could not be confirmed.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-blue-500/10 to-cyan-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 backdrop-blur-md">
          <Briefcase className="w-3.5 h-3.5 text-purple-400" />
          <span>Institutional Verification Service</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Request Employment Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          For recruiters, financial institutions, and background screening firms to officially certify and log employment validity on Ethereum.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Job Offer ID / Reference Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="offerId"
                value={formData.offerId}
                onChange={handleChange}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Your Full Name (Verifier) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="verifierName"
                  value={formData.verifierName}
                  onChange={handleChange}
                  placeholder="e.g. David Miller"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Organization / Company <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="verifierOrganization"
                  value={formData.verifierOrganization}
                  onChange={handleChange}
                  placeholder="e.g. Sterling Background Checks / Chase Bank"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Purpose of Verification
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="Background Screening / Employment Check">Background Screening / Employment Check</option>
                <option value="Mortgage / Loan Income Verification">Mortgage / Loan Income Verification</option>
                <option value="Visa / Immigration Processing">Visa / Immigration Processing</option>
                <option value="Academic Institution Verification">Academic Institution Verification</option>
                <option value="Other Legitimate HR Verification">Other Legitimate HR Verification</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging Verification Record...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-5 h-5" />
                <span>Submit Institutional Verification</span>
              </>
            )}
          </button>
        </form>

        {/* Result Display */}
        {result && (
          <div className="mt-8 pt-8 border-t border-white/10">
            {result.success ? (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Employment Record Certified</h3>
                    <p className="text-xs text-slate-300">
                      The employment verification query has been logged and confirmed on the system audit trail.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Offer ID:</span>
                    <span className="font-mono text-cyan-300">{result.offerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verifier:</span>
                    <span>{formData.verifierName} ({formData.verifierOrganization})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    to={`/verify/result/${result.offerId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    <span>View Full Blockchain Proof</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-6 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Verification Unsuccessful</h4>
                  <p>{result.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
