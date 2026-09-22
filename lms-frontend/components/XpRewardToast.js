'use client';
import { useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import { Flame, Sparkles, Trophy, Award, X, Zap, CheckCircle2 } from 'lucide-react';

export default function XpRewardToast() {
  const { rewardToast, closeToast } = useGamification();

  useEffect(() => {
    if (rewardToast) {
      const timer = setTimeout(() => {
        closeToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [rewardToast, closeToast]);

  if (!rewardToast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-in fade-in slide-in-from-bottom-8 duration-300 pointer-events-auto">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-amber-500/40 p-5 shadow-2xl shadow-amber-500/20 text-white">
        
        {/* Glow background burst */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeToast}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Animated Icon Avatar */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-bounce">
              {rewardToast.leveledUp ? (
                <Trophy className="w-7 h-7 text-white" />
              ) : rewardToast.streakIncreased ? (
                <Flame className="w-7 h-7 text-white" />
              ) : (
                <Sparkles className="w-7 h-7 text-white" />
              )}
            </div>
            {rewardToast.multiplier > 1 && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-600 text-white border border-indigo-400">
                {rewardToast.multiplier}x
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {rewardToast.leveledUp ? '🎉 Level Up!' : '⚡ XP Earned!'}
              </span>
              {rewardToast.streak > 0 && (
                <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>{rewardToast.streak} Day Streak</span>
                </span>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                +{rewardToast.xpAwarded} XP
              </span>
              <span className="text-xs text-slate-300 font-medium truncate">
                {rewardToast.description}
              </span>
            </div>

            {/* Level up extra message */}
            {rewardToast.leveledUp && rewardToast.levelInfo && (
              <div className="mt-2 p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs flex items-center gap-2 text-indigo-200">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Promoted to <strong>Level {rewardToast.levelInfo.level} ({rewardToast.levelInfo.title})</strong>!
                </span>
              </div>
            )}

            {/* Badge Unlocked Notification */}
            {rewardToast.badges && rewardToast.badges.length > 0 && (
              <div className="mt-2 space-y-1">
                {rewardToast.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs flex items-center gap-2 text-amber-200 animate-pulse"
                  >
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Badge Unlocked: <strong>{badge.title}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
