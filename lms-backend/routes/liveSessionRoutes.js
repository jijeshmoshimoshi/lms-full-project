const express = require('express');
const {
  createSession,
  getSessions,
  getSessionById,
  startSession,
  endSession,
  deleteSession,
} = require('../controllers/liveSessionController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

// Public / student session listing & session access check
router.get('/', optionalAuth, getSessions);
router.get('/:id', optionalAuth, getSessionById);

// Instructor / Admin management
router.post('/', protect, authorize('instructor', 'admin'), createSession);
router.put('/:id/start', protect, authorize('instructor', 'admin'), startSession);
router.put('/:id/end', protect, authorize('instructor', 'admin'), endSession);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteSession);

module.exports = router;
