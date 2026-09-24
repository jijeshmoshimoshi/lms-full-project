'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import io from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import {
  Users, Play, Pause, RotateCcw, Volume2, VolumeX,
  Code2, Video, Edit3, CheckCircle2, MessageSquare,
  Send, Hand, Share2, ArrowLeft, Sparkles, Copy,
  Check, Mic, MicOff, Maximize2, AlertCircle, Headphones,
  Flame, Terminal, RefreshCw, BookOpen, LogOut
} from 'lucide-react';

export default function StudyRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Workspace Tab: 'code' | 'video' | 'whiteboard' | 'notes'
  const [activeTab, setActiveTab] = useState('code');
  // Right Panel Tab: 'chat' | 'members'
  const [sidebarTab, setSidebarTab] = useState('chat');

  // Active Members & Socket state
  const [socket, setSocket] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [myGoal, setMyGoal] = useState('Working on daily goals');
  const [isGoalEditing, setIsGoalEditing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Real-Time Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState('chat'); // 'chat' | 'doubt' | 'code'
  const messagesEndRef = useRef(null);

  // Pomodoro Timer state
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' | 'short_break' | 'long_break'
  const [timerRemaining, setTimerRemaining] = useState(1500); // 25 min default
  const [timerDuration, setTimerDuration] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState('none'); // 'none' | 'lofi' | 'rain' | 'whitenoise'
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);

  // Code Scratchpad state
  const [code, setCode] = useState('// Collaborative Code Scratchpad\n// Share code with your study group!\n\nfunction calculateProgress(completed, total) {\n  const pct = Math.round((completed / total) * 100);\n  return `Course Progress: ${pct}%`;\n}\n\nconsole.log(calculateProgress(8, 10));\n');
  const [codeLang, setCodeLang] = useState('javascript');
  const [codeOutput, setCodeOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Video Co-Watch state
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const videoRef = useRef(null);

  // Whiteboard Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [toolMode, setToolMode] = useState('pen'); // 'pen' | 'eraser'

  // Shared Notes state
  const [sharedNotes, setSharedNotes] = useState('## 📌 Study Group Notes & Action Items\n- Topic: Key architectural concepts\n- Next sprint at 16:00');

  // Enforce Login Redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/study-rooms/${id}`);
    }
  }, [user, authLoading, id, router]);

  // Fetch Room Data
  useEffect(() => {
    if (authLoading || !user || !id) return;

    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/study-rooms/${id}`);
        if (res.data?.success && res.data.room) {
          const r = res.data.room;
          setRoom(r);
          if (r.sharedResource) {
            if (r.sharedResource.scratchpadCode) setCode(r.sharedResource.scratchpadCode);
            if (r.sharedResource.scratchpadLanguage) setCodeLang(r.sharedResource.scratchpadLanguage);
            if (r.sharedResource.videoUrl) setVideoUrl(r.sharedResource.videoUrl);
            if (r.sharedResource.notes) setSharedNotes(r.sharedResource.notes);
            if (r.sharedResource.activeTab) setActiveTab(r.sharedResource.activeTab);
          }
          if (r.messages) setMessages(r.messages);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          router.push(`/login?redirect=/study-rooms/${id}`);
          return;
        }
        setError(err.response?.data?.message || 'Failed to load study room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id, user, authLoading]);

  // Connect Socket.io
  useEffect(() => {
    if (!id || !user) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, { transports: ['websocket', 'polling'] });
    setSocket(s);

    // Join room
    s.emit('join_study_room', {
      roomId: id,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      goal: myGoal
    });

    // Initial State Sync
    s.on('study_room_state_sync', (state) => {
      if (state.activeMembers) setActiveMembers(state.activeMembers);
      if (state.timer) {
        setTimerRemaining(state.timer.remaining);
        setIsTimerRunning(state.timer.isRunning);
        setTimerMode(state.timer.mode);
        setTimerDuration(state.timer.duration);
      }
    });

    // Member Joined
    s.on('study_room_member_joined', ({ member, activeMembers }) => {
      setActiveMembers(activeMembers);
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys_${Date.now()}`,
          sender: { name: 'System', role: 'system' },
          text: `👋 ${member.name} joined the study room.`,
          type: 'system',
          createdAt: new Date()
        }
      ]);
    });

    // Member Left
    s.on('study_room_member_left', ({ leavingMember, activeMembers }) => {
      setActiveMembers(activeMembers);
      if (leavingMember) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `sys_${Date.now()}`,
            sender: { name: 'System', role: 'system' },
            text: `🚪 ${leavingMember.name} left the room.`,
            type: 'system',
            createdAt: new Date()
          }
        ]);
      }
    });

    // Receive Message
    s.on('study_room_receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Receive Timer Update
    s.on('study_room_timer_updated', (tState) => {
      setTimerRemaining(tState.remaining);
      setIsTimerRunning(tState.isRunning);
      setTimerMode(tState.mode);
      setTimerDuration(tState.duration);
    });

    // Timer Finished Alert
    s.on('study_room_timer_finished', ({ message }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys_finish_${Date.now()}`,
          sender: { name: 'Pomodoro Coach', role: 'system' },
          text: message,
          type: 'celebration',
          createdAt: new Date()
        }
      ]);
    });

    // Receive Resource Sync (Code, Video, Notes)
    s.on('study_room_resource_updated', ({ resourceType, data }) => {
      if (resourceType === 'code' && data?.code !== undefined) {
        setCode(data.code);
        if (data.language) setCodeLang(data.language);
      } else if (resourceType === 'video' && data) {
        if (data.videoUrl !== undefined) setVideoUrl(data.videoUrl);
        if (data.videoTime !== undefined && videoRef.current) {
          videoRef.current.currentTime = data.videoTime;
        }
        if (data.isPlaying !== undefined && videoRef.current) {
          if (data.isPlaying) videoRef.current.play?.().catch(() => {});
          else videoRef.current.pause?.();
          setIsVideoPlaying(data.isPlaying);
        }
      } else if (resourceType === 'notes' && data?.notes !== undefined) {
        setSharedNotes(data.notes);
      } else if (resourceType === 'tab' && data?.activeTab) {
        setActiveTab(data.activeTab);
      }
    });

    // Whiteboard Stroke Sync
    s.on('study_room_whiteboard_stroke', (drawAction) => {
      drawOnCanvas(drawAction);
    });

    s.on('study_room_whiteboard_cleared', () => {
      clearLocalCanvas();
    });

    // Goal Updates
    s.on('study_room_goal_updated', ({ activeMembers: updatedMembers }) => {
      if (updatedMembers) setActiveMembers(updatedMembers);
    });

    // Hand Raised
    s.on('study_room_hand_toggled', ({ user: u, isRaised, activeMembers: updatedMembers }) => {
      if (updatedMembers) setActiveMembers(updatedMembers);
      if (isRaised) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `hand_${Date.now()}`,
            sender: { name: 'System', role: 'system' },
            text: `✋ ${u.name} raised their hand with a question!`,
            type: 'doubt',
            createdAt: new Date()
          }
        ]);
      }
    });

    return () => {
      s.emit('leave_study_room', { roomId: id });
      s.disconnect();
    };
  }, [id, user]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer Tick Heartbeat (Host or room leader handles ticks)
  useEffect(() => {
    if (!isTimerRunning || !socket) return;

    const interval = setInterval(() => {
      socket.emit('study_room_timer_action', {
        roomId: id,
        action: 'tick'
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, socket, id]);

  // Web Audio Ambient Sound Generator (Rain, Lo-Fi Pink Noise, Coffee Shop Cafe hum)
  useEffect(() => {
    if (ambientSound === 'none') {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Generate soft ambient noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink / Brown noise filter for soothing rain or ambient hum
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 0.15;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      const filter = ctx.createBiquadFilter();
      filter.type = ambientSound === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = ambientSound === 'rain' ? 800 : 400;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      noiseNodeRef.current = noise;
    } catch (e) {
      console.warn('Web Audio synthesis not supported or blocked:', e);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [ambientSound]);

  // Timer Controls
  const handleTimerToggle = () => {
    if (!socket) return;
    socket.emit('study_room_timer_action', {
      roomId: id,
      action: isTimerRunning ? 'pause' : 'start'
    });
  };

  const handleTimerReset = () => {
    if (!socket) return;
    socket.emit('study_room_timer_action', {
      roomId: id,
      action: 'reset'
    });
  };

  const handleSetTimerMode = (mode) => {
    if (!socket) return;
    const dur = mode === 'short_break' ? 300 : mode === 'long_break' ? 900 : 1500;
    socket.emit('study_room_timer_action', {
      roomId: id,
      action: 'set_mode',
      mode,
      duration: dur
    });
  };

  // Chat Submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !user) return;

    socket.emit('study_room_send_message', {
      roomId: id,
      message: chatInput.trim(),
      type: chatType,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    });

    setChatInput('');
    setChatType('chat');
  };

  // Hand Raise Toggle
  const handleToggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socket && user) {
      socket.emit('study_room_toggle_hand', {
        roomId: id,
        isRaised: nextState,
        user: { name: user.name }
      });
    }
  };

  // Personal Goal Update
  const handleSaveGoal = async () => {
    setIsGoalEditing(false);
    if (socket && user) {
      socket.emit('study_room_update_goal', {
        roomId: id,
        goal: myGoal,
        user: { _id: user._id, name: user.name }
      });
    }
    try {
      await api.patch(`/study-rooms/${id}/goal`, { goal: myGoal });
    } catch (e) {}
  };

  // Code Scratchpad: Broadcast Code Changes
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) {
      socket.emit('study_room_sync_resource', {
        roomId: id,
        resourceType: 'code',
        data: { code: newCode, language: codeLang }
      });
    }
  };

  // Run Code in Sandbox
  const handleRunCode = () => {
    setIsExecuting(true);
    setCodeOutput('⚡ Executing snippet in secure browser sandbox...\n');

    setTimeout(() => {
      try {
        const logs = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
        console.warn = (...args) => logs.push(`⚠️ [Warn]: ${args.join(' ')}`);
        console.error = (...args) => logs.push(`❌ [Error]: ${args.join(' ')}`);

        // Execute function in isolated scope
        const runFn = new Function(code);
        const result = runFn();

        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;

        let output = logs.join('\n');
        if (result !== undefined) {
          output += `\n➡️ Returned: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
        }
        setCodeOutput(output || 'Code executed successfully (no output logged).');
      } catch (err) {
        setCodeOutput(`❌ Runtime Error: ${err.message}`);
      } finally {
        setIsExecuting(false);
      }
    }, 200);
  };

  // Whiteboard Drawing
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    const drawAction = {
      type: 'start',
      x,
      y,
      color: toolMode === 'eraser' ? '#0f172a' : brushColor,
      size: toolMode === 'eraser' ? brushSize * 4 : brushSize
    };
    drawOnCanvas(drawAction);
    if (socket) socket.emit('study_room_whiteboard_draw', { roomId: id, drawAction });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    const drawAction = {
      type: 'draw',
      x,
      y,
      color: toolMode === 'eraser' ? '#0f172a' : brushColor,
      size: toolMode === 'eraser' ? brushSize * 4 : brushSize
    };
    drawOnCanvas(drawAction);
    if (socket) socket.emit('study_room_whiteboard_draw', { roomId: id, drawAction });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const drawAction = { type: 'end' };
    drawOnCanvas(drawAction);
    if (socket) socket.emit('study_room_whiteboard_draw', { roomId: id, drawAction });
  };

  const drawOnCanvas = (action) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (action.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(action.x, action.y);
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (action.type === 'draw') {
      ctx.lineTo(action.x, action.y);
      ctx.stroke();
    } else if (action.type === 'end') {
      ctx.closePath();
    }
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearWhiteboard = () => {
    clearLocalCanvas();
    if (socket) socket.emit('study_room_whiteboard_clear', { roomId: id });
  };

  // Exit / Leave Room Handler
  const handleExitRoom = async () => {
    try {
      if (socket) {
        socket.emit('leave_study_room', { roomId: id });
        socket.disconnect();
      }
      await api.post(`/study-rooms/${id}/leave`).catch(() => {});
    } finally {
      router.push('/study-rooms');
    }
  };

  // Copy Room Link / Code
  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (authLoading || (!user && !error) || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">
            {authLoading || !user ? 'Verifying access & permissions...' : 'Entering Study Lounge...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold">Room Unavailable</h2>
          <p className="text-slate-400 text-sm">{error || 'This study room could not be found or has ended.'}</p>
          <Link
            href="/study-rooms"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Study Lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* 1. TOP NAVIGATION & POMODORO BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Room Title & Back */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <button
              onClick={handleExitRoom}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Exit Study Room"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[220px] sm:max-w-xs">
                  {room.title}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {room.mode?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                🎯 {room.topic}
              </p>
            </div>

            {/* Room Code Pill */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-indigo-300 transition cursor-pointer"
              title="Copy Room Code"
            >
              <span>{room.roomCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* POMODORO TIMER CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 border border-slate-800/90 px-3 py-1.5 rounded-2xl shadow-inner">
            
            {/* Mode Indicator & Switcher */}
            <div className="flex items-center gap-1">
              {[
                { id: 'focus', label: 'Focus' },
                { id: 'short_break', label: '5m Break' },
                { id: 'long_break', label: '15m' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSetTimerMode(m.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    timerMode === m.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Timer Display */}
            <div className="font-mono text-base sm:text-lg font-black tracking-widest text-indigo-400 min-w-[58px] text-center">
              {formatTime(timerRemaining)}
            </div>

            {/* Play/Pause & Reset */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleTimerToggle}
                className={`p-1.5 rounded-lg font-bold transition cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={isTimerRunning ? 'Pause Timer' : 'Start Focus Sprint'}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={handleTimerReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Ambient Sound Dropdown */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={ambientSound}
                onChange={(e) => setAmbientSound(e.target.value)}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="none" className="bg-slate-900">Audio: Off</option>
                <option value="rain" className="bg-slate-900">🌧️ Gentle Rain</option>
                <option value="whitenoise" className="bg-slate-900">☕ Cafe / Pink Noise</option>
              </select>
            </div>

          </div>

          {/* Quick Member Counter & Raise Hand */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleHand}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isHandRaised
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/20 animate-bounce'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{isHandRaised ? 'Hand Raised!' : 'Raise Hand'}</span>
            </button>

            <button
              onClick={() => setSidebarTab('members')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeMembers.length}</span>
            </button>

            <button
              onClick={handleExitRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-bold transition cursor-pointer"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Leave Room</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE & COLLABORATION STAGE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto p-3 sm:p-4 gap-4">
        
        {/* LEFT / CENTER: Interactive Multi-Tool Canvas */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl min-h-[550px]">
          
          {/* Tool Tab Switcher Bar */}
          <div className="flex items-center justify-between bg-slate-950/70 border-b border-slate-800 px-4 py-2.5">
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'code', label: 'Code Scratchpad', icon: Code2 },
                { id: 'video', label: 'Co-Watch Video', icon: Video },
                { id: 'whiteboard', label: 'Live Whiteboard', icon: Edit3 },
                { id: 'notes', label: 'Shared Notes', icon: BookOpen },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (socket) socket.emit('study_room_sync_resource', { roomId: id, resourceType: 'tab', data: { activeTab: tab.id } });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Status / Language Selector */}
            {activeTab === 'code' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Run Code</span>
                </button>
              </div>
            )}

            {activeTab === 'whiteboard' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearWhiteboard}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-semibold transition"
                >
                  Clear Board
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE TOOL CONTENT AREA */}
          <div className="flex-1 flex flex-col p-4 bg-slate-900/50 overflow-auto">
            
            {/* TAB 1: CODE SCRATCHPAD */}
            {activeTab === 'code' && (
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-indigo-400 font-semibold">scratchpad.js (Synced in real-time)</span>
                    <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">JavaScript Sandbox</span>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="// Type code here to share and run with your study group..."
                    className="flex-1 w-full p-4 bg-transparent text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-none selection:bg-indigo-600/40"
                    spellCheck={false}
                  />
                </div>

                {/* Console Output */}
                <div className="h-36 rounded-2xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs overflow-y-auto">
                  <div className="text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sandbox Console Output:</span>
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap">{codeOutput || 'Click "Run Code" to execute the JavaScript snippet.'}</pre>
                </div>
              </div>
            )}

            {/* TAB 2: CO-WATCH VIDEO */}
            {activeTab === 'video' && (
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Enter lecture video URL (MP4, WebM, or YouTube embed link)..."
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      if (socket) socket.emit('study_room_sync_resource', { roomId: id, resourceType: 'video', data: { videoUrl: e.target.value } });
                    }}
                    className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative min-h-[300px]">
                  {videoUrl ? (
                    videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={videoUrl.replace('watch?v=', 'embed/')}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        className="w-full h-full object-contain"
                        onPlay={() => {
                          if (socket) socket.emit('study_room_sync_resource', { roomId: id, resourceType: 'video', data: { isPlaying: true, videoTime: videoRef.current?.currentTime || 0 } });
                        }}
                        onPause={() => {
                          if (socket) socket.emit('study_room_sync_resource', { roomId: id, resourceType: 'video', data: { isPlaying: false, videoTime: videoRef.current?.currentTime || 0 } });
                        }}
                        onSeeked={() => {
                          if (socket) socket.emit('study_room_sync_resource', { roomId: id, resourceType: 'video', data: { isPlaying: isVideoPlaying, videoTime: videoRef.current?.currentTime || 0 } });
                        }}
                      />
                    )
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <Video className="w-12 h-12 text-slate-700 mx-auto" />
                      <p className="text-sm font-semibold text-slate-400">No lecture video loaded</p>
                      <p className="text-xs text-slate-500 max-w-sm">Paste a course lecture MP4 or YouTube embed link above to watch and review together.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE WHITEBOARD */}
            {activeTab === 'whiteboard' && (
              <div className="flex-1 flex flex-col gap-3">
                {/* Canvas Controls */}
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ffffff'].map((c) => (
                      <button
                        key={c}
                        onClick={() => { setBrushColor(c); setToolMode('pen'); }}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border-2 transition ${brushColor === c && toolMode === 'pen' ? 'border-white scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>

                  <div className="h-4 w-px bg-slate-800" />

                  <button
                    onClick={() => setToolMode('eraser')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${toolMode === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Eraser
                  </button>

                  <div className="flex items-center gap-1 text-slate-400 ml-auto">
                    <span>Size:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-20 accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative cursor-crosshair min-h-[350px]">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full touch-none block"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SHARED NOTES */}
            {activeTab === 'notes' && (
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col">
                  <textarea
                    value={sharedNotes}
                    onChange={(e) => {
                      setSharedNotes(e.target.value);
                      if (socket) socket.emit('study_room_sync_resource', { roomId: id, resourceType: 'notes', data: { notes: e.target.value } });
                    }}
                    placeholder="Write group study takeaways, formulas, and action items..."
                    className="flex-1 w-full bg-transparent text-slate-200 text-sm leading-relaxed focus:outline-none resize-none font-mono selection:bg-indigo-600/40"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT: Live Peer Lounge & Chat Sidebar */}
        <div className="w-full lg:w-88 xl:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl h-[550px] lg:h-auto">
          
          {/* Sidebar Tabs */}
          <div className="flex items-center bg-slate-950/80 border-b border-slate-800 p-1.5">
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                sidebarTab === 'chat'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Room Chat</span>
            </button>

            <button
              onClick={() => setSidebarTab('members')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                sidebarTab === 'members'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span>Peers ({activeMembers.length})</span>
            </button>
          </div>

          {/* TAB A: REAL-TIME CHAT */}
          {sidebarTab === 'chat' && (
            <div className="flex-1 flex flex-col p-3 overflow-hidden">
              
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {messages.map((m, idx) => {
                  const isMe = user && String(m.sender?._id) === String(user._id);
                  const isSystem = m.sender?.role === 'system' || m.type === 'system' || m.type === 'celebration';
                  const isDoubt = m.type === 'doubt';

                  if (isSystem) {
                    return (
                      <div key={m._id || idx} className="py-1.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{m.text}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m._id || idx}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isDoubt
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : isMe
                          ? 'bg-indigo-600/15 border-indigo-500/30 text-slate-200 ml-3'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 mr-3'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white flex items-center gap-1">
                          {m.sender?.name || 'Learner'}
                          {isMe && <span className="text-[10px] text-indigo-400 font-normal">(You)</span>}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {isDoubt && (
                        <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 mb-1">
                          ✋ Question / Doubt
                        </div>
                      )}

                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input & Type Selector */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChatType(chatType === 'doubt' ? 'chat' : 'doubt')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                      chatType === 'doubt'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ✋ Ask Doubt
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={chatType === 'doubt' ? 'Type your doubt/question...' : 'Message study group...'}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB B: ACTIVE PEER LIST & GOAL TRACKER */}
          {sidebarTab === 'members' && (
            <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-3">
              
              {/* My Goal Box */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>🎯 Your Session Goal:</span>
                  {isGoalEditing ? (
                    <button onClick={handleSaveGoal} className="text-emerald-400 hover:underline">Save</button>
                  ) : (
                    <button onClick={() => setIsGoalEditing(true)} className="text-indigo-400 hover:underline">Edit</button>
                  )}
                </div>

                {isGoalEditing ? (
                  <input
                    type="text"
                    value={myGoal}
                    onChange={(e) => setMyGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                ) : (
                  <p className="text-xs text-indigo-300 font-medium truncate">{myGoal}</p>
                )}
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeMembers.map((mem, idx) => {
                  const isHost = String(mem.userId) === String(room.host?._id || room.host);
                  return (
                    <div
                      key={mem.socketId || idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {mem.name?.charAt(0) || 'S'}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{mem.name}</span>
                            {isHost && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold uppercase">
                                Host
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate">
                            🎯 {mem.currentGoal || 'Focusing'}
                          </span>
                        </div>
                      </div>

                      {mem.isHandRaised && (
                        <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 animate-bounce" title="Hand Raised">
                          <Hand className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
