'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Radio, Plus, Calendar, Clock, Video, Play, Trash2,
  Users, CheckCircle2, AlertCircle, RefreshCw, ExternalLink,
  BookOpen, Sparkles, Filter, Search, ArrowRight, Shield
} from 'lucide-react';

export default function LiveSessionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [form, setForm] = useState({
    courseId: '',
    title: '',
    description: '',
    scheduledStartTime: '',
    durationMinutes: 60,
    streamType: 'webrtc',
    streamUrl: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, courseRes] = await Promise.all([
        api.get('/live-sessions?mine=true'),
        api.get('/courses?all=true'),
      ]);
      setSessions(sessRes.data?.sessions || []);
      setCourses(courseRes.data || []);

      if (courseRes.data && courseRes.data.length > 0 && !form.courseId) {
        setForm(prev => ({ ...prev, courseId: courseRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error loading live sessions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    // Default scheduled time to 15 minutes from now in local format YYYY-MM-DDTHH:mm
    const future = new Date(Date.now() + 15 * 60 * 1000);
    const localIso = new Date(future.getTime() - future.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setForm({
      courseId: courses[0]?._id || '',
      title: '',
      description: '',
      scheduledStartTime: localIso,
      durationMinutes: 60,
      streamType: 'webrtc',
      streamUrl: '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      if (!form.courseId) throw new Error('Please select a course');
      if (!form.title.trim()) throw new Error('Please enter a session title');
      if (!form.scheduledStartTime) throw new Error('Please pick a scheduled start time');

      const res = await api.post('/live-sessions', {
        ...form,
        scheduledStartTime: new Date(form.scheduledStartTime).toISOString(),
      });

      if (res.data?.session) {
        setSessions(prev => [res.data.session, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to schedule live session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel and delete the live session "${title}"?`)) return;
    try {
      await api.delete(`/live-sessions/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete session');
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.course?.title && s.course.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  // Metrics
  const liveCount = sessions.filter(s => s.status === 'live').length;
  const upcomingCount = sessions.filter(s => s.status === 'scheduled').length;
  const endedCount = sessions.filter(s => s.status === 'ended').length;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Live Telecast Studio</span>
                {liveCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                    {liveCount} LIVE NOW
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Schedule live interactive classes. Subscribed students receive in-app & email notifications 10 minutes prior.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-600/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Class</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Broadcasting Live</span>
            <Radio className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{liveCount}</div>
          <div className="text-xs text-slate-500 mt-1">Sessions active right now</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Scheduled</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">{upcomingCount}</div>
          <div className="text-xs text-slate-500 mt-1">Will trigger 10-min alerts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Broadcasts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{endedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Archived live lectures</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Broadcasts</span>
            <Video className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{sessions.length}</div>
          <div className="text-xs text-slate-500 mt-1">Created in your studio</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'live', label: '🔴 Live Now' },
            { id: 'scheduled', label: 'Upcoming' },
            { id: 'ended', label: 'Past Broadcasts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search session title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>
      </div>

      {/* Sessions Table / List */}
      {loading ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading live broadcasts...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No live telecasts found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {searchTerm || statusFilter !== 'all'
              ? 'Try changing your search query or filter criteria.'
              : 'Schedule your first live class session to broadcast in real time to enrolled students.'}
          </p>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/30 transition"
          >
            Schedule First Live Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const isLive = session.status === 'live';
            const isScheduled = session.status === 'scheduled';
            const isEnded = session.status === 'ended';
            const startDate = new Date(session.scheduledStartTime);

            return (
              <div
                key={session._id}
                className={`bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isLive ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Course Badge & Status */}
                  <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-800/80">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 truncate block max-w-[200px]">
                        {session.course?.title || 'Course'}
                      </span>
                    </div>

                    <div>
                      {isLive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span>LIVE NOW</span>
                        </span>
                      ) : isScheduled ? (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">
                          Scheduled
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold uppercase">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Details */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                      {session.title}
                    </h3>

                    {session.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{session.durationMinutes || 60} minutes estimated</span>
                        <span>•</span>
                        <span className="capitalize">{session.streamType === 'webrtc' ? 'Browser WebRTC' : 'External Stream'}</span>
                      </div>

                      {session.reminderSent && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>10-min Email & In-App Reminders Dispatched</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDeleteSession(session._id, session.title)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    title="Cancel session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {isEnded ? (
                      <span className="text-xs text-slate-500 font-medium px-3 py-1.5">
                        Broadcast Finished
                      </span>
                    ) : (
                      <Link
                        href={`/live/${session._id}/studio`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition ${
                          isLive
                            ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>{isLive ? 'Enter Live Studio' : 'Enter Studio'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Live Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-white">
                  Schedule Live Telecast Class
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSession} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Course Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Course <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} (₹{c.price})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enrolled students of this course will receive automated email and website alerts 10 minutes before start.
                </p>
              </div>

              {/* Session Title */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Session Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Q&A, Project Architecture Review & Debugging"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Session Agenda / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What will be covered in this live session..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Date & Time and Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Start Date & Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledStartTime}
                    onChange={(e) => setForm({ ...form, scheduledStartTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Estimated Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Stream Mode Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Broadcasting Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      form.streamType === 'webrtc'
                        ? 'bg-rose-600/10 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="streamType"
                      value="webrtc"
                      checked={form.streamType === 'webrtc'}
                      onChange={() => setForm({ ...form, streamType: 'webrtc' })}
                      className="hidden"
                    />
                    <div>
                      <div className="font-bold text-white">Browser WebRTC Studio</div>
                      <div className="text-[10px] text-slate-400">Broadcast camera & screen directly from browser</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      form.streamType === 'stream_url'
                        ? 'bg-rose-600/10 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="streamType"
                      value="stream_url"
                      checked={form.streamType === 'stream_url'}
                      onChange={() => setForm({ ...form, streamType: 'stream_url' })}
                      className="hidden"
                    />
                    <div>
                      <div className="font-bold text-white">External Stream URL</div>
                      <div className="text-[10px] text-slate-400">Embed YouTube Live, HLS, or Vimeo</div>
                    </div>
                  </label>
                </div>
              </div>

              {form.streamType === 'stream_url' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Live Stream / Embed URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/live_stream_id or https://...m3u8"
                    value={form.streamUrl}
                    onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Notification Guarantee Note */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2.5 text-indigo-300">
                <Clock className="w-4 h-4 shrink-0 text-indigo-400" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Automatic Reminders:</strong> 10 minutes before the scheduled time, our background service will automatically dispatch an email and trigger an instant in-app notification to all enrolled students.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Schedule Live Telecast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
