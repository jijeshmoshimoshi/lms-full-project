const express = require('express');
const { getAllUsers, updateUserRole, verifyInstructor, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const router = express.Router();

router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/:id/verify', protect, authorize('admin'), verifyInstructor);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
