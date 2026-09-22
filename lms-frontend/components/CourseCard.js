import Link from 'next/link';
import { Users, BookOpen, Star, ArrowRight, Sparkles, Tag } from 'lucide-react';

export default function CourseCard({ course, coupons = [] }) {
  // Check if any active coupon is applicable to this course
  const applicableCoupon = coupons.find((c) => {
    if (!c.applicableTo || c.applicableTo === 'all') return true;
    if (c.courses && Array.isArray(c.courses)) {
      return c.courses.some((id) => {
        const idStr = String(typeof id === 'object' && id !== null ? (id._id || id) : id);
        return idStr === String(course._id);
      });
    }
    return false;
  });

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0) || 0;

  return (
    <Link 
      href={`/courses/${course.slug || course._id}`} 
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 overflow-hidden hover:-translate-y-1"
    >
      {/* Thumbnail or Gradient Banner */}
      <div className="relative h-44 w-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center overflow-hidden">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 group-hover:text-slate-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              {course.category || 'Professional Course'}
            </span>
          </div>
        )}

        {/* Top Badges (Coupon / Category / Level) */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[85%]">
          {applicableCoupon && (
            <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-indigo-600 text-white shadow-md uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
              <Tag className="w-3 h-3" />
              <span>{applicableCoupon.discountType === 'percentage' ? `${applicableCoupon.discountValue}% OFF` : `₹${applicableCoupon.discountValue} OFF`} ({applicableCoupon.code})</span>
            </span>
          )}
          {course.isOfferActive && course.offerBadgeText && !applicableCoupon && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 shadow-sm uppercase tracking-wider">
              {course.offerBadgeText}
            </span>
          )}
          {course.level && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-900/70 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
              {course.level}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between gap-1.5 text-xs font-medium mb-1.5">
          <div className="flex items-center gap-1">
            {course.reviewsCount > 0 && course.rating > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-500">{course.rating}</span>
                <span className="text-slate-400 font-normal">({course.reviewsCount} {course.reviewsCount === 1 ? 'review' : 'reviews'})</span>
              </>
            ) : (
              <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-slate-300" />
                <span>Not rated yet</span>
              </span>
            )}
          </div>

          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md capitalize">
            {course.category || 'General'}
          </span>
        </div>

        <h3 className="font-heading font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
          {course.title}
        </h3>

        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">
          {course.description || 'Master key concepts with structured modules, real-world projects, and hands-on exercises.'}
        </p>

        {/* Card Footer */}
        <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2.5 font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{course.studentsCount || 0} Learners</span>
            </div>
            {totalLessons > 0 && (
              <div className="flex items-center gap-1 text-slate-400">
                <span>•</span>
                <span>{totalLessons} lessons</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
