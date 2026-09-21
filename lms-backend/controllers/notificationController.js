const Notification = require('../models/Notification');

/**
 * Get Current User's Notifications
 * Route: GET /api/notifications
 * Access: Private
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('relatedSession', 'title status scheduledStartTime');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

/**
 * Mark a Notification as Read (or Mark All as Read)
 * Route: PUT /api/notifications/mark-read
 * Access: Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id || req.body?.notificationId;
    const isReadAll = req.path.includes('read-all') || req.body?.markAll;

    if (isReadAll) {
      await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
      );
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { isRead: true }
      );
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error updating notification read status:', err);
    res.status(500).json({ message: 'Server error updating notification status' });
  }
};
