'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import io from 'socket.io-client';
import { 
  Radio, Users, MessageSquare, Send, ArrowLeft, 
  Lock, Calendar, Clock, AlertCircle, Volume2, 
  VolumeX, Maximize, Play, CheckCircle2, BookOpen,
  Sparkles, Shield, RefreshCw
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function StudentLiveRoom() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Live Stream state
  const [viewerCount, setViewerCount] = useState(0);
  const [streamActive, setStreamActive] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  const [isMuted, setIsMuted] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Refs
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnRef = useRef(null);
  const chatBottomRef = useRef(null);
  const videoContainerRef = useRef(null);

  // Fetch session details and enrollment check
  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/live-sessions/${id}`);
      if (res.data?.success) {
        setSession(res.data.session);
        const enrolled = Boolean(
          res.data.isEnrolled ?? 
          res.data.access?.isEnrolled ?? 
          res.data.access?.canWatch ?? 
          false
        );
        const host = Boolean(
          res.data.isHost ?? 
          res.data.isInstructorOrAdmin ?? 
          res.data.access?.isHost ?? 
          (user?.role === 'admin') ??
          false
        );
        setIsEnrolled(enrolled);
        setIsHost(host);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(err.response?.data?.message || 'Failed to load live session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSession();
    }
  }, [id, authLoading, user?._id]);

  const broadcasterSocketIdRef = useRef(null);

  // Scheduled session countdown timer
  useEffect(() => {
    if (!session || session.status !== 'scheduled') return;

    const timer = setInterval(() => {
      const start = new Date(session.scheduledStartTime).getTime();
      const now = new Date().getTime();
      const diff = start - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        clearInterval(timer);
        // Refresh session to check if host started
        fetchSession();
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, expired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Setup Peer Connection for Student Viewer
  const setupPeerConnection = (broadcasterSocketId) => {
    if (peerConnRef.current) {
      try {
        peerConnRef.current.close();
      } catch (e) {}
      peerConnRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnRef.current = pc;

    pc.onicecandidate = (event) => {
      const targetId = broadcasterSocketId || broadcasterSocketIdRef.current;
      if (event.candidate && socketRef.current && targetId) {
        socketRef.current.emit('webrtc_signal', {
          sessionId: id,
          targetSocketId: targetId,
          signal: { candidate: event.candidate },
          senderType: 'student',
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[Student] Received remote stream track:', event.track.kind);
      if (videoRef.current && event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setStreamActive(true);
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(e => console.log('Autoplay handled:', e));
          }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[Student] Connection state changed:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStreamActive(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStreamActive(false);
      }
    };

    return pc;
  };

  const initiateWebRTCAsStudent = () => {
    console.log('[Student] Requesting telecast stream from broadcaster...');
    if (socketRef.current) {
      socketRef.current.emit('webrtc_signal', {
        sessionId: id,
        signal: { type: 'request_stream' },
        senderType: 'student',
      });
    }
  };

  // WebRTC & Socket.io setup for Live Telecast
  useEffect(() => {
    if (!session || (!isEnrolled && !isHost)) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Student] Connected to socket server:', socket.id);
      socket.emit('join_live_session', {
        sessionId: id,
        role: isHost ? 'host' : 'student',
        user: {
          _id: user?._id,
          name: user?.name || 'Student',
          role: isHost ? 'instructor' : 'student',
        },
      });

      if (session.status === 'live') {
        initiateWebRTCAsStudent();
      }
    });

    const updateViewers = (data) => {
      const count = data?.viewerCount ?? data?.count ?? 0;
      setViewerCount(count);
    };
    socket.on('viewers_count_update', updateViewers);
    socket.on('viewer_count_updated', updateViewers);

    socket.on('broadcaster_ready', () => {
      console.log('[Student] Broadcaster is active, requesting stream...');
      initiateWebRTCAsStudent();
    });

    socket.on('session_status_changed', ({ status }) => {
      setSession((prev) => (prev ? { ...prev, status } : prev));
      if (status === 'live') {
        initiateWebRTCAsStudent();
      }
    });

    socket.on('stream_status_change', ({ status }) => {
      setSession((prev) => (prev ? { ...prev, status } : prev));
      if (status === 'live') {
        initiateWebRTCAsStudent();
      }
    });

    socket.on('receive_chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Handle WebRTC signaling from broadcaster
    socket.on('webrtc_signal', async ({ senderSocketId, signal, senderType }) => {
      if (senderSocketId) {
        broadcasterSocketIdRef.current = senderSocketId;
      }

      if (signal?.type === 'offer') {
        console.log('[Student] Received offer from broadcaster:', senderSocketId);
        try {
          const pc = setupPeerConnection(senderSocketId);

          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc_signal', {
            sessionId: id,
            targetSocketId: senderSocketId,
            signal: answer,
            senderType: 'student',
          });
        } catch (err) {
          console.error('[Student] Error handling WebRTC offer:', err);
        }
      } else if (signal?.candidate) {
        try {
          if (peerConnRef.current && peerConnRef.current.remoteDescription) {
            await peerConnRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (err) {
          console.error('[Student] Error adding ICE candidate:', err);
        }
      }
    });

    return () => {
      socket.emit('leave_live_session', { sessionId: id });
      socket.disconnect();
      if (peerConnRef.current) {
        peerConnRef.current.close();
      }
    };
  }, [session?.status, isEnrolled, isHost]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('send_chat_message', {
      sessionId: id,
      message: chatInput.trim(),
    });

    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Connecting to live telecast room...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Live Session Unavailable</h2>
          <p className="text-sm text-slate-400 mt-2">{error || 'The requested live session could not be found.'}</p>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Courses</span>
          </Link>
        </div>
      </div>
    );
  }

  // If student is not enrolled and not admin/instructor, show enrollment lock wall
  if (!isEnrolled && !isHost) {
    const courseSlug = session.course?.slug || session.course?._id;
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Subscriber Exclusive
          </span>
          <h2 className="text-2xl font-black mt-3">{session.title}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            This live telecast is reserved for students enrolled in <span className="text-white font-semibold">{session.course?.title}</span>.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Related Course</p>
              <p className="text-sm font-bold text-white truncate">{session.course?.title}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/courses/${courseSlug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enroll to Watch Live</span>
            </Link>
            <Link
              href="/courses"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${session.course?.slug || session.course?._id}`}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Back to Course"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400 truncate max-w-[200px] sm:max-w-xs">
                {session.course?.title}
              </span>
              <span className="text-slate-600">•</span>
              {session.status === 'live' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Radio className="w-3 h-3 animate-pulse" />
                  LIVE NOW
                </span>
              ) : session.status === 'scheduled' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  SCHEDULED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
                  ENDED
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
              {session.title}
            </h1>
          </div>
        </div>

        {/* Right Header Stats */}
        <div className="flex items-center gap-3">
          {session.status === 'live' && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{viewerCount} watching</span>
            </div>
          )}
          {isHost && (
            <a
              href={`http://localhost:3001/live/${id}/studio`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Host Studio</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Telecast Area: Video Grid & Live Chat */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Video Player & Details */}
        <div className="flex-1 flex flex-col bg-black overflow-y-auto">
          {/* Video Container */}
          <div 
            ref={videoContainerRef} 
            className="relative w-full aspect-video max-h-[75vh] bg-slate-950 flex items-center justify-center overflow-hidden group"
          >
            {session.status === 'live' ? (
              <>
                {/* WebRTC Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />

                {/* Stream Connecting / Buffering Placeholder */}
                {!streamActive && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
                      <Radio className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Connecting to Telecast...</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      The instructor is broadcasting. Negotiating live audio and video stream.
                    </p>
                    <button
                      onClick={initiateWebRTCAsStudent}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reconnect Stream</span>
                    </button>
                  </div>
                )}

                {/* Custom Overlay Controls */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-xs font-bold text-white/90">
                      {streamActive ? 'Live Broadcaster Feed' : 'Connecting...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                      title="Fullscreen"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : session.status === 'scheduled' ? (
              /* Scheduled Countdown Room */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-xl">
                  <Calendar className="w-10 h-10" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Scheduled Live Class
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 max-w-xl">
                  {session.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg">
                  This class is scheduled for {new Date(session.scheduledStartTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}. You will automatically receive reminders before the session begins!
                </p>

                {/* Countdown display */}
                <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-8 max-w-md w-full">
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="block text-xl sm:text-3xl font-black text-white">{countdown.days}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Days</span>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="block text-xl sm:text-3xl font-black text-white">{countdown.hours}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Hours</span>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="block text-xl sm:text-3xl font-black text-white">{countdown.minutes}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Mins</span>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="block text-xl sm:text-3xl font-black text-indigo-400">{countdown.seconds}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Secs</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>You're enrolled! The stream will launch right here when the instructor goes live.</span>
                </div>
              </div>
            ) : (
              /* Session Ended Room */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Live Telecast Ended</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
                  This live class concluded at {new Date(session.actualEndTime || session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                </p>
                <Link
                  href={`/courses/${session.course?.slug || session.course?._id}`}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Course Dashboard</span>
                </Link>
              </div>
            )}
          </div>

          {/* Session Information Under Video */}
          <div className="p-6 bg-slate-900/60 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">{session.title}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hosted by <span className="text-indigo-400 font-semibold">{session.instructor?.name || 'Instructor'}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                  <span className="text-slate-400">Scheduled: </span>
                  <span className="font-bold text-slate-200">
                    {new Date(session.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {session.description && (
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {session.description}
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Interactive Chat Sidebar */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-900/80 flex flex-col h-80 lg:h-auto shrink-0">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live Chat</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {chatMessages.length} messages
            </span>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                <p className="text-xs">Say hello! Chat with your instructor and classmates in real-time.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-bold ${msg.role === 'host' ? 'text-amber-400 font-black' : 'text-indigo-400'}`}>
                      {msg.userName}
                    </span>
                    {msg.role === 'host' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                        INSTRUCTOR
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 bg-slate-800/60 p-2.5 rounded-xl rounded-tl-none border border-slate-800/80 break-words leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/80 bg-slate-900/90 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question or send a message..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
