import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle, 
  Building2, 
  User, 
  Briefcase, 
  Calendar, 
  Hash, 
  Wallet, 
  CheckCircle2, 
  XCircle,
  ExternalLink
} from 'lucide-react';
import BlockchainBadge from './BlockchainBadge';
import StatusBadge from './StatusBadge';

export default function VerificationResultCard({ result, offerId }) {
  if (!result) return null;

  // Outcome status: 'VALID' | 'INVALID' | 'REVOKED' | 'NOT_FOUND'
  let outcome = 'NOT_FOUND';
  if (result.isValid === true) outcome = 'VALID';
  else if (result.isRevoked === true || result.status === 'revoked') outcome = 'REVOKED';
  else if (result.isValid === false || result.isMatch === false) outcome = 'INVALID';
  else if (result.offer) outcome = result.offer.status === 'revoked' ? 'REVOKED' : 'VALID';

  const offer = result.offer || result.data || result;

  const configs = {
    VALID: {
      title: 'Valid & Cryptographically Verified',
      subtitle: 'The document hash matches the immutable Ethereum blockchain record exactly.',
      badgeText: 'GENUINE VERIFIED RECORD',
      headerBg: 'from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      icon: ShieldCheck,
      glow: 'shadow-emerald-500/10',
    },
    INVALID: {
      title: 'Verification Failed / Document Tampered',
      subtitle: 'The cryptographic hash of the provided document does NOT match the registered blockchain record.',
      badgeText: 'SIGNATURE MISMATCH DETECTED',
      headerBg: 'from-rose-950/50 via-slate-900 to-slate-900 border-rose-500/30',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      icon: ShieldAlert,
      glow: 'shadow-rose-500/10',
    },
    REVOKED: {
      title: 'Offer Revoked by Employer',
      subtitle: 'This job offer was formally issued but has since been marked REVOKED on the blockchain.',
      badgeText: 'REVOKED BY ISSUER',
      headerBg: 'from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: AlertTriangle,
      glow: 'shadow-amber-500/10',
    },
    NOT_FOUND: {
      title: 'Offer Not Found',
      subtitle: 'No offer matching this identifier was located in the registry or blockchain database.',
      badgeText: 'RECORD NOT REGISTERED',
      headerBg: 'from-slate-800/50 via-slate-900 to-slate-900 border-slate-700',
      iconBg: 'bg-slate-700/50 text-slate-400 border-slate-600',
      icon: HelpCircle,
      glow: '',
    },
  };

  const current = configs[outcome] || configs.NOT_FOUND;
  const OutcomeIcon = current.icon;

  return (
    <div className={`overflow-hidden rounded-3xl bg-slate-900/90 border backdrop-blur-2xl shadow-2xl transition-all duration-300 ${current.headerBg} ${current.glow}`}>
      {/* Top Banner */}
      <div className="p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${current.iconBg} shrink-0`}>
            <OutcomeIcon className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                {current.badgeText}
              </span>
              {offer.status && <StatusBadge status={offer.status} />}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">{current.title}</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">{current.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Offer Details if available */}
      {offer && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Job Title */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Job Title
              </span>
              <p className="text-sm font-bold text-white truncate">{offer.jobTitle || 'N/A'}</p>
              {offer.department && <p className="text-xs text-slate-400 mt-0.5">{offer.department}</p>}
            </div>

            {/* Company Name */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Issuing Company
              </span>
              <p className="text-sm font-bold text-white truncate">
                {offer.companyId?.name || offer.companyName || 'Verified Partner'}
              </p>
              {offer.employmentType && (
                <span className="text-[11px] text-cyan-400 font-medium capitalize">{offer.employmentType}</span>
              )}
            </div>

            {/* Candidate Name */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-purple-400" /> Candidate
              </span>
              <p className="text-sm font-bold text-white truncate">{offer.candidateName || 'Confidential'}</p>
              <p className="text-xs text-slate-400 truncate">{offer.candidateEmail || ''}</p>
            </div>

            {/* Offer Date */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Issue Date
              </span>
              <p className="text-sm font-bold text-white">
                {offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : 'N/A'}
              </p>
              {offer.expiryDate && (
                <p className="text-xs text-slate-400">Exp: {new Date(offer.expiryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Cryptographic Hash match card */}
          {offer.documentHash && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  Cryptographic SHA-256 Digest
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Fingerprint
                </span>
              </div>
              <p className="font-mono text-xs text-cyan-300 break-all bg-black/40 p-3 rounded-xl border border-white/5 select-all">
                {offer.documentHash}
              </p>
            </div>
          )}

          {/* Blockchain proof details */}
          {(offer.onChain || offer.blockchainTxHash || result.txHash) && (
            <div className="pt-2">
              <BlockchainBadge
                txHash={offer.blockchainTxHash || result.txHash}
                blockNumber={offer.blockNumber || result.blockNumber}
                timestamp={offer.updatedAt || offer.createdAt || result.timestamp}
                contractAddress={offer.contractAddress || import.meta.env.VITE_CONTRACT_ADDRESS}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
