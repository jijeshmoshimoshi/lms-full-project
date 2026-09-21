const express = require('express');
const {
  getLessonComments,
  createComment,
  toggleUpvoteComment,
  deleteComment,
  togglePinComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.get('/lesson/:lessonId', protect, getLessonComments);
router.post('/', protect, createComment);
router.post('/:id/upvote', protect, toggleUpvoteComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id/pin', protect, authorize('instructor', 'admin'), togglePinComment);

module.exports = router;
