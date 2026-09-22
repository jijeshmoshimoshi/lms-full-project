'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/api';

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rewardToast, setRewardToast] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/gamification/me');
      if (res.data?.success) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error('Error fetching gamification profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const triggerReward = useCallback((rewardData) => {
    if (!rewardData) return;
    setRewardToast({
      id: Date.now(),
      xpAwarded: rewardData.xpAwarded || rewardData.xp || 0,
      streak: rewardData.streak || 0,
      streakIncreased: rewardData.streakIncreased || false,
      leveledUp: rewardData.leveledUp || false,
      levelInfo: rewardData.levelInfo || null,
      badges: rewardData.newlyUnlockedBadges || [],
      description: rewardData.description || 'Action Completed!',
      multiplier: rewardData.multiplier || 1,
    });
    // Auto-refresh profile state
    fetchProfile();
  }, [fetchProfile]);

  const claimDailyCheckIn = async () => {
    if (!user) return null;
    try {
      const res = await api.post('/gamification/check-in');
      if (res.data?.success && res.data?.result) {
        triggerReward(res.data.result);
        return res.data.result;
      }
    } catch (err) {
      console.error('Error claiming daily check-in:', err);
      throw err;
    }
  };

  const awardPlaygroundRun = async () => {
    if (!user) return null;
    try {
      const res = await api.post('/gamification/award', {
        actionType: 'PLAYGROUND_RUN',
      });
      if (res.data?.success && res.data?.result) {
        triggerReward(res.data.result);
        return res.data.result;
      }
    } catch (err) {
      console.error('Error awarding playground XP:', err);
    }
  };

  const closeToast = () => setRewardToast(null);

  return (
    <GamificationContext.Provider
      value={{
        profile,
        loading,
        fetchProfile,
        claimDailyCheckIn,
        awardPlaygroundRun,
        triggerReward,
        rewardToast,
        closeToast,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
