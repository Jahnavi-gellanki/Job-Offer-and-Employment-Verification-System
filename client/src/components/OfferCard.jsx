import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, User, ShieldCheck, ArrowRight, DollarSign, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function OfferCard({ 
  offer, 
  onAccept, 
  onReject, 
  isCandidateView = false, 
  customActions 
}) {
  if (!offer) return null;

  const companyName = offer.companyId?.name || offer.companyName || 'Company';
  const candidateName = offer.candidateName || offer.candidateEmail || 'Candidate';
  const offerDate = offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : 'N/A';
  const formattedSalary = offer.salary?.amount
    ? `${offer.salary.currency || 'USD'} ${Number(offer.salary.amount).toLocaleString()} / ${offer.salary.period || 'yr'}`
    : null;

  const candidateDetailPath = `/candidate/offer/${offer.offerId || offer._id}`;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-5 transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5">
      {/* Background glow on hover */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Header row: Company, Blockchain indicator, Status Badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {companyName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {offer.onChain && (
                <span 
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full"
                  title="Registered on Ethereum Blockchain"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">On-Chain</span>
                </span>
              )}
              <StatusBadge status={offer.status} size="small" />
            </div>
          </div>

          {/* Job Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
            {offer.jobTitle}
          </h3>

          {/* Subtitle / Department */}
          {offer.department && (
            <p className="text-xs text-slate-400 mt-0.5">{offer.department}</p>
          )}

          {/* Key metadata grid */}
          <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{candidateName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{offerDate}</span>
            </div>

            {formattedSalary && (
              <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-200 font-medium">{formattedSalary}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <Link
            to={isCandidateView ? candidateDetailPath : `/employer/offer/${offer.offerId || offer._id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>Offer Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Candidate direct actions if offered & issued */}
          {isCandidateView && offer.status === 'issued' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onReject && onReject()}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
              >
                Decline
              </button>
              <button
                onClick={() => onAccept && onAccept()}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition"
              >
                Accept Offer
              </button>
            </div>
          )}

          {customActions && customActions}
        </div>
      </div>
    </div>
  );
}
