'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import AdvancedVideoPlayer from '../../../components/AdvancedVideoPlayer';
import CertificateModal from '../../../components/CertificateModal';
import RazorpayCheckoutModal from '../../../components/RazorpayCheckoutModal';
import QuizPlayer from '../../../components/QuizPlayer';
import LessonDiscussion from '../../../components/LessonDiscussion';
import LessonNotesBookmarks from '../../../components/LessonNotesBookmarks';
import CodeSandbox from '../../../components/CodeSandbox';
import AskVideoWidget from '../../../components/AskVideoWidget';
import { 
  BookOpen, Video, FileText, CheckCircle2, Lock, Play, Clock, 
  Award, ArrowLeft, Star, Users, ShieldCheck, Sparkles, Check,
  ChevronRight, ArrowRight, Trophy, CreditCard, Tag, Shield, Percent, 
  AlertCircle, X, Download, ExternalLink, FileDown, AlignLeft,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageSquare,
  Share2, Gift, Infinity, Smartphone, Globe, Subtitles, HelpCircle,
  PlayCircle, ShoppingCart, Radio, Calendar, AlertTriangle, Code2, Search
} from 'lucide-react';


import { useCart } from '../../../context/CartContext';

export default function CourseDetailsPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCartToast, setShowCartToast] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showClassroomSandbox, setShowClassroomSandbox] = useState(false);
  const [classroomTab, setClassroomTab] = useState('ask_video'); // 'ask_video' | 'notes' | 'discussion'
  const videoPlayerRef = useRef(null);


  const [currentPlaybackSeconds, setCurrentPlaybackSeconds] = useState(0);

  // View Mode: 'landing' (Udemy sales & details page) or 'classroom' (active video player)
  const [viewMode, setViewMode] = useState('landing');

  // Preview Modal State (for free video preview)
  const [previewModalLesson, setPreviewModalLesson] = useState(null);

  // Reviews State
  const [reviewsData, setReviewsData] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReviewRating, setUserReviewRating] = useState(5);
  const [userReviewComment, setUserReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');
  const [votedReviews, setVotedReviews] = useState({});

  // Curriculum Accordion State
  const [expandedModules, setExpandedModules] = useState({});
  const [showFullBio, setShowFullBio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Certificate Modal state
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  // Razorpay Checkout & Coupon States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showRazorpayGateway, setShowRazorpayGateway] = useState(false);
  const [activeOrderData, setActiveOrderData] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loadingLiveSessions, setLoadingLiveSessions] = useState(false);

  // Offer Countdown Timer state (must be at top-level before any conditional returns)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!course?.offerExpiresAt) return;
    const calculateTime = () => {
      const difference = new Date(course.offerExpiresAt) - new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [course?.offerExpiresAt]);

  useEffect(() => {
    api.get('/coupons/active')
      .then((res) => {
        setAvailableCoupons(res.data?.coupons || []);
      })
      .catch(() => {
        setAvailableCoupons([]);
      });
  }, []);

  const applyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim();
    if (!code || !course) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      let res;
      try {
        res = await api.post('/coupons/validate', {
          code,
          courseIds: [course._id],
          cartTotal: course.price,
        });
      } catch (validateErr) {
        res = await api.post('/payments/validate-coupon', {
          code,
          courseId: course._id,
        });
      }

      setCouponData(res.data);
      setCouponCode(code);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponData(null);
    setCouponCode('');
    setCouponError('');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses/${slug}`);
      setCourse(res.data);

      // Select first lesson by default
      if (res.data.modules && res.data.modules.length > 0) {
        for (const mod of res.data.modules) {
          if (mod.lessons && mod.lessons.length > 0) {
            setActiveLesson(mod.lessons[0]);
            break;
          }
        }

        // Expand all modules by default
        const initialExpanded = {};
        res.data.modules.forEach((mod) => {
          initialExpanded[mod._id] = true;
        });
        setExpandedModules(initialExpanded);
      }

      // Fetch real course reviews
      fetchReviews(res.data._id);

      // Fetch live telecasts & scheduled sessions
      setLoadingLiveSessions(true);
      api.get(`/live-sessions?courseId=${res.data._id}`)
        .then((liveRes) => {
          setLiveSessions(liveRes.data?.sessions || []);
        })
        .catch((err) => {
          console.error('Failed to load course live sessions:', err);
          setLiveSessions([]);
        })
        .finally(() => setLoadingLiveSessions(false));
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (courseId) => {
    setReviewsLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/reviews`);
      setReviewsData(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchUserEnrollment = async () => {
    if (!user) return;
    try {
      const res = await api.get('/enrollments/me');
      const myEnrollment = res.data.find(
        (e) => e.course?._id === course?._id || e.course === course?._id
      );
      if (myEnrollment) {
        setEnrollment(myEnrollment);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (slug) fetchCourseData();
  }, [slug]);

  useEffect(() => {
    if (course && user) fetchUserEnrollment();
  }, [course, user]);

  // Handle Review Submission
  const handleAddReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to leave a review.');
      return;
    }
    if (!userReviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await api.post(`/courses/${course._id}/reviews`, {
        rating: userReviewRating,
        comment: userReviewComment.trim(),
      });
      setReviewNotice('Thank you! Your review has been posted.');
      setUserReviewComment('');
      setTimeout(() => setReviewNotice(''), 4500);
      fetchReviews(course._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Review Vote Helpful / Unhelpful
  const handleVoteReview = async (reviewId, type) => {
    if (votedReviews[reviewId]) return;
    try {
      await api.post(`/courses/reviews/${reviewId}/vote`, { type });
      setVotedReviews(prev => ({ ...prev, [reviewId]: type }));
      // Optimistically increment
      setReviewsData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => {
          if (r._id === reviewId) {
            return {
              ...r,
              [type === 'helpful' ? 'helpfulCount' : 'unhelpfulCount']: (r[type === 'helpful' ? 'helpfulCount' : 'unhelpfulCount'] || 0) + 1
            };
          }
          return r;
        })
      }));
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Toggle Module Accordion
  const toggleModule = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Expand / Collapse all modules
  const toggleAllModules = () => {
    const allExpanded = course?.modules?.every(m => expandedModules[m._id]);
    const newState = {};
    course?.modules?.forEach(m => {
      newState[m._id] = !allExpanded;
    });
    setExpandedModules(newState);
  };

  // Copy share link
  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Coupon handling
  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.post('/payments/validate-coupon', {
        code: couponCode.trim(),
        courseId: course._id,
      });
      setCouponData(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/courses/${slug}`;
      return;
    }

    if (course.price === 0) {
      processFreeEnrollment();
      return;
    }

    setProcessingPayment(true);
    try {
      const orderPayload = {
        courseId: course._id,
        couponCode: couponData?.code || couponCode?.trim() || undefined,
      };
      const res = await api.post('/payments/create-order', orderPayload);
      const orderInfo = res.data;
      setActiveOrderData(orderInfo);

      const rzpKey = orderInfo.key || orderInfo.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TXrmSOvTmddOrM';

      const isLoaded = await loadRazorpayScript();
      if (isLoaded && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: rzpKey,
          amount: orderInfo.amount,
          currency: orderInfo.currency || 'INR',
          name: 'SkillPulse Learning Platform',
          description: `Enrollment in ${course.title}`,
          order_id: orderInfo.orderId,
          handler: async function (response) {
            await handleVerifyPayment(response, orderInfo);
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: '#4f46e5',
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
            },
          },
        };

        const razorpayWindow = new window.Razorpay(options);
        razorpayWindow.on('payment.failed', function (resp) {
          alert(`Payment failed: ${resp.error?.description || 'Payment was declined'}`);
          setProcessingPayment(false);
        });
        razorpayWindow.open();
      } else {
        // Fallback: Open interactive Razorpay checkout modal
        setShowCheckoutModal(true);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      alert(err.response?.data?.message || 'Failed to initiate Razorpay checkout');
      setProcessingPayment(false);
    }
  };

  const processFreeEnrollment = async () => {
    setEnrolling(true);
    try {
      const res = await api.post('/enrollments', { courseId: course._id });
      setEnrollment(res.data);
      setViewMode('classroom');
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyPayment = async (razorpayResponse, orderInfo) => {
    setVerifyingPayment(true);
    try {
      const verifyRes = await api.post('/payments/verify-payment', {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        courseId: course._id,
      });

      setPaymentDetails(verifyRes.data);
      setShowPaymentSuccess(true);
      setShowCheckoutModal(false);
      await fetchUserEnrollment();
      await fetchCourseData();
    } catch (err) {
      console.error('Verification error:', err);
      alert(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setVerifyingPayment(false);
      setProcessingPayment(false);
    }
  };

  const handleMarkComplete = async (lessonId) => {
    if (!enrollment) return;
    setCompletingLesson(true);
    try {
      const res = await api.post('/enrollments/complete-lesson', {
        courseId: course._id,
        lessonId,
      });
      setEnrollment(res.data);

      if (res.data.progressPercent >= 100 && res.data.certificateStatus !== 'revoked') {
        setCertificateData({
          certificateId: res.data.certificateId || `CERT-${new Date().getFullYear()}-AWARD`,
          studentName: user.name || 'Student',
          courseTitle: course.title,
          instructorName: course.instructor?.name || 'Lead Instructor',
          issueDate: res.data.completedAt || new Date(),
          certificateStatus: res.data.certificateStatus || 'active',
          certificateRevokedReason: res.data.certificateRevokedReason || '',
        });
      }
    } catch (err) {
      console.error('Failed to update lesson completion', err);
    } finally {
      setCompletingLesson(false);
    }
  };

  const handleNextLesson = () => {
    if (!course?.modules || !activeLesson) return;
    let foundCurrent = false;

    for (const mod of course.modules) {
      if (mod.lessons) {
        for (const les of mod.lessons) {
          if (foundCurrent) {
            setActiveLesson(les);
            return;
          }
          if (les._id === activeLesson._id) {
            foundCurrent = true;
          }
        }
      }
    }
  };

  const handleOpenCertificate = () => {
    if (enrollment?.certificateStatus === 'revoked') {
      alert(`This certificate was revoked: ${enrollment?.certificateRevokedReason || 'Revoked by instructor or administrator.'}`);
      return;
    }
    setCertificateData({
      certificateId: enrollment?.certificateId || `CERT-${new Date().getFullYear()}-AWARD`,
      studentName: user?.name || 'Student',
      courseTitle: course?.title,
      instructorName: course?.instructor?.name || 'Lead Instructor',
      issueDate: enrollment?.completedAt || enrollment?.updatedAt || new Date(),
      certificateStatus: enrollment?.certificateStatus || 'active',
      certificateRevokedReason: enrollment?.certificateRevokedReason || '',
    });
    setShowCertificate(true);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-medium">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 px-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Course Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">The requested course catalog entry could not be found.</p>
          <Link href="/courses" className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-500 transition">
            Explore All Courses
          </Link>
        </div>
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const completedLessons = enrollment?.completedLessons || [];
  const isLessonCompleted = activeLesson && completedLessons.some((id) => String(id?._id || id) === String(activeLesson._id));
  const isCourseFinished = enrollment?.progressPercent >= 100 || enrollment?.isCompleted;

  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0) || 0;
  
  // Real duration calculation from actual lesson data
  const totalDurationMinutes = course.modules?.reduce((sum, m) => {
    return sum + (m.lessons ? m.lessons.reduce((sub, l) => sub + (Number(l.duration) || 0), 0) : 0);
  }, 0) || 0;

  const durationHours = Math.floor(totalDurationMinutes / 60);
  const durationRemainderMins = totalDurationMinutes % 60;
  const durationFormatted = totalDurationMinutes > 0 
    ? `${durationHours > 0 ? `${durationHours}h ` : ''}${durationRemainderMins}m total length`
    : `${totalLessons} ${totalLessons === 1 ? 'lecture' : 'lectures'}`;

  const completedCount = completedLessons.length;
  const currentProgressPercent = enrollment?.progressPercent || 0;



  // Real Pricing: only show discount if originalPrice > price and not expired
  const isOfferExpired = course?.offerExpiresAt && (timeLeft.isExpired || new Date(course.offerExpiresAt) < new Date());
  const hasDiscount = Boolean(course?.originalPrice && course.originalPrice > course.price && !isOfferExpired);
  const discountPercent = hasDiscount ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;

  // Coupon discount calculations
  let couponDiscountAmount = 0;
  if (couponData) {
    if (typeof couponData.discountAmount === 'number') {
      couponDiscountAmount = couponData.discountAmount;
    } else if (couponData.discountPercent) {
      couponDiscountAmount = Math.round((course.price * couponData.discountPercent) / 100);
    }
  }
  const effectivePrice = Math.max(0, course.price - couponDiscountAmount);

  // Filter active coupons from DB applicable to this specific course
  const applicableActiveCoupons = availableCoupons.filter((c) => {
    if (c.applicableTo === 'all') return true;
    if (c.courses && Array.isArray(c.courses)) {
      return c.courses.some(id => String(typeof id === 'object' ? id._id : id) === String(course?._id));
    }
    return false;
  });

  // Find first preview lesson if available
  const firstPreviewLesson = course.modules?.flatMap(m => m.lessons || []).find(l => l.isFreePreview);

  // Real Review Metrics (STRICT: no fake fallbacks)
  const hasReviews = reviewsData.totalReviews > 0 || (course.reviewsCount > 0 && course.rating > 0);
  const ratingAvg = reviewsData.totalReviews > 0 ? reviewsData.averageRating : (course.rating > 0 ? course.rating : null);
  const ratingCount = reviewsData.totalReviews || course.reviewsCount || 0;
  const actualStudentsCount = course.studentsCount || 0;

  // Real Instructor Stats from DB
  const instructorStats = course.instructorStats || {
    totalCourses: 0,
    totalStudents: 0,
    totalReviews: 0,
    instructorRating: 0,
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-500 selection:text-white pb-24">
      
      {/* =========================================================================
          IF ENROLLED & USER CLICKED "CLASSROOM MODE": RENDER ACTIVE VIDEO PLAYER
          ========================================================================= */}
      {viewMode === 'classroom' && isEnrolled ? (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <button
              onClick={() => setViewMode('landing')}
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Overview & Details</span>
            </button>
            <div className="text-xs font-bold text-slate-500 flex items-center gap-3">
              <span>{completedCount} of {totalLessons} lectures completed ({currentProgressPercent}%)</span>
              {isCourseFinished && (
                enrollment?.certificateStatus === 'revoked' ? (
                  <span
                    className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    title={enrollment?.certificateRevokedReason || 'Certificate revoked by instructor'}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Certificate Revoked</span>
                  </span>
                ) : (
                  <button
                    onClick={handleOpenCertificate}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>View Certificate</span>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {activeLesson ? (
                <div>
                  {(activeLesson.contentType === 'video' || (!activeLesson.documentUrl && activeLesson.contentType !== 'text' && activeLesson.contentType !== 'article' && activeLesson.videoUrl)) ? (
                    <AdvancedVideoPlayer
                      lesson={activeLesson}
                      courseId={course._id}
                      isEnrolled={isEnrolled}
                      isCompleted={isLessonCompleted}
                      onMarkComplete={handleMarkComplete}
                      onNextLesson={handleNextLesson}
                      onTimeUpdate={(sec) => setCurrentPlaybackSeconds(sec)}
                      playerRef={videoPlayerRef}
                    />
                  ) : (activeLesson.contentType === 'document' || activeLesson.contentType === 'pdf' || activeLesson.documentUrl) ? (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-bold text-slate-900">{activeLesson.title}</h2>
                        {activeLesson.documentUrl && (
                          <a href={activeLesson.documentUrl} download target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow">
                            <Download className="w-4 h-4" />
                            <span>Download Resource</span>
                          </a>
                        )}
                      </div>
                      {activeLesson.documentUrl && (
                        <iframe src={`${activeLesson.documentUrl}#toolbar=1`} className="w-full h-[600px] rounded-2xl border" title={activeLesson.title} />
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4">
                      <h1 className="text-2xl font-bold text-slate-900">{activeLesson.title}</h1>
                      <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">{activeLesson.content}</div>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-600">Current Lecture</span>
                      <h3 className="text-sm font-bold text-slate-900">{activeLesson.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkComplete(activeLesson._id)}
                        disabled={completingLesson}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                          isLessonCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                      >
                        {isLessonCompleted ? 'Completed ✓' : 'Mark as Complete'}
                      </button>
                      <button
                        id="open-ask-video-btn"
                        onClick={() => setClassroomTab('ask_video')}
                        className={`px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                          classroomTab === 'ask_video'
                            ? 'bg-fuchsia-600 text-white shadow-fuchsia-500/20'
                            : 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200'
                        }`}
                        title="Ask the Video with AI Semantic Jump"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Ask Video</span>
                      </button>
                      <button
                        id="open-sandbox-btn"
                        onClick={() => setShowClassroomSandbox(true)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                        title="Open in-browser interactive code sandbox"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Sandbox</span>
                      </button>
                      <button
                        id="open-quiz-btn"
                        onClick={() => setShowQuiz(true)}
                        className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        title="Take the quiz for this lesson"
                      >
                        📝 Quiz
                      </button>
                      <button onClick={handleNextLesson} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer">
                        Next →
                      </button>
                    </div>
                  </div>

                  {/* Classroom Sub-Tabs Bar: Ask Video | Notes & Bookmarks | Discussions */}
                  <div className="mt-6 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <button
                      onClick={() => setClassroomTab('ask_video')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        classroomTab === 'ask_video'
                          ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-md shadow-fuchsia-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask the Video (AI Jump)</span>
                    </button>
                    <button
                      onClick={() => setClassroomTab('notes')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        classroomTab === 'notes'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Notes & Bookmarks</span>
                    </button>
                    <button
                      onClick={() => setClassroomTab('discussion')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        classroomTab === 'discussion'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Q&A Discussion</span>
                    </button>
                  </div>

                  {/* Tab 1: Ask the Video Widget */}
                  {classroomTab === 'ask_video' && (
                    <div className="mt-4">
                      <AskVideoWidget
                        lesson={activeLesson}
                        course={course}
                        currentPlaybackSeconds={currentPlaybackSeconds}
                        onSeekVideo={(secs) => {
                          if (videoPlayerRef.current?.seekTo) {
                            videoPlayerRef.current.seekTo(secs);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Tab 2: Personal Notes & Lesson Bookmarks Panel */}
                  {classroomTab === 'notes' && (
                    <div className="mt-4">
                      <LessonNotesBookmarks
                        lesson={activeLesson}
                        course={course}
                        currentPlaybackSeconds={currentPlaybackSeconds}
                        onSeekVideo={(secs) => {
                          if (videoPlayerRef.current?.seekTo) {
                            videoPlayerRef.current.seekTo(secs);
                          }
                        }}
                        onSelectLesson={(bLesson) => {
                          setActiveLesson(bLesson);
                        }}
                      />
                    </div>
                  )}

                  {/* Tab 3: Per-Lesson Discussion Forum Q&A Thread */}
                  {classroomTab === 'discussion' && (
                    <div className="mt-4">
                      <LessonDiscussion lesson={activeLesson} course={course} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>


            {/* In-Browser Interactive Code Sandbox Modal (Classroom Mode) */}
            {showClassroomSandbox && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
                <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950">
                  <CodeSandbox
                    isEmbedded={true}
                    onClose={() => setShowClassroomSandbox(false)}
                    topicTitle={activeLesson ? `${activeLesson.title} - Sandbox` : 'Classroom Code Lab'}
                    initialLanguage="web"
                  />
                </div>
              </div>
            )}

            {/* Quiz Player Modal */}
            {showQuiz && activeLesson && (
              <QuizPlayer
                lessonId={activeLesson._id}
                userId={user?._id}
                onClose={() => setShowQuiz(false)}
              />
            )}


            {/* Classroom Playlist */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 h-fit max-h-[750px] overflow-y-auto">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Course Content</h3>
              <div className="space-y-3">
                {course.modules?.map((mod, mi) => (
                  <div key={mod._id} className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 uppercase">Section {mi + 1}: {mod.title}</div>
                    <div className="space-y-1 pl-2">
                      {mod.lessons?.map((les) => {
                        const isDone = completedLessons.some((id) => String(id?._id || id) === String(les._id));
                        const isSelected = activeLesson?._id === les._id;
                        return (
                          <button
                            key={les._id}
                            onClick={() => setActiveLesson(les)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                              isSelected ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-200/70 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                              <span className="truncate">{les.title}</span>
                            </div>
                            <span className="text-[10px] opacity-70 shrink-0 ml-2">{les.duration || 10}m</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (

        /* =========================================================================
            REAL DATA COURSE LANDING SHOWCASE (Strictly driven by Database)
            ========================================================================= */
        <div>
          {/* Top Dark Hero Banner */}
          <section className="bg-[#1c1d1f] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-10 relative">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left 2 Cols: Title, Subtitle, Ratings, Instructor, Meta */}
              <div className="lg:col-span-2 space-y-4 z-10">
                
                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-400 mb-2">
                  <Link href="/courses" className="hover:underline text-slate-300">Courses</Link>
                  <span className="text-slate-500">/</span>
                  <span className="capitalize">{course.category || 'General'}</span>
                  <span className="text-slate-500">/</span>
                  <span className="capitalize">{course.level || 'Beginner'}</span>
                </div>

                {/* Course Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white font-heading">
                  {course.title}
                </h1>

                {/* Subtitle (only if provided in database) */}
                {course.subtitle && (
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
                    {course.subtitle}
                  </p>
                )}

                {/* Ratings & Students Row (Strictly Real) */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  {/* Bestseller Badge: Only show if explicitly marked */}
                  {(course.isBestseller || course.badge) && (
                    <span className="px-2.5 py-1 rounded bg-[#eceb98] text-[#3d3c0a] font-extrabold text-[11px] uppercase tracking-wider">
                      {course.badge || 'Bestseller'}
                    </span>
                  )}

                  {/* Real Star Rating */}
                  {hasReviews ? (
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <span className="text-sm font-black">{ratingAvg}</span>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                        ))}
                      </div>
                      <a href="#reviews-section" className="text-indigo-400 underline font-semibold cursor-pointer">
                        ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-slate-500" />
                      <span>Not yet rated</span>
                    </span>
                  )}

                  <span className="text-slate-400">•</span>
                  <span className="text-white font-semibold">
                    {actualStudentsCount} {actualStudentsCount === 1 ? 'student' : 'students'}
                  </span>
                </div>

                {/* Created By */}
                <div className="text-xs text-slate-300 pt-1">
                  <span>Created by </span>
                  <a href="#instructor-section" className="text-indigo-400 font-bold underline hover:text-indigo-300">
                    {course.instructor?.name || 'Instructor'}
                  </a>
                  {course.instructor?.isVerified && (
                    <span className="inline-flex items-center gap-1 ml-2 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Creator</span>
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-300 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Last updated {new Date(course.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>{course.language || 'English'}</span>
                  </div>
                </div>

                {/* Enrolled Learner Direct Continue Banner */}
                {isEnrolled && (
                  <div className="mt-4 p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">You are enrolled in this course</span>
                        <span className="text-[11px] text-slate-300">{currentProgressPercent}% completed • {completedCount} of {totalLessons} lectures</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewMode('classroom')}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <span>Continue Learning</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column Desktop: Empty placeholder spacer for the Sticky Floating Card */}
              <div className="hidden lg:block lg:col-span-1" />

            </div>
          </section>

          {/* Main Body Container with Sticky Floating Purchase Card */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left 2 Columns: Main Content Sections */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* SECTION 1: "What you'll learn" Box (Only if provided in database) */}
              {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    What you'll learn
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {course.whatYouWillLearn.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIVE SESSIONS & TELECASTS SECTION (When available) */}
              {liveSessions && liveSessions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                          Live Classes & Telecasts
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Interactive real-time lectures and Q&A sessions hosted by the instructor
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
                      {liveSessions.length} {liveSessions.length === 1 ? 'Session' : 'Sessions'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {liveSessions.map((ls) => {
                      const isSessionLive = ls.status === 'live';
                      const isSessionScheduled = ls.status === 'scheduled';

                      return (
                        <div
                          key={ls._id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isSessionLive
                              ? 'bg-rose-50/40 border-rose-200 shadow-md shadow-rose-500/5'
                              : 'bg-white border-slate-200/90 hover:border-indigo-200 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                {isSessionLive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
                                    <Radio className="w-3 h-3" />
                                    HAPPENING NOW
                                  </span>
                                ) : isSessionScheduled ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    Upcoming Live Class
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    Past Session
                                  </span>
                                )}

                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {new Date(ls.scheduledStartTime).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-slate-900 truncate">
                                {ls.title}
                              </h3>

                              {ls.description && (
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                  {ls.description}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isEnrolled ? (
                                <Link
                                  href={`/live/${ls._id}`}
                                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm ${
                                    isSessionLive
                                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/20'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                  }`}
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span>{isSessionLive ? 'Join Live Telecast' : 'Open Live Room'}</span>
                                </Link>
                              ) : (
                                <button
                                  onClick={handleEnroll}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Enroll to Watch Live</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: Course Content / Curriculum Accordion */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                      Course content
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {totalModules} {totalModules === 1 ? 'section' : 'sections'} • {totalLessons} {totalLessons === 1 ? 'lecture' : 'lectures'}
                      {totalDurationMinutes > 0 ? ` • ${durationFormatted}` : ''}
                    </p>
                  </div>
                  {course.modules && course.modules.length > 0 && (
                    <button
                      onClick={toggleAllModules}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer self-start sm:self-auto"
                    >
                      {course.modules?.every(m => expandedModules[m._id]) ? 'Collapse all sections' : 'Expand all sections'}
                    </button>
                  )}
                </div>

                {/* Modules Accordion List */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 bg-white shadow-xs">
                  {course.modules && course.modules.length > 0 ? (
                    course.modules.map((mod, idx) => {
                      const isExpanded = !!expandedModules[mod._id];
                      const modLessons = mod.lessons || [];
                      const modDuration = modLessons.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);

                      return (
                        <div key={mod._id} className="transition">
                          {/* Module Header Toggle Button */}
                          <button
                            onClick={() => toggleModule(mod._id)}
                            className="w-full px-5 py-4 bg-slate-50/80 hover:bg-slate-100/80 transition flex items-center justify-between text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {mod.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 shrink-0 pl-3">
                              {modLessons.length} {modLessons.length === 1 ? 'lecture' : 'lectures'}
                              {modDuration > 0 ? ` • ${modDuration}m` : ''}
                            </div>
                          </button>

                          {/* Lessons inside Section */}
                          {isExpanded && (
                            <div className="divide-y divide-slate-100 bg-white">
                              {modLessons.map((les) => (
                                <div
                                  key={les._id}
                                  className="px-5 py-3 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-4">
                                    {les.contentType === 'video' ? (
                                      <PlayCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                    ) : les.contentType === 'document' ? (
                                      <FileDown className="w-4 h-4 text-amber-500 shrink-0" />
                                    ) : (
                                      <AlignLeft className="w-4 h-4 text-indigo-400 shrink-0" />
                                    )}
                                    <span className="text-slate-800 font-medium truncate">{les.title}</span>
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0">
                                    {/* Preview Button (Free preview lesson) */}
                                    {les.isFreePreview ? (
                                      <button
                                        onClick={() => setPreviewModalLesson(les)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                      >
                                        Preview
                                      </button>
                                    ) : null}
                                    {les.duration ? (
                                      <span className="text-slate-400 font-mono text-[11px]">
                                        {les.duration}:00
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No curriculum sections added yet.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Requirements (Only if provided in database) */}
              {course.requirements && course.requirements.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
                    Requirements
                  </h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {course.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION 4: Description */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
                  Description
                </h2>
                <div className="prose max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </div>
              </div>

              {/* SECTION 5: Instructors / Tutor Details (Strictly from DB) */}
              <div id="instructor-section" className="space-y-4 pt-4 border-t border-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  Instructor
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-600">
                      {course.instructor?.name || 'Instructor'}
                    </h3>
                    {course.instructor?.headline ? (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {course.instructor.headline}
                      </p>
                    ) : null}
                  </div>

                  {/* Avatar & Real Stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-extrabold uppercase shrink-0 shadow-md">
                      {course.instructor?.avatar ? (
                        <img src={course.instructor.avatar} alt={course.instructor.name} className="w-full h-full object-cover" />
                      ) : (
                        course.instructor?.name?.charAt(0) || 'I'
                      )}
                    </div>

                    {/* Real Stats Grid */}
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="font-semibold">
                          {instructorStats.instructorRating > 0 ? `${instructorStats.instructorRating} Instructor Rating` : 'Not yet rated'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-semibold">
                          {instructorStats.totalReviews > 0 
                            ? `${instructorStats.totalReviews} ${instructorStats.totalReviews === 1 ? 'Review' : 'Reviews'}` 
                            : 'No reviews'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-semibold">
                          {instructorStats.totalStudents > 0 
                            ? `${instructorStats.totalStudents} ${instructorStats.totalStudents === 1 ? 'Student' : 'Students'}` 
                            : '0 Students'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold">
                          {instructorStats.totalCourses > 0 
                            ? `${instructorStats.totalCourses} ${instructorStats.totalCourses === 1 ? 'Course' : 'Courses'}` 
                            : '0 Courses'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real Tutor Biography */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {course.instructor?.bio ? (
                      <div className="space-y-2">
                        <p className={showFullBio ? '' : 'line-clamp-4'}>{course.instructor.bio}</p>
                        {course.instructor.bio.length > 250 && (
                          <button
                            onClick={() => setShowFullBio(!showFullBio)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                          >
                            {showFullBio ? 'Show less ▴' : 'Show more ▾'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No biography provided yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 6: Student Feedback & Reviews (Strictly Real) */}
              <div id="reviews-section" className="space-y-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    {hasReviews 
                      ? `${ratingAvg} course rating • ${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}` 
                      : 'Student Feedback & Reviews'}
                  </h2>
                </div>

                {/* Rating Breakdown Bars: Only if real reviews exist */}
                {hasReviews && (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const pct = reviewsData.distribution?.[stars] || 0;
                      return (
                        <div key={stars} className="flex items-center sm:flex-col gap-2">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 w-12 sm:w-auto">
                            <span>{stars}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Write a Review Box for Enrolled Students */}
                {isEnrolled && (
                  <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm">Leave Your Rating & Review</h3>
                    {reviewNotice && (
                      <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{reviewNotice}</span>
                      </div>
                    )}
                    <form onSubmit={handleAddReviewSubmit} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Your Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setUserReviewRating(s)}
                              className="p-1 cursor-pointer focus:outline-none"
                            >
                              <Star className={`w-5 h-5 ${s <= userReviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        required
                        rows={3}
                        placeholder="Tell future students about your learning experience..."
                        value={userReviewComment}
                        onChange={(e) => setUserReviewComment(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                      >
                        {submittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Real Reviews List or Empty State */}
                {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {reviewsData.reviews.map((rev) => (
                      <div key={rev._id} className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center uppercase shrink-0">
                            {rev.student?.name ? rev.student.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{rev.student?.name || 'Student'}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {rev.createdAt ? `${Math.max(1, Math.floor((Date.now() - new Date(rev.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} days ago` : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {rev.comment}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-500">
                          <span>Helpful?</span>
                          <button
                            onClick={() => handleVoteReview(rev._id, 'helpful')}
                            className={`flex items-center gap-1 hover:text-indigo-600 transition cursor-pointer ${votedReviews[rev._id] === 'helpful' ? 'text-indigo-600 font-bold' : ''}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{rev.helpfulCount || 0}</span>
                          </button>
                          <button
                            onClick={() => handleVoteReview(rev._id, 'unhelpful')}
                            className={`flex items-center gap-1 hover:text-rose-600 transition cursor-pointer ${votedReviews[rev._id] === 'unhelpful' ? 'text-rose-600 font-bold' : ''}`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <h4 className="font-bold text-slate-800 text-sm">No reviews yet for this course</h4>
                    <p className="text-xs text-slate-500">
                      {isEnrolled
                        ? 'Be the first student to share your review and feedback!'
                        : 'Enroll now to review this course after learning.'}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Floating Sticky Purchase & Preview Card */}
            <div className="lg:col-span-1">
              <div className="lg:-mt-72 lg:sticky lg:top-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden z-20 space-y-6">
                
                {/* Course Video Preview Box */}
                <div 
                  onClick={() => {
                    if (firstPreviewLesson) {
                      setPreviewModalLesson(firstPreviewLesson);
                    } else if (course.modules?.[0]?.lessons?.[0]) {
                      setPreviewModalLesson(course.modules[0].lessons[0]);
                    }
                  }}
                  className="relative aspect-video w-full bg-slate-900 group cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-85"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 flex flex-col items-center justify-center p-6 text-center">
                      <BookOpen className="w-10 h-10 text-indigo-400 mb-2 opacity-80" />
                      <span className="text-xs font-bold text-slate-300 line-clamp-1">{course.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white gap-2 group-hover:bg-black/30 transition">
                    <div className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
                      <Play className="w-6 h-6 fill-slate-900 translate-x-0.5" />
                    </div>
                    <span className="text-xs font-bold tracking-wide drop-shadow-md">Preview this course</span>
                  </div>
                </div>

                {/* Card Content: Price, Buy Now, Features */}
                <div className="p-6 space-y-5">
                  
                  {/* Real Pricing Details */}
                  <div className="space-y-3">
                    {hasDiscount && (
                      <div className="p-3 bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl border border-rose-200/70 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider shadow-xs">
                            <Sparkles className="w-3 h-3" />
                            <span>{course.offerBadgeText || 'Special Offer Deal'}</span>
                          </span>
                          <span className="text-xs font-black text-rose-700">
                            Save ₹{(course.originalPrice - course.price).toLocaleString('en-IN')} ({discountPercent}% OFF)
                          </span>
                        </div>
                        {course.offerExpiresAt && !isOfferExpired && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 pt-1.5 border-t border-rose-100">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                            <span>
                              Deal ends in: {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-slate-900 font-heading">
                        {course.price > 0 ? (
                          couponDiscountAmount > 0 ? (
                            `₹${effectivePrice.toLocaleString('en-IN')}`
                          ) : (
                            `₹${course.price.toLocaleString('en-IN')}`
                          )
                        ) : 'Free'}
                      </span>
                      {course.price > 0 && (hasDiscount || couponDiscountAmount > 0) && (
                        <span className="text-sm font-semibold text-slate-400 line-through">
                          ₹{(hasDiscount ? course.originalPrice : course.price).toLocaleString('en-IN')}
                        </span>
                      )}
                      {couponDiscountAmount > 0 ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          {couponData?.savingsText || `${couponData?.discountPercent || ''}% off with coupon`}
                        </span>
                      ) : hasDiscount ? (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {discountPercent}% off
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions: Buy Now / Go to Classroom */}
                  <div className="space-y-2.5">
                    {isEnrolled ? (
                      <button
                        onClick={() => setViewMode('classroom')}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Go to Classroom</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleEnroll}
                          disabled={enrolling || processingPayment}
                          className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {course.price > 0 ? 'Buy now' : (enrolling ? 'Enrolling...' : 'Enroll in Free Course')}
                          </span>
                        </button>
                        {course.price > 0 && (
                          isInCart(course._id) ? (
                            <Link
                              href="/cart"
                              className="w-full py-3 px-6 border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition text-sm cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>Go to cart</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                addToCart(course);
                                setShowCartToast(true);
                                setTimeout(() => setShowCartToast(false), 4500);
                              }}
                              className="w-full py-3 px-6 border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-extrabold rounded-2xl transition text-sm cursor-pointer flex items-center justify-center gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>Add to cart</span>
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {/* Money Back Guarantee */}
                  <p className="text-[11px] text-center text-slate-500">
                    30-day money-back guarantee
                  </p>

                  {/* Coupon & Promotional Code (Udemy Style) */}
                  {!isEnrolled && course.price > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                          Promotions
                        </span>
                        <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Special Offer</span>
                        </span>
                      </div>

                      {couponData ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 font-mono">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{couponData.code} APPLIED</span>
                            </span>
                            <p className="text-[11px] font-bold text-emerald-700">
                              {couponData.savingsText || `${couponData.discountPercent}% coupon savings`}
                            </p>
                            {couponData.description && (
                              <p className="text-[10px] text-emerald-600">
                                {couponData.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-xs text-slate-400 hover:text-rose-600 transition font-bold p-1 rounded-lg hover:bg-emerald-100/50 cursor-pointer"
                            title="Remove coupon"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter Promo Code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => applyCoupon(couponCode)}
                              disabled={couponLoading || !couponCode.trim()}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                            >
                              {couponLoading ? 'Applying...' : 'Apply'}
                            </button>
                          </div>

                          {/* Quick Coupon Suggestions - only if real coupons exist in DB */}
                          {applicableActiveCoupons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {applicableActiveCoupons.map((promo) => (
                                <button
                                  key={promo._id || promo.code}
                                  type="button"
                                  onClick={() => applyCoupon(promo.code)}
                                  disabled={couponLoading}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 text-[10px] font-bold transition cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                  <span className="font-mono">{promo.code}</span>
                                  <span className="text-[9px] text-indigo-500 font-normal">
                                    ({promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`})
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {couponError && (
                        <div className="p-2 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-1.5 text-[10px] text-rose-600 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{couponError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Course Features Checklist */}
                  <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block text-xs">This course includes:</span>
                    {totalDurationMinutes > 0 && (
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{durationHours > 0 ? `${durationHours} hours` : `${totalDurationMinutes} mins`} of video lessons</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{totalLessons} lessons & learning resources</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Access on mobile and desktop</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Infinity className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Certificate of completion</span>
                    </div>
                  </div>

                  {/* Share Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <button
                      onClick={handleCopyShareLink}
                      className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Link Copied!' : 'Share Course'}</span>
                    </button>
                    {course.price > 0 && (
                      <button
                        onClick={() => {
                          const code = prompt('Enter coupon promo code (e.g. EARLYBIRD20):');
                          if (code) {
                            setCouponCode(code);
                            handleApplyCoupon();
                          }
                        }}
                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                      >
                        <span>Apply Coupon</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE FREE VIDEO PREVIEW MODAL
          ========================================================================= */}
      {previewModalLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 text-white border border-slate-800 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Course Preview Lecture</span>
                <h3 className="text-base font-bold text-white">{previewModalLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewModalLesson(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black aspect-video">
              <AdvancedVideoPlayer
                lesson={previewModalLesson}
                courseId={course._id}
                isEnrolled={false}
                isCompleted={false}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Free preview from <strong>{course.title}</strong></span>
              {!isEnrolled && (
                <button
                  onClick={() => {
                    setPreviewModalLesson(null);
                    handleEnroll();
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Enroll Now to Unlock All Lectures
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal */}
      {showCheckoutModal && activeOrderData && (
        <RazorpayCheckoutModal
          isOpen={showCheckoutModal}
          orderData={activeOrderData}
          course={course}
          user={user}
          onClose={() => setShowCheckoutModal(false)}
          onPaymentSuccess={async (simulatedResponse) => {
            await handleVerifyPayment(simulatedResponse, activeOrderData);
          }}
          onPaymentFailure={(err) => {
            alert(err?.message || 'Payment failed');
          }}
        />
      )}

      {/* Certificate Modal */}
      {showCertificate && certificateData && (
        <CertificateModal
          certificate={certificateData}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center border border-slate-200 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Enrollment Confirmed!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your payment was processed successfully. You now have lifetime access to <strong>{course.title}</strong>.
            </p>
            {paymentDetails?.paymentId && (
              <p className="text-[11px] text-slate-500 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100 font-mono">
                Transaction ID: <span className="font-semibold text-slate-800">{paymentDetails.paymentId}</span>
              </p>
            )}
            <button
              onClick={() => {
                setShowPaymentSuccess(false);
                setViewMode('classroom');
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Start Learning in Classroom Now
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification when item is added to cart */}
      {showCartToast && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white">Course added to cart!</p>
            <p className="text-[11px] text-slate-400 truncate">{course?.title}</p>
          </div>
          <Link
            href="/cart"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
          >
            View Cart
          </Link>
          <button
            onClick={() => setShowCartToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
