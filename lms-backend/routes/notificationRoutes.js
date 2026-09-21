const express = require('express');
const {
  getUserNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getUserNotifications);
router.put('/mark-read', protect, markAsRead);
router.put('/read-all', protect, markAsRead);
router.put('/:id/read', protect, markAsRead);
router.put('/:id', protect, markAsRead);

module.exports = router;
