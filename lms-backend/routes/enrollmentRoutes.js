const express = require('express');
const { 
  enroll, 
  myEnrollments, 
  markLessonComplete,
  savePlaybackPosition,
  getPlaybackPosition,
  getLessonNotes,
  addLessonNote,
  deleteLessonNote,
  getAllCourseNotes,
  toggleBookmarkLesson,
  getCourseBookmarks,
  getCertificateDetails,
  getCertificatesManagement,
  updateCertificateStatus,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, enroll);
router.get('/me', protect, myEnrollments);
router.post('/progress', protect, markLessonComplete);
router.post('/complete-lesson', protect, markLessonComplete);

// Certificate management (Admin / Instructor)
router.get('/certificates/manage', protect, getCertificatesManagement);
router.patch('/certificates/:enrollmentId/status', protect, updateCertificateStatus);

// Playback position
router.post('/playback-position', protect, savePlaybackPosition);
router.get('/playback-position/:courseId/:lessonId', protect, getPlaybackPosition);

// Bookmarks & Notes
router.post('/bookmark', protect, toggleBookmarkLesson);
router.get('/bookmarks/:courseId', protect, getCourseBookmarks);
router.get('/all-notes/:courseId', protect, getAllCourseNotes);

// Lesson notes at timestamps
router.get('/notes/:courseId/:lessonId', protect, getLessonNotes);
router.post('/notes', protect, addLessonNote);
router.delete('/notes/:courseId/:noteId', protect, deleteLessonNote);

// Public Certificate details
router.get('/certificate/:certificateId', getCertificateDetails);

module.exports = router;
