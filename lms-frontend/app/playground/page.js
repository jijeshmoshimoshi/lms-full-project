'use client';
import { useState } from 'react';
import Link from 'next/link';
import CodeSandbox from '../../components/CodeSandbox';
import { 
  Code2, Sparkles, Terminal, Flame, Database, Laptop, 
  ArrowLeft, CheckCircle2, Zap, BookOpen, Layers, ShieldCheck
} from 'lucide-react';

export default function PlaygroundPage() {
  const [selectedPresetLang, setSelectedPresetLang] = useState('web');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* Top Banner / Hero */}
      <div className="border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-transparent pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Link href="/courses" className="hover:text-indigo-400 transition flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Courses</span>
              </Link>
              <span>/</span>
              <span className="text-indigo-400">Code Sandbox</span>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero Server Lag (100% In-Browser)</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Gemini AI Code Copilot</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                  <Code2 className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
                  Interactive Code Sandbox & Lab
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Practice coding exercises, build frontend widgets, test algorithms, and execute queries in a sandboxed client-side environment.
              </p>
            </div>

            {/* Language Quick Highlights */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                <span>HTML/CSS/JS</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>JavaScript</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Python (WASM)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Playground Component */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <CodeSandbox
          initialLanguage="web"
          topicTitle="SkillPulse Master Lab"
        />

        {/* Pro-Tips and Shortcuts Bar */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Terminal className="w-4 h-4" />
              <span>Keyboard Shortcuts</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono text-[10px]">Ctrl+Enter</kbd> (or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono text-[10px]">Cmd+Enter</kbd>) to instantly execute code. Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono text-[10px]">Tab</kbd> for 2-space code indentation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>AI Code Copilot</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stuck on a bug? Open the <strong>AI Copilot</strong> drawer to get instant step-by-step explanations, bug fixes, or performance optimizations tailored to your code.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Safe & Sandboxed</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Code runs inside a private isolated client iframe/worker sandbox. You can safely experiment without risking your local machine or server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
