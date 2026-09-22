const express = require('express');
const {
  getMyGamificationProfile,
  claimDailyCheckIn,
  awardClientAction,
  getLeaderboardData,
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMyGamificationProfile);
router.post('/check-in', protect, claimDailyCheckIn);
router.post('/award', protect, awardClientAction);
router.get('/leaderboard', getLeaderboardData); // Publicly accessible or for students

module.exports = router;
