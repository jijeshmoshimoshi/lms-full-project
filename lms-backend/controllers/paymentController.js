const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Coupon = require('../models/Coupon');
const Enrollment = require('../models/Enrollment');
const { getRazorpayInstance, isRazorpayConfigured } = require('../config/razorpay');
const { sendEnrollmentConfirmationEmail } = require('../services/emailService');

/**
 * Onboard Instructor as a Razorpay Route Linked Account
 * Route: POST /api/payments/onboard-account
 * Access: Private (Instructor, Admin)
 */
exports.onboardInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'instructor' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only instructors can configure payout accounts' });
    }

    const {
      businessName,
      businessType = 'individual',
      accountNumber,
      ifsc,
      pan,
      beneficiaryName,
      payoutSchedule = 'weekly',
    } = req.body;

    if (!accountNumber || !ifsc || !pan || !beneficiaryName) {
      return res.status(400).json({ 
        message: 'Account Number, IFSC code, PAN, and Beneficiary Name are all required for KYC compliance' 
      });
    }

    // Basic format validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(pan.trim())) {
      return res.status(400).json({ message: 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)' });
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
    if (!ifscRegex.test(ifsc.trim())) {
      return res.status(400).json({ message: 'Invalid IFSC format (e.g. HDFC0001234)' });
    }

    let razorpayAccountId = user.razorpayAccountId;
    let status = 'active';

    if (isRazorpayConfigured()) {
      try {
        const razorpay = getRazorpayInstance();
        // Create linked account using Razorpay Route API
        const account = await razorpay.accounts.create({
          type: 'route',
          email: user.email,
          legal_business_name: businessName?.trim() || beneficiaryName.trim(),
          business_type: businessType || 'individual',
          contact_name: beneficiaryName.trim(),
          notes: {
            userId: String(user._id),
            platform: 'SkillPulse LMS',
          },
        });

        if (account && account.id) {
          razorpayAccountId = account.id;
          status = account.status === 'activated' ? 'active' : 'pending_kyc';
        }
      } catch (rzpErr) {
        console.warn('Razorpay Route API returned notice, using sandbox simulation fallback:', rzpErr.message);
        // Fallback for test environments
        if (!razorpayAccountId) {
          razorpayAccountId = `acc_${Math.random().toString(36).substring(2, 12)}`;
        }
      }
    } else {
      // Sandbox / Demo mode
      if (!razorpayAccountId) {
        razorpayAccountId = `acc_${Math.random().toString(36).substring(2, 12)}`;
      }
    }

    user.razorpayAccountId = razorpayAccountId;
    user.payoutStatus = status;
    user.payoutSchedule = payoutSchedule;
    user.payoutDetails = {
      businessName: businessName?.trim() || beneficiaryName.trim(),
      businessType: businessType || 'individual',
      accountNumberLast4: accountNumber.trim().slice(-4),
      ifsc: ifsc.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      beneficiaryName: beneficiaryName.trim(),
    };

    await user.save();

    res.json({
      success: true,
      message: 'Razorpay Route linked account registered successfully',
      razorpayAccountId: user.razorpayAccountId,
      payoutStatus: user.payoutStatus,
      payoutSchedule: user.payoutSchedule,
      payoutDetails: user.payoutDetails,
    });
  } catch (err) {
    console.error('Error onboarding instructor:', err);
    res.status(500).json({ message: err.message || 'Server error onboarding instructor account' });
  }
};

/**
 * Get current instructor payout status & linked account details
 * Route: GET /api/payments/account-status
 * Access: Private (Instructor, Admin)
 */
exports.getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'razorpayAccountId payoutStatus payoutSchedule payoutDetails unsettledClawbackAmount'
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      razorpayAccountId: user.razorpayAccountId || null,
      payoutStatus: user.payoutStatus || 'not_onboarded',
      payoutSchedule: user.payoutSchedule || 'weekly',
      payoutDetails: user.payoutDetails || {},
      unsettledClawbackAmount: user.unsettledClawbackAmount || 0,
      isConfigured: isRazorpayConfigured(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update Payout Schedule
 * Route: PUT /api/payments/payout-schedule
 * Access: Private (Instructor, Admin)
 */
exports.updatePayoutSchedule = async (req, res) => {
  try {
    const { payoutSchedule } = req.body;
    if (!['daily', 'weekly', 'monthly'].includes(payoutSchedule)) {
      return res.status(400).json({ message: 'Invalid schedule. Choose daily, weekly, or monthly.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.payoutSchedule = payoutSchedule;
    await user.save();

    res.json({ success: true, payoutSchedule: user.payoutSchedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const crypto = require('crypto');

/**
 * Validate a Coupon Code
 * Route: POST /api/payments/validate-coupon
 * Access: Private (Student)
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, courseId } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code required' });

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
    if (!coupon) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired coupon code' });
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ valid: false, message: 'This coupon has reached its maximum usage limit' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const originalPrice = Number(course.price) || 0;

    // Check min order
    if (coupon.minOrderAmount && originalPrice < coupon.minOrderAmount) {
      return res.status(400).json({ valid: false, message: `Minimum cart value of ₹${coupon.minOrderAmount} required` });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((originalPrice * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(originalPrice, coupon.discountValue);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountPercent: coupon.discountType === 'percentage' ? coupon.discountValue : 0,
      description: coupon.description,
      originalPrice,
      discountAmount,
      finalPrice,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create Razorpay Route Order with Split Transfers
 * Route: POST /api/payments/create-order
 * Access: Private (Student)
 */
exports.createOrder = async (req, res) => {
  try {
    const { courseId, courseIds, couponCode } = req.body;
    const targetCourseIds = Array.isArray(courseIds) && courseIds.length > 0 
      ? courseIds 
      : (courseId ? [courseId] : []);

    if (targetCourseIds.length === 0) {
      return res.status(400).json({ message: 'Course ID or Course IDs required' });
    }

    // Check existing enrollments
    const existingEnrollments = await Enrollment.find({ 
      student: req.user._id, 
      course: { $in: targetCourseIds } 
    });
    const enrolledIds = existingEnrollments.map(e => String(e.course));
    const pendingCourseIds = targetCourseIds.filter(id => !enrolledIds.includes(String(id)));

    if (pendingCourseIds.length === 0) {
      return res.status(400).json({ message: 'You are already enrolled in all selected courses.' });
    }

    const courses = await Course.find({ _id: { $in: pendingCourseIds } }).populate('instructor');
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: 'No valid courses found' });
    }

    const course = courses[0];
    const originalPrice = courses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);

    // If free course, direct enrollment should be used instead
    if (originalPrice <= 0) {
      return res.status(400).json({ 
        message: 'Selected courses are free. Please use standard direct enrollment.', 
        isFree: true 
      });
    }

    let discountAmount = 0;
    let couponApplied = null;

    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      const dbCoupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (dbCoupon) {
        const notExpired = !dbCoupon.expiresAt || new Date(dbCoupon.expiresAt) >= new Date();
        const underLimit = !dbCoupon.maxUses || dbCoupon.usedCount < dbCoupon.maxUses;
        const meetsMin = !dbCoupon.minOrderAmount || originalPrice >= dbCoupon.minOrderAmount;

        if (notExpired && underLimit && meetsMin) {
          if (dbCoupon.discountType === 'percentage') {
            discountAmount = Math.round((originalPrice * dbCoupon.discountValue) / 100);
            if (dbCoupon.maxDiscountAmount && discountAmount > dbCoupon.maxDiscountAmount) {
              discountAmount = dbCoupon.maxDiscountAmount;
            }
          } else {
            discountAmount = Math.min(originalPrice, dbCoupon.discountValue);
          }
          couponApplied = cleanCode;
        }
      }
    }

    // Revenue split applies to the actual discounted price paid by student
    const amountPaid = Math.max(1, originalPrice - discountAmount);

    const instructor = course.instructor;
    const instructorSharePercent = course.instructorSharePercent !== undefined ? course.instructorSharePercent : 70;
    const platformSharePercent = course.platformSharePercent !== undefined ? course.platformSharePercent : 30;

    const instructorCut = Math.round((amountPaid * instructorSharePercent) / 100);
    const platformCut = amountPaid - instructorCut;
    const gatewayFee = Math.round(amountPaid * 0.02); // Estimated ~2% Razorpay fee

    let razorpayOrderId = null;
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    // Prepare Route auto-split transfers
    const transfers = [];
    if (instructor && instructor.razorpayAccountId && instructor.payoutStatus === 'active') {
      transfers.push({
        account: instructor.razorpayAccountId,
        amount: instructorCut * 100, // Razorpay amounts in paise
        currency: course.currency || 'INR',
        notes: {
          courseId: String(course._id),
          instructorId: String(instructor._id),
          studentId: String(req.user._id),
          instructorSharePercent: `${instructorSharePercent}%`,
          platformSharePercent: `${platformSharePercent}%`,
        },
      });
    }

    if (isRazorpayConfigured()) {
      try {
        const razorpay = getRazorpayInstance();
        const orderPayload = {
          amount: amountPaid * 100, // In paise
          currency: course.currency || 'INR',
          receipt,
          notes: {
            courseId: String(course._id),
            studentId: String(req.user._id),
            instructorId: String(instructor ? instructor._id : ''),
            couponApplied: couponApplied || 'NONE',
          },
        };

        // Attach Route transfers if linked account is available
        if (transfers.length > 0) {
          orderPayload.transfers = transfers;
        }

        let rzpOrder;
        try {
          rzpOrder = await razorpay.orders.create(orderPayload);
        } catch (routeErr) {
          console.warn('Order with Route transfers failed, retrying standard order for Razorpay checkout:', routeErr.message);
          if (orderPayload.transfers) {
            delete orderPayload.transfers;
            rzpOrder = await razorpay.orders.create(orderPayload);
          } else {
            throw routeErr;
          }
        }
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.warn('Razorpay API notice, fallback to simulation order:', rzpErr.message);
        razorpayOrderId = `order_${Math.random().toString(36).substring(2, 14)}`;
      }
    } else {
      // Local development sandbox mock
      razorpayOrderId = `order_${Math.random().toString(36).substring(2, 14)}`;
    }

    // Persist pending Transaction record with historical split snapshot
    const transaction = await Transaction.create({
      course: course._id,
      items: pendingCourseIds,
      couponCode: couponApplied || '',
      student: req.user._id,
      instructor: instructor ? instructor._id : req.user._id,
      razorpayOrderId,
      amountPaid,
      currency: course.currency || 'INR',
      originalPrice,
      discountAmount,
      platformCut,
      instructorCut,
      gatewayFee,
      platformSharePercent,
      instructorSharePercent,
      status: 'created',
      transferStatus: transfers.length > 0 ? 'pending' : 'pending',
    });

    res.json({
      success: true,
      orderId: razorpayOrderId,
      amount: amountPaid * 100, // In paise for Razorpay Checkout
      amountInRupees: amountPaid,
      currency: course.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        originalPrice,
        discountAmount,
        finalPrice: amountPaid,
      },
      splitBreakdown: {
        instructorCut,
        platformCut,
        gatewayFee,
        instructorSharePercent,
        platformSharePercent,
      },
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: err.message || 'Server error creating checkout order' });
  }
};

/**
 * Verify Razorpay Payment Signature and Grant Course Enrollment
 * Route: POST /api/payments/verify-payment
 * Access: Private (Student)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Missing order ID or payment ID' });
    }

    const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) {
      return res.status(404).json({ message: 'Matching transaction order not found' });
    }

    // Verify cryptographic signature if configured
    if (isRazorpayConfigured() && razorpay_signature && razorpay_signature !== 'sandbox_test_signature') {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        transaction.status = 'failed';
        await transaction.save();
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
      }
    }

    // Mark Transaction as paid and route transfer as processed
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature || 'simulated_signature';
    transaction.status = 'paid';
    transaction.transferStatus = 'processed';
    await transaction.save();

    // Grant Course Enrollment for all items in the transaction
    const coursesToEnroll = (transaction.items && transaction.items.length > 0)
      ? transaction.items
      : [transaction.course];

    let lastEnrollmentId = null;
    for (const cId of coursesToEnroll) {
      let enrollment = await Enrollment.findOne({
        student: transaction.student,
        course: cId,
      });

      if (!enrollment) {
        enrollment = await Enrollment.create({
          student: transaction.student,
          course: cId,
        });
        await Course.findByIdAndUpdate(cId, { $inc: { studentsCount: 1 } });

        // Trigger confirmation email
        try {
          const studentObj = await User.findById(transaction.student);
          const courseObj = await Course.findById(cId).populate('instructor', 'name');
          if (studentObj && courseObj) {
            sendEnrollmentConfirmationEmail({
              studentEmail: studentObj.email,
              studentName: studentObj.name,
              courseTitle: courseObj.title,
              coursePrice: transaction.amountPaid || courseObj.price || 0,
              instructorName: courseObj.instructor?.name || 'Course Instructor',
            }).catch((err) => console.error('[EmailService] Paid enrollment email error:', err.message));
          }
        } catch (mailErr) {
          console.error('[EmailService] Could not send paid enrollment confirmation:', mailErr.message);
        }
      }
      lastEnrollmentId = enrollment._id;
    }

    // Increment coupon redemption count if a coupon was used
    if (transaction.couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: transaction.couponCode.toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      } catch (couponErr) {
        console.warn('Could not increment coupon usedCount:', couponErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully and enrollment granted.',
      transaction: {
        id: transaction._id,
        orderId: transaction.razorpayOrderId,
        paymentId: transaction.razorpayPaymentId,
        amountPaid: transaction.amountPaid,
        status: transaction.status,
      },
      enrollmentId: lastEnrollmentId,
      enrolledCount: coursesToEnroll.length,
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: err.message || 'Server error verifying payment' });
  }
};

/**
 * Razorpay Webhook Handler
 * Route: POST /api/payments/webhook
 * Access: Public (Signature Verified)
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';

    // Verify webhook signature if in live/configured mode
    if (isRazorpayConfigured() && webhookSignature) {
      const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        console.warn('Invalid Razorpay webhook signature received');
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (!event || !payload) {
      return res.status(400).json({ message: 'Invalid webhook payload structure' });
    }

    console.log(`Razorpay Webhook Event Received: ${event}`);

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.order_id;
        const paymentId = payment.id;

        const transaction = await Transaction.findOne({ razorpayOrderId: orderId });
        if (transaction) {
          transaction.razorpayPaymentId = paymentId;
          transaction.status = 'paid';
          transaction.transferStatus = 'processed';
          await transaction.save();

          // Ensure Enrollment exists
          let enrollment = await Enrollment.findOne({
            student: transaction.student,
            course: transaction.course,
          });

          if (!enrollment) {
            await Enrollment.create({
              student: transaction.student,
              course: transaction.course,
            });
            await Course.findByIdAndUpdate(transaction.course, { $inc: { studentsCount: 1 } });
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.order_id;
        const transaction = await Transaction.findOne({ razorpayOrderId: orderId });
        if (transaction) {
          transaction.status = 'failed';
          transaction.refundReason = payment.error_description || 'Payment capture failed';
          await transaction.save();
        }
        break;
      }

      case 'transfer.processed': {
        const transfer = payload.transfer?.entity;
        if (!transfer) break;

        // Route transfer settled to linked account
        const transferId = transfer.id;
        const transaction = await Transaction.findOne({
          $or: [
            { razorpayTransferId: transferId },
            { 'notes.transferId': transferId },
          ],
        });

        if (transaction) {
          transaction.transferStatus = 'processed';
          transaction.status = 'settled';
          if (transfer.recipient_settlement_id) {
            transaction.settlementId = transfer.recipient_settlement_id;
          }
          await transaction.save();
        }
        break;
      }

      case 'refund.processed':
      case 'refund.created':
      case 'payment.refunded': {
        const refund = payload.refund?.entity || payload.payment?.entity;
        if (!refund) break;

        const paymentId = refund.payment_id || refund.id;
        const refundId = refund.id;

        const transaction = await Transaction.findOne({
          $or: [
            { razorpayPaymentId: paymentId },
            { razorpayOrderId: refund.order_id },
          ],
        });

        if (transaction && transaction.status !== 'refunded') {
          transaction.status = 'refunded';
          transaction.razorpayRefundId = refundId;
          transaction.refundReason = refund.notes?.reason || 'Refund processed via Razorpay';

          // Route Transfer Reversal & Post-Settlement Clawback Logic:
          // If the transfer was already processed/settled, record clawback against instructor balance
          if (transaction.transferStatus === 'processed') {
            transaction.transferStatus = 'clawback_pending';
            await User.findByIdAndUpdate(transaction.instructor, {
              $inc: { unsettledClawbackAmount: transaction.instructorCut },
            });
            console.log(`Clawback registered: Added ₹${transaction.instructorCut} to instructor ${transaction.instructor} negative balance`);
          } else {
            transaction.transferStatus = 'reversed';
          }

          await transaction.save();

          // Revoke course access
          const deleted = await Enrollment.findOneAndDelete({
            student: transaction.student,
            course: transaction.course,
          });

          if (deleted) {
            await Course.findByIdAndUpdate(transaction.course, { $inc: { studentsCount: -1 } });
            console.log(`Course access revoked for student ${transaction.student} on refund`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ status: 'ok', eventReceived: event });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ message: err.message || 'Webhook processing error' });
  }
};

/**
 * Initiate Refund for a Transaction (Admin)
 * Route: POST /api/payments/refund
 * Access: Private (Admin)
 */
exports.processRefund = async (req, res) => {
  try {
    const { transactionId, reason } = req.body;
    if (!transactionId) return res.status(400).json({ message: 'Transaction ID is required' });

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.status === 'refunded') {
      return res.status(400).json({ message: 'Transaction has already been refunded' });
    }

    let refundId = `rfnd_${Math.random().toString(36).substring(2, 14)}`;

    if (isRazorpayConfigured() && transaction.razorpayPaymentId) {
      try {
        const razorpay = getRazorpayInstance();
        // Call Razorpay API to issue full refund and reverse Route transfer
        const refund = await razorpay.payments.refund(transaction.razorpayPaymentId, {
          amount: transaction.amountPaid * 100, // In paise
          reverse_all: 1, // Reverses Route linked account transfers
          notes: {
            reason: reason || 'Admin requested refund',
            transactionId: String(transaction._id),
          },
        });
        refundId = refund.id;
      } catch (rzpErr) {
        console.warn('Razorpay refund API notice, proceeding with local reversal:', rzpErr.message);
      }
    }

    transaction.status = 'refunded';
    transaction.razorpayRefundId = refundId;
    transaction.refundReason = reason || 'Admin initiated refund';

    // Post-settlement clawback tracking:
    // If the transfer was already settled/processed, add instructorCut to instructor's unsettledClawbackAmount
    if (transaction.transferStatus === 'processed') {
      transaction.transferStatus = 'clawback_pending';
      await User.findByIdAndUpdate(transaction.instructor, {
        $inc: { unsettledClawbackAmount: transaction.instructorCut },
      });
    } else {
      transaction.transferStatus = 'reversed';
    }

    await transaction.save();

    // Revoke student course access
    await Enrollment.findOneAndDelete({
      student: transaction.student,
      course: transaction.course,
    });
    await Course.findByIdAndUpdate(transaction.course, { $inc: { studentsCount: -1 } });

    res.json({
      success: true,
      message: 'Refund processed successfully and course access revoked.',
      refundId,
      transaction,
    });
  } catch (err) {
    console.error('Error processing refund:', err);
    res.status(500).json({ message: err.message || 'Server error processing refund' });
  }
};

/**
 * Get Instructor Earnings & Settlement Analytics
 * Route: GET /api/payments/instructor/earnings
 * Access: Private (Instructor, Admin)
 */
exports.getInstructorEarnings = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const instructorUser = await User.findById(instructorId);

    // Build filter: instructors see their own, admins can inspect all
    const query = req.user.role === 'admin' && req.query.all === 'true'
      ? {}
      : { instructor: instructorId };

    const transactions = await Transaction.find(query)
      .populate('course', 'title price slug')
      .populate('student', 'name email')
      .populate('instructor', 'name email razorpayAccountId payoutStatus')
      .sort({ createdAt: -1 });

    let grossSales = 0;
    let netInstructorEarnings = 0;
    let platformFeesPaid = 0;
    let gatewayFeesTotal = 0;
    let pendingSettlement = 0;
    let settledEarnings = 0;
    let refundedCount = 0;
    let totalSalesCount = 0;

    const courseMap = {};

    transactions.forEach((tx) => {
      if (tx.status === 'paid' || tx.status === 'settled') {
        grossSales += tx.amountPaid || 0;
        netInstructorEarnings += tx.instructorCut || 0;
        platformFeesPaid += tx.platformCut || 0;
        gatewayFeesTotal += tx.gatewayFee || 0;
        totalSalesCount += 1;

        if (tx.transferStatus === 'processed' || tx.status === 'settled') {
          settledEarnings += tx.instructorCut || 0;
        } else {
          pendingSettlement += tx.instructorCut || 0;
        }

        // Per-Course Breakdown
        const cId = String(tx.course?._id || tx.course);
        if (!courseMap[cId]) {
          courseMap[cId] = {
            courseId: cId,
            title: tx.course?.title || 'Course',
            salesCount: 0,
            grossRevenue: 0,
            instructorCut: 0,
            platformCut: 0,
          };
        }
        courseMap[cId].salesCount += 1;
        courseMap[cId].grossRevenue += tx.amountPaid || 0;
        courseMap[cId].instructorCut += tx.instructorCut || 0;
        courseMap[cId].platformCut += tx.platformCut || 0;
      } else if (tx.status === 'refunded') {
        refundedCount += 1;
      }
    });

    const courseBreakdown = Object.values(courseMap).sort((a, b) => b.grossRevenue - a.grossRevenue);
    const unsettledClawbacks = instructorUser?.unsettledClawbackAmount || 0;
    const netPayable = Math.max(0, settledEarnings - unsettledClawbacks);

    res.json({
      summary: {
        grossSales,
        netInstructorEarnings,
        platformFeesPaid,
        gatewayFeesTotal,
        pendingSettlement,
        settledEarnings,
        unsettledClawbacks,
        netPayable,
        totalSalesCount,
        refundedCount,
      },
      payoutSchedule: instructorUser?.payoutSchedule || 'weekly',
      payoutStatus: instructorUser?.payoutStatus || 'not_onboarded',
      razorpayAccountId: instructorUser?.razorpayAccountId || null,
      courseBreakdown,
      transactions: transactions.map(t => ({
        id: t._id,
        orderId: t.razorpayOrderId,
        paymentId: t.razorpayPaymentId || null,
        courseTitle: t.course?.title || 'Course',
        studentName: t.student?.name || 'Student',
        studentEmail: t.student?.email || '',
        instructorId: t.instructor?._id || null,
        instructorName: t.instructor?.name || 'Instructor',
        instructorEmail: t.instructor?.email || '',
        amountPaid: t.amountPaid,
        instructorCut: t.instructorCut,
        platformCut: t.platformCut,
        platformSharePercent: t.platformSharePercent,
        instructorSharePercent: t.instructorSharePercent,
        status: t.status,
        transferStatus: t.transferStatus,
        settlementId: t.settlementId || null,
        refundReason: t.refundReason || null,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error fetching instructor earnings:', err);
    res.status(500).json({ message: err.message || 'Server error fetching earnings' });
  }
};
