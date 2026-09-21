'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Award, Search, ArrowRight, CheckCircle2, Lock, Sparkles, HelpCircle } from 'lucide-react';

export default function CertificateVerificationSearchPage() {
  const [certId, setCertId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanId = certId.trim();
    if (!cleanId) {
      setError('Please enter a valid Certificate ID');
      return;
    }
    setError('');
    router.push(`/certificate/${encodeURIComponent(cleanId)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5 text-white font-extrabold text-lg tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <span>SkillPulse <span className="text-amber-400">Academy</span></span>
        </Link>

        <Link
          href="/courses"
          className="text-xs font-bold text-slate-400 hover:text-white transition"
        >
          Explore Courses
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="relative z-10 max-w-3xl mx-auto w-full px-6 py-16 text-center space-y-8">
        
        {/* Verification Shield Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official Credential Registry & Verification</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Verify Certificate <span className="text-amber-400">Authenticity</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Employers, recruiters, and academic institutions can verify the validity of any completion certificate issued by our platform in real time.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto space-y-3">
          <div className="relative flex items-center bg-slate-900 border-2 border-slate-700 focus-within:border-amber-500 rounded-2xl p-2 shadow-2xl transition duration-200">
            <div className="pl-3 text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={certId}
              onChange={(e) => {
                setCertId(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter Certificate ID (e.g. CERT-2026-XXXXXX)"
              className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 font-mono focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Verify Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-400 text-left pl-3">{error}</p>
          )}

          <p className="text-xs text-slate-500 text-left pl-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>The Certificate ID can be found at the bottom-right corner of the official PDF or printed credential.</span>
          </p>
        </form>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 text-left">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">Tamper-Proof Registry</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Every credential is keyed to a unique immutable ID logged upon verified course completion.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">Live Status & Revocation</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Instantly shows if a credential is active, verified, or revoked by the institution.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">Direct QR Scanning</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Scan the QR code printed on physical or PDF certificates to open this audit portal instantly.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SkillPulse Learning Academy. All rights reserved. Official Credential Verification System.</p>
      </footer>

    </div>
  );
}
