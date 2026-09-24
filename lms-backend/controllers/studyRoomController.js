const StudyRoom = require('../models/StudyRoom');
const Course = require('../models/Course');
const User = require('../models/User');

/**
 * Get all active study rooms (with optional filters)
 * GET /api/study-rooms
 */
exports.getStudyRooms = async (req, res) => {
  try {
    const { category, search, courseId, mode } = req.query;
    const filter = { status: 'active', isPrivate: false };

    if (courseId) {
      filter.course = courseId;
    }

    if (mode && mode !== 'all') {
      filter.mode = mode;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { topic: regex },
        { tags: regex },
        { courseTitle: regex },
        { hostName: regex }
      ];
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const totalCount = await StudyRoom.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    const rooms = await StudyRoom.find(filter)
      .select('-messages -passcode')
      .populate('host', 'name email avatar role')
      .populate('course', 'title slug thumbnail category')
      .sort({ 'activeMembers.length': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: rooms.length,
      totalCount,
      totalPages,
      currentPage: page,
      rooms
    });
  } catch (err) {
    console.error('[StudyRoom Controller] getStudyRooms error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch study rooms', error: err.message });
  }
};

/**
 * Create a new study room
 * POST /api/study-rooms
 */
exports.createStudyRoom = async (req, res) => {
  try {
    const {
      title,
      topic,
      description,
      courseId,
      isPrivate = false,
      passcode = '',
      maxParticipants = 16,
      mode = 'open_discussion',
      tags = [],
      initialGoal = 'Focusing on learning'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Room title is required' });
    }

    let courseTitle = '';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) courseTitle = course.title;
    }

    // Clean tags
    const cleanTags = Array.isArray(tags) 
      ? tags.map(t => String(t).trim()).filter(Boolean)
      : typeof tags === 'string' 
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    const newRoom = new StudyRoom({
      title: title.trim(),
      topic: topic?.trim() || 'General Focus & Study',
      description: description?.trim() || 'Join in for a collaborative focus and study session.',
      course: courseId || null,
      courseTitle,
      host: req.user._id,
      hostName: req.user.name || 'Host',
      isPrivate: Boolean(isPrivate),
      passcode: passcode?.trim() || '',
      maxParticipants: Math.min(Math.max(Number(maxParticipants) || 16, 2), 50),
      mode,
      tags: cleanTags,
      activeMembers: [{
        user: req.user._id,
        name: req.user.name || 'Host',
        avatar: req.user.avatar || '',
        currentGoal: initialGoal || 'Host & Moderator',
        joinedAt: new Date()
      }],
      messages: [{
        sender: {
          _id: req.user._id,
          name: 'System',
          role: 'system'
        },
        text: `🚀 Study Room "${title.trim()}" was created by ${req.user.name}. Welcome to the study session!`,
        type: 'system',
        createdAt: new Date()
      }]
    });

    await newRoom.save();

    res.status(201).json({
      success: true,
      message: 'Study room created successfully',
      room: newRoom
    });
  } catch (err) {
    console.error('[StudyRoom Controller] createStudyRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to create study room', error: err.message });
  }
};

/**
 * Get study room by ID
 * GET /api/study-rooms/:id
 */
exports.getStudyRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await StudyRoom.findById(id)
      .populate('host', 'name email avatar role')
      .populate('course', 'title slug thumbnail category lessons');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Study room not found' });
    }

    // Keep last 100 messages for fast rendering
    const recentMessages = room.messages ? room.messages.slice(-100) : [];
    const roomData = room.toObject();
    roomData.messages = recentMessages;
    
    // Don't leak raw passcode
    delete roomData.passcode;

    res.json({
      success: true,
      room: roomData
    });
  } catch (err) {
    console.error('[StudyRoom Controller] getStudyRoomById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch room details', error: err.message });
  }
};

/**
 * Find study room by 6-digit room code
 * GET /api/study-rooms/code/:code
 */
exports.getStudyRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ success: false, message: 'Room code is required' });

    const room = await StudyRoom.findOne({ 
      roomCode: code.toUpperCase().trim(),
      status: 'active'
    }).select('-passcode -messages');

    if (!room) {
      return res.status(404).json({ success: false, message: 'No active study room found with this code' });
    }

    res.json({
      success: true,
      room
    });
  } catch (err) {
    console.error('[StudyRoom Controller] getStudyRoomByCode error:', err);
    res.status(500).json({ success: false, message: 'Failed to lookup room by code', error: err.message });
  }
};

/**
 * Join a study room
 * POST /api/study-rooms/:id/join
 */
exports.joinStudyRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { passcode, currentGoal } = req.body;

    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Study room not found' });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This study room is no longer active' });
    }

    // Verify passcode if private
    if (room.isPrivate && room.passcode && room.passcode !== passcode) {
      const isHost = String(room.host) === String(req.user._id);
      if (!isHost && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Invalid room passcode' });
      }
    }

    // Check capacity
    const isAlreadyMember = room.activeMembers.some(m => String(m.user) === String(req.user._id));
    if (!isAlreadyMember && room.activeMembers.length >= room.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Room has reached maximum capacity' });
    }

    if (!isAlreadyMember) {
      room.activeMembers.push({
        user: req.user._id,
        name: req.user.name || 'Student',
        avatar: req.user.avatar || '',
        currentGoal: currentGoal || 'Active focus session',
        joinedAt: new Date()
      });
      await room.save();
    }

    res.json({
      success: true,
      message: 'Joined study room successfully',
      roomId: room._id
    });
  } catch (err) {
    console.error('[StudyRoom Controller] joinStudyRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to join room', error: err.message });
  }
};

/**
 * Leave a study room
 * POST /api/study-rooms/:id/leave
 */
exports.leaveStudyRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Study room not found' });
    }

    room.activeMembers = room.activeMembers.filter(m => String(m.user) !== String(req.user._id));
    await room.save();

    res.json({
      success: true,
      message: 'Left study room'
    });
  } catch (err) {
    console.error('[StudyRoom Controller] leaveStudyRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to leave room', error: err.message });
  }
};

/**
 * Update member focus goal
 * PATCH /api/study-rooms/:id/goal
 */
exports.updateMemberGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { goal } = req.body;

    const room = await StudyRoom.findById(id);
    if (!room) return res.status(404).json({ success: false, message: 'Study room not found' });

    const member = room.activeMembers.find(m => String(m.user) === String(req.user._id));
    if (member) {
      member.currentGoal = (goal || '').slice(0, 150);
      await room.save();
    }

    res.json({
      success: true,
      goal: member ? member.currentGoal : ''
    });
  } catch (err) {
    console.error('[StudyRoom Controller] updateMemberGoal error:', err);
    res.status(500).json({ success: false, message: 'Failed to update goal', error: err.message });
  }
};

/**
 * Update shared resource / scratchpad / whiteboard
 * PATCH /api/study-rooms/:id/resource
 */
exports.updateSharedResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { activeTab, scratchpadCode, scratchpadLanguage, videoUrl, videoTitle, whiteboardData, notes } = req.body;

    const room = await StudyRoom.findById(id);
    if (!room) return res.status(404).json({ success: false, message: 'Study room not found' });

    if (activeTab) room.sharedResource.activeTab = activeTab;
    if (scratchpadCode !== undefined) room.sharedResource.scratchpadCode = scratchpadCode;
    if (scratchpadLanguage !== undefined) room.sharedResource.scratchpadLanguage = scratchpadLanguage;
    if (videoUrl !== undefined) room.sharedResource.videoUrl = videoUrl;
    if (videoTitle !== undefined) room.sharedResource.videoTitle = videoTitle;
    if (whiteboardData !== undefined) room.sharedResource.whiteboardData = whiteboardData;
    if (notes !== undefined) room.sharedResource.notes = notes;

    await room.save();

    res.json({
      success: true,
      sharedResource: room.sharedResource
    });
  } catch (err) {
    console.error('[StudyRoom Controller] updateSharedResource error:', err);
    res.status(500).json({ success: false, message: 'Failed to update shared resource', error: err.message });
  }
};

/**
 * Archive / Delete study room
 * DELETE /api/study-rooms/:id
 */
exports.archiveRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await StudyRoom.findById(id);
    if (!room) return res.status(404).json({ success: false, message: 'Study room not found' });

    const isHost = String(room.host) === String(req.user._id);
    if (!isHost && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host or admin can close this room' });
    }

    room.status = 'archived';
    await room.save();

    res.json({
      success: true,
      message: 'Study room archived successfully'
    });
  } catch (err) {
    console.error('[StudyRoom Controller] archiveRoom error:', err);
    res.status(500).json({ success: false, message: 'Failed to archive room', error: err.message });
  }
};
