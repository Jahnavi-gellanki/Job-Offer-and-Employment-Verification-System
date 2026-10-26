import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Upload, 
  QrCode, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Blocks
} from 'lucide-react';
import api from '../../services/api';
import DocumentUploader from '../../components/DocumentUploader';
import VerificationResultCard from '../../components/VerificationResultCard';
import toast from 'react-hot-toast';

export default function VerifyOffer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('id'); // 'id' | 'document'
  const [offerId, setOfferId] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentHash, setDocumentHash] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [inlineResult, setInlineResult] = useState(null);

  // Check query parameter on load e.g. /verify?offerId=UUID
  useEffect(() => {
    const paramId = searchParams.get('offerId') || searchParams.get('id');
    if (paramId) {
      setOfferId(paramId);
    }
  }, [searchParams]);

  const handleVerifyById = (e) => {
    e.preventDefault();
    const cleanId = offerId.trim();
    if (!cleanId) {
      toast.error('Please enter an Offer ID');
      return;
    }
    navigate(`/verify/result/${cleanId}`);
  };

  const handleVerifyByDocument = async (e) => {
    e.preventDefault();
    if (!offerId.trim()) {
      toast.error('Please specify the Offer ID to match against');
      return;
    }
    if (!documentFile && !documentHash) {
      toast.error('Please upload an offer letter document first');
      return;
    }

    setLoading(true);
    setInlineResult(null);

    try {
      let res;
      if (documentFile) {
        const formData = new FormData();
        formData.append('document', documentFile);
        formData.append('offerId', offerId.trim());
        res = await api.postForm('/verify/upload-and-verify', formData);
      } else {
        res = await api.post('/verify/hash', {
          offerId: offerId.trim(),
          documentHash,
        });
      }

      setInlineResult(res);
      if (res.isValid || res.isMatch) {
        toast.success('Document verified authentic on blockchain!');
      } else {
        toast.error('Document mismatch: Tampering detected');
      }
    } catch (err) {
      console.error('Document verification error:', err);
      // Fallback: Query offer directly and compare hashes client-side
      try {
        const directRes = await api.get(`/verify/offer/${offerId.trim()}`);
        const offer = directRes.offer || directRes.data || directRes;
        const isMatch = offer.documentHash && offer.documentHash.toLowerCase() === documentHash.toLowerCase();
        const fallbackResult = {
          isValid: isMatch && !offer.isRevoked && offer.status !== 'revoked',
          isMatch,
          isRevoked: offer.isRevoked || offer.status === 'revoked',
          offer,
        };
        setInlineResult(fallbackResult);
      } catch (innerErr) {
        toast.error(err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = ({ hash, file }) => {
    setDocumentHash(hash);
    setDocumentFile(file);
    toast.success('Document hash calculated! Click "Verify Document Match" to test against blockchain.');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-blue-500/10 to-teal-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Zero-Knowledge Tamper Detection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Cryptographic Job Offer Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Verify digital job offers directly against Ethereum smart contracts. Validate document integrity, issuance dates, and corporate employer wallet provenance in real time.
        </p>
      </div>

      {/* Verification Tabs Card */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        {/* Tab switchers */}
        <div className="flex rounded-2xl bg-slate-900/80 p-1.5 border border-white/5 mb-8 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('id');
              setInlineResult(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'id'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify by Offer ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('document');
              setInlineResult(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'document'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Verify Document File</span>
          </button>
        </div>

        {/* TAB 1: By Offer ID */}
        {activeTab === 'id' && (
          <form onSubmit={handleVerifyById} className="space-y-6 max-w-xl mx-auto">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Job Offer Unique Identifier (UUID / ID)
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Tip: You can find the unique Offer ID on the printed or electronic offer letter, or in the QR code link.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Verify On Blockchain</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>
        )}

        {/* TAB 2: By Document File & Hash */}
        {activeTab === 'document' && (
          <form onSubmit={handleVerifyByDocument} className="space-y-6 max-w-xl mx-auto">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Offer Identifier
              </label>
              <input
                type="text"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
                placeholder="Enter corresponding Offer ID"
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Upload Offer Document to Check
              </label>
              <DocumentUploader
                onUploadSuccess={handleDocumentUploaded}
                title="Select Original Offer Letter"
                subtitle="Calculates SHA-256 in browser to match with the blockchain state"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !offerId || (!documentFile && !documentHash)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Comparing With Blockchain State...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verify Document Match</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Inline result if verifying by document */}
        {inlineResult && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <VerificationResultCard result={inlineResult} offerId={offerId} />
          </div>
        )}
      </div>

      {/* QR scanner note box */}
      <div className="rounded-2xl bg-slate-900/40 border border-white/5 p-4 flex items-center gap-3 text-xs text-slate-400">
        <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          <span className="font-semibold text-slate-200">Looking to scan a QR code?</span> Point your smartphone camera at the QR code printed on the official offer letter; it will instantly open the cryptographic verification page with the Offer ID pre-filled.
        </div>
      </div>
    </div>
  );
}
