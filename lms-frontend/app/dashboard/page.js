'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import CertificateModal from '../../components/CertificateModal';
import StreakCalendar from '../../components/StreakCalendar';
import { 
  BookOpen, GraduationCap, Award, TrendingUp, ArrowRight, 
  CheckCircle2, Clock, Sparkles, Trophy, Printer, ExternalLink, AlertTriangle,
  Flame, Zap, Code2, Lock, Check, Footprints, Crown, Star
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { profile, claimDailyCheckIn } = useGamification();
  const [enrollments, setEnrollments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/enrollments/me')
        .then((res) => setEnrollments(res.data))
        .catch(() => setEnrollments([]))
        .finally(() => setFetching(false));
    }
  }, [user]);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      await claimDailyCheckIn();
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 px-6 text-center">
        <div className="glass-card p-8 rounded-3xl border border-slate-200">
          <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Required</h2>
          <p className="text-slate-500 text-sm mb-6">Please log in to view your active enrollments and progress.</p>
          <Link href="/login" className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-500 transition">
            Log In Now
          </Link>
        </div>
      </div>
    );
  }

  const completedCourses = enrollments.filter(e => e.progressPercent === 100 || e.isCompleted);
  const activeCertificates = enrollments.filter(
    (e) => (e.progressPercent === 100 || e.isCompleted || e.certificateIssued) && e.certificateStatus !== 'revoked'
  );
  const revokedCertificates = enrollments.filter(
    (e) => e.certificateStatus === 'revoked'
  );
  const completedCount = completedCourses.length;
  const activeCertificateCount = activeCertificates.length;

  const handleOpenCertificate = (en) => {
    if (en.certificateStatus === 'revoked') return;
    setSelectedCert({
      certificateId: en.certificateId || `CERT-${new Date().getFullYear()}-AWARD`,
      studentName: user.name || 'Student',
      courseTitle: en.course?.title || 'Mastery Course',
      instructorName: en.course?.instructor?.name || 'Lead Instructor',
      issueDate: en.completedAt || en.updatedAt || new Date(),
      certificateStatus: en.certificateStatus || 'active',
      certificateRevokedReason: en.certificateRevokedReason || '',
    });
  };

  const levelInfo = profile?.levelInfo;
  const isTodayActive = profile?.isTodayActive || false;
  const badges = profile?.badges || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Welcome & Gamification Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learner Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {user.name}!</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-lg">
              Level up your developer skills, maintain your daily learning streak, and earn official credentials.
            </p>
          </div>

          {profile && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">{profile.streak} Day Streak 🔥</p>
                <p className="text-lg font-black text-white">{profile.xp} Total XP</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Hub: Level Progress & Daily Quests */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Level Progress & Streak Card */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm">
                    {levelInfo?.level || 1}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      Level {levelInfo?.level || 1}: {levelInfo?.title || 'Novice'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {levelInfo?.xpToNextLevel || 0} XP needed to reach Level {(levelInfo?.level || 1) + 1}
                    </p>
                  </div>
                </div>

                <Link
                  href="/leaderboard"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Leaderboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Animated Level Bar */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Level {levelInfo?.level || 1}</span>
                  <span className="text-indigo-600">{levelInfo?.progressPercent || 0}% Complete</span>
                  <span>Level {(levelInfo?.level || 1) + 1}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${levelInfo?.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streak 7-Day Matrix */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">7-Day Streak Tracker</p>
              <StreakCalendar profile={profile} compact={false} />
            </div>
          </div>

          {/* Daily Quests / Missions Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Daily Quests</span>
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {profile.todayXp} / {profile.dailyGoalXp} XP
                </span>
              </div>

              {/* Missions Checklist */}
              <div className="space-y-3">
                {/* Quest 1: Daily Checkin */}
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isTodayActive ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                      {isTodayActive ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Daily Check-in</p>
                      <p className="text-[11px] text-amber-300 font-semibold">+25 XP bonus</p>
                    </div>
                  </div>

                  {isTodayActive ? (
                    <span className="text-[11px] font-bold text-emerald-400">Done</span>
                  ) : (
                    <button
                      onClick={handleClaim}
                      disabled={claiming}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      {claiming ? '...' : 'Claim'}
                    </button>
                  )}
                </div>

                {/* Quest 2: Watch Lesson */}
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                      <BookOpen className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Complete 1 Lesson</p>
                      <p className="text-[11px] text-amber-300 font-semibold">+50 XP per lesson</p>
                    </div>
                  </div>

                  <Link
                    href="/courses"
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
                  >
                    Learn
                  </Link>
                </div>

                {/* Quest 3: Code in Sandbox */}
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                      <Code2 className="w-4 h-4 text-pink-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Run Code in Sandbox</p>
                      <p className="text-[11px] text-amber-300 font-semibold">+15 XP / execution</p>
                    </div>
                  </div>

                  <Link
                    href="/playground"
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
                  >
                    Lab
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/leaderboard"
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold text-indigo-200 transition flex items-center justify-center gap-2"
            >
              <span>View Global Rankings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}

      {/* Badges & Achievements Cabinet */}
      {badges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Badges & Achievements ({profile?.unlockedBadgeCount || 0}/{profile?.totalBadgeCount || 10})</span>
              </h2>
              <p className="text-xs text-slate-500">Milestone trophies unlocked through learning, streaks, and assessments.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-2 ${
                  badge.isUnlocked
                    ? 'bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-white border-amber-300/80 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/60 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                    badge.isUnlocked
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {badge.isUnlocked ? (
                    <Trophy className="w-6 h-6 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div>
                  <h4 className={`text-xs font-bold ${badge.isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                    {badge.description}
                  </p>
                </div>

                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    badge.isUnlocked
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200/80 text-slate-500'
                  }`}
                >
                  {badge.isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{enrollments.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Completed Courses</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Certificates Earned</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{activeCertificateCount}</p>
          </div>
        </div>
      </div>

      {/* Earned Active Certificates Section */}
      {activeCertificateCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>My Earned Certificates</span>
              </h2>
              <p className="text-xs text-slate-500">Official verified credentials issued for complete course mastery.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCertificates.map((en) => (
              <div
                key={en._id}
                className="p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs transition bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-500/5 border-amber-300"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-sm bg-amber-500 text-slate-950">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800">
                        Verified Certificate
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                      {en.course?.title || 'Course Title'}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      ID: {en.certificateId || 'CERT-COMPLETED'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenCertificate(en)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>View & Download PDF</span>
                  </button>
                  {en.certificateId && (
                    <Link
                      href={`/certificate/${en.certificateId}`}
                      target="_blank"
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition"
                      title="Open public verification page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revoked Credentials Notice if any */}
      {revokedCertificates.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Credential Revocation Notice ({revokedCertificates.length})</span>
          </div>
          <p className="text-xs text-rose-700">
            The following credential has been revoked and is no longer valid or verifiable:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {revokedCertificates.map((en) => (
              <div key={en._id} className="p-4 bg-white rounded-xl border border-rose-200 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 truncate">{en.course?.title || 'Course'}</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-black rounded-full text-[10px] uppercase shrink-0">
                    Revoked
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">ID: {en.certificateId || 'CERT-REVOKED'}</p>
                <div className="text-rose-600 text-[11px] bg-rose-50 p-2 rounded-lg border border-rose-100">
                  <strong>Reason:</strong> {en.certificateRevokedReason || 'Revoked by instructor or administrator.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Enrolled Courses</h2>

        {enrollments.length === 0 ? (
          <div className="bg-white text-center py-16 px-6 rounded-2xl border border-slate-200 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Enrollments</h3>
            <p className="text-slate-500 text-sm mb-6">
              You haven't enrolled in any courses yet. Explore our course catalog to get started!
            </p>
            <Link 
              href="/courses" 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-500 transition"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((en) => {
              const is100 = en.progressPercent === 100 || en.isCompleted;
              return (
                <div 
                  key={en._id} 
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {en.course?.category || 'Active Course'}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        {is100 ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="text-indigo-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg mb-2">
                      {en.course?.title || 'Course Title'}
                    </h3>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-2">
                      <span>Overall Progress</span>
                      <span className="text-indigo-600 font-bold">{en.progressPercent || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          is100 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                        }`}
                        style={{ width: `${en.progressPercent || 0}%` }} 
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/courses/${en.course?.slug || en.course?._id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                      >
                        <span>{is100 ? 'Review Lectures' : 'Continue Lecture'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {is100 && (
                        en.certificateStatus === 'revoked' ? (
                          <div
                            className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
                            title={en.certificateRevokedReason || 'Certificate revoked by instructor'}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>Revoked</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenCertificate(en)}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            title="View Certificate"
                          >
                            <Award className="w-4 h-4" />
                            <span>Certificate</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

    </div>
  );
}
