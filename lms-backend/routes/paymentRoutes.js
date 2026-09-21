const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  onboardInstructor,
  getAccountStatus,
  updatePayoutSchedule,
  createOrder,
  verifyPayment,
  validateCoupon,
  handleRazorpayWebhook,
  processRefund,
  getInstructorEarnings,
} = require('../controllers/paymentController');

const router = express.Router();

// Razorpay Webhook Handler (Public, verified via x-razorpay-signature header)
router.post('/webhook', handleRazorpayWebhook);

// Instructor Route Onboarding & Account Management
router.post('/onboard-account', protect, authorize('instructor', 'admin'), onboardInstructor);
router.get('/account-status', protect, authorize('instructor', 'admin'), getAccountStatus);
router.put('/payout-schedule', protect, authorize('instructor', 'admin'), updatePayoutSchedule);
router.get('/instructor/earnings', protect, authorize('instructor', 'admin'), getInstructorEarnings);

// Student Checkout & Payment Flow
router.post('/validate-coupon', protect, validateCoupon);
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

// Admin Refund Processing
router.post('/refund', protect, authorize('admin'), processRefund);

module.exports = router;
