'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, Users, Shield, PlusCircle, ArrowUpRight, TrendingUp, 
  Sparkles, Activity, CreditCard, CheckCircle2, AlertTriangle, 
  ArrowRight, Clock, Eye, Check, X, RefreshCw, Layers, 
  DollarSign, Banknote, ShieldAlert, Award, FileText, ChevronRight,
  Server, Database, Zap
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Initializing workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Authentication Required</h2>
          <p className="text-slate-500 text-sm mb-6">Please log in to manage your LMS platform.</p>
          <Link href="/login" className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-500 transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return user.role === 'admin' ? <AdminExecutiveDashboard /> : <InstructorDashboard user={user} />;
}

/* =========================================================================
   1. SUPER ADMIN EXECUTIVE DASHBOARD (Dedicated Platform Master Control)
   ========================================================================= */
function AdminExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');

  const loadOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleQuickApproveCourse = async (courseId) => {
    setActionLoadingId(`course_${courseId}`);
    try {
      await api.put(`/courses/${courseId}/approve`);
      setSuccessNotice('Course approved successfully and published to student catalog!');
      setTimeout(() => setSuccessNotice(''), 4000);
      await loadOverview();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve course');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickVerifyInstructor = async (userId) => {
    setActionLoadingId(`inst_${userId}`);
    try {
      await api.put(`/users/${userId}/verify`, { isVerified: true });
      setSuccessNotice('Instructor verified successfully! Their courses can now be published live.');
      setTimeout(() => setSuccessNotice(''), 4000);
      await loadOverview();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify instructor');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Aggregating platform metrics & governance state...</p>
      </div>
    );
  }

  const m = data?.metrics || {};
  const queue = data?.moderationQueue || { pendingCourses: [], pendingInstructors: [] };
  const health = data?.systemHealth || {};

  return (
    <div className="space-y-8 pb-16">
      
      {/* Super Admin Top Control Header */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>SkillPulse Super Admin Console</span>
              <span className="text-slate-400">• Master Governance</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Executive Platform Operations</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Real-time platform oversight, commission revenue tracking, curriculum moderation queues, and multi-tenant instructor governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true);
                loadOverview();
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Refresh platform statistics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            <Link
              href="/courses"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Review Catalog ({m.totalCourses || 0})</span>
            </Link>

            <Link
              href="/payouts"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Platform Financials</span>
            </Link>
          </div>
        </div>

        {/* Live System Pulse Sub-Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-200 font-semibold">Core API:</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Online</span>
          </div>

          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-200 font-semibold">MongoDB:</span>
            <span className="text-slate-300 capitalize">{health.database || 'Connected'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-200 font-semibold">Razorpay Route:</span>
            <span className="text-slate-300 capitalize">{health.razorpayRoute || 'Operational'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-200 font-semibold">Uptime:</span>
            <span className="text-slate-300 font-mono">{Math.floor((health.serverUptime || 0) / 60)} min</span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* 5 Core Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Platform Gross GMV */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform GMV</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{(m.grossVolume || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Gross Volume</span>
              <span className="text-emerald-600 font-semibold">{m.paidSalesCount || 0} Orders</span>
            </div>
          </div>
        </div>

        {/* Platform Commission Revenue (30%) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Platform Share</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-600">
              ₹{(m.platformRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>30% Retained Revenue</span>
            </div>
          </div>
        </div>

        {/* Instructor Payouts (70%) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teacher Payouts</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600">
              ₹{(m.instructorPayouts || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>70% Distributed Route Share</span>
            </div>
          </div>
        </div>

        {/* Active Learners */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Learners</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {m.learnersCount || 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Registered Students</span>
              <span className="text-sky-600 font-semibold">{m.totalEnrollments || 0} Enrolled</span>
            </div>
          </div>
        </div>

        {/* Instructors & Verification Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instructor Force</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {m.instructorsCount || 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-600 font-bold">{m.verifiedInstructorsCount || 0} Verified</span>
              {m.pendingInstructorsCount > 0 ? (
                <span className="text-amber-600 font-bold animate-pulse">{m.pendingInstructorsCount} Pending</span>
              ) : (
                <span className="text-slate-400">0 Pending</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Dual Urgent Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Course Moderation Queue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Courses Awaiting Approval</h3>
                  <p className="text-xs text-slate-500">Submitted instructor curriculums ready for platform review</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                queue.pendingCourses?.length > 0 
                  ? 'bg-amber-100 text-amber-800 animate-pulse' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {queue.pendingCourses?.length || 0} Pending
              </span>
            </div>

            {queue.pendingCourses?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Course moderation queue is clear!</p>
                <p className="text-slate-400 mt-0.5">All instructor submitted courses have been verified.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {queue.pendingCourses.map(c => (
                  <div key={c._id} className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-sm">
                      <span className="text-sm font-bold text-slate-900 block truncate">{c.title}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>By <strong className="text-slate-700">{c.instructor?.name || 'Instructor'}</strong></span>
                        <span>•</span>
                        <span>{c.price > 0 ? `₹${c.price}` : 'Free'}</span>
                        <span>•</span>
                        <span className="capitalize">{c.level}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/courses/${c._id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                      <button
                        onClick={() => handleQuickApproveCourse(c._id)}
                        disabled={actionLoadingId === `course_${c._id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === `course_${c._id}` ? 'Approving...' : 'Approve Live'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Courses published by verified instructors go live to students.</span>
            <Link href="/courses" className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <span>View All Courses</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. Instructor Verification Queue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Instructor Verification Queue</h3>
                  <p className="text-xs text-slate-500">Unverified educators awaiting platform credential authorization</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                queue.pendingInstructors?.length > 0 
                  ? 'bg-amber-100 text-amber-800 animate-pulse' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {queue.pendingInstructors?.length || 0} Pending
              </span>
            </div>

            {queue.pendingInstructors?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">All registered instructors are verified!</p>
                <p className="text-slate-400 mt-0.5">New signups will automatically appear here for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {queue.pendingInstructors.map(u => (
                  <div key={u._id} className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                        {u.name?.charAt(0) || 'I'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 block truncate">{u.name}</span>
                        <span className="text-xs text-slate-400 font-mono block truncate">{u.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/users"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => handleQuickVerifyInstructor(u._id)}
                        disabled={actionLoadingId === `inst_${u._id}`}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === `inst_${u._id}` ? 'Verifying...' : 'Verify Teacher'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Verification grants instructors public visibility for their published courses.</span>
            <Link href="/users" className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <span>User Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Live Platform Sales Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Live Platform Transaction Stream</h3>
            <p className="text-xs text-slate-500">Student checkouts with automated 70/30 Razorpay Route settlement splits</p>
          </div>
          <Link
            href="/payouts"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>Full Financials & Ledger</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {data?.recentTransactions?.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No course purchases recorded across the platform yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Learner</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Gross Amount</th>
                  <th className="px-6 py-4">Platform Cut (30%)</th>
                  <th className="px-6 py-4">Instructor Cut (70%)</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">
                      {tx.courseTitle}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{tx.studentName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{tx.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{tx.instructorName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{tx.instructorEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{tx.amountPaid?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-indigo-600">
                      ₹{tx.platformCut?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600">
                      ₹{tx.instructorCut?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === 'paid' || tx.status === 'settled'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tx.status === 'refunded'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboard & System Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Grossing Offerings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Top Performing Courses</h3>
              <p className="text-xs text-slate-500">Highest grossing titles on the student marketplace</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          {data?.topCourses?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No course revenue recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topCourses.map((c, i) => (
                <div key={c.courseId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">{c.title}</span>
                      <span className="text-[11px] text-slate-400">By {c.instructorName} • {c.salesCount} learners</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-900 block">₹{c.grossRevenue.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">₹{c.platformCommission.toLocaleString('en-IN')} Cut</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Earning Instructors */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Leading Instructors</h3>
              <p className="text-xs text-slate-500">Creators generating the most volume across the platform</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>

          {data?.topInstructors?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No instructor sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topInstructors.map((inst, i) => (
                <div key={inst.instructorId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">{inst.name}</span>
                      <span className="text-[11px] text-slate-400">{inst.salesCount} course sales</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-emerald-600 block">₹{inst.totalEarnings.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400">Total Payouts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

/* =========================================================================
   2. INSTRUCTOR STUDIO DASHBOARD (Dedicated Creator Experience)
   ========================================================================= */
function InstructorDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [accountStatus, setAccountStatus] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses?all=true'),
      api.get('/payments/account-status'),
      api.get('/payments/instructor/earnings'),
    ])
      .then(([coursesRes, statusRes, earningsRes]) => {
        setCourses(coursesRes.data || []);
        setAccountStatus(statusRes.data || null);
        setEarnings(earningsRes.data || null);
      })
      .catch((err) => console.error('Error loading instructor studio:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading your instructor studio...</p>
      </div>
    );
  }

  const isRouteActive = accountStatus?.payoutStatus === 'active';
  const pendingCourses = courses.filter(c => c.approvalStatus === 'pending_approval');
  const liveCourses = courses.filter(c => c.approvalStatus === 'approved');

  return (
    <div className="space-y-8 pb-16">
      {/* Instructor Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SkillPulse Creator Studio</span>
              <span className="text-slate-400">• Educator Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Design courses, upload video lessons and articles, submit for administrative verification, and track your revenue settlements.
            </p>
          </div>

          <Link
            href="/courses"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition self-start md:self-auto"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Create New Course</span>
          </Link>
        </div>
      </div>

      {/* Verification Notice if Instructor is unverified */}
      {!user.isVerified && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start sm:items-center gap-4 text-amber-950 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-amber-950">Instructor Account Pending Verification</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              An administrator has not yet verified your instructor profile. You can draft courses and upload curriculum immediately; your courses will go live once an administrator verifies your account.
            </p>
          </div>
        </div>
      )}

      {/* Route Setup Notice */}
      {!isRouteActive && (
        <div className="p-5 rounded-3xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Automated Bank Settlement Setup</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Connect your bank account and PAN with Razorpay Route to receive your 70% revenue share.
              </p>
            </div>
          </div>
          <Link
            href="/payouts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
          >
            <span>Complete Setup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Courses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">My Courses</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{courses.length}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{liveCourses.length} Approved & Live</span>
              <span className="text-amber-600">{pendingCourses.length} In Review</span>
            </div>
          </div>
        </div>

        {/* Total Learners Enrolled */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Students Enrolled</span>
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">
              {courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all your courses</p>
          </div>
        </div>

        {/* Your Total Earnings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Net Earnings</span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-600">
              ₹{(earnings?.summary?.netInstructorEarnings || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              70% share of ₹{(earnings?.summary?.grossSales || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Settled to Bank */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Bank Settlements</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600">
              ₹{(earnings?.summary?.settledEarnings || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1 capitalize">
              Schedule: {accountStatus?.payoutSchedule || 'Weekly'}
            </p>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Curriculum Builder</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Create video lectures, upload PDF lesson notes, configure quizzes, and submit your offerings for administrator approval.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
          >
            <span>Go to Course Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Bank & Revenue Hub</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Inspect per-course revenue breakdown, review incoming settlements from student enrollments, and update your bank account.
          </p>
          <Link
            href="/payouts"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
          >
            <span>View Earnings & Settlements</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
