const express = require('express');
const {
  createCourse, getCourses, getCourseById, getCourseBySlug, updateCourse, deleteCourse, 
  addModule, deleteModule, addLesson, updateLesson, deleteLesson,
  submitCourseForReview, approveCourse, rejectCourse
} = require('../controllers/courseController');
const { getCourseReviews, addReview, voteReview } = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const router = express.Router();

router.get('/', optionalAuth, getCourses);
router.get('/id/:id', optionalAuth, getCourseById);
router.get('/:slug', optionalAuth, getCourseBySlug);

// Course Reviews
router.get('/:courseId/reviews', getCourseReviews);
router.post('/:courseId/reviews', protect, addReview);
router.post('/reviews/:reviewId/vote', voteReview);
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.put('/:id/submit-review', protect, authorize('instructor', 'admin'), submitCourseForReview);
router.put('/:id/approve', protect, authorize('admin'), approveCourse);
router.put('/:id/reject', protect, authorize('admin'), rejectCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);
router.post('/:courseId/modules', protect, authorize('instructor', 'admin'), addModule);
router.delete('/modules/:moduleId', protect, authorize('instructor', 'admin'), deleteModule);
router.post('/modules/:moduleId/lessons', protect, authorize('instructor', 'admin'), addLesson);
router.put('/lessons/:lessonId', protect, authorize('instructor', 'admin'), updateLesson);
router.delete('/lessons/:lessonId', protect, authorize('instructor', 'admin'), deleteLesson);

module.exports = router;
