import Link from 'next/link';
import { Users, BookOpen, Star, ArrowRight, Sparkles } from 'lucide-react';

export default function CourseCard({ course }) {
  const isFree = !course.price || course.price === 0;
  const isOfferExpired = course.offerExpiresAt && new Date(course.offerExpiresAt) < new Date();
  const hasDiscount = Boolean(course.originalPrice && course.originalPrice > course.price && !isOfferExpired);
  const discountPercent = hasDiscount ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;

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

        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[65%]">
          {hasDiscount && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white shadow-sm uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{discountPercent}% OFF</span>
            </span>
          )}
          {course.isOfferActive && course.offerBadgeText && !hasDiscount && (
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

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-sm ${
            isFree 
              ? 'bg-emerald-500/90 text-white' 
              : hasDiscount
                ? 'bg-slate-900/90 text-white font-extrabold'
                : 'bg-white/90 text-indigo-900 font-extrabold'
          }`}>
            {isFree ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
          </span>
          {hasDiscount && (
            <span className="text-[10px] font-semibold text-white/80 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full line-through">
              ₹{course.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium mb-1.5">
          {course.reviewsCount > 0 && course.rating > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-500">{course.rating}</span>
              <span className="text-slate-400 font-normal">({course.reviewsCount} {course.reviewsCount === 1 ? 'review' : 'reviews'})</span>
            </>
          ) : (
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Star className="w-3 h-3 text-slate-300" />
              <span>No reviews yet</span>
            </span>
          )}
        </div>

        <h3 className="font-heading font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
          {course.title}
        </h3>

        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">
          {course.description || 'Master key concepts with structured modules, real-world projects, and hands-on exercises.'}
        </p>

        {/* Pricing Summary */}
        <div className="mt-3.5 flex items-baseline gap-2">
          {isFree ? (
            <span className="text-emerald-600 font-extrabold text-sm">Free Course</span>
          ) : hasDiscount ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-900 font-extrabold text-base">
                ₹{course.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 line-through">
                ₹{course.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                {discountPercent}% OFF
              </span>
            </div>
          ) : (
            <span className="text-slate-900 font-extrabold text-base">
              ₹{course.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>{course.studentsCount || 0} Learners</span>
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
