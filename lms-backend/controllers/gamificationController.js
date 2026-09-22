const {
  awardActivityXp,
  getGamificationProfile,
  getLeaderboard,
} = require('../services/gamificationService');

/**
 * Get current authenticated user's full gamification stats
 */
exports.getMyGamificationProfile = async (req, res) => {
  try {
    const profile = await getGamificationProfile(req.user._id);
    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Error fetching gamification profile:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Claim daily check-in XP bonus
 */
exports.claimDailyCheckIn = async (req, res) => {
  try {
    const result = await awardActivityXp(
      req.user._id,
      'DAILY_CHECKIN',
      25,
      'Daily Check-in Bonus'
    );
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error claiming daily check-in:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Award XP for client-side actions like Playground Code execution
 */
exports.awardClientAction = async (req, res) => {
  try {
    const { actionType } = req.body;
    
    // Whitelist allowed client-reported actions
    if (actionType !== 'PLAYGROUND_RUN') {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    const result = await awardActivityXp(
      req.user._id,
      actionType,
      15,
      'Code Sandbox Experimentation'
    );

    res.json({ success: true, result });
  } catch (err) {
    console.error('Error awarding client action XP:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get global or weekly leaderboard
 */
exports.getLeaderboardData = async (req, res) => {
  try {
    const period = req.query.period || 'all-time';
    const limit = parseInt(req.query.limit, 10) || 20;
    const leaderboard = await getLeaderboard(period, Math.min(limit, 50));
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: err.message });
  }
};
