'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark,
  FileText,
  Clock,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export default function LessonNotesBookmarks({
  lesson,
  course,
  currentPlaybackSeconds = 0,
  onSeekVideo,
  onSelectLesson,
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'bookmarks'

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [notesScope, setNotesScope] = useState('lesson'); // 'lesson' | 'course'
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Bookmarks state
  const [bookmarkedLessons, setBookmarkedLessons] = useState([]);
  const [isCurrentBookmarked, setIsCurrentBookmarked] = useState(false);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [togglingBookmark, setTogglingBookmark] = useState(false);

  useEffect(() => {
    if (!course?._id) return;
    fetchBookmarks();
    if (activeTab === 'notes') {
      fetchNotes();
    }
  }, [course?._id, lesson?._id, activeTab, notesScope]);

  const fetchNotes = async () => {
    if (!course?._id) return;
    try {
      setLoadingNotes(true);
      let res;
      if (notesScope === 'lesson' && lesson?._id) {
        res = await api.get(`/enrollments/notes/${course._id}/${lesson._id}`);
      } else {
        res = await api.get(`/enrollments/all-notes/${course._id}`);
      }
      if (res.data?.notes) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!course?._id) return;
    try {
      setLoadingBookmarks(true);
      const res = await api.get(`/enrollments/bookmarks/${course._id}`);
      if (res.data?.bookmarkedLessons) {
        setBookmarkedLessons(res.data.bookmarkedLessons);
        if (lesson?._id) {
          const isBookmarked = res.data.bookmarkedLessons.some(
            (b) => String(b._id || b) === String(lesson._id)
          );
          setIsCurrentBookmarked(isBookmarked);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!course?._id || !lesson?._id || togglingBookmark) return;

    try {
      setTogglingBookmark(true);
      const res = await api.post('/enrollments/bookmark', {
        courseId: course._id,
        lessonId: lesson._id,
      });

      if (res.data?.success) {
        setIsCurrentBookmarked(res.data.isBookmarked);
        fetchBookmarks();
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      alert(err.response?.data?.message || 'Failed to update bookmark');
    } finally {
      setTogglingBookmark(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !course?._id || !lesson?._id) return;

    try {
      setSavingNote(true);
      const timestampSeconds = Math.max(0, Math.floor(currentPlaybackSeconds || 0));

      const res = await api.post('/enrollments/notes', {
        courseId: course._id,
        lessonId: lesson._id,
        timestamp: timestampSeconds,
        text: noteText.trim(),
      });

      if (res.data) {
        setNoteText('');
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      alert(err.response?.data?.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await api.delete(`/enrollments/notes/${course._id}/${noteId}`);
      if (res.data?.success) {
        setNotes((prev) => prev.filter((n) => String(n._id) !== String(noteId)));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert(err.response?.data?.message || 'Failed to delete note');
    }
  };

  const formatSecondsToTimestamp = (totalSecs) => {
    const secs = Math.max(0, Math.floor(totalSecs || 0));
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header with Tabs & Bookmark Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Personal Notes</span>
            {notes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                {notes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks</span>
            {bookmarkedLessons.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                {bookmarkedLessons.length}
              </span>
            )}
          </button>
        </div>

        {/* Current Lesson Bookmark Quick Toggle */}
        {lesson && (
          <button
            onClick={handleToggleBookmark}
            disabled={togglingBookmark}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border shadow-xs ${
              isCurrentBookmarked
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${
                isCurrentBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
              }`}
            />
            <span>{isCurrentBookmarked ? 'Bookmarked ✓' : 'Bookmark Lesson'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: Personal Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Note Input Form */}
          {lesson ? (
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Timestamp:</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-black border border-indigo-200">
                    {formatSecondsToTimestamp(currentPlaybackSeconds)}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Notes are synced with your video timestamp
                </span>
              </div>

              <textarea
                rows={3}
                required
                placeholder={`Write a personal note for "${lesson.title}" at ${formatSecondsToTimestamp(
                  currentPlaybackSeconds
                )}...`}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNotesScope('lesson')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition ${
                      notesScope === 'lesson'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Current Lesson Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotesScope('course')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition ${
                      notesScope === 'course'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Course Notes
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {savingNote
                      ? 'Saving...'
                      : `Save Note at ${formatSecondsToTimestamp(currentPlaybackSeconds)}`}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 text-center font-medium">
              Select a lesson to start taking timestamped notes.
            </div>
          )}

          {/* Notes List */}
          {loadingNotes ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Fetching notes...</span>
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-3 pt-2">
              {notes.map((note) => {
                const noteLesson = typeof note.lesson === 'object' ? note.lesson : null;

                return (
                  <div
                    key={note._id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      {/* Interactive Timestamp button */}
                      <button
                        onClick={() => onSeekVideo && onSeekVideo(note.timestamp || 0)}
                        title="Click to jump video to this moment"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono font-black text-xs border border-indigo-200/80 cursor-pointer transition shadow-xs group"
                      >
                        <Play className="w-3 h-3 fill-indigo-600 text-indigo-600 group-hover:scale-110 transition" />
                        <span>{formatSecondsToTimestamp(note.timestamp)}</span>
                      </button>

                      {noteLesson && notesScope === 'course' && (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {noteLesson.title}
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                      {note.text}
                    </p>

                    <div className="text-[10px] text-slate-400 text-right">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No notes saved yet</h4>
              <p className="text-xs text-slate-500">
                {notesScope === 'lesson'
                  ? 'Take your first personal note for this lesson above!'
                  : 'You have not saved any personal notes for this course yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Bookmarked Lessons */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {loadingBookmarks ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Fetching bookmarks...</span>
            </div>
          ) : bookmarkedLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {bookmarkedLessons.map((bLesson) => {
                const isSelected = lesson?._id === bLesson._id;

                return (
                  <div
                    key={bLesson._id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-amber-200'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {bLesson.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{bLesson.duration || 10}m duration</span>
                        {bLesson.isFreePreview && (
                          <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Free Preview
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectLesson && onSelectLesson(bLesson)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <span>Study</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No bookmarks saved</h4>
              <p className="text-xs text-slate-500">
                Click the "Bookmark Lesson" button at the top of any lesson to save it for quick review!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
