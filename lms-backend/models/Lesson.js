const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  contentType: { type: String, enum: ['video', 'text', 'document', 'pdf', 'quiz', 'article'], default: 'video' },
  videoUrl: { type: String, default: '' },
  videoType: { type: String, enum: ['upload', 'hls', 'dash', 'direct', 'youtube', 'vimeo'], default: 'direct' },
  subtitlesUrl: { type: String, default: '' },
  subtitlesLabel: { type: String, default: 'English' },
  originalFileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  documentUrl: { type: String, default: '' },
  documentName: { type: String, default: '' },
  documentSize: { type: Number, default: 0 },
  documentType: { type: String, default: '' }, // e.g., 'pdf', 'docx', 'pptx', 'txt'
  content: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  isFreePreview: { type: Boolean, default: false },
  transcript: [{
    seconds: { type: Number, required: true },
    timestamp: { type: String, default: '00:00' },
    title: { type: String, default: '' },
    text: { type: String, required: true },
    speaker: { type: String, default: 'Instructor' }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);

