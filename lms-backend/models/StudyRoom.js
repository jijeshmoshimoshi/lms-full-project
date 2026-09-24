const mongoose = require('mongoose');

const studyRoomMessageSchema = new mongoose.Schema({
  sender: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Student' },
    avatar: { type: String, default: '' },
    role: { type: String, default: 'student' }
  },
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['chat', 'system', 'code', 'doubt', 'celebration'], 
    default: 'chat' 
  },
  codeSnippet: {
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' }
  },
  createdAt: { type: Date, default: Date.now }
});

const studyRoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Room title is required'],
    trim: true,
    maxlength: 100
  },
  topic: {
    type: String,
    default: 'General Focus & Study',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: 'Join in for a collaborative focus and study session.'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  courseTitle: {
    type: String,
    default: ''
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostName: {
    type: String,
    default: 'Host'
  },
  roomCode: {
    type: String,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  passcode: {
    type: String,
    default: ''
  },
  maxParticipants: {
    type: Number,
    default: 16,
    min: 2,
    max: 50
  },
  mode: {
    type: String,
    enum: ['open_discussion', 'deep_focus', 'pair_programming', 'lecture_watch'],
    default: 'open_discussion'
  },
  tags: [{
    type: String,
    trim: true
  }],
  activeMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Learner' },
    avatar: { type: String, default: '' },
    currentGoal: { type: String, default: 'Focusing on coursework' },
    joinedAt: { type: Date, default: Date.now },
    socketId: { type: String, default: '' },
    isHandRaised: { type: Boolean, default: false }
  }],
  sharedResource: {
    activeTab: {
      type: String,
      enum: ['code', 'video', 'whiteboard', 'goals'],
      default: 'code'
    },
    scratchpadCode: {
      type: String,
      default: '// Welcome to the Collaborative Code Scratchpad!\n// Write, test, and share algorithms with your study group.\n\nfunction solveProblem(arr) {\n  console.log("Solving collaborative exercise...");\n  return arr.map(x => x * 2);\n}\n\nconsole.log(solveProblem([1, 2, 3, 4, 5]));\n'
    },
    scratchpadLanguage: {
      type: String,
      default: 'javascript'
    },
    videoUrl: {
      type: String,
      default: ''
    },
    videoTitle: {
      type: String,
      default: ''
    },
    videoTime: {
      type: Number,
      default: 0
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    whiteboardData: {
      type: String,
      default: '[]'
    },
    notes: {
      type: String,
      default: '## 📌 Group Study Notes\n- Key Concept 1:\n- Action Items:'
    }
  },
  timerState: {
    mode: {
      type: String,
      enum: ['focus', 'short_break', 'long_break', 'idle'],
      default: 'idle'
    },
    duration: {
      type: Number,
      default: 1500 // 25 mins in seconds
    },
    remaining: {
      type: Number,
      default: 1500
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  ambientSound: {
    type: String,
    enum: ['none', 'lofi', 'rain', 'cafe', 'forest', 'waves'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  messages: [studyRoomMessageSchema]
}, {
  timestamps: true
});

// Generate 6-character room code before validation if not set
studyRoomSchema.pre('validate', function(next) {
  if (!this.roomCode) {
    this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('StudyRoom', studyRoomSchema);
