const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Snippet title is required'],
    trim: true,
    maxlength: 100,
    default: 'Untitled Snippet',
  },
  language: {
    type: String,
    enum: ['web', 'javascript', 'python', 'sql'],
    default: 'web',
  },
  htmlCode: { type: String, default: '' },
  cssCode: { type: String, default: '' },
  jsCode: { type: String, default: '' },
  code: { type: String, default: '' },
  isPublic: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    maxlength: 300,
    default: '',
  },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Snippet', snippetSchema);
