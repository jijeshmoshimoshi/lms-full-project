import Link from 'next/link';
import { BookOpen, Sparkles, Award, Zap, Users, ArrowRight, CheckCircle2, ShieldCheck, PlayCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs mb-8 hover:bg-indigo-100/70 transition cursor-default animate-bounce-subtle">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Next-Gen Learning Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-500 font-normal">Over 100+ Premium Courses</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Master High-Impact Skills <br className="hidden sm:inline" />
            <span className="text-gradient">On Your Schedule</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Accelerate your career with industry-tailored courses, interactive quizzes, hands-on projects, and verifiable credentials.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/courses" 
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition duration-200 text-base"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link 
              href="/register" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition duration-200 text-base"
            >
              <span>Join as Student</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Certificates</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Self-Paced Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Expert Instructors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Highlight Bar */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center md:border-r border-slate-800">
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-heading">10k+</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Active Students</p>
          </div>
          <div className="text-center md:border-r border-slate-800">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-heading">95%</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Completion Rate</p>
          </div>
          <div className="text-center md:border-r border-slate-800">
            <p className="text-3xl sm:text-4xl font-extrabold text-violet-400 font-heading">120+</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Expert Mentors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-fuchsia-400 font-heading">4.9★</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Average Rating</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Why SkillPulse?
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4">
            Everything you need to excel in your field
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl border border-slate-200/80 hover:shadow-lg transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">High-Definition Content</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Curated lessons with step-by-step video walkthroughs, downloadable resources, and practical codebase repositories.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-slate-200/80 hover:shadow-lg transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Quizzes</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Test your mastery with instant quiz scoring, interactive assessments, and detailed explanations for every topic.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-slate-200/80 hover:shadow-lg transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Progress Analytics</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Monitor your enrollment progress, completion percentages, and quiz scores with our intuitive personal dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
