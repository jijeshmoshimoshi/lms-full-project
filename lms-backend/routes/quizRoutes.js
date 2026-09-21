const express = require('express');
const { createQuiz, getQuizByLesson, submitQuiz, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const router = express.Router();

router.post('/', protect, authorize('instructor', 'admin'), createQuiz);
router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/:id/submit', protect, submitQuiz);
router.put('/:id', protect, authorize('instructor', 'admin'), updateQuiz);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteQuiz);

module.exports = router;
