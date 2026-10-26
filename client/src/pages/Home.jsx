import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  QrCode, 
  Zap, 
  FileCheck, 
  Blocks, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Users, 
  Building2, 
  Database, 
  Cpu, 
  ChevronRight,
  Fingerprint
} from 'lucide-react';

export default function Home() {
  const stats = [
    { value: '10,000+', label: 'Job Offers Secured', icon: FileCheck, color: 'text-cyan-400' },
    { value: '100%', label: 'Tamper Prevention', icon: ShieldCheck, color: 'text-emerald-400' },
    { value: '450+', label: 'Verified Employers', icon: Building2, color: 'text-blue-400' },
    { value: '< 2 sec', label: 'Instant Verification', icon: Zap, color: 'text-purple-400' },
  ];

  const features = [
    {
      icon: Lock,
      title: 'Cryptographic SHA-256 Hashing',
      description:
        'Documents are converted into unique cryptographic hashes before hitting the chain. Zero sensitive candidate data or PII is ever leaked to the public blockchain.',
      color: 'from-blue-600/20 to-cyan-600/10',
      iconColor: 'text-cyan-400',
    },
    {
      icon: Blocks,
      title: 'Immutable Blockchain Registry',
      description:
        'Stored on smart contracts running on Ethereum. Once an employer issues an offer, the record cannot be forged, manipulated, or backdated by anyone.',
      color: 'from-purple-600/20 to-pink-600/10',
      iconColor: 'text-purple-400',
    },
    {
      icon: QrCode,
      title: 'Instant QR Code Verification',
      description:
        'Every job offer includes a cryptographically-linked QR code. Background check agencies, universities, and banks can verify legitimacy in seconds.',
      color: 'from-emerald-600/20 to-teal-600/10',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Fingerprint,
      title: 'Employer Wallet Signature',
      description:
        'Every offer is signed on-chain using the verified corporate MetaMask wallet, guaranteeing clear lineage and indisputable provenance.',
      color: 'from-amber-600/20 to-orange-600/10',
      iconColor: 'text-amber-400',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Company Issues Job Offer',
      desc: 'The verified employer drafts the job offer terms and generates a digitally hashed PDF contract.',
      icon: Building2,
    },
    {
      step: '02',
      title: 'Registered on Smart Contract',
      desc: 'The employer signs via MetaMask, permanently anchoring the SHA-256 hash onto the Ethereum blockchain.',
      icon: Blocks,
    },
    {
      step: '03',
      title: 'Instant Public Verification',
      desc: 'The candidate or verifier scans the QR code or checks the document hash against the blockchain for 100% authenticity.',
      icon: ShieldCheck,
    },
  ];

  const techStack = [
    { name: 'Ethereum / Hardhat', role: 'Smart Contract Network', icon: '⛓️' },
    { name: 'Solidity 0.8.19', role: 'Smart Contract Logic', icon: '📜' },
    { name: 'Ethers.js v6', role: 'Web3 Client Provider', icon: '⚡' },
    { name: 'SHA-256 Engine', role: 'Cryptographic Digest', icon: '🔒' },
    { name: 'MetaMask', role: 'Digital Signatures', icon: '🦊' },
    { name: 'React + Vite', role: 'Modern UI Engine', icon: '⚛️' },
  ];

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background ambient decorative glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-1/3 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-8 hover:scale-105 transition-transform cursor-pointer">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Gen Cryptographic HR Infrastructure</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Blockchain-Powered{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
            Employment & Offer
          </span>{' '}
          Verification
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Eliminate credential fraud and fake offer letters permanently. Issuers sign cryptographic digests 
          on Ethereum smart contracts, enabling candidates and background screeners to verify offers instantaneously.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/verify"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white font-bold text-base shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition duration-300 transform hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Verify an Offer Now</span>
          </Link>

          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-base border border-white/10 hover:border-cyan-500/30 backdrop-blur-md flex items-center justify-center gap-2 transition duration-300"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </Link>
        </div>

        {/* Trust Badges row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Zero Personal Data Stored On-Chain
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Ethereum Smart Contract Guaranteed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> MetaMask Compatible
          </span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-2xl shadow-xl">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center p-3">
                <Icon className={`w-6 h-6 mb-2 ${s.color}`} />
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {s.value}
                </span>
                <span className="text-xs text-slate-400 font-medium mt-1">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
            Engineered For Trust
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            Why Modern HR & Candidates Trust VeriJob
          </p>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            Traditional PDF offer letters are trivially spoofed and altered. VeriJob connects every job document to an immutable cryptographic proof on the blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${f.color} rounded-full blur-2xl group-hover:scale-150 transition-transform`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${f.iconColor} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
            Seamless Three-Step Architecture
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            How The Blockchain Verification Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl bg-[#1e293b]/70 border border-white/10 p-8 backdrop-blur-xl flex flex-col items-start hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between w-full mb-6">
                  <span className="text-3xl font-black text-cyan-400/40 font-mono">
                    {st.step}
                  </span>
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{st.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack Highlights */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-white/10">
        <div className="text-center mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
            Under The Hood
          </h3>
          <p className="text-2xl font-bold text-white">Enterprise Blockchain Stack</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map((tech, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center flex flex-col items-center justify-center hover:border-white/20 transition"
            >
              <span className="text-2xl mb-2">{tech.icon}</span>
              <span className="text-xs font-bold text-white">{tech.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{tech.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-cyan-950/40 to-purple-900/40 border border-cyan-500/30 p-8 sm:p-14 text-center backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black text-white max-w-2xl mx-auto">
            Ready to Secure Your Employment Offers?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Join hundreds of forward-thinking enterprises issuing verifiable job offers on Ethereum.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition shadow-lg"
            >
              Create Account
            </Link>
            <Link
              to="/verify"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold border border-white/20 transition"
            >
              Verify An Offer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">VeriJob Platform</span>
            <span>• College Final Year Demonstration System</span>
          </div>
          <p>© 2026 Blockchain Job Offer & Employment Verification System. Fictional demo environment.</p>
        </div>
      </footer>
    </div>
  );
}
