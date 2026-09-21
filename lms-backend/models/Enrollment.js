const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  progressPercent: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  certificateIssued: { type: Boolean, default: false },
  certificateId: { type: String, default: '' },
  certificateStatus: { type: String, enum: ['active', 'revoked'], default: 'active' },
  certificateRevokedAt: { type: Date },
  certificateRevokedReason: { type: String, default: '' },
  playbackPositions: [{
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    seconds: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  }],
  notes: [{
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    timestamp: { type: Number, default: 0 },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  bookmarkedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
}, { timestamps: true });

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
