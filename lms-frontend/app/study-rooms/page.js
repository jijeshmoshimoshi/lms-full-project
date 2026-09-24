'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  Users, Sparkles, Plus, Search, Radio, Clock,
  Lock, ArrowRight, BookOpen, Coffee, Code2, Flame,
  Share2, Check, Shield, MessageSquare, Headphones, Zap
} from 'lucide-react';

export default function StudyRoomsLobby() {
  const { user } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    description: '',
    courseId: '',
    mode: 'open_discussion',
    isPrivate: false,
    passcode: '',
    maxParticipants: 16,
    tags: 'React, Focus, WebDev',
    initialGoal: 'Mastering today\'s coursework'
  });
  const [formError, setFormError] = useState('');

  // Fetch active rooms & courses
  const fetchRooms = async (pageToFetch = currentPage) => {
    try {
      setLoading(true);
      const res = await api.get('/study-rooms', {
        params: {
          search: searchQuery || undefined,
          mode: selectedMode !== 'all' ? selectedMode : undefined,
          page: pageToFetch,
          limit: 12
        }
      });
      if (res.data?.success) {
        setRooms(res.data.rooms || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || res.data.rooms?.length || 0);
        setCurrentPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error('Error fetching study rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      if (res.data?.courses) {
        setCourses(res.data.courses);
      }
    } catch (e) {
      console.error('Error fetching courses:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchCourses();
  }, [selectedMode]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Join by Code
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    if (!user) {
      router.push(`/login?redirect=/study-rooms`);
      return;
    }
    setJoinCodeError('');

    try {
      const res = await api.get(`/study-rooms/code/${joinCode.trim().toUpperCase()}`);
      if (res.data?.success && res.data.room) {
        router.push(`/study-rooms/${res.data.room._id}`);
      } else {
        setJoinCodeError('Invalid or expired room code');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        router.push(`/login?redirect=/study-rooms`);
        return;
      }
      setJoinCodeError(err.response?.data?.message || 'Room code not found');
    }
  };

  // Handle Room Creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/study-rooms');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Please provide a room title');
      return;
    }

    try {
      setCreating(true);
      setFormError('');

      const res = await api.post('/study-rooms', {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });

      if (res.data?.success && res.data.room) {
        setShowCreateModal(false);
        router.push(`/study-rooms/${res.data.room._id}`);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'deep_focus':
        return { label: 'Silent Focus', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Headphones };
      case 'pair_programming':
        return { label: 'Pair Coding', bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Code2 };
      case 'lecture_watch':
        return { label: 'Lecture Watch', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: BookOpen };
      default:
        return { label: 'Discussion', bg: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: MessageSquare };
    }
  };

  // Quick stats
  const totalActivePeers = rooms.reduce((acc, r) => acc + (r.activeMembers?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* Top Ambient Glow Banner */}
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 pt-12 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-fuchsia-600/10 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE COLLABORATIVE FOCUS HUBS
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Virtual Study Rooms & <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">Peer Learning</span>
              </h1>

              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Study with peers in real-time. Join synchronized Pomodoro timers, co-watch course lectures, pair program on shared code scratchpads, and crush your goals together.
              </p>

              {/* Metrics Pills */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span><strong className="text-white">{rooms.length}</strong> Active Rooms</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span><strong className="text-white">{totalActivePeers}</strong> Students Focusing</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Bonus XP for Group Streaks</span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md lg:w-96 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center justify-between">
                <span>Jump into a Room</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </h2>

              <button
                onClick={() => {
                  if (!user) router.push('/login?redirect=/study-rooms');
                  else setShowCreateModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Create New Study Room
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">or enter code</span>
              </div>

              <form onSubmit={handleJoinByCode} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 7K9X2B"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase font-mono tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    Join <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {joinCodeError && (
                  <p className="text-xs text-rose-400 pl-1">{joinCodeError}</p>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* Filter & Rooms Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 space-y-8">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3 sm:p-4 rounded-2xl">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by topic, course, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'open_discussion', label: '💬 Open Discussion' },
              { id: 'deep_focus', label: '🎧 Silent Focus' },
              { id: 'pair_programming', label: '💻 Pair Code' },
              { id: 'lecture_watch', label: '🎬 Co-Watch' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMode(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedMode === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No active study rooms found</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              Be the first to create a study room and invite your peers to focus, pair code, and study together!
            </p>
            <button
              onClick={() => {
                if (!user) router.push('/login?redirect=/study-rooms');
                else setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              <Plus className="w-4 h-4" /> Create First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const modeBadge = getModeBadge(room.mode);
              const ModeIcon = modeBadge.icon;
              const activeCount = room.activeMembers?.length || 0;

              return (
                <div
                  key={room._id}
                  className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="space-y-3.5">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${modeBadge.bg}`}>
                        <ModeIcon className="w-3.5 h-3.5" />
                        <span>{modeBadge.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {room.roomCode && (
                          <span 
                            className="text-[11px] font-mono font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md"
                            title="Room Code"
                          >
                            #{room.roomCode}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{activeCount} / {room.maxParticipants}</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Title & Topic */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                        {room.title}
                      </h3>
                      <p className="text-xs font-medium text-indigo-400/90 mt-0.5 line-clamp-1">
                        🎯 {room.topic}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {room.description || 'Join this collaborative study lounge to focus and review lessons.'}
                    </p>

                    {/* Course Link if available */}
                    {room.courseTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="truncate">Course: {room.courseTitle}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {room.tags && room.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {room.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Join Action */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                        {room.hostName?.charAt(0) || 'H'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400">Hosted by</span>
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[90px]">
                          {room.hostName || 'Host'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          router.push(`/login?redirect=/study-rooms/${room._id}`);
                        } else {
                          router.push(`/study-rooms/${room._id}`);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs tracking-wide shadow-md shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6 mt-4">
            <div className="text-xs text-slate-400">
              Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount} active rooms)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => fetchRooms(currentPage - 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => fetchRooms(pNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentPage === pNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => fetchRooms(currentPage + 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Virtual Study Room</h3>
                  <p className="text-xs text-slate-400">Set up a space to focus, collaborate, or co-watch lectures</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4 text-left">
              
              {/* Room Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Room Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. React Full-Stack Night Sprint"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Study Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Study Format / Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'open_discussion', label: '💬 Open Discussion', desc: 'Audio & active text chat' },
                    { id: 'deep_focus', label: '🎧 Silent Focus', desc: 'Pomodoro timer & goals' },
                    { id: 'pair_programming', label: '💻 Pair Code', desc: 'Shared live code runner' },
                    { id: 'lecture_watch', label: '🎬 Co-Watch', desc: 'Synced video playback' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setFormData({ ...formData, mode: m.id })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.mode === m.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{m.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Topic / Sub-goal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Solving Module 4 LeetCode exercises"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Link to Course (Optional)
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">General Study (No course link)</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags & Initial Host Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Python, Backend, Algorithms"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Goal Today
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Finish 3 chapters and exercise"
                    value={formData.initialGoal}
                    onChange={(e) => setFormData({ ...formData, initialGoal: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Privacy & Max Participants */}
              <div className="flex items-center justify-between gap-4 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-300 font-medium">Private Room (Invite Code only)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition flex items-center gap-2"
                >
                  {creating ? 'Launching Room...' : 'Launch Study Room 🚀'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
