'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useGamification } from '../context/GamificationContext';
import StreakCalendar from './StreakCalendar';
import { Flame, Trophy, Sparkles, Check, ArrowRight, Award, Zap } from 'lucide-react';

export default function NavbarGamificationPill() {
  const { profile, loading, claimDailyCheckIn } = useGamification();
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profile) return null;

  const {
    xp = 0,
    levelInfo,
    streak = 0,
    isTodayActive = false,
    todayXp = 0,
    dailyGoalXp = 50,
    dailyGoalProgressPercent = 0,
  } = profile;

  const handleCheckIn = async () => {
    try {
      setClaiming(true);
      await claimDailyCheckIn();
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Pill */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-orange-200/80 transition-all duration-200 cursor-pointer shadow-xs"
        title="Streak & XP Progression"
      >
        {/* Streak Flame Badge */}
        <div className="flex items-center gap-1 text-orange-600 font-extrabold text-xs">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-white animate-pulse" />
          </div>
          <span>{streak}</span>
        </div>

        <div className="h-3 w-[1px] bg-orange-200/90" />

        {/* Level & XP Badge */}
        <div className="flex items-center gap-1 text-slate-800 text-xs font-bold">
          <span className="text-amber-500">⭐</span>
          <span>Lvl {levelInfo?.level || 1}</span>
          <span className="text-slate-400 font-normal hidden lg:inline">({xp} XP)</span>
        </div>
      </button>

      {/* Popover Card */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-50 overflow-hidden p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-400">Level {levelInfo?.level || 1}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">• {levelInfo?.title || 'Novice'}</span>
                </div>
                <p className="text-sm font-black text-white">{xp} Total XP</p>
              </div>
            </div>

            <Link
              href="/leaderboard"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl transition"
            >
              <span>Ranks</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Next Level ({levelInfo?.level ? levelInfo.level + 1 : 2})</span>
              <span className="text-indigo-600 font-bold">{levelInfo?.xpToNextLevel || 0} XP needed</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${levelInfo?.progressPercent || 0}%` }}
              />
            </div>
          </div>

          {/* Streak 7-Day Matrix */}
          <StreakCalendar profile={profile} compact={false} />

          {/* Daily Goal & Daily Check-in Button */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Daily XP Goal</span>
              </span>
              <span className="font-extrabold text-amber-700">
                {todayXp} / {dailyGoalXp} XP ({dailyGoalProgressPercent}%)
              </span>
            </div>

            <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${dailyGoalProgressPercent}%` }}
              />
            </div>

            {isTodayActive ? (
              <div className="w-full py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Checked-in Today! Keep the streak alive tomorrow</span>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={claiming}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{claiming ? 'Claiming...' : 'Claim Daily Bonus (+25 XP)'}</span>
              </button>
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="flex items-center justify-between pt-1 text-xs px-1 text-slate-500">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="hover:text-indigo-600 font-semibold transition"
            >
              View Quests & Badges
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setOpen(false)}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Global Leaderboard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
