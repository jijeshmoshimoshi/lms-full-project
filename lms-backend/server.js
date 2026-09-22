require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { apiLimiter, authLimiter, adminLimiter } = require('./middleware/security');

const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const couponRoutes = require('./routes/couponRoutes');
const liveSessionRoutes = require('./routes/liveSessionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const commentRoutes = require('./routes/commentRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');


const { startReminderScheduler } = require('./services/reminderScheduler');
const { setLiveSessionIo } = require('./controllers/liveSessionController');

const app = express();
const server = http.createServer(app);

// Helper to check if origin is permitted
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server, curl, mobile, webhooks
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (origin.endsWith('.vercel.app')) return true; // Vercel preview & production domains
  if (origin.endsWith('.onrender.com')) return true;

  const envOrigins = [
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : []),
    ...(process.env.ADMIN_URL ? process.env.ADMIN_URL.split(',').map(s => s.trim()) : []),
  ];

  return envOrigins.some(allowed => origin === allowed || origin.startsWith(allowed));
};

// Initialize Socket.io with allowed origins
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for demo web sockets
      }
    },
    credentials: true,
  },
});

setLiveSessionIo(io);

connectDB();

// 1. Enhanced Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  frameguard: false,
}));

// 2. Dynamic Origin Whitelist for CORS
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for demo project to avoid deployment blockers
    }
  },
  credentials: true,
}));

// 3. Request Body Size Limit (Prevent Memory Exhaustion DoS)
app.use(express.json({

  limit: '50kb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 4. Data Sanitization against NoSQL query injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security Alert] Request with prohibited NoSQL operator sanitized on key: ${key}`);
  },
}));

// 5. Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['category', 'level', 'price', 'rating', 'role'] // allowed duplicate query params
}));

// 6. Global API Rate Limiter
app.use('/api', apiLimiter);

app.use(morgan('dev'));

// Serve uploaded video, document, and subtitle media statically with framing allowed for client apps
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.removeHeader('X-Frame-Options');
  res.setHeader(
    'Content-Security-Policy',
    `frame-ancestors 'self' ${process.env.CLIENT_URL || 'http://localhost:3000'} ${process.env.ADMIN_URL || 'http://localhost:3001'} http://127.0.0.1:3000 http://127.0.0.1:3001`
  );
  next();
}, express.static(path.join(__dirname, 'public/uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 7. Route Handlers with Dedicated Rate Limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/gamification', gamificationRoutes);


// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler (Safe error responses that never leak stacks to clients)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({ message: 'CORS access denied' });
  }
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'An unexpected server error occurred',
  });
});

// Real-Time Socket.io Telecast Signaling & Live Chat
const sessionViewers = new Map();

io.on('connection', (socket) => {
  // Join student's personal notification channel
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join a live session room
  socket.on('join_live_session', ({ sessionId, user, role }) => {
    if (!sessionId) return;
    const roomName = `session_${sessionId}`;
    socket.join(roomName);

    if (!sessionViewers.has(sessionId)) {
      sessionViewers.set(sessionId, new Set());
    }
    sessionViewers.get(sessionId).add(socket.id);

    const viewerCount = sessionViewers.get(sessionId).size;
    io.to(roomName).emit('viewers_count_update', { viewerCount, count: viewerCount });
    io.to(roomName).emit('viewer_count_updated', { viewerCount, count: viewerCount });

    socket.to(roomName).emit('user_joined_session', {
      user: user || { name: 'Student', role: role || 'student' },
      socketId: socket.id,
      viewerCount,
    });
  });

  // WebRTC Telecast Peer-to-Peer Signaling
  socket.on('webrtc_signal', ({ sessionId, targetSocketId, signal, senderType, user }) => {
    const roomName = `session_${sessionId}`;
    const effectiveSenderType = senderType || signal?.senderType || (signal?.type === 'request_stream' ? 'student' : undefined);

    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc_signal', {
        senderSocketId: socket.id,
        signal,
        senderType: effectiveSenderType,
        user,
      });
    } else {
      socket.to(roomName).emit('webrtc_signal', {
        senderSocketId: socket.id,
        signal,
        senderType: effectiveSenderType,
        user,
      });
    }
  });

  // Broadcaster announces they are active & streaming
  socket.on('broadcaster_ready', ({ sessionId }) => {
    if (!sessionId) return;
    socket.to(`session_${sessionId}`).emit('broadcaster_ready', {
      broadcasterSocketId: socket.id,
    });
  });

  // Real-Time Live Chat in session
  socket.on('send_chat_message', ({ sessionId, message, user, userName, role }) => {
    if (!sessionId || !message || !message.trim()) return;
    const roomName = `session_${sessionId}`;
    const senderName = user?.name || userName || 'Learner';
    const senderRole = user?.role || role || 'student';

    const chatMsg = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: message.trim(),
      message: message.trim(),
      sender: user || { name: senderName, role: senderRole },
      userName: senderName,
      role: senderRole,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    io.to(roomName).emit('receive_chat_message', chatMsg);
  });

  // Leave Live Session
  socket.on('leave_live_session', ({ sessionId }) => {
    if (sessionId && sessionViewers.has(sessionId)) {
      sessionViewers.get(sessionId).delete(socket.id);
      const viewerCount = sessionViewers.get(sessionId).size;
      io.to(`session_${sessionId}`).emit('viewers_count_update', { viewerCount, count: viewerCount });
      io.to(`session_${sessionId}`).emit('viewer_count_updated', { viewerCount, count: viewerCount });
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room.startsWith('session_')) {
        const sessionId = room.replace('session_', '');
        if (sessionViewers.has(sessionId)) {
          sessionViewers.get(sessionId).delete(socket.id);
          const viewerCount = sessionViewers.get(sessionId).size;
          io.to(room).emit('viewers_count_update', { viewerCount, count: viewerCount });
          io.to(room).emit('viewer_count_updated', { viewerCount, count: viewerCount });
        }
      }
    }
  });
});

// Start the 10-Minute Reminder Worker
startReminderScheduler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`LMS backend running on port ${PORT} (Socket.io enabled)`));
