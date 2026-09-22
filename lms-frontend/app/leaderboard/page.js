'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import {
  Trophy, Flame, Award, Sparkles, Crown, Medal,
  ArrowRight, Shield, Zap, Search, UserCheck
} from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { profile } = useGamification();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all-time');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/gamification/leaderboard?period=${period}`);
        if (res.data?.success) {
          setLeaderboard(res.data.leaderboard || []);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  const filteredLeaderboard = leaderboard.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);
  const restOfStudents = filteredLeaderboard.slice(3);

  // Identify user's rank
  const userRankIndex = leaderboard.findIndex(
    (s) => String(s.id) === String(user?.id || user?._id)
  );
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold backdrop-blur-md mb-3 border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>SkillPulse Arena</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Global XP & Streak Leaderboard
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl leading-relaxed">
              Compete with students worldwide! Earn XP by completing lessons, passing quizzes, coding in the sandbox, and maintaining your daily streaks.
            </p>
          </div>

          {user && profile && (
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-white text-lg shadow-md">
                {userRank ? `#${userRank}` : 'Unranked'}
              </div>
              <div>
                <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Your Standing</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-black text-white">{profile.xp} XP</span>
                  <span className="text-xs text-amber-300 font-bold flex items-center gap-0.5">
                    <Flame className="w-3.5 h-3.5 fill-amber-300" />
                    {profile.streak}d
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Toggle Period */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setPeriod('all-time')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              period === 'all-time'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏆 All-Time Masters
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              period === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Weekly Sprint
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-semibold">Loading top performers...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4 items-end">
              
              {/* 2nd Place (Silver) */}
              {topThree[1] && (
                <div className="order-2 md:order-1 bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-lg text-center relative hover:-translate-y-1 transition duration-300">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm absolute -top-5 left-1/2 -translate-x-1/2 shadow-md">
                    2
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-md mt-2">
                    {topThree[1].name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base truncate">{topThree[1].name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{topThree[1].levelTitle} (Lvl {topThree[1].level})</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">XP</p>
                      <p className="text-sm font-extrabold text-slate-900">{topThree[1].xp}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Streak</p>
                      <p className="text-sm font-extrabold text-orange-500 flex items-center gap-0.5 justify-center">
                        <Flame className="w-3.5 h-3.5 fill-orange-500" />
                        {topThree[1].streak}d
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold Crown) */}
              {topThree[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-100/20 to-white rounded-3xl p-7 border-2 border-amber-400 shadow-xl text-center relative md:-translate-y-4 hover:-translate-y-5 transition duration-300">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg absolute -top-6 left-1/2 -translate-x-1/2 shadow-lg ring-4 ring-white">
                    <Crown className="w-6 h-6 fill-slate-950" />
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg mt-3">
                    {topThree[0].name.charAt(0)}
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-1">
                    Grand Champion
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg truncate">{topThree[0].name}</h3>
                  <p className="text-xs text-indigo-600 font-bold">{topThree[0].levelTitle} (Lvl {topThree[0].level})</p>

                  <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center justify-around">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Total XP</p>
                      <p className="text-lg font-black text-amber-700">{topThree[0].xp}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Streak</p>
                      <p className="text-lg font-black text-orange-600 flex items-center gap-0.5 justify-center">
                        <Flame className="w-4 h-4 fill-orange-500" />
                        {topThree[0].streak}d
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {topThree[2] && (
                <div className="order-3 bg-white rounded-3xl p-6 border-2 border-amber-700/30 shadow-lg text-center relative hover:-translate-y-1 transition duration-300">
                  <div className="w-10 h-10 rounded-full bg-amber-800 text-white flex items-center justify-center font-black text-sm absolute -top-5 left-1/2 -translate-x-1/2 shadow-md">
                    3
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-900 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-md mt-2">
                    {topThree[2].name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base truncate">{topThree[2].name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{topThree[2].levelTitle} (Lvl {topThree[2].level})</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">XP</p>
                      <p className="text-sm font-extrabold text-slate-900">{topThree[2].xp}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Streak</p>
                      <p className="text-sm font-extrabold text-orange-500 flex items-center gap-0.5 justify-center">
                        <Flame className="w-3.5 h-3.5 fill-orange-500" />
                        {topThree[2].streak}d
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Medal className="w-5 h-5 text-indigo-600" />
                <span>Student Rankings</span>
              </h2>
              <span className="text-xs text-slate-500">{filteredLeaderboard.length} active students</span>
            </div>

            {filteredLeaderboard.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No students found matching "{searchQuery}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLeaderboard.map((student, idx) => {
                  const isCurrentUser = String(student.id) === String(user?.id || user?._id);
                  return (
                    <div
                      key={student.id}
                      className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition ${
                        isCurrentUser
                          ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600 font-bold'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Rank Pill */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            student.rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : student.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : student.rank === 3
                              ? 'bg-amber-800 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{student.rank}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase shadow-xs">
                          {student.name.charAt(0)}
                        </div>

                        {/* Name & Title */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {student.name}
                            </span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-indigo-600 text-white">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {student.levelTitle} • Level {student.level}
                          </p>
                        </div>
                      </div>

                      {/* Right Stats: Streak & XP */}
                      <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200/50">
                          <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                          <span>{student.streak}d</span>
                        </div>

                        <div>
                          <p className="text-sm font-black text-slate-900">{student.xp} XP</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">{student.badgeCount || 0} badges</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* How to Earn XP Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>How to Earn More XP & Level Up</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-indigo-100/80 shadow-xs">
            <p className="font-bold text-slate-900">Daily Check-in</p>
            <p className="text-slate-500 mt-0.5">+25 XP / day</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-indigo-100/80 shadow-xs">
            <p className="font-bold text-slate-900">Complete a Lesson</p>
            <p className="text-slate-500 mt-0.5">+50 XP / lecture</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-indigo-100/80 shadow-xs">
            <p className="font-bold text-slate-900">Pass a Quiz</p>
            <p className="text-slate-500 mt-0.5">+40 to +60 XP</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-indigo-100/80 shadow-xs">
            <p className="font-bold text-slate-900">Full Course Mastery</p>
            <p className="text-slate-500 mt-0.5">+200 XP Graduation</p>
          </div>
        </div>
      </div>

    </div>
  );
}
