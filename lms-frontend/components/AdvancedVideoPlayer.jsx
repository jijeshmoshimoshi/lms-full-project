'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, 
  Minimize2, Settings, Subtitles, CheckCircle2, BookmarkPlus, 
  Clock, Trash2, ChevronDown, Check, Sparkles, AlertCircle, FastForward
} from 'lucide-react';
import api from '../lib/api';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function AdvancedVideoPlayer({
  lesson,
  courseId,
  isEnrolled,
  isCompleted,
  onMarkComplete,
  onNextLesson,
  onTimeUpdate,
  playerRef,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const progressSaveTimerRef = useRef(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef(null);

  // Streaming & Quality
  const [streamType, setStreamType] = useState('direct'); // 'hls' | 'dash' | 'direct' | 'embed'
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState('main'); // 'main' | 'speed' | 'quality'

  // Subtitles / Captions
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  // Resume from last position
  const [resumePrompt, setResumePrompt] = useState(null); // { seconds, formatted }
  const [hasResumed, setHasResumed] = useState(false);

  // Timestamp Notes
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Auto completion flag
  const autoCompletedRef = useRef(false);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null) return '00:00';
    const totalSeconds = Math.floor(secs);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const h = Math.floor(m / 60);
    const displayM = m % 60;
    if (h > 0) {
      return `${h}:${displayM < 10 ? '0' : ''}${displayM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${displayM < 10 ? '0' : ''}${displayM}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper to determine stream type
  const detectStreamType = (url, declaredType) => {
    if (!url) return 'none';
    if (declaredType === 'hls' || url.includes('.m3u8')) return 'hls';
    if (declaredType === 'dash' || url.includes('.mpd')) return 'dash';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'direct';
  };

  // 1. Fetch saved playback position & notes
  const fetchProgressAndNotes = useCallback(async () => {
    if (!lesson?._id || !courseId) return;
    autoCompletedRef.current = false;

    // LocalStorage fallback key
    const localKey = `lms_progress_${courseId}_${lesson._id}`;
    let savedSecs = 0;

    if (isEnrolled) {
      try {
        const [posRes, notesRes] = await Promise.allSettled([
          api.get(`/enrollments/playback-position/${courseId}/${lesson._id}`),
          api.get(`/enrollments/notes/${courseId}/${lesson._id}`),
        ]);

        if (posRes.status === 'fulfilled' && posRes.value?.data?.seconds > 5) {
          savedSecs = posRes.value.data.seconds;
        } else {
          const localVal = parseFloat(localStorage.getItem(localKey) || '0');
          if (localVal > 5) savedSecs = localVal;
        }

        if (notesRes.status === 'fulfilled' && notesRes.value?.data?.notes) {
          setNotes(notesRes.value.data.notes);
        }
      } catch (err) {
        console.error('Error loading video progress or notes:', err);
      }
    } else {
      const localVal = parseFloat(localStorage.getItem(localKey) || '0');
      if (localVal > 5) savedSecs = localVal;
    }

    if (savedSecs > 5) {
      setResumePrompt({
        seconds: savedSecs,
        formatted: formatTime(savedSecs),
      });
    } else {
      setResumePrompt(null);
    }
  }, [lesson?._id, courseId, isEnrolled]);

  useEffect(() => {
    fetchProgressAndNotes();
  }, [fetchProgressAndNotes]);

  // 2. Initialize video & HLS player
  useEffect(() => {
    if (!lesson?.videoUrl || !videoRef.current) return;
    const video = videoRef.current;
    const detectedType = detectStreamType(lesson.videoUrl, lesson.videoType);
    setStreamType(detectedType);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (detectedType === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(lesson.videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          const lvls = data.levels.map((lvl, index) => ({
            id: index,
            height: lvl.height,
            label: `${lvl.height}p`,
            bitrate: lvl.bitrate,
          }));
          setQualities(lvls);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          // Track active level
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = lesson.videoUrl;
      }
    } else if (detectedType === 'direct') {
      video.src = lesson.videoUrl;
      setQualities([
        { id: -1, label: 'Auto (Original)' },
        { id: 1080, label: '1080p HD' },
        { id: 720, label: '720p' },
        { id: 480, label: '480p' },
      ]);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lesson?.videoUrl, lesson?.videoType]);

  // 3. Auto-save playback position periodically
  const savePlaybackPosition = useCallback((secs) => {
    if (!courseId || !lesson?._id || isNaN(secs)) return;
    const localKey = `lms_progress_${courseId}_${lesson._id}`;
    localStorage.setItem(localKey, secs.toString());

    if (isEnrolled) {
      api.post('/enrollments/playback-position', {
        courseId,
        lessonId: lesson._id,
        seconds: Math.floor(secs),
      }).catch(() => {});
    }
  }, [courseId, lesson?._id, isEnrolled]);

  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        seekTo: (secs) => {
          if (videoRef.current) {
            videoRef.current.currentTime = secs;
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        },
      };
    }
  }, [playerRef]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(cur);
    if (onTimeUpdate) onTimeUpdate(cur);

    if (dur && !isNaN(dur)) {
      setDuration(dur);

      // Auto complete at 90% of duration
      if (!autoCompletedRef.current && !isCompleted && cur / dur >= 0.9) {
        autoCompletedRef.current = true;
        if (onMarkComplete) onMarkComplete(lesson._id);
      }
    }

    // Throttle progress save
    if (!progressSaveTimerRef.current) {
      progressSaveTimerRef.current = setTimeout(() => {
        savePlaybackPosition(cur);
        progressSaveTimerRef.current = null;
      }, 4000);
    }
  };

  // 4. Resume actions
  const handleApplyResume = () => {
    if (!videoRef.current || !resumePrompt) return;
    videoRef.current.currentTime = resumePrompt.seconds;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setHasResumed(true);
    setResumePrompt(null);
  };

  const handleDismissResume = () => {
    setResumePrompt(null);
  };

  // 5. Playback Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pos * duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettingsMenu(false);
  };

  const handleQualityChange = (qualityId) => {
    setCurrentQuality(qualityId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
    }
    setShowSettingsMenu(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 6. Subtitles track toggle
  const toggleSubtitles = () => {
    setSubtitlesEnabled((prev) => !prev);
    if (videoRef.current && videoRef.current.textTracks) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = subtitlesEnabled ? 'disabled' : 'showing';
      }
    }
  };

  // 7. Timestamp Notes
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || !lesson?._id || !courseId) return;

    const noteTimestamp = Math.floor(videoRef.current ? videoRef.current.currentTime : currentTime);
    try {
      const res = await api.post('/enrollments/notes', {
        courseId,
        lessonId: lesson._id,
        timestamp: noteTimestamp,
        text: noteInput.trim(),
      });

      setNotes((prev) => [...prev, res.data].sort((a, b) => a.timestamp - b.timestamp));
      setNoteInput('');
      setIsAddingNote(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/enrollments/notes/${courseId}/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const handleJumpToTimestamp = (timestamp) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestamp;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  // Hide controls on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  // Embed format for YouTube/Vimeo
  if (streamType === 'youtube' || streamType === 'vimeo') {
    let embedSrc = lesson.videoUrl;
    if (streamType === 'youtube') {
      const match = lesson.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) embedSrc = `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1`;
    } else if (streamType === 'vimeo') {
      const match = lesson.videoUrl.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) embedSrc = `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    }

    return (
      <div className="space-y-6">
        <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          <iframe
            src={embedSrc}
            title={lesson.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group select-none flex items-center justify-center"
      >
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (!autoCompletedRef.current && !isCompleted && onMarkComplete) {
              autoCompletedRef.current = true;
              onMarkComplete(lesson._id);
            }
          }}
          onClick={togglePlay}
          playsInline
          crossOrigin="anonymous"
          className="w-full h-full object-contain cursor-pointer"
        >
          {lesson.subtitlesUrl && (
            <track
              kind="subtitles"
              src={lesson.subtitlesUrl}
              srcLang="en"
              label={lesson.subtitlesLabel || 'English'}
              default={subtitlesEnabled}
            />
          )}
        </video>

        {/* Big Center Play/Pause Watermark on click */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute w-20 h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md hover:scale-110 hover:bg-indigo-500 transition duration-300 pointer-events-auto"
          >
            <Play className="w-9 h-9 ml-1 fill-current" />
          </button>
        )}

        {/* Resume-from-last-position Toast Notification */}
        {resumePrompt && (
          <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto z-40 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 text-white p-3.5 px-5 rounded-2xl shadow-xl flex items-center gap-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold">Resume playback?</p>
              <p className="text-slate-400">You previously paused at <strong className="text-indigo-300">{resumePrompt.formatted}</strong></p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleApplyResume}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
              >
                Resume
              </button>
              <button
                onClick={handleDismissResume}
                className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Top Info Bar (Lesson Title & Badges) */}
        <div
          className={`absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white transition-opacity duration-300 pointer-events-none ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-500/30">
              {streamType === 'hls' ? 'HLS Adaptive' : 'HD Video'}
            </span>
            <span className="font-bold text-sm truncate max-w-md">{lesson.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {lesson.isFreePreview && (
              <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Free Preview
              </span>
            )}
          </div>
        </div>

        {/* Bottom Custom Controls Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 transition-opacity duration-300 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress / Scrub Bar */}
          <div
            onClick={handleSeek}
            className="group/bar relative w-full h-1.5 hover:h-3 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all duration-150 flex items-center"
          >
            {/* Played Bar */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full relative"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md scale-0 group-hover/bar:scale-100 transition-transform duration-150" />
            </div>

            {/* Note Markers on Timeline */}
            {notes.map((note) => {
              const notePos = duration ? (note.timestamp / duration) * 100 : 0;
              return (
                <div
                  key={note._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJumpToTimestamp(note.timestamp);
                  }}
                  title={`Note: ${note.text}`}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 border border-black hover:scale-150 transition-transform cursor-pointer"
                  style={{ left: `${notePos}%` }}
                />
              );
            })}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white text-xs">
            {/* Left Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="p-1.5 hover:text-indigo-400 transition"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* 10s Backward */}
              <button
                onClick={() => skipTime(-10)}
                className="p-1.5 hover:text-indigo-400 transition"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* 10s Forward */}
              <button
                onClick={() => skipTime(10)}
                className="p-1.5 hover:text-indigo-400 transition"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume & Slider */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:text-indigo-400 transition"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500 opacity-70 group-hover/volume:opacity-100 transition-opacity"
                />
              </div>

              {/* Timestamp Display */}
              <span className="text-[11px] font-mono text-slate-300 font-semibold">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3 relative">
              {/* Subtitles (CC) Toggle */}
              {lesson.subtitlesUrl && (
                <button
                  onClick={toggleSubtitles}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    subtitlesEnabled
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Captions / Subtitles"
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>CC</span>
                </button>
              )}

              {/* Playback Speed Menu Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettingsMenu((prev) => !prev);
                    setSettingsTab('speed');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1"
                  title="Playback Speed"
                >
                  <span>{playbackSpeed}x</span>
                </button>
              </div>

              {/* Quality & Settings Menu Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettingsMenu((prev) => !prev);
                    setSettingsTab('main');
                  }}
                  className="p-1.5 hover:text-indigo-400 rounded-lg transition"
                  title="Settings & Quality"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Settings Dropdown Popover */}
                {showSettingsMenu && (
                  <div className="absolute bottom-10 right-0 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-2 shadow-2xl text-xs z-50 animate-fadeIn">
                    {settingsTab === 'main' && (
                      <div className="space-y-1">
                        <button
                          onClick={() => setSettingsTab('speed')}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition"
                        >
                          <span className="font-semibold text-slate-300">Speed</span>
                          <span className="text-indigo-400 font-bold">{playbackSpeed}x</span>
                        </button>
                        <button
                          onClick={() => setSettingsTab('quality')}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition"
                        >
                          <span className="font-semibold text-slate-300">Quality</span>
                          <span className="text-indigo-400 font-bold">
                            {currentQuality === -1 ? 'Auto' : `${currentQuality}p`}
                          </span>
                        </button>
                      </div>
                    )}

                    {settingsTab === 'speed' && (
                      <div>
                        <div className="flex items-center justify-between p-2 border-b border-slate-800 mb-1">
                          <span className="font-bold text-slate-200">Playback Speed</span>
                          <button
                            onClick={() => setSettingsTab('main')}
                            className="text-slate-400 hover:text-white"
                          >
                            Back
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {SPEEDS.map((spd) => (
                            <button
                              key={spd}
                              onClick={() => handleSpeedChange(spd)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition ${
                                playbackSpeed === spd ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              <span>{spd}x {spd === 1 && '(Normal)'}</span>
                              {playbackSpeed === spd && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {settingsTab === 'quality' && (
                      <div>
                        <div className="flex items-center justify-between p-2 border-b border-slate-800 mb-1">
                          <span className="font-bold text-slate-200">Stream Quality</span>
                          <button
                            onClick={() => setSettingsTab('main')}
                            className="text-slate-400 hover:text-white"
                          >
                            Back
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition ${
                              currentQuality === -1 ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/10 text-slate-300'
                            }`}
                          >
                            <span>Auto (Adaptive)</span>
                            {currentQuality === -1 && <Check className="w-3.5 h-3.5" />}
                          </button>

                          {qualities.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => handleQualityChange(q.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition ${
                                currentQuality === q.id ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              <span>{q.label}</span>
                              {currentQuality === q.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:text-indigo-400 transition"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Timestamp Notes Panel */}
      {isEnrolled && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-indigo-600" />
                <span>Timestamped Study Notes</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Take notes tied to video timestamps. Click any timestamp to jump straight to that moment in the video.
              </p>
            </div>

            <button
              onClick={() => setIsAddingNote((prev) => !prev)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Note at {formatTime(currentTime)}</span>
            </button>
          </div>

          {/* Add Note Form */}
          {isAddingNote && (
            <form onSubmit={handleAddNote} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                <span>Add Note at {formatTime(currentTime)}</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <textarea
                rows={2}
                placeholder="What did you learn at this timestamp? E.g., Key formula explained here..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No notes taken for this lecture yet. Click "Note at {formatTime(currentTime)}" to save your first takeaway!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200/80 transition flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <button
                      onClick={() => handleJumpToTimestamp(note.timestamp)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-mono font-bold text-[11px] hover:bg-indigo-600 hover:text-white transition"
                      title="Jump to this video timestamp"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{formatTime(note.timestamp)}</span>
                    </button>
                    <p className="text-xs text-slate-700 font-medium break-words">{note.text}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
