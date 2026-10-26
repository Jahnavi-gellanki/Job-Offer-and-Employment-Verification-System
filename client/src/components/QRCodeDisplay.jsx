import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, QrCode, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRCodeDisplay({ 
  offerId, 
  customUrl, 
  title = "Offer Verification QR Code",
  size = 180 
}) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const verificationUrl = customUrl || `${window.location.origin}/verify/result/${offerId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success('Verification URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size * 2;
        canvas.height = size * 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `offer-verify-${offerId || 'qr'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR Code downloaded as PNG!');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Download QR failed:', err);
      toast.error('Could not download QR code');
    }
  };

  return (
    <div className="rounded-2xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-5 flex flex-col items-center text-center shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-slate-300 font-semibold text-sm">
        <QrCode className="w-4 h-4 text-cyan-400" />
        <span>{title}</span>
      </div>

      {/* QR Code Container */}
      <div 
        ref={qrRef}
        className="p-3 bg-white rounded-2xl shadow-xl transition-transform hover:scale-105 duration-300"
      >
        <QRCodeSVG
          value={verificationUrl}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>

      <p className="mt-3 text-xs text-slate-400 max-w-xs">
        Scan to view tamper-proof blockchain verification proof.
      </p>

      {/* Verification URL box */}
      <div className="mt-4 w-full p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-2 text-xs">
        <span className="font-mono text-slate-400 truncate text-left select-all">
          {verificationUrl}
        </span>
        <button
          onClick={copyUrl}
          className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition shrink-0"
          title="Copy Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2 w-full">
        <button
          onClick={copyUrl}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy URL</span>
        </button>

        <button
          onClick={downloadQR}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save QR</span>
        </button>
      </div>
    </div>
  );
}
