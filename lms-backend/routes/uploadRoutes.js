const express = require('express');
const { uploadVideo, uploadSubtitle, uploadDocument, uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.post('/video', protect, authorize('instructor', 'admin'), uploadVideo);
router.post('/subtitle', protect, authorize('instructor', 'admin'), uploadSubtitle);
router.post('/document', protect, authorize('instructor', 'admin'), uploadDocument);
router.post('/image', protect, authorize('instructor', 'admin'), uploadImage);

module.exports = router;
