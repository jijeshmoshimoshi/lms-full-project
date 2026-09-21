const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient user is required'],
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['live_reminder', 'live_started', 'system'],
    default: 'system',
  },
  relatedSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession',
    default: null,
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
