import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, Blocks, Hash, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BlockchainBadge({ 
  txHash, 
  blockNumber, 
  timestamp, 
  contractAddress,
  compact = false 
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || 'Value'} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncate = (str, len = 8) => {
    if (!str) return '—';
    if (str.length <= len * 2) return str;
    return `${str.slice(0, len)}...${str.slice(-len)}`;
  };

  const formattedDate = timestamp 
    ? new Date(typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp).toLocaleString()
    : null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
        <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>Verified On-Chain</span>
        {txHash && (
          <button
            onClick={() => copyToClipboard(txHash, 'Transaction Hash')}
            className="text-slate-400 hover:text-white transition-colors"
            title={`Tx: ${txHash}`}
          >
            <Copy className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 p-5 backdrop-blur-xl shadow-xl shadow-emerald-950/20">
      {/* Glow decorative element */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              Verified on Blockchain
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-widest">
                IMMUTABLE
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically registered on Ethereum Hardhat / EVM
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Tx Hash */}
        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col justify-between">
          <span className="text-slate-400 flex items-center gap-1.5 mb-1">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            Transaction Hash
          </span>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="font-mono text-slate-200 select-all font-medium">
              {truncate(txHash, 10)}
            </span>
            <button
              onClick={() => copyToClipboard(txHash, 'Transaction Hash')}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Copy Tx Hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Block Number */}
        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col justify-between">
          <span className="text-slate-400 flex items-center gap-1.5 mb-1">
            <Blocks className="w-3.5 h-3.5 text-blue-400" />
            Block Number
          </span>
          <div className="mt-1">
            <span className="font-mono text-blue-300 font-semibold text-sm">
              {blockNumber ? `#${blockNumber}` : 'Confirmed'}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        {formattedDate && (
          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col justify-between md:col-span-2">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Registration Timestamp
            </span>
            <span className="font-mono text-slate-300 mt-1">
              {formattedDate}
            </span>
          </div>
        )}

        {/* Contract Address */}
        {contractAddress && (
          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col justify-between md:col-span-2">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              Contract Address
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="font-mono text-slate-300 select-all">
                {truncate(contractAddress, 14)}
              </span>
              <button
                onClick={() => copyToClipboard(contractAddress, 'Contract Address')}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                title="Copy Contract Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
