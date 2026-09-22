const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const { sendEnrollmentConfirmationEmail } = require('../services/emailService');
const { awardActivityXp } = require('../services/gamificationService');

exports.enroll = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Critical Security Enforcement: Direct enrollment is ONLY permitted for free courses
    if (course.price > 0) {
      return res.status(402).json({
        message: 'Payment required. Paid courses must be purchased via the secure payment checkout.',
        requiresPayment: true,
      });
    }

    let existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.status(200).json(existing);

    const enrollment = await Enrollment.create({ student: req.user._id, course: courseId });
    await Course.findByIdAndUpdate(courseId, { $inc: { studentsCount: 1 } });

    // Send enrollment confirmation email asynchronously
    sendEnrollmentConfirmationEmail({
      studentEmail: req.user.email,
      studentName: req.user.name,
      courseTitle: course.title,
      coursePrice: course.price || 0,
      instructorName: course.instructor?.name || 'Course Instructor',
    }).catch((err) => console.error('[EmailService] Enrollment email send error:', err.message));

    res.status(201).json(enrollment);
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ message: 'Enrollment failed due to a server error' });
  }
};

exports.myEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id }).populate('course');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markLessonComplete = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    let enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Not enrolled in this course' });

    let gamificationResult = null;
    const alreadyDone = enrollment.completedLessons.some(id => String(id) === String(lessonId));
    if (!alreadyDone) {
      enrollment.completedLessons.push(lessonId);
      // Award XP & Streak for completing a lesson
      gamificationResult = await awardActivityXp(
        req.user._id,
        'LESSON_COMPLETE',
        50,
        'Completed Video Lesson'
      );
    }

    const course = await Course.findById(courseId).populate({ path: 'modules', populate: 'lessons' });
    const totalLessons = course ? course.modules.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0) : 0;
    
    const wasAlreadyCompleted = enrollment.isCompleted;
    enrollment.progressPercent = totalLessons > 0
      ? Math.min(100, Math.round((enrollment.completedLessons.length / totalLessons) * 100))
      : 100;
    
    if (enrollment.progressPercent >= 100) {
      enrollment.isCompleted = true;
      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }
      if (!enrollment.certificateIssued) {
        enrollment.certificateIssued = true;
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        enrollment.certificateId = `CERT-${new Date().getFullYear()}-${randomHex}`;
      }

      // If newly graduated course, award big 200 XP mastery bonus!
      if (!wasAlreadyCompleted) {
        const courseGraduationReward = await awardActivityXp(
          req.user._id,
          'COURSE_COMPLETE',
          200,
          `Course Mastered: ${course?.title || 'Graduation'}`
        );
        if (courseGraduationReward) {
          gamificationResult = courseGraduationReward;
        }
      }
    }

    await enrollment.save();
    res.json({
      ...enrollment.toObject(),
      gamification: gamificationResult,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save video playback position for resume-from-last-position
exports.savePlaybackPosition = async (req, res) => {
  try {
    const { courseId, lessonId, seconds } = req.body;
    let enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const existingIndex = enrollment.playbackPositions.findIndex(
      p => String(p.lesson) === String(lessonId)
    );

    if (existingIndex >= 0) {
      enrollment.playbackPositions[existingIndex].seconds = seconds;
      enrollment.playbackPositions[existingIndex].updatedAt = new Date();
    } else {
      enrollment.playbackPositions.push({
        lesson: lessonId,
        seconds: seconds,
        updatedAt: new Date(),
      });
    }

    await enrollment.save();
    res.json({ success: true, seconds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get playback position for a lesson
exports.getPlaybackPosition = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.json({ seconds: 0 });

    const pos = enrollment.playbackPositions.find(p => String(p.lesson) === String(lessonId));
    res.json({ seconds: pos ? pos.seconds : 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get notes for a lesson
exports.getLessonNotes = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.json({ notes: [] });

    const notes = enrollment.notes
      .filter(n => String(n.lesson) === String(lessonId))
      .sort((a, b) => a.timestamp - b.timestamp);

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a note with timestamp
exports.addLessonNote = async (req, res) => {
  try {
    const { courseId, lessonId, timestamp, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Note text is required' });

    let enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const newNote = {
      lesson: lessonId,
      timestamp: Math.max(0, Math.floor(timestamp || 0)),
      text: text.trim(),
      createdAt: new Date(),
    };

    enrollment.notes.push(newNote);
    await enrollment.save();

    const savedNote = enrollment.notes[enrollment.notes.length - 1];
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a note
exports.deleteLessonNote = async (req, res) => {
  try {
    const { courseId, noteId } = req.params;
    let enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    enrollment.notes = enrollment.notes.filter(n => String(n._id) !== String(noteId));
    await enrollment.save();

    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get public/authenticated certificate details
exports.getCertificateDetails = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const enrollment = await Enrollment.findOne({ certificateId, certificateIssued: true })
      .populate('student', 'name email avatar')
      .populate({
        path: 'course',
        select: 'title slug category level description instructor thumbnail',
        populate: { path: 'instructor', select: 'name avatar bio' },
      });

    if (!enrollment) {
      return res.status(404).json({ message: 'Certificate not found or not yet issued' });
    }

    res.json({
      certificateId: enrollment.certificateId,
      studentName: enrollment.student?.name || 'Student',
      studentEmail: enrollment.student?.email,
      courseTitle: enrollment.course?.title,
      courseSlug: enrollment.course?.slug,
      courseThumbnail: enrollment.course?.thumbnail,
      instructorName: enrollment.course?.instructor?.name || 'Lead Instructor',
      issueDate: enrollment.completedAt || enrollment.updatedAt || enrollment.enrolledAt,
      isCompleted: enrollment.isCompleted,
      certificateStatus: enrollment.certificateStatus || 'active',
      certificateRevokedAt: enrollment.certificateRevokedAt,
      certificateRevokedReason: enrollment.certificateRevokedReason || '',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Certificate Management Endpoint (Admin / Instructor)
// GET /api/enrollments/certificates/manage
exports.getCertificatesManagement = async (req, res) => {
  try {
    const { search, courseId, status } = req.query;
    const filter = {
      $or: [
        { certificateIssued: true },
        { progressPercent: 100 },
        { isCompleted: true },
      ],
    };

    // If Instructor, only show certificates for courses owned by this instructor
    if (req.user.role === 'instructor') {
      const instructorCourses = await Course.find({ instructor: req.user._id }).select('_id');
      const courseIds = instructorCourses.map(c => c._id);
      filter.course = { $in: courseIds };
    } else if (req.user.role === 'admin') {
      if (courseId) {
        filter.course = courseId;
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to access certificate management' });
    }

    if (status && status !== 'all') {
      filter.certificateStatus = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate('student', 'name email avatar')
      .populate({
        path: 'course',
        select: 'title slug thumbnail category instructor',
        populate: { path: 'instructor', select: 'name email' },
      })
      .sort({ updatedAt: -1 });

    // In-memory filter for search across student name, email, course title, certificateId
    let filtered = enrollments;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = enrollments.filter(e => {
        const matchName = e.student?.name?.toLowerCase().includes(q);
        const matchEmail = e.student?.email?.toLowerCase().includes(q);
        const matchCourse = e.course?.title?.toLowerCase().includes(q);
        const matchCertId = e.certificateId?.toLowerCase().includes(q);
        return matchName || matchEmail || matchCourse || matchCertId;
      });
    }

    // Auto-generate certificateId if missing for completed student
    const certificates = await Promise.all(filtered.map(async (e) => {
      if (!e.certificateId && e.certificateIssued) {
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        e.certificateId = `CERT-${new Date().getFullYear()}-${randomHex}`;
        await e.save();
      }

      return {
        _id: e._id,
        certificateId: e.certificateId || `CERT-${new Date().getFullYear()}-${e._id.toString().slice(-6).toUpperCase()}`,
        student: {
          _id: e.student?._id,
          name: e.student?.name || 'Learner',
          email: e.student?.email || '',
          avatar: e.student?.avatar || '',
        },
        course: {
          _id: e.course?._id,
          title: e.course?.title || 'Course',
          slug: e.course?.slug,
          thumbnail: e.course?.thumbnail,
          instructorName: e.course?.instructor?.name || 'Instructor',
        },
        issueDate: e.completedAt || e.updatedAt || e.enrolledAt,
        progressPercent: e.progressPercent || 100,
        certificateStatus: e.certificateStatus || 'active',
        certificateRevokedAt: e.certificateRevokedAt,
        certificateRevokedReason: e.certificateRevokedReason || '',
      };
    }));

    // Calculate metrics
    const totalIssued = enrollments.filter(e => e.certificateIssued || e.progressPercent === 100).length;
    const activeCount = enrollments.filter(e => (e.certificateStatus || 'active') === 'active').length;
    const revokedCount = enrollments.filter(e => e.certificateStatus === 'revoked').length;

    res.json({
      certificates,
      metrics: {
        totalIssued,
        activeCount,
        revokedCount,
      },
    });
  } catch (err) {
    console.error('getCertificatesManagement error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update Certificate Status (Revoke or Reactivate)
// PATCH /api/enrollments/certificates/:enrollmentId/status
exports.updateCertificateStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'revoked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid certificate status. Must be "active" or "revoked"' });
    }

    const enrollment = await Enrollment.findById(enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment / Certificate record not found' });
    }

    // Permission check: Admin or course Instructor
    if (req.user.role !== 'admin') {
      const isCourseInstructor = String(enrollment.course?.instructor) === String(req.user._id);
      if (!isCourseInstructor) {
        return res.status(403).json({ message: 'Not authorized to modify this certificate' });
      }
    }

    enrollment.certificateStatus = status;
    if (status === 'revoked') {
      enrollment.certificateRevokedAt = new Date();
      enrollment.certificateRevokedReason = reason?.trim() || 'Revoked by administrator or course instructor.';
    } else {
      enrollment.certificateRevokedAt = null;
      enrollment.certificateRevokedReason = '';
    }

    await enrollment.save();

    res.json({
      success: true,
      message: `Certificate has been successfully ${status === 'active' ? 'reactivated' : 'revoked'}.`,
      certificateStatus: enrollment.certificateStatus,
      certificateRevokedAt: enrollment.certificateRevokedAt,
      certificateRevokedReason: enrollment.certificateRevokedReason,
    });
  } catch (err) {
    console.error('updateCertificateStatus error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Toggle Bookmark for a Lesson
 * POST /api/enrollments/bookmark
 */
exports.toggleBookmarkLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'Course ID and Lesson ID are required' });
    }

    let enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (!enrollment.bookmarkedLessons) {
      enrollment.bookmarkedLessons = [];
    }

    const lessonIdStr = String(lessonId);
    const existingIndex = enrollment.bookmarkedLessons.findIndex(id => String(id) === lessonIdStr);
    let isBookmarked = false;

    if (existingIndex > -1) {
      enrollment.bookmarkedLessons.splice(existingIndex, 1);
      isBookmarked = false;
    } else {
      enrollment.bookmarkedLessons.push(lessonId);
      isBookmarked = true;
    }

    await enrollment.save();

    res.json({
      success: true,
      isBookmarked,
      bookmarkedLessons: enrollment.bookmarkedLessons,
    });
  } catch (err) {
    console.error('toggleBookmarkLesson error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all bookmarked lessons for a course
 * GET /api/enrollments/bookmarks/:courseId
 */
exports.getCourseBookmarks = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId })
      .populate('bookmarkedLessons', 'title duration isFreePreview contentType videoUrl documentUrl');

    if (!enrollment) return res.json({ bookmarkedLessons: [] });

    res.json({
      success: true,
      bookmarkedLessons: enrollment.bookmarkedLessons || [],
    });
  } catch (err) {
    console.error('getCourseBookmarks error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all notes across all lessons for a course
 * GET /api/enrollments/all-notes/:courseId
 */
exports.getAllCourseNotes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId })
      .populate('notes.lesson', 'title duration');

    if (!enrollment) return res.json({ notes: [] });

    res.json({
      success: true,
      notes: enrollment.notes || [],
    });
  } catch (err) {
    console.error('getAllCourseNotes error:', err);
    res.status(500).json({ message: err.message });
  }
};

