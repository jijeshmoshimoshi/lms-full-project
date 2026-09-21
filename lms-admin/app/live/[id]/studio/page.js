'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import api from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  Radio, Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff,
  Users, MessageSquare, Send, ArrowLeft, Clock, Shield, AlertCircle,
  Sparkles, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function InstructorStudioPage() {
  const { id: sessionId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Media state
  const [localStream, setLocalStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Broadcast state
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streamEnded, setStreamEnded] = useState(false);

  // Live Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // studentSocketId -> RTCPeerConnection
  const timerRef = useRef(null);
  const chatBottomRef = useRef(null);

  // 1. Load Session Details
  const loadSession = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/live-sessions/${sessionId}`);
      const sess = res.data?.session;
      setSession(sess);

      if (sess.status === 'live') {
        setIsLive(true);
      } else if (sess.status === 'ended') {
        setStreamEnded(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // 2. Initialize Camera & Mic Preview
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Could not acquire camera/microphone:', err.message);
    }
  };

  useEffect(() => {
    startLocalMedia();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 3. Socket.io Connection & WebRTC Signaling
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const socket = io(backendUrl, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Studio] Connected to telecast socket server:', socket.id);
      socket.emit('join_live_session', {
        sessionId,
        role: 'host',
        user: { name: user?.name || 'Instructor', role: 'instructor' },
      });
    });

    const updateViewers = (data) => {
      const count = data?.viewerCount ?? data?.count ?? 0;
      setViewerCount(count);
    };
    socket.on('viewers_count_update', updateViewers);
    socket.on('viewer_count_updated', updateViewers);

    socket.on('receive_chat_message', (chatData) => {
      setChatMessages(prev => [...prev, chatData]);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Handle student request to watch stream (WebRTC Signaling)
    socket.on('webrtc_signal', async ({ senderSocketId, signal, senderType }) => {
      if (signal?.type === 'request_stream') {
        createPeerConnectionForStudent(senderSocketId);
      } else if (signal?.type === 'answer') {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } catch (e) {
            console.error('Failed to set remote answer:', e);
          }
        }
      } else if (signal?.candidate) {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Failed to add ice candidate:', e);
          }
        }
      }
    });

    return () => {
      socket.emit('leave_live_session', { sessionId });
      socket.disconnect();
    };
  }, [sessionId, user]);

  // Create WebRTC PeerConnection for each student joining
  const createPeerConnectionForStudent = async (studentSocketId) => {
    const stream = localStreamRef.current || localStream;
    if (!stream) {
      console.warn('[Studio] Broadcaster has no active media stream to transmit yet');
      return;
    }

    // Close any previous peer connection for this student
    if (peerConnectionsRef.current.has(studentSocketId)) {
      try {
        peerConnectionsRef.current.get(studentSocketId).close();
      } catch (e) {}
    }

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionsRef.current.set(studentSocketId, pc);

    // Add local audio and video tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_signal', {
          sessionId,
          targetSocketId: studentSocketId,
          signal: { candidate: event.candidate },
          senderType: 'instructor',
        });
      }
    };

    try {
      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('webrtc_signal', {
        sessionId,
        targetSocketId: studentSocketId,
        signal: offer,
        senderType: 'instructor',
      });
    } catch (err) {
      console.error('[Studio] Error creating WebRTC offer for student:', err);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      startLocalMedia();
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          startLocalMedia();
        };

        // Replace track on all student peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        setLocalStream(displayStream);
        localStreamRef.current = displayStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled or denied:', err.message);
      }
    }
  };

  // Start Broadcasting Live
  const handleGoLive = async () => {
    try {
      await api.put(`/live-sessions/${sessionId}/start`);
      setIsLive(true);
      socketRef.current?.emit('broadcaster_ready', { sessionId });

      // Start stream timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start live stream');
    }
  };

  // End Broadcast
  const handleEndStream = async () => {
    if (!window.confirm('Are you sure you want to end this live broadcast for all students?')) return;
    try {
      await api.put(`/live-sessions/${sessionId}/end`);
      setIsLive(false);
      setStreamEnded(true);
      if (timerRef.current) clearInterval(timerRef.current);

      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end stream');
    }
  };

  // Send Host Message to Live Chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socketRef.current) return;

    socketRef.current.emit('send_chat_message', {
      sessionId,
      message: messageInput.trim(),
      user: {
        name: `${user?.name || 'Instructor'} (Host)`,
        role: 'instructor',
      },
    });

    setMessageInput('');
  };

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-bold">Entering Telecast Studio...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold mb-2">Could Not Load Studio</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">{error || 'Session not found'}</p>
        <Link href="/live" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">
          ← Return to Live Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Studio Top Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Exit Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                {session.course?.title || 'Course'}
              </span>
              <span className="text-slate-600">•</span>
              <h1 className="text-sm font-bold text-white truncate max-w-md">
                {session.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Live Broadcast Status & Timer */}
        <div className="flex items-center gap-4">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>LIVE</span>
              <span className="font-mono ml-1 text-white">{formatTimer(elapsedSeconds)}</span>
            </div>
          ) : streamEnded ? (
            <div className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 font-bold text-xs">
              Broadcast Ended
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs">
              Pre-Broadcast Standby
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-white">{viewerCount}</span>
            <span className="text-[11px]">watching</span>
          </div>

          {isLive ? (
            <button
              onClick={handleEndStream}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-rose-800/50 font-bold text-xs transition cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Broadcast</span>
            </button>
          ) : !streamEnded ? (
            <button
              onClick={handleGoLive}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer animate-pulse"
            >
              <Radio className="w-4 h-4" />
              <span>Go Live Now</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        {/* Left Monitor (Video Player & Controls) */}
        <div className="lg:col-span-3 flex flex-col p-6 overflow-y-auto">
          {/* Main Video Monitor */}
          <div className="relative aspect-video w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${!cameraEnabled && !isScreenSharing ? 'hidden' : ''}`}
            />

            {!cameraEnabled && !isScreenSharing && (
              <div className="text-center p-6 space-y-2">
                <div className="w-20 h-20 rounded-full bg-slate-800 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-inner uppercase">
                  {user?.name ? user.name.charAt(0) : 'I'}
                </div>
                <h3 className="font-bold text-white text-base">{user?.name || 'Instructor'}</h3>
                <p className="text-xs text-slate-500">Camera is currently paused</p>
              </div>
            )}

            {/* Overlays on stream */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-bold">
                {isScreenSharing ? '🖥 Screen Share Active' : '📹 Host Camera'}
              </span>
              {isLive && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-600/80 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider animate-pulse">
                  ON AIR
                </span>
              )}
            </div>
          </div>

          {/* Studio Device Control Bar */}
          <div className="mt-5 flex items-center justify-center gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                micEnabled
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-rose-600/20 border border-rose-500/40 text-rose-400'
              }`}
            >
              {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
              <span>{micEnabled ? 'Mute Mic' : 'Unmute Mic'}</span>
            </button>

            <button
              onClick={toggleCamera}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                cameraEnabled
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-rose-600/20 border border-rose-500/40 text-rose-400'
              }`}
            >
              {cameraEnabled ? <Video className="w-4 h-4 text-indigo-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
              <span>{cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}</span>
            </button>

            <button
              onClick={toggleScreenShare}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isScreenSharing
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <MonitorUp className="w-4 h-4 text-amber-400" />
              <span>{isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Real-Time Live Chat */}
        <div className="lg:col-span-1 border-l border-slate-800 bg-slate-900/50 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-xs text-white uppercase tracking-wider">Live Chat & Q&A</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              {chatMessages.length} msgs
            </span>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {chatMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="font-bold text-xs text-slate-400">No chat messages yet</p>
                <p className="text-[10px] mt-1">Student questions and comments will appear here live during your broadcast.</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isHostMsg = msg.sender?.role === 'instructor' || msg.sender?.role === 'admin';
                return (
                  <div key={msg.id} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-extrabold text-[11px] ${isHostMsg ? 'text-rose-400' : 'text-indigo-400'}`}>
                        {msg.sender?.name || 'Student'}
                      </span>
                      {isHostMsg && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded">
                          HOST
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600 ml-auto">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed bg-slate-800/40 p-2 rounded-xl border border-slate-800">
                      {msg.text}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Send message to live class..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="p-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
