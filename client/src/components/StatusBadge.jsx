import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Send, 
  FileText, 
  ShieldCheck, 
  ShieldAlert 
} from 'lucide-react';

export default function StatusBadge({ status = 'draft', size = 'default', showIcon = true }) {
  const normStatus = (status || '').toLowerCase();

  const configs = {
    valid: {
      label: 'Valid',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      icon: ShieldCheck,
      dot: 'bg-emerald-400',
    },
    approved: {
      label: 'Approved',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
    },
    accepted: {
      label: 'Accepted',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
    },
    issued: {
      label: 'Issued',
      bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      icon: Send,
      dot: 'bg-blue-400',
    },
    pending: {
      label: 'Pending',
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      icon: Clock,
      dot: 'bg-amber-400',
    },
    draft: {
      label: 'Draft',
      bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
      icon: FileText,
      dot: 'bg-slate-400',
    },
    revoked: {
      label: 'Revoked',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      icon: AlertTriangle,
      dot: 'bg-rose-400',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-red-500/15 border-red-500/30 text-red-400',
      icon: XCircle,
      dot: 'bg-red-400',
    },
    invalid: {
      label: 'Invalid / Mismatch',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      icon: ShieldAlert,
      dot: 'bg-rose-400',
    },
  };

  const current = configs[normStatus] || {
    label: status.toUpperCase(),
    bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
    icon: FileText,
    dot: 'bg-slate-400',
  };

  const IconComponent = current.icon;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs gap-1',
    default: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    large: 'px-3.5 py-1.5 text-sm gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md transition-all duration-200 capitalize tracking-wide ${
        current.bg
      } ${sizeClasses[size] || sizeClasses.default}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {showIcon && IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
}
