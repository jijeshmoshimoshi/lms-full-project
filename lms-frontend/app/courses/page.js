'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import CourseCard from '../../components/CourseCard';
import { Search, BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses').then((res) => res.data).catch(() => []),
      api.get('/coupons/active').then((res) => res.data?.coupons || []).catch(() => [])
    ])
      .then(([coursesData, couponsData]) => {
        setCourses(coursesData);
        setCoupons(couponsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter((c) => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            Explore All Courses
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
            Choose from industry-leading courses designed to help you gain in-demand skills and advance your career.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition"
          />
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-80">
              <div className="bg-slate-200 h-40 rounded-xl mb-4" />
              <div className="bg-slate-200 h-5 w-3/4 rounded mb-2" />
              <div className="bg-slate-200 h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="glass-card text-center py-16 px-6 rounded-2xl max-w-md mx-auto my-12 border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Courses Found</h3>
          <p className="text-slate-500 text-sm">
            {searchTerm ? `No courses matching "${searchTerm}"` : 'No published courses available yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <CourseCard key={c._id} course={c} coupons={coupons} />
          ))}
        </div>
      )}
    </div>
  );
}
