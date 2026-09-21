const LiveSession = require('../models/LiveSession');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const { sendLiveSessionReminderEmail } = require('./emailService');

let schedulerInterval = null;
let ioInstance = null;

const setSocketIoInstance = (io) => {
  ioInstance = io;
};

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    // Look ahead 10.5 minutes (allowing slight timing jitter)
    const in10Minutes = new Date(now.getTime() + 10.5 * 60 * 1000);
    // Ensure we don't look back past 15 minutes ago
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const upcomingSessions = await LiveSession.find({
      status: 'scheduled',
      reminderSent: false,
      scheduledStartTime: {
        $gte: fifteenMinsAgo,
        $lte: in10Minutes,
      },
    }).populate('course', 'title slug').populate('instructor', 'name email');

    if (!upcomingSessions || upcomingSessions.length === 0) {
      return;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    for (const session of upcomingSessions) {
      console.log(`[ReminderScheduler] Triggering 10-min reminder for session: "${session.title}" (${session._id})`);

      // Find all enrolled students for this course
      const enrollments = await Enrollment.find({ course: session.course._id }).populate('student', 'name email');
      console.log(`[ReminderScheduler] Found ${enrollments.length} enrolled student(s) to notify`);

      for (const enrollment of enrollments) {
        const student = enrollment.student;
        if (!student || !student.email) continue;

        const joinUrl = `${clientUrl}/live/${session._id}`;

        // 1. Create In-App Notification record
        try {
          const notif = await Notification.create({
            recipient: student._id,
            title: '🔴 Live Class Starting in 10 Minutes!',
            message: `"${session.title}" for your course "${session.course?.title}" starts in 10 minutes. Click to join the stream!`,
            type: 'live_reminder',
            relatedSession: session._id,
            link: `/live/${session._id}`,
          });

          // Push real-time notification to student via Socket.io if connected
          if (ioInstance) {
            ioInstance.to(`user_${student._id}`).emit('new_notification', notif);
            ioInstance.to(`user_${student._id}`).emit('live_session_reminder_toast', {
              title: session.title,
              courseTitle: session.course?.title,
              sessionId: session._id,
              joinUrl: `/live/${session._id}`,
            });
          }
        } catch (notifErr) {
          console.error('[ReminderScheduler] Error saving in-app notification:', notifErr.message);
        }

        // 2. Dispatch Email
        sendLiveSessionReminderEmail({
          studentEmail: student.email,
          studentName: student.name,
          sessionTitle: session.title,
          courseTitle: session.course?.title || 'Live Course',
          instructorName: session.instructor?.name || 'Instructor',
          scheduledStartTime: session.scheduledStartTime,
          joinUrl,
        }).catch((emailErr) => {
          console.error(`[ReminderScheduler] Email error for ${student.email}:`, emailErr.message);
        });
      }

      // Mark reminderSent as true to prevent duplicate triggers
      session.reminderSent = true;
      await session.save();
      console.log(`[ReminderScheduler] Successfully dispatched reminders for session "${session.title}"`);
    }
  } catch (err) {
    console.error('[ReminderScheduler] Error running reminder checks:', err.message);
  }
};

const startReminderScheduler = (io = null) => {
  if (io) setSocketIoInstance(io);
  if (schedulerInterval) clearInterval(schedulerInterval);

  console.log('[ReminderScheduler] Starting 60-second automated live session reminder worker...');
  // Run immediately once on start
  checkAndSendReminders();
  // Then repeat every 60 seconds
  schedulerInterval = setInterval(checkAndSendReminders, 60 * 1000);
};

const stopReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  checkAndSendReminders,
  setSocketIoInstance,
};
