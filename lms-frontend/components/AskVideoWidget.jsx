'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Search, Sparkles, Play, Clock, ArrowRight, Loader2, 
  HelpCircle, CheckCircle2, ChevronRight, FileText, 
  Flame, Zap, BookOpen, Volume2, CornerDownRight, X, ExternalLink
} from 'lucide-react';
import api from '../lib/api';

const PRESET_QUESTIONS = [
  'Where is the core concept explained?',
  'Where is the live code implementation?',
  'Where are debugging & error handling shown?',
  'Where are performance best practices covered?',
  'What are the key summary takeaways?'
];

export default function AskVideoWidget({
  lesson,
  course,
  currentPlaybackSeconds = 0,
  onSeekVideo,
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState('ask'); // 'ask' | 'transcript'
  const [jumpNotice, setJumpNotice] = useState(null);
  const searchInputRef = useRef(null);
  const activeTranscriptRef = useRef(null);

  // Fetch initial transcript when lesson changes
  useEffect(() => {
    if (!lesson?._id) return;
    setSearchResult(null);
    setQuery('');

    const fetchTranscript = async () => {
      setLoadingTranscript(true);
      try {
        const res = await api.get(`/ai/transcript/${lesson._id}`, {
          params: {
            title: lesson.title,
            duration: lesson.duration || 10,
          }
        });
        if (res.data?.success) {
          setTranscript(res.data.transcript || []);
        }
      } catch (err) {
        console.warn('Transcript fetch error:', err);
      } finally {
        setLoadingTranscript(false);
      }
    };

    fetchTranscript();
  }, [lesson?._id, lesson?.title]);

  // Execute Semantic Search
  const handleSearch = async (overrideQuery = null) => {
    const q = (overrideQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setActiveTab('ask');

    try {
      const res = await api.post('/ai/ask-video', {
        query: q,
        lessonId: lesson?._id,
        lessonTitle: lesson?.title || 'Video Lecture',
        courseTitle: course?.title || '',
        duration: lesson?.duration || 10,
      });

      if (res.data?.success) {
        setSearchResult(res.data);
        if (res.data.transcript && res.data.transcript.length > 0) {
          setTranscript(res.data.transcript);
        }
      }
    } catch (err) {
      console.warn('Ask video search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Jump to specific second in video player
  const handleJumpToTime = (seconds, label = '') => {
    if (typeof onSeekVideo === 'function') {
      onSeekVideo(seconds);
      setJumpNotice(`Jumping to ${label || formatTime(seconds)}...`);
      setTimeout(() => setJumpNotice(null), 2500);

      // Smooth scroll to top video container
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const formatTime = (secs) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  // Find currently active transcript segment based on video playback seconds
  const activeSegmentIndex = transcript.findIndex((seg, idx) => {
    const nextSeg = transcript[idx + 1];
    if (nextSeg) {
      return currentPlaybackSeconds >= seg.seconds && currentPlaybackSeconds < nextSeg.seconds;
    }
    return currentPlaybackSeconds >= seg.seconds;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-900 font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 p-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-white tracking-tight">
                Ask the Video
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                AI Semantic Jump
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask anything taught in this lecture to jump straight to the exact second.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>AI Search</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Interactive Transcript</span>
            {transcript.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-700 text-slate-300">
                {transcript.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Jumping Notification Toast */}
      {jumpNotice && (
        <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-between animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>{jumpNotice}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: AI NATURAL LANGUAGE SEARCH & TIMESTAMP JUMPING
          ========================================================================= */}
      {activeTab === 'ask' && (
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Search Bar Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center"
          >
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Ask anything about "${lesson?.title || 'this video'}"... (e.g. "Where is error handling explained?")`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-28 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300/80 focus:border-indigo-500 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Query Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Suggested Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUESTIONS.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(pq);
                    handleSearch(pq);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/80 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>{pq}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800">Analyzing Video Lecture...</h4>
                <p className="text-xs text-slate-500">Scanning transcript segments and mapping concept timestamps.</p>
              </div>
            </div>
          )}

          {/* Search Result Card with Jump Buttons */}
          {searchResult && !loading && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Primary AI Answer Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-violet-50/60 to-white border border-indigo-200/80 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-indigo-950 uppercase tracking-wider">
                      AI Direct Answer
                    </span>
                  </div>

                  {/* Primary Video Jump Button */}
                  {searchResult.primaryTimestamp && (
                    <button
                      onClick={() => handleJumpToTime(
                        searchResult.primaryTimestamp.seconds,
                        searchResult.primaryTimestamp.formattedTime
                      )}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/25 transition transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Jump to {searchResult.primaryTimestamp.formattedTime}</span>
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  {searchResult.directAnswer}
                </p>

                {searchResult.primaryTimestamp && (
                  <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-xs text-indigo-900 block">
                        Timestamp {searchResult.primaryTimestamp.formattedTime} — {searchResult.primaryTimestamp.topic}
                      </span>
                      <p className="text-xs text-slate-600 italic mt-0.5">
                        "{searchResult.primaryTimestamp.snippet}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Related Key Moments */}
              {searchResult.relatedMoments && searchResult.relatedMoments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Other Related Moments in This Video:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResult.relatedMoments.map((moment, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleJumpToTime(moment.seconds, moment.formattedTime)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 transition cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-mono font-bold text-[11px] shrink-0">
                            {moment.formattedTime}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-indigo-600 transition">
                              {moment.topic}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {moment.snippet}
                            </span>
                          </div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: LIVE SYNCHRONIZED TRANSCRIPT VIEWER
          ========================================================================= */}
      {activeTab === 'transcript' && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Lecture Transcript</h4>
              <p className="text-xs text-slate-500">Click any paragraph to seek the video to that exact timestamp.</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              Playing: {formatTime(currentPlaybackSeconds)}
            </span>
          </div>

          {loadingTranscript ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading time-coded transcript...</p>
            </div>
          ) : transcript.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No transcript available for this lecture.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-2 divide-y divide-slate-100">
              {transcript.map((seg, idx) => {
                const isActive = activeSegmentIndex === idx;
                return (
                  <div
                    key={idx}
                    ref={isActive ? activeTranscriptRef : null}
                    onClick={() => handleJumpToTime(seg.seconds, seg.timestamp)}
                    className={`pt-3 p-3 rounded-2xl transition cursor-pointer flex items-start gap-3.5 ${
                      isActive
                        ? 'bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Timestamp Tag */}
                    <button
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold shrink-0 transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{seg.timestamp}</span>
                    </button>

                    {/* Segment Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {seg.title && (
                        <span className={`text-xs font-bold block ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {seg.title}
                        </span>
                      )}
                      <p className="text-xs leading-relaxed font-normal">
                        {seg.text}
                      </p>
                    </div>

                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
