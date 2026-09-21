const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'INR', uppercase: true },
  platformSharePercent: { type: Number, default: 30, min: 0, max: 100 },
  instructorSharePercent: { type: Number, default: 70, min: 0, max: 100 },
  category: { type: String, default: 'general' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  isPublished: { type: Boolean, default: false },
  approvalStatus: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'approved', 'rejected'], 
    default: 'draft' 
  },
  rejectionReason: { type: String, default: '' },
  submittedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  subtitle: { type: String, default: '' },
  whatYouWillLearn: [{ type: String }],
  requirements: [{ type: String }],
  whoThisCourseIsFor: [{ type: String }],
  language: { type: String, default: 'English' },
  originalPrice: { type: Number, default: 0 },
  isOfferActive: { type: Boolean, default: false },
  offerExpiresAt: { type: Date },
  offerBadgeText: { type: String, default: 'Special Offer' },
  isBestseller: { type: Boolean, default: false },
  badge: { type: String, default: 'Bestseller' },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 0 },
  studentsCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
