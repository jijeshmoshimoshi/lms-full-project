const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * Platform Executive Overview & Analytics
 * Route: GET /api/admin/overview
 * Access: Super Admin
 */
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    // 1. User Metrics
    const allUsers = await User.find().select('name email role isVerified createdAt razorpayAccountId payoutStatus');
    const learners = allUsers.filter(u => u.role === 'student');
    const instructors = allUsers.filter(u => u.role === 'instructor');
    const verifiedInstructors = instructors.filter(u => u.isVerified);
    const pendingInstructors = instructors.filter(u => !u.isVerified);

    // 2. Course Metrics
    const allCourses = await Course.find()
      .populate('instructor', 'name email isVerified')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    const pendingCourses = allCourses.filter(c => c.approvalStatus === 'pending_approval');
    const approvedCourses = allCourses.filter(c => c.approvalStatus === 'approved');
    const draftCourses = allCourses.filter(c => c.approvalStatus === 'draft' || c.approvalStatus === 'rejected' || !c.approvalStatus);

    // 3. Financial Metrics (Platform GMV, 30% Platform Cut, 70% Instructor Payouts)
    const transactions = await Transaction.find()
      .populate('course', 'title price slug')
      .populate('student', 'name email')
      .populate('instructor', 'name email razorpayAccountId payoutStatus')
      .sort({ createdAt: -1 });

    let grossVolume = 0;
    let platformRevenue = 0;
    let instructorPayouts = 0;
    let gatewayFees = 0;
    let settledPayouts = 0;
    let pendingPayouts = 0;
    let refundedCount = 0;
    let refundedAmount = 0;
    let paidSalesCount = 0;

    transactions.forEach(tx => {
      if (tx.status === 'paid' || tx.status === 'settled') {
        grossVolume += tx.amountPaid || 0;
        platformRevenue += tx.platformCut || 0;
        instructorPayouts += tx.instructorCut || 0;
        gatewayFees += tx.gatewayFee || 0;
        paidSalesCount += 1;

        if (tx.transferStatus === 'processed' || tx.status === 'settled') {
          settledPayouts += tx.instructorCut || 0;
        } else {
          pendingPayouts += tx.instructorCut || 0;
        }
      } else if (tx.status === 'refunded') {
        refundedCount += 1;
        refundedAmount += tx.amountPaid || 0;
      }
    });

    // 4. Enrollments Count
    const totalEnrollments = await Enrollment.countDocuments();

    // 5. Top Performing Courses
    const coursePerformanceMap = {};
    transactions.forEach(tx => {
      if (tx.status === 'paid' || tx.status === 'settled') {
        const cId = String(tx.course?._id || tx.course);
        if (!coursePerformanceMap[cId]) {
          coursePerformanceMap[cId] = {
            courseId: cId,
            title: tx.course?.title || 'Unknown Course',
            salesCount: 0,
            grossRevenue: 0,
            platformCommission: 0,
            instructorCut: 0,
            instructorName: tx.instructor?.name || 'Instructor',
          };
        }
        coursePerformanceMap[cId].salesCount += 1;
        coursePerformanceMap[cId].grossRevenue += tx.amountPaid || 0;
        coursePerformanceMap[cId].platformCommission += tx.platformCut || 0;
        coursePerformanceMap[cId].instructorCut += tx.instructorCut || 0;
      }
    });

    const topCourses = Object.values(coursePerformanceMap)
      .sort((a, b) => b.grossRevenue - a.grossRevenue)
      .slice(0, 5);

    // 6. Top Earning Instructors
    const instructorPerformanceMap = {};
    transactions.forEach(tx => {
      if (tx.status === 'paid' || tx.status === 'settled') {
        const instId = String(tx.instructor?._id || tx.instructor);
        if (!instructorPerformanceMap[instId]) {
          instructorPerformanceMap[instId] = {
            instructorId: instId,
            name: tx.instructor?.name || 'Instructor',
            email: tx.instructor?.email || '',
            salesCount: 0,
            totalEarnings: 0,
            grossVolume: 0,
          };
        }
        instructorPerformanceMap[instId].salesCount += 1;
        instructorPerformanceMap[instId].totalEarnings += tx.instructorCut || 0;
        instructorPerformanceMap[instId].grossVolume += tx.amountPaid || 0;
      }
    });

    const topInstructors = Object.values(instructorPerformanceMap)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5);

    // 7. System Health Status
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
    const razorpayActive = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    res.json({
      metrics: {
        learnersCount: learners.length,
        instructorsCount: instructors.length,
        verifiedInstructorsCount: verifiedInstructors.length,
        pendingInstructorsCount: pendingInstructors.length,
        totalCourses: allCourses.length,
        pendingCoursesCount: pendingCourses.length,
        approvedCoursesCount: approvedCourses.length,
        draftCoursesCount: draftCourses.length,
        totalEnrollments,
        grossVolume,
        platformRevenue,
        instructorPayouts,
        gatewayFees,
        settledPayouts,
        pendingPayouts,
        paidSalesCount,
        refundedCount,
        refundedAmount,
      },
      moderationQueue: {
        pendingCourses: pendingCourses.slice(0, 10).map(c => ({
          _id: c._id,
          title: c.title,
          price: c.price,
          category: c.category,
          level: c.level,
          instructor: c.instructor,
          modulesCount: c.modules?.length || 0,
          submittedAt: c.submittedAt || c.updatedAt,
          createdAt: c.createdAt,
        })),
        pendingInstructors: pendingInstructors.slice(0, 10).map(u => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          payoutStatus: u.payoutStatus || 'not_onboarded',
        })),
      },
      recentTransactions: transactions.slice(0, 10).map(t => ({
        id: t._id,
        orderId: t.razorpayOrderId,
        paymentId: t.razorpayPaymentId || null,
        courseTitle: t.course?.title || 'Course',
        studentName: t.student?.name || 'Student',
        studentEmail: t.student?.email || '',
        instructorName: t.instructor?.name || 'Instructor',
        instructorEmail: t.instructor?.email || '',
        amountPaid: t.amountPaid,
        platformCut: t.platformCut,
        instructorCut: t.instructorCut,
        platformSharePercent: t.platformSharePercent,
        instructorSharePercent: t.instructorSharePercent,
        status: t.status,
        transferStatus: t.transferStatus,
        createdAt: t.createdAt,
      })),
      topCourses,
      topInstructors,
      systemHealth: {
        database: dbStatus,
        razorpayRoute: razorpayActive ? 'active' : 'sandbox',
        serverUptime: Math.floor(process.uptime()),
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error('Error fetching admin overview:', err);
    res.status(500).json({ message: err.message || 'Server error loading admin overview' });
  }
});

/**
 * Detailed Instructor Registry with Earnings & KYC Payout Info
 * Route: GET /api/admin/instructors-overview
 * Access: Super Admin
 */
router.get('/instructors-overview', protect, authorize('admin'), async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('-password')
      .sort({ createdAt: -1 });

    const courses = await Course.find().select('title price instructor studentsCount approvalStatus isPublished');
    const transactions = await Transaction.find({ status: { $in: ['paid', 'settled'] } });

    const instructorDetails = instructors.map(inst => {
      const instCourses = courses.filter(c => String(c.instructor) === String(inst._id));
      const totalStudents = instCourses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
      const instTransactions = transactions.filter(t => String(t.instructor) === String(inst._id));
      
      const totalGrossSales = instTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      const totalEarnings = instTransactions.reduce((sum, t) => sum + (t.instructorCut || 0), 0);
      const platformFeesGenerated = instTransactions.reduce((sum, t) => sum + (t.platformCut || 0), 0);

      return {
        _id: inst._id,
        name: inst.name,
        email: inst.email,
        isVerified: !!inst.isVerified,
        razorpayAccountId: inst.razorpayAccountId || null,
        payoutStatus: inst.payoutStatus || 'not_onboarded',
        payoutSchedule: inst.payoutSchedule || 'weekly',
        payoutDetails: inst.payoutDetails || null,
        unsettledClawbackAmount: inst.unsettledClawbackAmount || 0,
        coursesCount: instCourses.length,
        approvedCoursesCount: instCourses.filter(c => c.approvalStatus === 'approved').length,
        totalStudents,
        totalGrossSales,
        totalEarnings,
        platformFeesGenerated,
        salesCount: instTransactions.length,
        createdAt: inst.createdAt,
      };
    });

    res.json(instructorDetails);
  } catch (err) {
    console.error('Error loading instructors overview:', err);
    res.status(500).json({ message: err.message || 'Server error loading instructors overview' });
  }
});

module.exports = router;
