const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, default: 0 },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);
