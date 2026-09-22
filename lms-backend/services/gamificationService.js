const User = require('../models/User');

// Level progression brackets
const LEVEL_TIERS = [
  { level: 1, title: 'Novice Learner', minXp: 0, maxXp: 100 },
  { level: 2, title: 'Apprentice', minXp: 100, maxXp: 250 },
  { level: 3, title: 'Code Explorer', minXp: 250, maxXp: 500 },
  { level: 4, title: 'Knowledge Seeker', minXp: 500, maxXp: 900 },
  { level: 5, title: 'Skilled Developer', minXp: 900, maxXp: 1500 },
  { level: 6, title: 'Master Coder', minXp: 1500, maxXp: 2400 },
  { level: 7, title: 'Grandmaster', minXp: 2400, maxXp: 3600 },
  { level: 8, title: 'Legendary Architect', minXp: 3600, maxXp: 5000 },
  { level: 9, title: 'Coding Luminary', minXp: 5000, maxXp: 7000 },
  { level: 10, title: 'SkillPulse Elite', minXp: 7000, maxXp: 10000 },
];

/**
 * Calculate user level and progress based on total XP
 */
const getLevelInfo = (xp) => {
  const currentXp = Math.max(0, xp || 0);
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    const tier = LEVEL_TIERS[i];
    if (currentXp >= tier.minXp) {
      const xpInCurrentLevel = currentXp - tier.minXp;
      const xpRequiredForLevel = tier.maxXp - tier.minXp;
      const progressPercent = Math.min(
        100,
        Math.round((xpInCurrentLevel / xpRequiredForLevel) * 100)
      );
      return {
        level: tier.level,
        title: tier.title,
        minXp: tier.minXp,
        maxXp: tier.maxXp,
        currentXp,
        xpInCurrentLevel,
        xpRequiredForLevel,
        xpToNextLevel: Math.max(0, tier.maxXp - currentXp),
        progressPercent,
      };
    }
  }
  return {
    level: 1,
    title: LEVEL_TIERS[0].title,
    minXp: 0,
    maxXp: 100,
    currentXp: 0,
    xpInCurrentLevel: 0,
    xpRequiredForLevel: 100,
    xpToNextLevel: 100,
    progressPercent: 0,
  };
};

/**
 * Get date string formatted as YYYY-MM-DD
 */
const getTodayStr = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d.toISOString().split('T')[0];
};

/**
 * Get streak multiplier based on streak count
 */
const getStreakMultiplier = (streak) => {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
};

// All available badges definitions
const BADGE_DEFINITIONS = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Completed your very first video lesson!',
    icon: 'Footprints',
    category: 'learning',
    check: (user, ctx) => ctx.action === 'LESSON_COMPLETE',
  },
  {
    id: 'streak_3',
    title: 'Streak Starter',
    description: 'Maintained a 3-day active learning streak 🔥',
    icon: 'Flame',
    category: 'streak',
    check: (user) => (user.streak || 0) >= 3,
  },
  {
    id: 'streak_7',
    title: 'Unstoppable Momentum',
    description: '7-day learning streak! You are in the top 5% of learners ⚡',
    icon: 'Zap',
    category: 'streak',
    check: (user) => (user.streak || 0) >= 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Legend',
    description: 'Phenomenal! 30-day continuous daily streak 🏆',
    icon: 'Crown',
    category: 'streak',
    check: (user) => (user.streak || 0) >= 30,
  },
  {
    id: 'xp_100',
    title: 'Century Club',
    description: 'Earned 100 total Experience Points (XP)',
    icon: 'Star',
    category: 'xp',
    check: (user) => (user.xp || 0) >= 100,
  },
  {
    id: 'xp_500',
    title: 'XP High Flyer',
    description: 'Reached 500 total XP milestone',
    icon: 'Sparkles',
    category: 'xp',
    check: (user) => (user.xp || 0) >= 500,
  },
  {
    id: 'xp_1000',
    title: 'Grand Scholar',
    description: 'Crossed 1,000 XP in learning mastery',
    icon: 'Award',
    category: 'xp',
    check: (user) => (user.xp || 0) >= 1000,
  },
  {
    id: 'code_wizard',
    title: 'Code Wizard',
    description: 'Executed interactive code in the SkillPulse Lab Sandbox',
    icon: 'Code2',
    category: 'coding',
    check: (user, ctx) => ctx.action === 'PLAYGROUND_RUN',
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Scored a perfect score on a lesson quiz',
    icon: 'CheckCheck',
    category: 'learning',
    check: (user, ctx) => ctx.action === 'QUIZ_PERFECT',
  },
  {
    id: 'course_master',
    title: 'Course Conqueror',
    description: 'Successfully finished and graduated from a full course',
    icon: 'GraduationCap',
    category: 'learning',
    check: (user, ctx) => ctx.action === 'COURSE_COMPLETE',
  },
];

/**
 * Award XP, process daily streaks, and check badges
 */
const awardActivityXp = async (userId, actionType, customBaseXp = null, description = '', extraContext = {}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const today = getTodayStr(0);
  const yesterday = getTodayStr(-1);
  const dayBeforeYesterday = getTodayStr(-2);

  let streakIncreased = false;
  let streakFrozenUsed = false;
  let oldStreak = user.streak || 0;
  let oldLevel = user.level || 1;

  // 1. Calculate and update Daily Streak
  if (!user.streakHistory) user.streakHistory = [];

  if (!user.lastActiveDate) {
    // First time active
    user.streak = 1;
    user.lastActiveDate = today;
    user.todayXp = 0;
    if (!user.streakHistory.includes(today)) user.streakHistory.push(today);
    streakIncreased = true;
  } else if (user.lastActiveDate === today) {
    // Already active today, streak remains same, todayXp continues accumulating
  } else if (user.lastActiveDate === yesterday) {
    // Consecutive day! Increment streak
    user.streak = (user.streak || 0) + 1;
    user.lastActiveDate = today;
    user.todayXp = 0;
    if (!user.streakHistory.includes(today)) user.streakHistory.push(today);
    streakIncreased = true;
  } else {
    // Missed at least one day
    if (user.lastActiveDate === dayBeforeYesterday && (user.streakFreezeCount || 0) > 0) {
      // Use streak freeze to protect streak
      user.streakFreezeCount -= 1;
      user.streak = (user.streak || 0) + 1;
      user.lastActiveDate = today;
      user.todayXp = 0;
      if (!user.streakHistory.includes(today)) user.streakHistory.push(today);
      streakIncreased = true;
      streakFrozenUsed = true;
    } else {
      // Streak resets to 1
      user.streak = 1;
      user.lastActiveDate = today;
      user.todayXp = 0;
      if (!user.streakHistory.includes(today)) user.streakHistory.push(today);
      streakIncreased = true;
    }
  }

  user.longestStreak = Math.max(user.longestStreak || 0, user.streak || 0);

  // Keep streakHistory to last 30 days
  if (user.streakHistory.length > 30) {
    user.streakHistory = user.streakHistory.slice(-30);
  }

  // 2. Determine base XP by action type
  let baseXp = customBaseXp;
  if (baseXp === null) {
    switch (actionType) {
      case 'DAILY_CHECKIN':
        baseXp = 25;
        if (!description) description = 'Daily Check-in Bonus';
        break;
      case 'LESSON_COMPLETE':
        baseXp = 50;
        if (!description) description = 'Completed Video Lesson';
        break;
      case 'QUIZ_PASS':
        baseXp = 40;
        if (!description) description = 'Passed Lesson Quiz';
        break;
      case 'QUIZ_PERFECT':
        baseXp = 60;
        if (!description) description = 'Perfect Score on Quiz';
        break;
      case 'PLAYGROUND_RUN':
        baseXp = 15;
        if (!description) description = 'Code Sandbox Experimentation';
        break;
      case 'COURSE_COMPLETE':
        baseXp = 200;
        if (!description) description = 'Full Course Certification Mastery';
        break;
      default:
        baseXp = 10;
        if (!description) description = 'Learning Activity';
    }
  }

  // Apply streak multiplier
  const multiplier = getStreakMultiplier(user.streak);
  const finalXpAwarded = Math.round(baseXp * multiplier);

  user.xp = (user.xp || 0) + finalXpAwarded;
  user.todayXp = (user.todayXp || 0) + finalXpAwarded;

  // Log to xpHistory
  if (!user.xpHistory) user.xpHistory = [];
  user.xpHistory.unshift({
    action: actionType,
    xp: finalXpAwarded,
    description: multiplier > 1.0 ? `${description} (${multiplier}x Streak Boost)` : description,
    createdAt: new Date(),
  });
  if (user.xpHistory.length > 20) {
    user.xpHistory = user.xpHistory.slice(0, 20);
  }

  // 3. Recalculate Level
  const levelInfo = getLevelInfo(user.xp);
  const leveledUp = levelInfo.level > oldLevel;
  user.level = levelInfo.level;

  // 4. Check & Unlock Badges
  if (!user.badges) user.badges = [];
  const existingBadgeIds = new Set(user.badges.map((b) => b.id));
  const newlyUnlockedBadges = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    if (!existingBadgeIds.has(badgeDef.id)) {
      const isQualified = badgeDef.check(user, {
        action: actionType,
        baseXp,
        ...extraContext,
      });
      if (isQualified) {
        const newBadge = {
          id: badgeDef.id,
          title: badgeDef.title,
          description: badgeDef.description,
          icon: badgeDef.icon,
          category: badgeDef.category,
          unlockedAt: new Date(),
        };
        user.badges.push(newBadge);
        newlyUnlockedBadges.push(newBadge);
      }
    }
  }

  await user.save();

  return {
    xpAwarded: finalXpAwarded,
    baseXp,
    multiplier,
    totalXp: user.xp,
    todayXp: user.todayXp,
    dailyGoalXp: user.dailyGoalXp || 50,
    dailyGoalCompleted: (user.todayXp || 0) >= (user.dailyGoalXp || 50),
    levelInfo,
    leveledUp,
    streak: user.streak,
    longestStreak: user.longestStreak,
    streakIncreased,
    streakFrozenUsed,
    streakHistory: user.streakHistory,
    newlyUnlockedBadges,
    action: actionType,
    description,
  };
};

/**
 * Get student's gamification profile and 7-day week activity matrix
 */
const getGamificationProfile = async (userId) => {
  const user = await User.findById(userId).select(
    'name email avatar xp level streak longestStreak lastActiveDate streakHistory streakFreezeCount dailyGoalXp todayXp badges xpHistory'
  );
  if (!user) return null;

  const today = getTodayStr(0);

  // If lastActiveDate is not today, todayXp should display 0
  const isTodayActive = user.lastActiveDate === today;
  const todayXp = isTodayActive ? (user.todayXp || 0) : 0;

  const levelInfo = getLevelInfo(user.xp);

  // Generate last 7 days tracker
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = getTodayStr(-i);
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = i === 0;
    const isActive = (user.streakHistory || []).includes(dateStr);
    last7Days.push({
      date: dateStr,
      dayName,
      isToday,
      isActive,
    });
  }

  // All badge list with unlocked status
  const unlockedMap = new Map((user.badges || []).map((b) => [b.id, b]));
  const allBadgesWithStatus = BADGE_DEFINITIONS.map((def) => {
    const unlocked = unlockedMap.get(def.id);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      isUnlocked: !!unlocked,
      unlockedAt: unlocked ? unlocked.unlockedAt : null,
    };
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      avatar: user.avatar,
    },
    xp: user.xp || 0,
    levelInfo,
    streak: user.streak || 0,
    longestStreak: user.longestStreak || 0,
    isTodayActive,
    todayXp,
    dailyGoalXp: user.dailyGoalXp || 50,
    dailyGoalProgressPercent: Math.min(100, Math.round((todayXp / (user.dailyGoalXp || 50)) * 100)),
    streakFreezeCount: user.streakFreezeCount || 0,
    last7Days,
    badges: allBadgesWithStatus,
    unlockedBadgeCount: (user.badges || []).length,
    totalBadgeCount: BADGE_DEFINITIONS.length,
    recentXpHistory: (user.xpHistory || []).slice(0, 10),
  };
};

/**
 * Get Leaderboard (Weekly & All-Time)
 */
const getLeaderboard = async (period = 'all-time', limit = 25) => {
  const students = await User.find({ role: 'student' })
    .select('name email avatar xp level streak badges createdAt')
    .sort({ xp: -1 })
    .limit(limit);

  return students.map((student, index) => {
    const levelInfo = getLevelInfo(student.xp);
    return {
      rank: index + 1,
      id: student._id,
      name: student.name || 'Anonymous Student',
      avatar: student.avatar || '',
      xp: student.xp || 0,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      streak: student.streak || 0,
      badgeCount: (student.badges || []).length,
    };
  });
};

module.exports = {
  getLevelInfo,
  awardActivityXp,
  getGamificationProfile,
  getLeaderboard,
  BADGE_DEFINITIONS,
};
