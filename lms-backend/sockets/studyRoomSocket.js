const StudyRoom = require('../models/StudyRoom');

// In-memory tracking for fast active connection maps
const roomConnections = new Map(); // roomId -> Set of { socketId, userId, name, avatar }
const roomTimers = new Map(); // roomId -> { timerInterval, remaining, isRunning, mode, duration }

function setupStudyRoomSockets(io) {
  io.on('connection', (socket) => {

    // 1. Join Study Room
    socket.on('join_study_room', async ({ roomId, user, goal }) => {
      if (!roomId) return;
      if (!user || (!user._id && !user.id)) {
        socket.emit('study_room_error', { message: 'Authentication is required to join a study room.' });
        return;
      }
      const roomChannel = `study_room_${roomId}`;
      socket.join(roomChannel);
      socket.studyRoomId = roomId;

      const memberInfo = {
        socketId: socket.id,
        userId: user._id || user.id,
        name: user.name || 'Learner',
        avatar: user.avatar || '',
        role: user.role || 'student',
        currentGoal: goal || 'Deep focus & study',
        isHandRaised: false,
        joinedAt: new Date()
      };

      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Map());
      }
      roomConnections.get(roomId).set(socket.id, memberInfo);

      const activeMembers = Array.from(roomConnections.get(roomId).values());

      // Notify the joining user with the full active member list
      socket.emit('study_room_state_sync', {
        activeMembers,
        timer: roomTimers.get(roomId) || null
      });

      // Broadcast to everyone else in the room
      socket.to(roomChannel).emit('study_room_member_joined', {
        member: memberInfo,
        activeMembers,
        totalCount: activeMembers.length
      });

      // Also persist to DB active members if possible
      try {
        await StudyRoom.findByIdAndUpdate(roomId, {
          $addToSet: {
            activeMembers: {
              user: user?._id || null,
              name: memberInfo.name,
              avatar: memberInfo.avatar,
              currentGoal: memberInfo.currentGoal,
              socketId: socket.id
            }
          }
        });
      } catch (err) {
        // Non-blocking
      }
    });

    // 2. Real-Time Chat & Code Snippets
    socket.on('study_room_send_message', async ({ roomId, message, type = 'chat', codeSnippet, user }) => {
      if (!roomId || (!message && !codeSnippet)) return;
      const roomChannel = `study_room_${roomId}`;

      const chatPayload = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: {
          _id: user?._id || user?.id,
          name: user?.name || 'Student',
          avatar: user?.avatar || '',
          role: user?.role || 'student'
        },
        text: message || '',
        type,
        codeSnippet: codeSnippet || { code: '', language: 'javascript' },
        createdAt: new Date()
      };

      io.to(roomChannel).emit('study_room_receive_message', chatPayload);

      // Persist to Mongo in background
      try {
        await StudyRoom.findByIdAndUpdate(roomId, {
          $push: {
            messages: {
              $each: [chatPayload],
              $slice: -100 // retain last 100 messages
            }
          }
        });
      } catch (err) {
        console.error('[StudyRoom Socket] Error saving message:', err.message);
      }
    });

    // 3. Shared Resource Sync (Code Scratchpad, Shared Video, Whiteboard, Notes)
    socket.on('study_room_sync_resource', async ({ roomId, resourceType, data, isBroadcaster = false }) => {
      if (!roomId) return;
      const roomChannel = `study_room_${roomId}`;

      // Broadcast immediately to all other participants
      socket.to(roomChannel).emit('study_room_resource_updated', {
        resourceType,
        data,
        updatedBy: socket.id,
        timestamp: Date.now()
      });

      // Periodically or asynchronously save heavy changes
      if (resourceType === 'code' && data?.code) {
        try {
          await StudyRoom.findByIdAndUpdate(roomId, {
            'sharedResource.scratchpadCode': data.code,
            'sharedResource.scratchpadLanguage': data.language || 'javascript'
          });
        } catch (e) {}
      } else if (resourceType === 'video' && data) {
        try {
          await StudyRoom.findByIdAndUpdate(roomId, {
            'sharedResource.videoUrl': data.videoUrl,
            'sharedResource.videoTitle': data.videoTitle,
            'sharedResource.videoTime': data.videoTime,
            'sharedResource.isPlaying': data.isPlaying
          });
        } catch (e) {}
      } else if (resourceType === 'notes' && data?.notes !== undefined) {
        try {
          await StudyRoom.findByIdAndUpdate(roomId, {
            'sharedResource.notes': data.notes
          });
        } catch (e) {}
      }
    });

    // 4. Whiteboard Stroke Real-time Broadcast
    socket.on('study_room_whiteboard_draw', ({ roomId, drawAction }) => {
      if (!roomId || !drawAction) return;
      socket.to(`study_room_${roomId}`).emit('study_room_whiteboard_stroke', drawAction);
    });

    socket.on('study_room_whiteboard_clear', ({ roomId }) => {
      if (!roomId) return;
      io.to(`study_room_${roomId}`).emit('study_room_whiteboard_cleared');
    });

    // 5. Synchronized Pomodoro Timer Controls
    socket.on('study_room_timer_action', ({ roomId, action, mode, duration }) => {
      if (!roomId) return;
      const roomChannel = `study_room_${roomId}`;

      let currentTimer = roomTimers.get(roomId) || {
        remaining: 1500,
        duration: 1500,
        isRunning: false,
        mode: 'focus'
      };

      if (action === 'start') {
        currentTimer.isRunning = true;
      } else if (action === 'pause') {
        currentTimer.isRunning = false;
      } else if (action === 'reset') {
        currentTimer.isRunning = false;
        currentTimer.remaining = currentTimer.duration;
      } else if (action === 'set_mode') {
        currentTimer.mode = mode || 'focus';
        const defaultDur = mode === 'short_break' ? 300 : mode === 'long_break' ? 900 : 1500;
        currentTimer.duration = duration || defaultDur;
        currentTimer.remaining = currentTimer.duration;
        currentTimer.isRunning = false;
      } else if (action === 'tick' && currentTimer.isRunning) {
        if (currentTimer.remaining > 0) {
          currentTimer.remaining -= 1;
        } else {
          currentTimer.isRunning = false;
          // Trigger celebration / notification on timer finish
          io.to(roomChannel).emit('study_room_timer_finished', {
            mode: currentTimer.mode,
            message: currentTimer.mode === 'focus' 
              ? '🎉 Focus sprint completed! Time for a well-deserved break.' 
              : '⚡ Break time is over! Ready for the next focus sprint?'
          });
        }
      }

      roomTimers.set(roomId, currentTimer);

      io.to(roomChannel).emit('study_room_timer_updated', currentTimer);
    });

    // 6. Member Goal Status Update
    socket.on('study_room_update_goal', ({ roomId, goal, user }) => {
      if (!roomId) return;
      const roomChannel = `study_room_${roomId}`;

      if (roomConnections.has(roomId) && roomConnections.get(roomId).has(socket.id)) {
        const mem = roomConnections.get(roomId).get(socket.id);
        mem.currentGoal = (goal || '').slice(0, 150);
      }

      const activeMembers = roomConnections.has(roomId) 
        ? Array.from(roomConnections.get(roomId).values()) 
        : [];

      io.to(roomChannel).emit('study_room_goal_updated', {
        socketId: socket.id,
        userId: user?._id || user?.id,
        goal,
        activeMembers
      });
    });

    // 7. Raise Hand / Doubt Tagging
    socket.on('study_room_toggle_hand', ({ roomId, isRaised, user }) => {
      if (!roomId) return;
      const roomChannel = `study_room_${roomId}`;

      if (roomConnections.has(roomId) && roomConnections.get(roomId).has(socket.id)) {
        const mem = roomConnections.get(roomId).get(socket.id);
        mem.isHandRaised = isRaised;
      }

      const activeMembers = roomConnections.has(roomId) 
        ? Array.from(roomConnections.get(roomId).values()) 
        : [];

      io.to(roomChannel).emit('study_room_hand_toggled', {
        socketId: socket.id,
        user: user || { name: 'Learner' },
        isRaised,
        activeMembers
      });
    });

    // 8. WebRTC Peer-to-Peer Voice/Video Mesh Signaling
    socket.on('study_room_webrtc_signal', ({ roomId, targetSocketId, signal, user }) => {
      if (!roomId) return;
      if (targetSocketId) {
        io.to(targetSocketId).emit('study_room_webrtc_signal', {
          senderSocketId: socket.id,
          signal,
          user
        });
      } else {
        socket.to(`study_room_${roomId}`).emit('study_room_webrtc_signal', {
          senderSocketId: socket.id,
          signal,
          user
        });
      }
    });

    // 9. Leave & Disconnect Handlers
    const handleLeave = async (roomId, socketId) => {
      if (!roomId) return;
      const roomChannel = `study_room_${roomId}`;

      if (roomConnections.has(roomId)) {
        const leavingMember = roomConnections.get(roomId).get(socketId);
        roomConnections.get(roomId).delete(socketId);
        const activeMembers = Array.from(roomConnections.get(roomId).values());

        if (roomConnections.get(roomId).size === 0) {
          roomConnections.delete(roomId);
        }

        io.to(roomChannel).emit('study_room_member_left', {
          socketId,
          leavingMember,
          activeMembers,
          totalCount: activeMembers.length
        });
      }

      try {
        await StudyRoom.findByIdAndUpdate(roomId, {
          $pull: { activeMembers: { socketId } }
        });
      } catch (e) {}
    };

    socket.on('leave_study_room', ({ roomId }) => {
      const targetRoomId = roomId || socket.studyRoomId;
      if (targetRoomId) {
        handleLeave(targetRoomId, socket.id);
        socket.leave(`study_room_${targetRoomId}`);
        socket.studyRoomId = null;
      }
    });

    socket.on('disconnect', () => {
      if (socket.studyRoomId) {
        handleLeave(socket.studyRoomId, socket.id);
      }
    });
  });
}

module.exports = { setupStudyRoomSockets };
