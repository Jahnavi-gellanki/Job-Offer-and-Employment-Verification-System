import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, Calendar, DollarSign, ShieldCheck,
  CheckCircle2, Loader2, ExternalLink, Hash
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CandidateOfferDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    api.get(`/candidate/offers/${id}`, token)
      .then(res => setOffer(res.offer || res.data || res))
      .catch(err => toast.error(err.message || 'Failed to load offer'))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleRespond = async (response) => {
    setResponding(true);
    try {
      const res = await api.put(`/candidate/offers/${offer.offerId || offer._id}/respond`, { response }, token);
      toast.success(`Offer ${response} successfully!`);
      setOffer(res.offer || { ...offer, status: response });
    } catch (err) {
      toast.error(err.message || 'Failed to respond to offer');
    } finally {
      setResponding(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading offer details..." />;

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Offer Not Found</h2>
        <Link to="/candidate/dashboard" className="text-cyan-400 text-xs font-semibold hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const companyName = offer.companyId?.name || 'Company';
  const salary = offer.salary?.amount
    ? `${offer.salary.currency || 'USD'} ${Number(offer.salary.amount).toLocaleString()} / ${offer.salary.period || 'yr'}`
    : 'Not specified';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/candidate/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-6 md:p-8 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
            ID: {offer.offerId}
          </span>
          <StatusBadge status={offer.status} />
          {offer.onChain && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              On-Chain Verified
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{offer.jobTitle}</h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {companyName}
          {offer.companyId?.verificationStatus === 'approved' && (
            <span className="text-emerald-400 font-semibold">· Verified Company</span>
          )}
        </p>
      </div>

      {/* Details grid */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {[
            ['Department', offer.department || 'N/A'],
            ['Employment Type', (offer.employmentType || 'full-time').replace('-', ' ')],
            ['Compensation', salary],
            ['Offer Date', offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : 'N/A'],
            ['Expiry Date', offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'No expiry'],
            ['Issued By', offer.employerId?.name || 'Employer'],
          ].map(([label, value]) => (
            <div key={label} className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
              <span className="text-slate-400 block mb-1">{label}</span>
              <span className="font-bold text-white capitalize">{value}</span>
            </div>
          ))}
        </div>

        {offer.notes && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 text-xs">
            <span className="text-slate-400 block mb-1 font-semibold">Additional Terms:</span>
            <p className="text-slate-300 leading-relaxed">{offer.notes}</p>
          </div>
        )}
      </div>

      {/* Document hash */}
      {offer.documentHash && (
        <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
            <Hash className="w-4 h-4" /> Cryptographic Document Fingerprint
          </h3>
          <p className="font-mono text-xs text-cyan-300 break-all bg-black/40 p-3 rounded-xl select-all">
            {offer.documentHash}
          </p>
          <p className="text-[11px] text-slate-400">
            SHA-256 hash of the official offer document. Any tampering changes this value.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <a
          href={`/verify/result/${offer.offerId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Public Verification Proof
        </a>

        {offer.status === 'issued' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRespond('rejected')}
              disabled={responding}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition disabled:opacity-50"
            >
              Decline Offer
            </button>
            <button
              onClick={() => handleRespond('accepted')}
              disabled={responding}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {responding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Accept Offer
            </button>
          </div>
        )}

        {offer.status === 'accepted' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> You accepted this offer
          </span>
        )}
      </div>
    </div>
  );
}
