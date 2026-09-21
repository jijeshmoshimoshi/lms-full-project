const Coupon = require('../models/Coupon');
const Course = require('../models/Course');

/**
 * Get Active Public Coupons (Student Marketplace / Cart / Course Page)
 * Only returns actual coupons added by admin or instructor in DB
 * Route: GET /api/coupons/active
 * Access: Public
 */
exports.getActivePublicCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    })
      .select('code description discountType discountValue maxDiscountAmount minOrderAmount applicableTo courses maxUses usedCount')
      .sort({ createdAt: -1 });

    // Filter out any that reached max redemptions limit
    const validCoupons = coupons.filter(c => !c.maxUses || (c.usedCount || 0) < c.maxUses);

    res.json({ success: true, coupons: validCoupons });
  } catch (err) {
    console.error('Error fetching active coupons:', err);
    res.status(500).json({ success: false, message: 'Server error loading active coupons' });
  }
};

/**
 * Validate a Coupon Code (Public / Student)
 * Route: POST /api/coupons/validate
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, courseId, courseIds, cartTotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Look up strictly in MongoDB Coupon collection (coupons created by admin/instructor)
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(400).json({ valid: false, message: 'Invalid coupon code' });
    }

    // Check if active
    if (!coupon.isActive) {
      return res.status(400).json({ valid: false, message: 'This coupon is no longer active' });
    }

    // Check expiration date
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This coupon has expired' });
    }

    // Check maximum redemptions limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ valid: false, message: 'This coupon has reached its maximum usage limit' });
    }

    // Collect targeted course IDs
    const targetCourseIds = Array.isArray(courseIds) && courseIds.length > 0
      ? courseIds.map(String)
      : (courseId ? [String(courseId)] : []);

    // Check course restrictions if coupon is course-specific
    if (coupon.applicableTo === 'specific_courses' && coupon.courses && coupon.courses.length > 0) {
      const allowedCourseIds = coupon.courses.map(String);
      const isEligible = targetCourseIds.some((id) => allowedCourseIds.includes(id));
      if (targetCourseIds.length > 0 && !isEligible) {
        return res.status(400).json({
          valid: false,
          message: 'This coupon is not valid for the selected course(s)',
        });
      }
    }

    // Determine base order amount
    let orderAmount = Number(cartTotal);
    if (isNaN(orderAmount) || orderAmount <= 0) {
      if (targetCourseIds.length > 0) {
        const foundCourses = await Course.find({ _id: { $in: targetCourseIds } }).select('price');
        orderAmount = foundCourses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
      } else {
        orderAmount = 0;
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `This coupon requires a minimum cart value of ₹${coupon.minOrderAmount}`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      // Fixed discount
      discountAmount = Math.min(orderAmount, coupon.discountValue);
    }

    const finalPrice = Math.max(0, orderAmount - discountAmount);

    res.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalPrice: orderAmount,
      discountAmount,
      finalPrice,
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ valid: false, message: err.message || 'Server error validating coupon' });
  }
};

/**
 * Get All Promotional Coupons (Admin / Instructor)
 * Route: GET /api/coupons
 */
exports.getCoupons = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'instructor') {
      filter.$or = [
        { createdBy: req.user._id },
        { applicableTo: 'all' },
      ];
    }

    const coupons = await Coupon.find(filter)
      .populate('courses', 'title price slug')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      coupons,
    });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a New Promotional Coupon (Admin / Instructor)
 * Route: POST /api/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType = 'percentage',
      discountValue,
      maxDiscountAmount,
      minOrderAmount = 0,
      expiresAt,
      maxUses,
      applicableTo = 'all',
      courses = [],
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ message: `Coupon code "${cleanCode}" already exists` });
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be a positive number' });
    }

    if (discountType === 'percentage' && numValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const isSpecific = applicableTo === 'specific' || applicableTo === 'specific_courses';
    const normalizedApplicableTo = isSpecific ? 'specific_courses' : 'all';

    // Ensure valid MongoDB ObjectIDs for courses
    const validCourses = isSpecific && Array.isArray(courses)
      ? courses.filter(id => id && String(id).match(/^[0-9a-fA-F]{24}$/))
      : [];

    const newCoupon = await Coupon.create({
      code: cleanCode,
      description: description?.trim() || '',
      discountType,
      discountValue: numValue,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      minOrderAmount: Number(minOrderAmount) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      applicableTo: normalizedApplicableTo,
      courses: validCourses,
      createdBy: req.user._id,
      isActive: true,
    });

    const populated = await Coupon.findById(newCoupon._id)
      .populate('courses', 'title price slug')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      coupon: populated,
      ...populated.toObject(),
    });
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ 
      message: err.message || 'Failed to create coupon' 
    });
  }
};

/**
 * Update / Toggle a Coupon (Admin / Instructor)
 * Route: PUT /api/coupons/:id
 */
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    // Authorization: only creator or admin can update
    if (req.user.role !== 'admin' && String(coupon.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this coupon' });
    }

    const updatableFields = [
      'description', 'discountType', 'discountValue', 'maxDiscountAmount',
      'minOrderAmount', 'expiresAt', 'maxUses', 'isActive', 'applicableTo', 'courses'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'discountValue' && req.body.discountType === 'percentage' && req.body[field] > 100) {
          coupon[field] = 100;
        } else if (field === 'applicableTo') {
          coupon[field] = (req.body[field] === 'specific' || req.body[field] === 'specific_courses') ? 'specific_courses' : 'all';
        } else if (field === 'courses') {
          coupon[field] = Array.isArray(req.body[field])
            ? req.body[field].filter(id => id && String(id).match(/^[0-9a-fA-F]{24}$/))
            : [];
        } else {
          coupon[field] = req.body[field];
        }
      }
    });

    await coupon.save();

    const populated = await Coupon.findById(coupon._id)
      .populate('courses', 'title price slug')
      .populate('createdBy', 'name email role');

    res.json({
      success: true,
      coupon: populated,
      ...populated.toObject(),
    });
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

/**
 * Delete a Coupon (Admin / Instructor)
 * Route: DELETE /api/coupons/:id
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    if (req.user.role !== 'admin' && String(coupon.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this coupon' });
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
