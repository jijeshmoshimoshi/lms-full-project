'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Plus, Trash2, CheckCircle2, XCircle, Users, Sparkles,
  Filter, Layers, Clock, AlertTriangle, CreditCard, ArrowRight,
  ShieldAlert, AlertCircle, Send, CheckCircle, Eye, ShieldCheck,
  Search, Check, X, MessageSquare, ArrowUpRight, HelpCircle,
  ChevronDown, ChevronUp, LayoutList, GraduationCap, FolderKanban,
  Edit3
} from 'lucide-react';
import EditCourseModal from '../../components/EditCourseModal';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [instructorsList, setInstructorsList] = useState([]);
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending_approval' | 'approved' | 'draft_rejected'
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [viewLayout, setViewLayout] = useState('grouped'); // 'grouped' (default) | 'table'
  const [expandedInstructors, setExpandedInstructors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  // Quick Moderation Modal State (Admin)
  const [moderateCourse, setModerateCourse] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    originalPrice: 0,
    isOfferActive: false,
    offerBadgeText: 'Special Offer',
    currency: 'INR',
    platformSharePercent: 30,
    instructorSharePercent: 70,
    category: '',
    level: 'beginner'
  });

  const loadCourses = () => {
    setLoading(true);
    api.get('/courses?all=true')
      .then((res) => {
        const data = res.data || [];
        setCourses(data);

        // Extract unique instructors for admin dropdown
        if (user?.role === 'admin') {
          const map = {};
          data.forEach(c => {
            if (c.instructor && c.instructor._id) {
              map[c.instructor._id] = c.instructor;
            }
          });
          setInstructorsList(Object.values(map));
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  const loadAccountStatus = () => {
    api.get('/payments/account-status')
      .then((res) => setAccountStatus(res.data))
      .catch(() => setAccountStatus(null));
  };

  useEffect(() => {
    if (user) {
      loadCourses();
      loadAccountStatus();
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (user.role === 'instructor' && form.price > 0 && accountStatus?.payoutStatus !== 'active') {
      alert('You must complete Razorpay Route onboarding (active payout status) before publishing a paid course.');
      return;
    }

    if (Number(form.platformSharePercent) + Number(form.instructorSharePercent) !== 100) {
      alert('Platform Share and Instructor Share percentages must sum to 100%');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/courses', form);
      setForm({
        title: '',
        description: '',
        price: 0,
        originalPrice: 0,
        isOfferActive: false,
        offerBadgeText: 'Special Offer',
        currency: 'INR',
        platformSharePercent: 30,
        instructorSharePercent: 70,
        category: '',
        level: 'beginner'
      });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (courseId) => {
    setSubmittingReviewId(courseId);
    try {
      await api.put(`/courses/${courseId}/submit-review`);
      alert('Course successfully submitted for administrator review!');
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit course for review');
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const handleApproveFromModal = async (courseId) => {
    setModerating(true);
    try {
      await api.put(`/courses/${courseId}/approve`);
      setModerateCourse(null);
      setShowRejectInput(false);
      setRejectReason('');
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve course');
    } finally {
      setModerating(false);
    }
  };

  const handleRejectFromModal = async (courseId) => {
    if (!rejectReason.trim()) {
      alert('Please provide feedback or reason for requesting changes.');
      return;
    }
    setModerating(true);
    try {
      await api.put(`/courses/${courseId}/reject`, { reason: rejectReason.trim() });
      setModerateCourse(null);
      setShowRejectInput(false);
      setRejectReason('');
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request changes');
    } finally {
      setModerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      loadCourses();
    } catch (err) {
      alert('Failed to delete course');
    }
  };

  const isAdmin = user?.role === 'admin';

  const pendingCourses = courses.filter((c) => c.approvalStatus === 'pending_approval');
  const approvedCourses = courses.filter((c) => c.approvalStatus === 'approved');
  const draftCourses = courses.filter((c) => c.approvalStatus === 'draft' || c.approvalStatus === 'rejected' || !c.approvalStatus);

  const filteredCourses = courses.filter((c) => {
    // Status Filter
    if (statusFilter === 'pending_approval' && c.approvalStatus !== 'pending_approval') return false;
    if (statusFilter === 'approved' && c.approvalStatus !== 'approved') return false;
    if (statusFilter === 'draft_rejected' && !(c.approvalStatus === 'draft' || c.approvalStatus === 'rejected' || !c.approvalStatus)) return false;

    // Instructor Filter (Admin only)
    if (isAdmin && instructorFilter !== 'all') {
      const instId = c.instructor?._id || c.instructor;
      if (String(instId) !== String(instructorFilter)) return false;
    }

    // Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      const matchInstructor = c.instructor?.name?.toLowerCase().includes(q) || c.instructor?.email?.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchInstructor) return false;
    }

    return true;
  });

  // Group courses by instructor
  const groupedInstructors = filteredCourses.reduce((acc, c) => {
    const inst = c.instructor && (c.instructor._id || c.instructor.name)
      ? c.instructor
      : { _id: 'platform', name: 'Platform Admin / Direct', email: 'admin@skillpulse.com', role: 'admin' };
    const instId = String(inst._id || 'platform');

    if (!acc[instId]) {
      acc[instId] = {
        instructor: inst,
        courses: [],
        totalStudents: 0,
        pendingCount: 0,
        approvedCount: 0,
        draftCount: 0,
      };
    }
    acc[instId].courses.push(c);
    acc[instId].totalStudents += (c.studentsCount || 0);
    if (c.approvalStatus === 'pending_approval') acc[instId].pendingCount += 1;
    else if (c.approvalStatus === 'approved') acc[instId].approvedCount += 1;
    else acc[instId].draftCount += 1;
    return acc;
  }, {});

  const instructorGroups = Object.values(groupedInstructors);

  const toggleInstructor = (instId) => {
    setExpandedInstructors(prev => ({
      ...prev,
      [instId]: prev[instId] === false ? true : false,
    }));
  };

  const toggleAllInstructors = () => {
    const allExpanded = instructorGroups.every(g => expandedInstructors[g.instructor._id || 'platform'] !== false);
    const newState = {};
    instructorGroups.forEach(g => {
      const id = g.instructor._id || 'platform';
      newState[id] = !allExpanded;
    });
    setExpandedInstructors(newState);
  };

  const renderCourseRow = (c, showInstructorColumn = false) => (
    <tr key={c._id} className="hover:bg-slate-50/70 transition duration-150">
      <td className="px-6 py-4 max-w-xs">
        <div className="font-bold text-slate-900 text-sm leading-snug">{c.title}</div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
            {c.category || 'General'}
          </span>
          <span className="uppercase text-[10px] text-indigo-600 font-bold">
            {c.level || 'beginner'}
          </span>
        </div>
      </td>

      {showInstructorColumn && (
        <td className="px-6 py-4">
          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <span>{c.instructor?.name || 'Unknown'}</span>
            {c.instructor?.isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Instructor" />
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{c.instructor?.email}</div>
        </td>
      )}

      <td className="px-6 py-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-extrabold text-slate-900">
            {c.price > 0 ? `₹${c.price.toLocaleString('en-IN')}` : <span className="text-emerald-600 font-bold">Free</span>}
          </span>
          {c.originalPrice > c.price && c.price > 0 && (
            <>
              <span className="text-xs text-slate-400 line-through">₹{c.originalPrice.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>
        {c.isOfferActive && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
              <span>{c.offerBadgeText || 'Special Offer'}</span>
            </span>
          </div>
        )}
        {c.price > 0 && (
          <span className="text-[10px] text-slate-400 block mt-1 font-medium">
            {c.instructorSharePercent || 70}% Inst. / {c.platformSharePercent || 30}% Plat.
          </span>
        )}
      </td>

      <td className="px-6 py-4">
        {c.approvalStatus === 'approved' ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live</span>
            </span>
            {c.reviewedAt && (
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                Approved {new Date(c.reviewedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        ) : c.approvalStatus === 'pending_approval' ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>In Review</span>
            </span>
            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
              Awaiting admin action
            </span>
          </div>
        ) : c.approvalStatus === 'rejected' ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Changes Requested</span>
            </span>
            {c.rejectionReason && (
              <p className="text-[11px] text-rose-600 font-normal mt-0.5 max-w-[180px] truncate" title={c.rejectionReason}>
                {c.rejectionReason}
              </p>
            )}
          </div>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Draft</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Unpublished</span>
          </div>
        )}
      </td>

      <td className="px-6 py-4 font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-800">{c.studentsCount || 0}</span>
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Admin Moderation Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setModerateCourse(c);
                setShowRejectInput(false);
                setRejectReason('');
              }}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                c.approvalStatus === 'pending_approval'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{c.approvalStatus === 'pending_approval' ? 'Moderate' : 'Audit'}</span>
            </button>
          )}

          {/* Instructor: Submit for Review */}
          {!isAdmin && (c.approvalStatus === 'draft' || c.approvalStatus === 'rejected') && (
            <button
              onClick={() => handleSubmitForReview(c._id)}
              disabled={submittingReviewId === c._id}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingReviewId === c._id ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          )}

          <button
            onClick={() => setEditingCourse(c)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            title="Edit Course Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <Link
            href={`/courses/${c._id}`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curriculum</span>
          </Link>

          <button
            onClick={() => handleDelete(c._id)}
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Delete Course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  if (!user) return <p className="p-8 text-center text-slate-500">Please log in to access this page.</p>;

  return (
    <div className="space-y-8 pb-16">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2 ${
            isAdmin ? 'text-indigo-700 bg-indigo-50' : 'text-emerald-700 bg-emerald-50'
          }`}>
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isAdmin ? `Platform Course Governance (${courses.length})` : `My Course Catalog (${courses.length})`}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? 'Course Catalog & Governance' : 'My Course Studio'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            {isAdmin
              ? 'Multi-instructor course moderation hub. Inspect submitted lecture videos and curriculum modules, approve to publish live, or request changes with specific feedback.'
              : 'Build your curriculum with video lectures, document resources, and quiz tests. Submit to platform admin for approval to go live.'}
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition duration-200 self-start sm:self-auto cursor-pointer ${
            isAdmin
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancel' : 'Add New Course'}</span>
        </button>
      </div>

      {/* Admin Review Alert Banner if pending courses exist */}
      {isAdmin && pendingCourses.length > 0 && (
        <div className="p-5 bg-amber-500/10 border border-amber-300 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              {pendingCourses.length}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950">
                {pendingCourses.length} Course{pendingCourses.length > 1 ? 's' : ''} Awaiting Administrator Review
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Instructors have submitted curriculum modules and lessons. Review content and approve to publish them live to students.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            Filter Pending Reviews
          </button>
        </div>
      )}

      {/* Course Creation Form Modal/Card */}
      {showForm && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-900/5 animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg mb-6 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5" />
            <span>{isAdmin ? 'Admin Course Authoring' : 'Create Course Draft'}</span>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Course Title</label>
              <input
                placeholder="e.g., Master Full-Stack Web Development"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Description</label>
              <textarea
                placeholder="Detailed overview of what students will learn..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Regular / MRP Price (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 2999"
                value={form.originalPrice || ''}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setForm({
                    ...form,
                    originalPrice: val,
                    isOfferActive: val > form.price && form.price > 0 ? true : form.isOfferActive
                  });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-indigo-700 mb-1 flex items-center justify-between">
                <span>Offer / Selling Price (₹)</span>
                {form.originalPrice > form.price && form.price > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% OFF
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 for Free"
                value={form.price}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setForm({
                    ...form,
                    price: val,
                    isOfferActive: form.originalPrice > val && val > 0 ? true : form.isOfferActive
                  });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Platform Share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.platformSharePercent}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, Number(e.target.value)));
                  setForm({ ...form, platformSharePercent: val, instructorSharePercent: 100 - val });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Category</label>
              <input
                placeholder="e.g., Development, Design, Business"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="beginner">Beginner Level</option>
                <option value="intermediate">Intermediate Level</option>
                <option value="advanced">Advanced Level</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition disabled:opacity-70 cursor-pointer"
              >
                {submitting ? 'Creating...' : isAdmin ? 'Save & Auto-Approve Course' : 'Create Course Draft'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>All Courses</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {courses.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              statusFilter === 'pending_approval'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              statusFilter === 'pending_approval' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingCourses.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Live</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'approved' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
              {approvedCourses.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('draft_rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              statusFilter === 'draft_rejected'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Drafts / Rejected</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'draft_rejected' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {draftCourses.length}
            </span>
          </button>
        </div>

        {/* Admin Instructor Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <div className="relative">
              <select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="all">All Instructors ({instructorsList.length})</option>
                {instructorsList.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

      </div>

      {/* Secondary Organization Bar: Stats & View Layout Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <FolderKanban className="w-4 h-4 text-indigo-600" />
          <span>
            {viewLayout === 'grouped'
              ? `Organized by Instructor (${instructorGroups.length} ${instructorGroups.length === 1 ? 'instructor' : 'instructors'} • ${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'})`
              : `Showing ${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'} in flat view`}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {viewLayout === 'grouped' && instructorGroups.length > 1 && (
            <button
              onClick={toggleAllInstructors}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              {instructorGroups.every(g => expandedInstructors[g.instructor._id || 'platform'] !== false) ? 'Collapse All' : 'Expand All'}
            </button>
          )}

          {/* View Mode Toggle: Grouped vs Flat Table */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setViewLayout('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                viewLayout === 'grouped'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Grouped by Instructor</span>
            </button>

            <button
              onClick={() => setViewLayout('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                viewLayout === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 text-slate-600" />
              <span>Flat Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses Display Area */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center max-w-md mx-auto shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base mb-1">No Courses Match Selection</h3>
          <p className="text-slate-400 text-xs mb-4">Try adjusting your status tab or search keyword.</p>
          {(statusFilter !== 'all' || searchTerm || instructorFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
                setInstructorFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewLayout === 'grouped' ? (
        /* ================= GROUPED BY INSTRUCTOR VIEW ================= */
        <div className="space-y-6">
          {instructorGroups.map((group) => {
            const instId = group.instructor._id || 'platform';
            const isExpanded = expandedInstructors[instId] !== false;

            return (
              <div
                key={instId}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Instructor Header Banner */}
                <div
                  onClick={() => toggleInstructor(instId)}
                  className="p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 transition select-none"
                >
                  {/* Left: Instructor Identity */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-extrabold text-base flex items-center justify-center uppercase shadow-md shrink-0">
                      {group.instructor.avatar ? (
                        <img src={group.instructor.avatar} alt={group.instructor.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        group.instructor.name?.charAt(0) || 'I'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-extrabold text-slate-900 text-base truncate">
                          {group.instructor.name || 'Instructor'}
                        </h3>
                        {group.instructor.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified Creator</span>
                          </span>
                        )}
                        {group.instructor.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span>Master Admin</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                        {group.instructor.email}
                      </div>
                    </div>
                  </div>

                  {/* Right: Summary Metrics & Expand Arrow */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {group.pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{group.pendingCount} Needs Moderation</span>
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {group.courses.length} {group.courses.length === 1 ? 'Course' : 'Courses'}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{group.totalStudents} {group.totalStudents === 1 ? 'Learner' : 'Learners'}</span>
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {group.approvedCount} Live
                    </span>

                    <div className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 bg-white border border-slate-200 ml-1 transition">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Body: Courses Table under this Instructor */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200/60">
                          <th className="px-6 py-3">Course Details</th>
                          <th className="px-6 py-3">Price & Split</th>
                          <th className="px-6 py-3">Approval State</th>
                          <th className="px-6 py-3">Learners</th>
                          <th className="px-6 py-3 text-right">Moderation / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {group.courses.map((c) => renderCourseRow(c, false))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT TABLE VIEW ================= */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80">
                  <th className="px-6 py-4">Course Details</th>
                  {isAdmin && <th className="px-6 py-4">Instructor</th>}
                  <th className="px-6 py-4">Price & Split</th>
                  <th className="px-6 py-4">Approval State</th>
                  <th className="px-6 py-4">Learners</th>
                  <th className="px-6 py-4 text-right">Moderation / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCourses.map((c) => renderCourseRow(c, isAdmin))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Moderation Modal */}
      {moderateCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Administrator Course Audit</h3>
                  <p className="text-xs text-slate-500">Inspect course details & moderate publishing status</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModerateCourse(null);
                  setShowRejectInput(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Course Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Offering</span>
                <h4 className="text-sm font-bold text-slate-900">{moderateCourse.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{moderateCourse.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Instructor:</span>
                  <strong className="text-slate-800">{moderateCourse.instructor?.name || 'Unknown'}</strong>
                  <span className="text-slate-400 font-mono block text-[11px]">{moderateCourse.instructor?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Pricing & Revenue Split:</span>
                  <strong className="text-slate-800">{moderateCourse.price > 0 ? `₹${moderateCourse.price}` : 'Free'}</strong>
                  <span className="text-indigo-600 block text-[11px] font-semibold">
                    {moderateCourse.platformSharePercent || 30}% Platform / {moderateCourse.instructorSharePercent || 70}% Inst.
                  </span>
                </div>
              </div>

              {moderateCourse.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <span className="font-bold block">Previous Review Notes:</span>
                  <span>{moderateCourse.rejectionReason}</span>
                </div>
              )}
            </div>

            {/* Reject / Changes Input Box */}
            {showRejectInput ? (
              <div className="space-y-3 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700">
                  Specify Feedback & Changes Needed for Instructor:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please add lecture notes in Module 2 or improve video audio quality..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectFromModal(moderateCourse._id)}
                    disabled={moderating}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {moderating ? 'Sending...' : 'Confirm Changes Request'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <Link
                href={`/courses/${moderateCourse._id}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Inspect Full Curriculum (Modules & Lessons)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                {!showRejectInput && (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Request Changes
                  </button>
                )}

                <button
                  onClick={() => handleApproveFromModal(moderateCourse._id)}
                  disabled={moderating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{moderating ? 'Publishing...' : 'Approve & Publish Live'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <EditCourseModal
          isOpen={!!editingCourse}
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSuccess={() => {
            setEditingCourse(null);
            loadCourses();
          }}
        />
      )}

    </div>
  );
}
