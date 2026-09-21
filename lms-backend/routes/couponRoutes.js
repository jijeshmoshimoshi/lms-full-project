const express = require('express');
const {
  validateCoupon,
  getActivePublicCoupons,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

// Public / Student Coupon Routes
router.post('/validate', validateCoupon);
router.get('/active', getActivePublicCoupons);

// Admin & Instructor Management Routes
router.get('/', protect, authorize('admin', 'instructor'), getCoupons);
router.post('/', protect, authorize('admin', 'instructor'), createCoupon);
router.put('/:id', protect, authorize('admin', 'instructor'), updateCoupon);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteCoupon);

module.exports = router;
