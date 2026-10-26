import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import VerificationResultCard from '../../components/VerificationResultCard';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VerificationResult() {
  const { offerId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/verify/offer/${offerId}`);
      setResult(res);
    } catch (err) {
      console.error('Verification query failed:', err);
      setError(err.message || 'Offer verification could not be completed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (offerId) {
      fetchVerification();
    }
  }, [offerId]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Public verification link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Querying Ethereum blockchain proof..." />;
  }

  const offer = result?.offer || result?.data || result;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-white/10 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Share Result</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-white/10 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print Proof</span>
          </button>
        </div>
      </div>

      {/* Main Result Card */}
      {error ? (
        <VerificationResultCard
          result={{
            isValid: false,
            status: 'not_found',
            message: error,
          }}
          offerId={offerId}
        />
      ) : (
        <VerificationResultCard result={result} offerId={offerId} />
      )}

      {/* Secondary Row: QR Code and Share info */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <QRCodeDisplay offerId={offerId} title="Digital Verification QR" />
          </div>

          <div className="md:col-span-2 rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Immutable Integrity Guarantee
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This verification result is powered by a decentralized smart contract on the Ethereum blockchain. The cryptographic hash was generated directly from the issuer's source document bytes at the moment of registration. Any modification of the job terms, dates, salary, or candidate name produces a completely different hash and invalidates the proof instantly.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between items-center">
                <span>Verification ID:</span>
                <span className="font-mono text-cyan-300 select-all">{offerId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Verification Time:</span>
                <span className="text-slate-300 font-mono">{new Date().toUTCString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Network Protocol:</span>
                <span className="text-emerald-400 font-mono">EVM / Hardhat 31337</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Need formal employment certification?</span>
              <Link to="/verify/employment" className="text-cyan-400 font-semibold hover:underline">
                Request Certification →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
