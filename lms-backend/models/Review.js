const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  unhelpfulCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Prevent duplicate review per user per course
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
