const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required for live session'],
    index: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required for live session'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  scheduledStartTime: {
    type: Date,
    required: [true, 'Scheduled start time is required'],
    index: true,
  },
  scheduledEndTime: {
    type: Date,
  },
  durationMinutes: {
    type: Number,
    default: 60,
  },
  actualStartTime: {
    type: Date,
    default: null,
  },
  actualEndTime: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
    index: true,
  },
  streamType: {
    type: String,
    enum: ['webrtc', 'stream_url'],
    default: 'webrtc',
  },
  streamUrl: {
    type: String,
    trim: true,
    default: '',
  },
  reminderSent: {
    type: Boolean,
    default: false,
    index: true,
  },
  startedAlertSent: {
    type: Boolean,
    default: false,
  },
  attendeesCount: {
    type: Number,
    default: 0,
  },
  chatEnabled: {
    type: Boolean,
    default: true,
  },
  recordingUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
