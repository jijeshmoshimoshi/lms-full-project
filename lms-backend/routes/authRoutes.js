const express = require('express');
const { register, login, me, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/me', protect, updateProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;

