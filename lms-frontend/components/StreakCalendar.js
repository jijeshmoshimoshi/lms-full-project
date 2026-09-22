'use client';
import { Flame, Shield, Check, Lock, Sparkles } from 'lucide-react';

export default function StreakCalendar({ profile, compact = false }) {
  if (!profile) return null;

  const {
    streak = 0,
    longestStreak = 0,
    last7Days = [],
    isTodayActive = false,
    streakFreezeCount = 0,
    levelInfo,
  } = profile;

  return (
    <div className={`rounded-2xl ${compact ? 'p-3 bg-slate-900 text-white' : 'p-5 bg-white border border-slate-200/80 shadow-xs'}`}>
      
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black ${compact ? 'text-white' : 'text-slate-900'}`}>
                {streak} Day{streak === 1 ? '' : 's'} Streak
              </span>
              {isTodayActive ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Today
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Action Needed
                </span>
              )}
            </div>
            <p className={`text-xs ${compact ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              Personal Best: {longestStreak} days
            </p>
          </div>
        </div>

        {streakFreezeCount > 0 && (
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold"
            title="Streak Freeze: Automatically preserves your streak if you miss a single day!"
          >
            <Shield className="w-3.5 h-3.5 fill-cyan-400/30" />
            <span>{streakFreezeCount} Freeze</span>
          </div>
        )}
      </div>

      {/* 7-Day Flame Track */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-1">
        {last7Days.map((item, idx) => {
          return (
            <div
              key={idx}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                item.isToday
                  ? item.isActive
                    ? 'bg-gradient-to-b from-orange-500/20 to-amber-500/10 border border-orange-500/50 shadow-xs'
                    : 'bg-indigo-500/10 border border-dashed border-indigo-400/50'
                  : item.isActive
                  ? compact ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-50 border border-slate-200/80'
                  : compact ? 'bg-slate-900/40 opacity-40' : 'bg-slate-50/50 opacity-40'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${
                item.isToday ? 'text-amber-400 font-extrabold' : compact ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {item.dayName}
              </span>

              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform ${
                  item.isActive
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs scale-105'
                    : item.isToday
                    ? 'bg-slate-700/50 text-slate-400'
                    : 'bg-slate-200/40 text-slate-400'
                }`}
              >
                {item.isActive ? (
                  <Flame className="w-4 h-4 fill-white" />
                ) : item.isToday ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multiplier Info Tag */}
      {streak >= 3 && (
        <div className={`mt-3.5 pt-3 border-t ${compact ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'} flex items-center justify-between text-xs`}>
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Streak Multiplier Active:</span>
          </span>
          <span className="font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/30">
            {streak >= 30 ? '2.0x XP Boost' : streak >= 14 ? '1.5x XP Boost' : streak >= 7 ? '1.25x XP Boost' : '1.1x XP Boost'}
          </span>
        </div>
      )}

    </div>
  );
}
