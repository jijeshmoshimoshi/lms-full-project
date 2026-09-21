const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [1, 'Discount value must be at least 1'],
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // Cap for percentage discounts (e.g. max ₹500 off)
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: null, // null means no expiration
  },
  maxUses: {
    type: Number,
    default: null, // null means unlimited uses
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  applicableTo: {
    type: String,
    enum: ['all', 'specific_courses', 'specific'],
    default: 'all',
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
