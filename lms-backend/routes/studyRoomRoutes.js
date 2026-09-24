const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getStudyRooms,
  createStudyRoom,
  getStudyRoomById,
  getStudyRoomByCode,
  joinStudyRoom,
  leaveStudyRoom,
  updateMemberGoal,
  updateSharedResource,
  archiveRoom
} = require('../controllers/studyRoomController');

// Public & optional auth routes
router.get('/', optionalAuth, getStudyRooms);

// Protected routes (Logged in students & instructors)
router.get('/code/:code', protect, getStudyRoomByCode);
router.get('/:id', protect, getStudyRoomById);
router.post('/', protect, createStudyRoom);
router.post('/:id/join', protect, joinStudyRoom);
router.post('/:id/leave', protect, leaveStudyRoom);
router.patch('/:id/goal', protect, updateMemberGoal);
router.patch('/:id/resource', protect, updateSharedResource);
router.delete('/:id', protect, archiveRoom);

module.exports = router;
