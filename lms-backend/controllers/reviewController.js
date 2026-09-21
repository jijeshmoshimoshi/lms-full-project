const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

/**
 * Get Reviews & Rating Breakdown for a Course
 * Route: GET /api/courses/:courseId/reviews
 */
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let sum = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(r => {
      sum += r.rating;
      const rounded = Math.round(r.rating);
      if (distribution[rounded] !== undefined) {
        distribution[rounded] += 1;
      }
    });

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    // Calculate percentage breakdown strictly from real reviews in DB
    const distributionPercent = {
      5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0,
    };

    res.json({
      averageRating,
      totalReviews,
      distribution: distributionPercent,
      reviews,
    });
  } catch (err) {
    console.error('Error fetching course reviews:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch reviews' });
  }
};

/**
 * Add or Update a Review
 * Route: POST /api/courses/:courseId/reviews
 */
exports.addReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Please write a review comment' });
    }

    // Upsert review (update if already exists for this student & course)
    const review = await Review.findOneAndUpdate(
      { course: courseId, student: studentId },
      { rating: Number(rating), comment: comment.trim() },
      { new: true, upsert: true, runValidators: true }
    ).populate('student', 'name avatar');

    // Recalculate course rating and reviewsCount
    const allCourseReviews = await Review.find({ course: courseId });
    const totalCount = allCourseReviews.length;
    const avgRating = (allCourseReviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1);

    await Course.findByIdAndUpdate(courseId, {
      rating: Number(avgRating),
      reviewsCount: totalCount,
    });

    res.status(201).json({
      message: 'Review submitted successfully!',
      review,
    });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ message: err.message || 'Failed to submit review' });
  }
};

/**
 * Vote Helpful or Unhelpful
 * Route: POST /api/courses/reviews/:reviewId/vote
 */
exports.voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { type } = req.body; // 'helpful' | 'unhelpful'

    const field = type === 'helpful' ? 'helpfulCount' : 'unhelpfulCount';
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { [field]: 1 } },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
