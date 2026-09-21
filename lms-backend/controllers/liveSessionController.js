const LiveSession = require('../models/LiveSession');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

let ioInstance = null;
const setLiveSessionIo = (io) => {
  ioInstance = io;
};

/**
 * Create / Schedule a Live Session
 * Route: POST /api/live-sessions
 * Access: Private (Instructor, Admin)
 */
const createSession = async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      scheduledStartTime,
      durationMinutes = 60,
      streamType = 'webrtc',
      streamUrl = '',
    } = req.body;

    if (!courseId) return res.status(400).json({ message: 'Course ID is required' });
    if (!title || !title.trim()) return res.status(400).json({ message: 'Session title is required' });
    if (!scheduledStartTime) return res.status(400).json({ message: 'Scheduled start time is required' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Ensure only instructor of the course or admin can create live session
    if (req.user.role !== 'admin' && String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the course instructor or admin can schedule live sessions' });
    }

    const startTime = new Date(scheduledStartTime);
    const endTime = new Date(startTime.getTime() + (Number(durationMinutes) || 60) * 60 * 1000);

    const session = await LiveSession.create({
      course: course._id,
      instructor: req.user._id,
      title: title.trim(),
      description: description?.trim() || '',
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      durationMinutes: Number(durationMinutes) || 60,
      streamType: streamType || 'webrtc',
      streamUrl: streamUrl?.trim() || '',
      status: 'scheduled',
      reminderSent: false,
    });

    const populated = await LiveSession.findById(session._id)
      .populate('course', 'title slug thumbnail price')
      .populate('instructor', 'name email avatar');

    res.status(201).json({ success: true, session: populated });
  } catch (err) {
    console.error('Error creating live session:', err);
    res.status(500).json({ message: err.message || 'Server error creating live session' });
  }
};

/**
 * Get Live Sessions (Filter by courseId, status, or instructor)
 * Route: GET /api/live-sessions
 * Access: Public / Enrolled
 */
const getSessions = async (req, res) => {
  try {
    const { courseId, status, mine } = req.query;
    const filter = {};

    if (courseId) filter.course = courseId;
    if (status) filter.status = status;

    if (mine === 'true' && req.user) {
      if (req.user.role === 'instructor') {
        filter.instructor = req.user._id;
      }
    }

    const sessions = await LiveSession.find(filter)
      .populate('course', 'title slug thumbnail price')
      .populate('instructor', 'name email avatar')
      .sort({ scheduledStartTime: 1 });

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error fetching live sessions:', err);
    res.status(500).json({ message: err.message || 'Server error fetching live sessions' });
  }
};

/**
 * Get Single Live Session with Access Verification
 * Route: GET /api/live-sessions/:id
 * Access: Private (Student / Instructor / Admin)
 */
const getSessionById = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('course', 'title slug thumbnail price instructor studentsCount')
      .populate('instructor', 'name email avatar headline');

    if (!session) return res.status(404).json({ message: 'Live session not found' });

    // Check enrollment / access rights
    let isEnrolled = false;
    let isHost = false;

    if (req.user) {
      if (req.user.role === 'admin' || String(session.instructor?._id || session.instructor) === String(req.user._id)) {
        isHost = true;
        isEnrolled = true;
      } else {
        const enrollment = await Enrollment.findOne({
          student: req.user._id,
          course: session.course._id,
        });
        isEnrolled = Boolean(enrollment);
      }
    }

    res.json({
      success: true,
      session,
      isEnrolled,
      isHost,
      isInstructorOrAdmin: isHost,
      canWatch: isEnrolled || isHost,
      access: {
        isEnrolled,
        isHost,
        canWatch: isEnrolled || isHost,
      },
    });
  } catch (err) {
    console.error('Error fetching session details:', err);
    res.status(500).json({ message: err.message || 'Server error fetching session details' });
  }
};

/**
 * Start Live Session (Instructor goes live)
 * Route: PUT /api/live-sessions/:id/start
 * Access: Private (Host Instructor, Admin)
 */
const startSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('course', 'title slug')
      .populate('instructor', 'name');

    if (!session) return res.status(404).json({ message: 'Live session not found' });

    if (req.user.role !== 'admin' && String(session.instructor?._id || session.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the session host instructor can start the stream' });
    }

    session.status = 'live';
    session.actualStartTime = new Date();
    await session.save();

    // Broadcast instant "🔴 LIVE NOW" notifications if not already sent
    if (!session.startedAlertSent) {
      session.startedAlertSent = true;
      await session.save();

      const enrollments = await Enrollment.find({ course: session.course._id }).populate('student', 'name email');
      for (const enr of enrollments) {
        if (!enr.student) continue;

        Notification.create({
          recipient: enr.student._id,
          title: '🔴 Class is LIVE NOW!',
          message: `"${session.title}" in "${session.course?.title}" is currently broadcasting. Join now!`,
          type: 'live_started',
          relatedSession: session._id,
          link: `/live/${session._id}`,
        }).catch(() => {});

        if (ioInstance) {
          ioInstance.to(`user_${enr.student._id}`).emit('live_stream_started_alert', {
            sessionId: session._id,
            title: session.title,
            courseTitle: session.course?.title,
            instructorName: session.instructor?.name,
          });
        }
      }
    }

    if (ioInstance) {
      ioInstance.to(`session_${session._id}`).emit('stream_status_change', {
        status: 'live',
        session,
      });
    }

    res.json({ success: true, message: 'Live broadcast started', session });
  } catch (err) {
    console.error('Error starting live session:', err);
    res.status(500).json({ message: err.message || 'Server error starting live session' });
  }
};

/**
 * End Live Session
 * Route: PUT /api/live-sessions/:id/end
 * Access: Private (Host Instructor, Admin)
 */
const endSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    if (req.user.role !== 'admin' && String(session.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the session host instructor can end the stream' });
    }

    session.status = 'ended';
    session.actualEndTime = new Date();
    await session.save();

    if (ioInstance) {
      ioInstance.to(`session_${session._id}`).emit('stream_status_change', {
        status: 'ended',
        session,
      });
    }

    res.json({ success: true, message: 'Live broadcast ended', session });
  } catch (err) {
    console.error('Error ending live session:', err);
    res.status(500).json({ message: err.message || 'Server error ending live session' });
  }
};

/**
 * Delete a Scheduled Session
 * Route: DELETE /api/live-sessions/:id
 */
const deleteSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Live session not found' });

    if (req.user.role !== 'admin' && String(session.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this session' });
    }

    await LiveSession.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting live session:', err);
    res.status(500).json({ message: err.message || 'Server error deleting live session' });
  }
};

module.exports = {
  setLiveSessionIo,
  createSession,
  getSessions,
  getSessionById,
  startSession,
  endSession,
  deleteSession,
};
