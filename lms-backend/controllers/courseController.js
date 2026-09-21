const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// Helper to protect premium course videos and documents from unauthorized scraping
const redactUnenrolledCourseContent = async (courseObj, user) => {
  if (!courseObj) return courseObj;
  // If free course, all learners can view
  if (!courseObj.price || courseObj.price <= 0) return courseObj;

  const courseInstructorId = courseObj.instructor?._id || courseObj.instructor;
  const isOwner = user && String(courseInstructorId) === String(user._id);
  const isAdmin = user && user.role === 'admin';

  // Instructors and Admins see full unredacted content
  if (isOwner || isAdmin) return courseObj;

  // Check if current user is an enrolled student
  let isEnrolled = false;
  if (user) {
    const enrollment = await Enrollment.findOne({ student: user._id, course: courseObj._id });
    if (enrollment) isEnrolled = true;
  }

  if (isEnrolled) return courseObj;

  // For un-enrolled public users, redact non-preview video URLs, subtitles, and document attachments
  if (courseObj.modules && Array.isArray(courseObj.modules)) {
    courseObj.modules.forEach((mod) => {
      if (mod.lessons && Array.isArray(mod.lessons)) {
        mod.lessons.forEach((lesson) => {
          if (!lesson.isPreview) {
            lesson.videoUrl = '';
            lesson.subtitleUrl = '';
            lesson.documentUrl = '';
            lesson.resources = [];
            lesson.isLocked = true;
          }
        });
      }
    });
  }

  return courseObj;
};

exports.createCourse = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      price = 0, 
      currency = 'INR', 
      platformSharePercent = 30, 
      instructorSharePercent = 70, 
      category, 
      level, 
      thumbnail, 
      isPublished 
    } = req.body;

    const numPrice = Math.max(0, Number(price) || 0);
    const numOriginalPrice = Math.max(0, Number(req.body.originalPrice) || 0);
    const isOfferActive = req.body.isOfferActive !== undefined 
      ? Boolean(req.body.isOfferActive) 
      : (numOriginalPrice > numPrice && numPrice > 0);
    const offerExpiresAt = req.body.offerExpiresAt ? new Date(req.body.offerExpiresAt) : null;
    const offerBadgeText = req.body.offerBadgeText?.trim() || 'Special Offer';

    const willPublish = isPublished !== undefined ? Boolean(isPublished) : true;

    // Block publishing as paid if instructor hasn't completed Razorpay Route onboarding
    if (numPrice > 0 && willPublish) {
      const instructorUser = await User.findById(req.user._id);
      if (!instructorUser?.razorpayAccountId || instructorUser?.payoutStatus !== 'active') {
        return res.status(400).json({
          message: 'Cannot publish a paid course until your Razorpay Route linked account onboarding is complete and active.',
        });
      }
    }

    const baseSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course';
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    
    // Admin courses are auto-approved. Instructor courses start in 'draft' mode.
    const isUserAdmin = req.user.role === 'admin';
    const initialApprovalStatus = isUserAdmin ? 'approved' : 'draft';
    const initialPublished = isUserAdmin ? willPublish : false;

    const course = await Course.create({
      title, 
      description, 
      price: numPrice, 
      originalPrice: numOriginalPrice,
      isOfferActive,
      offerExpiresAt,
      offerBadgeText,
      currency: currency || 'INR',
      platformSharePercent: Number(platformSharePercent) || 30,
      instructorSharePercent: Number(instructorSharePercent) || 70,
      category: category || 'general', 
      level: level || 'beginner', 
      thumbnail, 
      slug,
      isPublished: initialPublished,
      approvalStatus: initialApprovalStatus,
      instructor: req.user._id,
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const { category, level, search, all, instructor, approvalStatus } = req.query;
    const filter = {};

    // STRICT PERSONALIZATION: When an instructor calls courses for their dashboard/management (all === 'true')
    // they MUST only see their own courses!
    if (req.user && req.user.role === 'instructor') {
      if (all === 'true') {
        filter.instructor = req.user._id;
      }
    } else if (req.user && req.user.role === 'admin') {
      // Admins can see all courses, or optionally filter by a specific instructor
      if (instructor) filter.instructor = instructor;
    }

    // When requested by the public student website (all !== 'true')
    // only show courses that are published AND approved AND created by an approved/verified instructor (or admin)
    if (all !== 'true') {
      filter.isPublished = true;
      filter.approvalStatus = 'approved';

      const approvedInstructors = await User.find({
        $or: [
          { role: 'admin' },
          { role: 'instructor', isVerified: true },
        ],
      }).select('_id');

      const approvedIds = approvedInstructors.map(u => u._id);
      if (filter.instructor) {
        // Instructor already set
      } else {
        filter.instructor = { $in: approvedIds };
      }
    } else {
      // Management context (all === 'true'): optional approvalStatus filter
      if (approvalStatus) {
        filter.approvalStatus = approvalStatus;
      }
    }

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter)
      .populate('instructor', 'name avatar email role isVerified')
      .populate('reviewedBy', 'name email');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar email bio headline role isVerified')
      .populate('reviewedBy', 'name email')
      .populate({ path: 'modules', populate: { path: 'lessons' } });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const courseInstructorId = course.instructor?._id || course.instructor;
    const isOwner = req.user && String(courseInstructorId) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    // If an instructor is accessing someone else's course
    if (req.user && req.user.role === 'instructor' && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized. You can only view and manage your own courses.' });
    }

    // Public / student access checks: only apply if the requester is neither the course instructor nor platform admin
    if (!isOwner && !isAdmin) {
      if (course.approvalStatus && course.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'This course is pending administrator review and approval.' });
      }
      if (!course.isPublished) {
        return res.status(403).json({ message: 'This course is not published.' });
      }
      if (course.instructor && course.instructor.role === 'instructor' && !course.instructor.isVerified) {
        return res.status(403).json({ message: 'This course is pending instructor verification by an administrator.' });
      }
    }

    const instId = course.instructor?._id || course.instructor;
    const instructorCourses = instId ? await Course.find({ 
      instructor: instId,
      isPublished: true 
    }).select('studentsCount rating reviewsCount') : [];

    const totalStudents = instructorCourses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
    const totalReviews = instructorCourses.reduce((sum, c) => sum + (c.reviewsCount || 0), 0);

    const coursesWithRatings = instructorCourses.filter(c => c.reviewsCount > 0 && c.rating > 0);
    const avgInstRating = coursesWithRatings.length > 0
      ? Number((coursesWithRatings.reduce((sum, c) => sum + c.rating, 0) / coursesWithRatings.length).toFixed(1))
      : (course.reviewsCount > 0 && course.rating > 0 ? course.rating : 0);

    const courseObj = course.toObject();
    courseObj.instructorStats = {
      totalCourses: instructorCourses.length,
      totalStudents: totalStudents,
      totalReviews: totalReviews,
      instructorRating: avgInstRating,
    };

    const protectedCourse = await redactUnenrolledCourseContent(courseObj, req.user);
    res.json(protectedCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseBySlug = async (req, res) => {
  try {
    let course = await Course.findOne({ slug: req.params.slug })
      .populate('instructor', 'name avatar email bio headline role isVerified')
      .populate('reviewedBy', 'name email')
      .populate({ path: 'modules', populate: { path: 'lessons' } });
    
    if (!course && req.params.slug.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(req.params.slug)
        .populate('instructor', 'name avatar email bio headline role isVerified')
        .populate('reviewedBy', 'name email')
        .populate({ path: 'modules', populate: { path: 'lessons' } });
    }

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const courseInstructorId = course.instructor?._id || course.instructor;
    const isOwner = req.user && String(courseInstructorId) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    // Public / student access checks: only apply if the requester is neither the course instructor nor platform admin
    if (!isOwner && !isAdmin) {
      if (course.approvalStatus && course.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'This course is pending administrator review and approval.' });
      }
      if (!course.isPublished) {
        return res.status(403).json({ message: 'This course is not published.' });
      }
      if (course.instructor && course.instructor.role === 'instructor' && !course.instructor.isVerified) {
        return res.status(403).json({ message: 'This course is pending instructor verification by an administrator.' });
      }
    }

    const instId = course.instructor?._id || course.instructor;
    const instructorCourses = instId ? await Course.find({ 
      instructor: instId,
      isPublished: true 
    }).select('studentsCount rating reviewsCount') : [];

    const totalStudents = instructorCourses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
    const totalReviews = instructorCourses.reduce((sum, c) => sum + (c.reviewsCount || 0), 0);

    const coursesWithRatings = instructorCourses.filter(c => c.reviewsCount > 0 && c.rating > 0);
    const avgInstRating = coursesWithRatings.length > 0
      ? Number((coursesWithRatings.reduce((sum, c) => sum + c.rating, 0) / coursesWithRatings.length).toFixed(1))
      : (course.reviewsCount > 0 && course.rating > 0 ? course.rating : 0);

    const courseObj = course.toObject();
    courseObj.instructorStats = {
      totalCourses: instructorCourses.length,
      totalStudents: totalStudents,
      totalReviews: totalReviews,
      instructorRating: avgInstRating,
    };

    const protectedCourse = await redactUnenrolledCourseContent(courseObj, req.user);
    res.json(protectedCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Security: Instructors cannot self-approve or manipulate approval timestamps
    if (req.user.role !== 'admin') {
      delete req.body.approvalStatus;
      delete req.body.reviewedBy;
      delete req.body.reviewedAt;
      delete req.body.rejectionReason;
      delete req.body.platformSharePercent;
      delete req.body.instructorSharePercent;
      delete req.body.instructor;
    }

    const proposedPrice = req.body.price !== undefined ? Number(req.body.price) : course.price;
    const proposedPublished = req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : course.isPublished;

    // Block publishing as paid if instructor hasn't completed Razorpay Route onboarding
    if (proposedPrice > 0 && proposedPublished) {
      const instructorUser = await User.findById(course.instructor);
      if (!instructorUser?.razorpayAccountId || instructorUser?.payoutStatus !== 'active') {
        return res.status(400).json({
          message: 'Cannot publish a paid course until your Razorpay Route linked account onboarding is complete and active.',
        });
      }
    }

    // If an unapproved course has isPublished passed by an instructor, keep isPublished false until approved
    if (req.user.role !== 'admin' && course.approvalStatus !== 'approved' && req.body.isPublished) {
      req.body.isPublished = false;
    }

    // Strict Whitelist of editable fields to prevent Mass Assignment attacks
    const allowedFields = [
      'title', 'subtitle', 'description', 'thumbnail', 'price', 'originalPrice',
      'isOfferActive', 'offerExpiresAt', 'offerBadgeText', 'currency',
      'category', 'level', 'language', 'whatYouWillLearn', 'requirements',
      'whoThisCourseIsFor', 'badge', 'isBestseller', 'isPublished'
    ];

    if (req.user.role === 'admin') {
      allowedFields.push(
        'approvalStatus', 'reviewedBy', 'reviewedAt', 'rejectionReason',
        'platformSharePercent', 'instructorSharePercent'
      );
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'originalPrice') {
          course[field] = Math.max(0, Number(req.body[field]) || 0);
        } else if (field === 'isOfferActive') {
          course[field] = Boolean(req.body[field]);
        } else if (field === 'offerExpiresAt') {
          course[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          course[field] = req.body[field];
        }
      }
    });

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitCourseForReview = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'modules',
      populate: { path: 'lessons' }
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to submit this course' });
    }

    // Validation: ensure course has at least 1 module
    if (!course.modules || course.modules.length === 0) {
      return res.status(400).json({ 
        message: 'Please add at least one module before submitting this course for review.' 
      });
    }

    // Validation: ensure at least 1 lesson exists across modules
    const totalLessons = course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    if (totalLessons === 0) {
      return res.status(400).json({ 
        message: 'Please add at least one lesson (video, document, or article) before submitting for review.' 
      });
    }

    // If course is paid, ensure instructor has completed Razorpay Route onboarding
    if (course.price > 0) {
      const instructorUser = await User.findById(course.instructor);
      if (!instructorUser?.razorpayAccountId || instructorUser?.payoutStatus !== 'active') {
        return res.status(400).json({
          message: 'You must complete your Razorpay Route linked account onboarding before submitting a paid course for review.',
        });
      }
    }

    course.approvalStatus = 'pending_approval';
    course.submittedAt = new Date();
    course.rejectionReason = '';
    await course.save();

    res.json({
      message: 'Course successfully submitted for administrator review.',
      course,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.approvalStatus = 'approved';
    course.isPublished = true;
    course.reviewedBy = req.user._id;
    course.reviewedAt = new Date();
    course.rejectionReason = '';
    await course.save();

    res.json({
      message: 'Course approved successfully! It is now live on the student portal.',
      course,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectCourse = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Please provide feedback or a reason for requesting changes.' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.approvalStatus = 'rejected';
    course.isPublished = false;
    course.rejectionReason = reason.trim();
    course.reviewedBy = req.user._id;
    course.reviewedAt = new Date();
    await course.save();

    res.json({
      message: 'Course review completed. Feedback sent to the instructor.',
      course,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await course.deleteOne();
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }

    const { title, order } = req.body;
    const module = await Module.create({ title, order: order || 0, course: req.params.courseId });
    await Course.findByIdAndUpdate(req.params.courseId, { $push: { modules: module._id } });
    res.status(201).json(module);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const course = await Course.findById(module.course);
    if (course && String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }

    await Course.findByIdAndUpdate(module.course, { $pull: { modules: module._id } });
    await Lesson.deleteMany({ module: module._id });
    await module.deleteOne();
    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addLesson = async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const course = await Course.findById(module.course);
    if (course && String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }

    const { 
      title, 
      contentType, 
      videoUrl, 
      videoType,
      subtitlesUrl,
      subtitlesLabel,
      originalFileName,
      fileSize,
      documentUrl,
      documentName,
      documentSize,
      documentType,
      content, 
      duration, 
      order, 
      isFreePreview 
    } = req.body;

    const lesson = await Lesson.create({
      title,
      module: req.params.moduleId,
      contentType: contentType || 'video',
      videoUrl: videoUrl || '',
      videoType: videoType || (videoUrl && videoUrl.includes('.m3u8') ? 'hls' : 'direct'),
      subtitlesUrl: subtitlesUrl || '',
      subtitlesLabel: subtitlesLabel || 'English',
      originalFileName: originalFileName || '',
      fileSize: fileSize || 0,
      documentUrl: documentUrl || '',
      documentName: documentName || '',
      documentSize: documentSize || 0,
      documentType: documentType || '',
      content: content || '',
      duration: duration || 0,
      order: order || 0,
      isFreePreview: !!isFreePreview,
    });
    await Module.findByIdAndUpdate(req.params.moduleId, { $push: { lessons: lesson._id } });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    
    const module = await Module.findById(lesson.module);
    if (module) {
      const course = await Course.findById(module.course);
      if (course && String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to modify this course' });
      }
    }

    Object.assign(lesson, req.body);
    await lesson.save();
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const module = await Module.findById(lesson.module);
    if (module) {
      const course = await Course.findById(module.course);
      if (course && String(course.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to modify this course' });
      }
    }

    await Module.findByIdAndUpdate(lesson.module, { $pull: { lessons: lesson._id } });
    await lesson.deleteOne();
    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
