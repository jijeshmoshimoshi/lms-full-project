'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  LayoutDashboard, BookOpen, Users, LogOut, Shield, GraduationCap, 
  ExternalLink, CreditCard, Sparkles, CheckCircle2, Clock, 
  BarChart3, AlertCircle, Settings, Tag, Radio, Award
} from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function Sidebar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingBadges, setPendingBadges] = useState({ courses: 0, instructors: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Fetch quick badges for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/overview')
        .then(res => {
          setPendingBadges({
            courses: res.data?.metrics?.pendingCoursesCount || 0,
            instructors: res.data?.metrics?.pendingInstructorsCount || 0,
          });
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  if (!user || pathname === '/login') return null;

  const isActive = (path) => pathname === path;
  const isAdmin = user.role === 'admin';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen flex flex-col justify-between p-5 sticky top-0 h-screen select-none shrink-0 z-40">
      
      {/* Top Header & Navigation */}
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-8 border-b border-slate-800/80 pb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
            isAdmin 
              ? 'bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 shadow-purple-500/20' 
              : 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 shadow-teal-500/20'
          }`}>
            {isAdmin ? <Shield className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-lg text-white tracking-tight leading-none">
                SkillPulse
              </span>
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest mt-1 ${
              isAdmin ? 'text-indigo-400' : 'text-emerald-400'
            }`}>
              {isAdmin ? 'Master Admin' : 'Creator Studio'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            {isAdmin ? 'Platform Governance' : 'Instructor Workspace'}
          </div>

          <Link
            href="/"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/')
                ? isAdmin 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>{isAdmin ? 'Executive Control' : 'Studio Dashboard'}</span>
            </div>
          </Link>

          <Link
            href="/courses"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/courses')
                ? isAdmin 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4.5 h-4.5" />
              <span>{isAdmin ? 'Course Moderation' : 'My Courses'}</span>
            </div>
            {isAdmin && pendingBadges.courses > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                {pendingBadges.courses}
              </span>
            )}
          </Link>

          <Link
            href="/payouts"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/payouts')
                ? isAdmin 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4.5 h-4.5" />
              <span>{isAdmin ? 'Platform Financials' : 'Earnings & Payouts'}</span>
            </div>
          </Link>

          <Link
            href="/coupons"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/coupons')
                ? isAdmin 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag className="w-4.5 h-4.5" />
              <span>Coupons & Offers</span>
            </div>
          </Link>

          <Link
            href="/certificates"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/certificates')
                ? isAdmin 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Award className="w-4.5 h-4.5 text-amber-400" />
              <span>Certificates</span>
            </div>
          </Link>

          <Link
            href="/live"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/live')
                ? isAdmin 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Radio className="w-4.5 h-4.5 text-rose-400" />
              <span>Live Telecast</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider">
              Live
            </span>
          </Link>

          {isAdmin && (
            <Link
              href="/users"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/users')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4.5 h-4.5" />
                <span>User Directory</span>
              </div>
              {pendingBadges.instructors > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                  {pendingBadges.instructors}
                </span>
              )}
            </Link>
          )}

          <div className="pt-6 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            External Links
          </div>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4.5 h-4.5 text-indigo-400" />
              <span>Student Marketplace</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </nav>
      </div>

      {/* User Profile & Logout Footer */}
      <div className="border-t border-slate-800/80 pt-4 mt-auto">
        <div className="bg-slate-800/60 rounded-2xl p-3 flex items-center justify-between gap-3 border border-slate-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center uppercase shrink-0 ${
              isAdmin 
                ? 'bg-gradient-to-tr from-indigo-500 to-purple-600' 
                : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
            }`}>
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{user.name}</span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                isAdmin ? 'text-indigo-400' : 'text-emerald-400'
              }`}>
                {isAdmin ? 'Super Admin' : 'Instructor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60 rounded-lg transition cursor-pointer"
              title="Edit Profile (Headline & Bio)"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </aside>
  );
}
