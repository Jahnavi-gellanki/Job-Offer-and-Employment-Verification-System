import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Blocks, 
  Upload, 
  Hash, 
  CheckCircle2, 
  Loader2, 
  X, 
  ExternalLink,
  Wallet,
  FileDown
} from 'lucide-react';
import { ethers } from 'ethers';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import BlockchainBadge from '../../components/BlockchainBadge';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import DocumentUploader from '../../components/DocumentUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const HARDHAT_CHAIN_ID_HEX = '0x7a69'; // 31337

export default function OfferDetails() {
  const { id } = useParams();
  const { token, walletAddress, setWalletAddress } = useAuth();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const fetchOffer = async () => {
    try {
      const res = await api.get(`/employer/offers/${id}`, token);
      const data = res.offer || res.data || res;
      setOffer(data);
    } catch (err) {
      console.error('Failed to fetch offer details:', err);
      toast.error(err.message || 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer();
  }, [id, token]);

  // Ensure wallet is switched to Hardhat local chain (31337)
  const ensureHardhatNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      // 4902 error code means the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HARDHAT_CHAIN_ID_HEX,
                chainName: 'Hardhat Localhost',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
        } catch (addError) {
          console.warn('Could not add local chain:', addError);
        }
      }
    }
  };

  const handleRegisterOnChain = async () => {
    if (!offer) return;
    if (!offer.documentHash) {
      toast.error('Please upload and hash an offer document first before registering on blockchain.');
      return;
    }

    setRegistering(true);
    try {
      let signerAddr = walletAddress;

      // Connect MetaMask if not connected
      if (typeof window !== 'undefined' && window.ethereum) {
        await ensureHardhatNetwork();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        signerAddr = await signer.getAddress();
        setWalletAddress(signerAddr);
      }

      // Backend route: POST /api/employer/offers/:id/blockchain with { signerAddress }
      const res = await api.post(
        `/employer/offers/${offer.offerId || offer._id}/blockchain`,
        { signerAddress: signerAddr },
        token
      );

      toast.success('Offer successfully notarized on Ethereum blockchain!');
      const updatedOffer = res.offer || res.data || { ...offer, onChain: true, blockchainTxHash: res.txHash };
      setOffer(updatedOffer);
      fetchOffer();
    } catch (err) {
      console.error('Blockchain registration error:', err);
      toast.error(err.message || 'Failed to register offer on blockchain');
    } finally {
      setRegistering(false);
    }
  };

  const handleDocumentUploaded = async ({ hash, file, serverResult }) => {
    try {
      // Normalize hash: strip 0x prefix before saving
      const cleanHash = hash && (hash.startsWith('0x') || hash.startsWith('0X'))
        ? hash.slice(2)
        : hash;

      const filePath = serverResult?.filePath || null;
      const originalName = serverResult?.originalName || file?.name || null;

      // Persist to DB via the dedicated document endpoint
      const res = await api.put(
        `/employer/offers/${offer.offerId || offer._id}/document`,
        { documentHash: cleanHash, documentPath: filePath, documentOriginalName: originalName },
        token
      );

      const updatedOffer = res.offer || res.data;
      if (updatedOffer) {
        setOffer(updatedOffer);
      } else {
        setOffer((prev) => ({ ...prev, documentHash: cleanHash, documentPath: filePath, documentOriginalName: originalName }));
      }
      toast.success('Document hash saved to offer record!');
    } catch (err) {
      console.error('Failed to save document hash:', err);
      toast.error(err.message || 'Failed to save document hash to offer');
    }
  };

  const handleIssueOffer = async () => {
    setIssuing(true);
    try {
      // Use the /issue endpoint (not /status) — it resolves and links candidateId
      // so the candidate dashboard $or query finds the offer immediately.
      const res = await api.put(`/employer/offers/${offer.offerId || offer._id}/issue`, {}, token);
      toast.success('Offer issued to candidate successfully!');
      setOffer(res.offer || offer);
      fetchOffer();
    } catch (err) {
      toast.error(err.message || 'Failed to issue offer');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeConfirm = async () => {
    setRevoking(true);
    try {
      await api.post(
        `/employer/offers/${offer.offerId || offer._id}/revoke`,
        { reason: revokeReason },
        token
      );
      toast.success('Offer revoked successfully.');
      setShowRevokeModal(false);
      fetchOffer();
    } catch (err) {
      console.error('Revocation error:', err);
      toast.error(err.message || 'Failed to revoke offer');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading offer details..." />;
  }

  if (!offer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Offer Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested job offer ID could not be located.</p>
        <Link to="/employer/dashboard" className="text-cyan-400 text-xs font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const formattedSalary = offer.salary?.amount
    ? `${offer.salary.currency || 'USD'} ${Number(offer.salary.amount).toLocaleString()} / ${offer.salary.period || 'yr'}`
    : 'Not Specified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top back nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/employer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {offer.status !== 'revoked' && (
          <button
            onClick={() => setShowRevokeModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
          >
            Revoke Offer
          </button>
        )}
      </div>

      {/* Hero Header */}
      <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
              ID: {offer.offerId || offer._id}
            </span>
            <StatusBadge status={offer.status} />
            {offer.onChain && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>On-Chain Verified</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{offer.jobTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Issued to <span className="text-slate-200 font-semibold">{offer.candidateName}</span> ({offer.candidateEmail})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employer/offers/${offer.offerId || offer._id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
            title="Download PDF Offer Letter"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download PDF</span>
          </a>
          <Link
            to={`/verify/result/${offer.offerId || offer._id}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
          >
            <span>Public Proof Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Offer Details & Document Attachment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key metadata card */}
          <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" /> Employment Offer Terms
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block mb-1">Company / Issuer</span>
                <span className="font-bold text-white text-sm">
                  {offer.companyId?.name || offer.companyName || 'Verified Employer'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block mb-1">Department</span>
                <span className="font-bold text-white text-sm">
                  {offer.department || 'Not Specified'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block mb-1">Employment Type</span>
                <span className="font-bold text-white text-sm capitalize">
                  {offer.employmentType || 'Full-time'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block mb-1">Compensation</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formattedSalary}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block mb-1">Issue Date</span>
                <span className="font-medium text-slate-200">
                  {offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block mb-1">Expiry Date</span>
                <span className="font-medium text-slate-200">
                  {offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'No expiry'}
                </span>
              </div>
            </div>

            {offer.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 text-xs">
                <span className="text-slate-400 block mb-1 font-semibold">Special Terms / Notes:</span>
                <p className="text-slate-300 leading-relaxed">{offer.notes}</p>
              </div>
            )}
          </div>

          {/* Document & Hash Section */}
          <div className="rounded-3xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Offer Document & SHA-256 Digest
            </h3>

            {offer.documentHash ? (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Attached Cryptographic Document Hash:
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    SHA-256
                  </span>
                </div>
                <p className="font-mono text-xs text-cyan-300 break-all bg-black/40 p-3 rounded-xl select-all">
                  {offer.documentHash}
                </p>
                <p className="text-[11px] text-slate-400">
                  This SHA-256 fingerprint represents the exact bytes of the PDF contract. To re-calculate or replace it, upload a new document below.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                No document hash attached yet. Upload the official PDF letter below so it can be signed onto Ethereum.
              </div>
            )}

            <DocumentUploader
              onUploadSuccess={handleDocumentUploaded}
              token={token}
              title="Upload Official Offer Letter PDF"
              subtitle="Generates tamper-proof SHA-256 hash to lock on-chain"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Blockchain Registration & QR Code */}
        <div className="lg:col-span-5 space-y-6">
          {offer.onChain ? (
            <>
              {/* Blockchain Badge */}
              <BlockchainBadge
                txHash={offer.blockchainTxHash}
                blockNumber={offer.blockNumber}
                timestamp={offer.updatedAt || offer.createdAt}
                contractAddress={offer.contractAddress || import.meta.env.VITE_CONTRACT_ADDRESS}
              />

              {/* QR Code Display */}
              <QRCodeDisplay
                offerId={offer.offerId || offer._id}
                title="Cryptographic Verification QR"
              />
            </>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 p-6 backdrop-blur-xl shadow-xl space-y-5 text-center">
              {/* Issue without blockchain — makes offer visible to candidate immediately */}
              {offer.status === 'draft' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-3">
                  <p className="text-xs font-semibold text-emerald-300">
                    Issue this offer to the candidate now (without blockchain). They will see it in their dashboard immediately. You can still register on-chain afterwards.
                  </p>
                  <button
                    type="button"
                    onClick={handleIssueOffer}
                    disabled={issuing}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{issuing ? 'Issuing...' : 'Issue Offer to Candidate'}</span>
                  </button>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-16 h-16 mx-auto flex items-center justify-center">
                <Blocks className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Not Registered On-Chain Yet</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  Sign this offer's cryptographic hash to the Ethereum smart contract. This provides mathematical proof that your organization issued this document.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Wallet className="w-3.5 h-3.5" /> Web3 MetaMask Signature
                </div>
                <p>Contract Address: {import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}</p>
                <p>Network: Hardhat Local (31337)</p>
              </div>

              <button
                type="button"
                onClick={handleRegisterOnChain}
                disabled={registering || !offer.documentHash}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing On Blockchain...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Register on Blockchain</span>
                  </>
                )}
              </button>

              {!offer.documentHash && (
                <p className="text-[11px] text-amber-400">
                  ⚠️ Please upload the offer PDF first to generate its SHA-256 hash.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Revoke Job Offer</h3>
              </div>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to revoke this job offer? The offer will permanently show as <strong className="text-rose-400">REVOKED</strong> on the blockchain and will no longer be considered valid.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason for Revocation (Optional)
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={2}
                placeholder="e.g. Candidate declined / Position filled internally"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={revoking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Revocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
