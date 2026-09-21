const Comment = require('../models/Comment');
const Lesson = require('../models/Lesson');

/**
 * Get all comments & nested replies for a specific lesson
 * GET /api/comments/lesson/:lessonId
 */
exports.getLessonComments = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Fetch all comments for this lesson populated with user details
    const comments = await Comment.find({ lesson: lessonId })
      .populate('user', 'name email role avatar headline')
      .sort({ isPinned: -1, createdAt: 1 })
      .lean();

    // Separate top-level comments and nested replies
    const topLevelComments = [];
    const repliesMap = {};

    comments.forEach((comment) => {
      if (comment.parentComment) {
        const parentId = String(comment.parentComment);
        if (!repliesMap[parentId]) repliesMap[parentId] = [];
        repliesMap[parentId].push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });

    // Attach replies array to top-level comments
    const structuredComments = topLevelComments.map((parent) => ({
      ...parent,
      replies: repliesMap[String(parent._id)] || [],
    }));

    // Sort top-level comments so pinned items stay on top, then newest first
    structuredComments.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      count: comments.length,
      comments: structuredComments,
    });
  } catch (err) {
    console.error('Error fetching lesson comments:', err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

/**
 * Create a new question/comment or inline reply
 * POST /api/comments
 */
exports.createComment = async (req, res) => {
  try {
    const { lessonId, courseId, text, parentCommentId } = req.body;

    if (!lessonId || !courseId || !text || !text.trim()) {
      return res.status(400).json({ message: 'Lesson ID, Course ID, and comment text are required.' });
    }

    const comment = await Comment.create({
      lesson: lessonId,
      course: courseId,
      user: req.user._id,
      text: text.trim(),
      parentComment: parentCommentId || null,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name email role avatar headline'
    );

    res.status(201).json({
      success: true,
      comment: {
        ...populatedComment.toObject(),
        replies: [],
      },
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ message: 'Failed to post comment' });
  }
};

/**
 * Upvote / Like a comment
 * POST /api/comments/:id/upvote
 */
exports.toggleUpvoteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userIdStr = String(req.user._id);
    const existingIndex = comment.upvotes.findIndex((id) => String(id) === userIdStr);

    if (existingIndex > -1) {
      comment.upvotes.splice(existingIndex, 1);
    } else {
      comment.upvotes.push(req.user._id);
    }

    await comment.save();

    const updated = await Comment.findById(comment._id).populate(
      'user',
      'name email role avatar headline'
    );

    res.json({
      success: true,
      upvotesCount: updated.upvotes.length,
      isUpvoted: existingIndex === -1,
      comment: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a comment & its nested replies
 * DELETE /api/comments/:id
 */
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isAuthor = String(comment.user) === String(req.user._id);
    const isInstructorOrAdmin = req.user.role === 'instructor' || req.user.role === 'admin';

    if (!isAuthor && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment.' });
    }

    // Delete comment and its replies
    await Comment.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ parentComment: req.params.id });

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Pin or Unpin a comment (Instructor/Admin only)
 * PUT /api/comments/:id/pin
 */
exports.togglePinComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.isPinned = !comment.isPinned;
    await comment.save();

    const updated = await Comment.findById(comment._id).populate(
      'user',
      'name email role avatar headline'
    );

    res.json({
      success: true,
      isPinned: updated.isPinned,
      comment: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
