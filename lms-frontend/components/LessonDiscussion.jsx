'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Pin,
  Trash2,
  Reply,
  Sparkles,
  ShieldCheck,
  Award,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function LessonDiscussion({ lesson, course }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply State
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Collapse / Expand nested replies
  const [collapsedReplies, setCollapsedReplies] = useState({});

  useEffect(() => {
    if (!lesson?._id) return;
    fetchComments();
  }, [lesson?._id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/comments/lesson/${lesson._id}`);
      if (res.data?.success) {
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load lesson comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !lesson?._id || !course?._id) return;

    try {
      setSubmitting(true);
      const res = await api.post('/comments', {
        lessonId: lesson._id,
        courseId: course._id,
        text: newCommentText.trim(),
      });

      if (res.data?.success && res.data.comment) {
        setComments((prev) => [res.data.comment, ...prev]);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentCommentId) => {
    if (!replyText.trim() || !lesson?._id || !course?._id) return;

    try {
      setSubmittingReply(true);
      const res = await api.post('/comments', {
        lessonId: lesson._id,
        courseId: course._id,
        text: replyText.trim(),
        parentCommentId,
      });

      if (res.data?.success && res.data.comment) {
        const newReply = res.data.comment;
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply],
              };
            }
            return c;
          })
        );
        setReplyText('');
        setReplyingToId(null);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
      alert(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleUpvote = async (commentId, isReply = false, parentId = null) => {
    try {
      const res = await api.post(`/comments/${commentId}/upvote`);
      if (!res.data?.success) return;

      const updatedUpvotes = res.data.comment?.upvotes || [];

      if (!isReply) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, upvotes: updatedUpvotes } : c))
        );
      } else {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === parentId) {
              return {
                ...c,
                replies: (c.replies || []).map((r) =>
                  r._id === commentId ? { ...r, upvotes: updatedUpvotes } : r
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('Failed to toggle upvote:', err);
    }
  };

  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.data?.success) {
        if (!isReply) {
          setComments((prev) => prev.filter((c) => c._id !== commentId));
        } else {
          setComments((prev) =>
            prev.map((c) => {
              if (c._id === parentId) {
                return {
                  ...c,
                  replies: (c.replies || []).filter((r) => r._id !== commentId),
                };
              }
              return c;
            })
          );
        }
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleTogglePin = async (commentId) => {
    try {
      const res = await api.put(`/comments/${commentId}/pin`);
      if (res.data?.success) {
        const isPinned = res.data.isPinned;
        setComments((prev) => {
          const updated = prev.map((c) => (c._id === commentId ? { ...c, isPinned } : c));
          return updated.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        });
      }
    } catch (err) {
      console.error('Failed to pin comment:', err);
      alert(err.response?.data?.message || 'Failed to pin comment');
    }
  };

  const toggleCollapseReplies = (commentId) => {
    setCollapsedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const isInstructorOrAdmin = user?.role === 'instructor' || user?.role === 'admin';
  const totalCommentsCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Discussion Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Lesson Q&A & Discussion Thread</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold">
                {totalCommentsCount}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask questions about "{lesson?.title || 'this lesson'}" or join the discussion with classmates & instructors.
            </p>
          </div>
        </div>
      </div>

      {/* Post New Question / Comment Input */}
      {user ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center uppercase shrink-0 shadow-md">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                required
                placeholder="Ask a question or share your thoughts on this lesson..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newCommentText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Posting...' : 'Post Question'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-600 font-medium">
          Please sign in to ask questions and participate in lesson discussions.
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading discussion thread...</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-5 pt-2">
          {comments.map((comment) => {
            const commentUser = comment.user || {};
            const isAuthor = user && String(user._id || user.id) === String(commentUser._id || commentUser);
            const isUpvoted = comment.upvotes?.some((id) => String(id) === String(user?._id || user?.id));
            const upvotesCount = comment.upvotes?.length || 0;
            const replies = comment.replies || [];
            const isReplying = replyingToId === comment._id;
            const isCollapsed = collapsedReplies[comment._id];

            return (
              <div
                key={comment._id}
                className={`p-5 rounded-2xl border transition ${
                  comment.isPinned
                    ? 'bg-amber-50/50 border-amber-200/90 shadow-xs'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                {/* Pinned Badge */}
                {comment.isPinned && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold mb-3">
                    <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                    <span>PINNED BY INSTRUCTOR</span>
                  </div>
                )}

                {/* Comment Main Body */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center uppercase shrink-0">
                    {commentUser.name ? commentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {commentUser.name || 'Student'}
                      </span>

                      {/* User Role Badge */}
                      {commentUser.role === 'instructor' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                          <Award className="w-3 h-3" /> Instructor
                        </span>
                      )}
                      {commentUser.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        • {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line font-normal">
                      {comment.text}
                    </p>

                    {/* Actions Bar: Upvote, Reply, Pin, Delete */}
                    <div className="flex items-center gap-4 mt-3 pt-2 text-[11px] font-bold text-slate-500">
                      <button
                        onClick={() => handleToggleUpvote(comment._id)}
                        className={`flex items-center gap-1 hover:text-indigo-600 transition cursor-pointer ${
                          isUpvoted ? 'text-indigo-600' : ''
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                        <span>{upvotesCount} Helpful</span>
                      </button>

                      <button
                        onClick={() => {
                          setReplyingToId(isReplying ? null : comment._id);
                          setReplyText('');
                        }}
                        className="flex items-center gap-1 hover:text-indigo-600 transition cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>

                      {isInstructorOrAdmin && (
                        <button
                          onClick={() => handleTogglePin(comment._id)}
                          className={`flex items-center gap-1 hover:text-amber-600 transition cursor-pointer ${
                            comment.isPinned ? 'text-amber-600 font-extrabold' : ''
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{comment.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                      )}

                      {(isAuthor || isInstructorOrAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="flex items-center gap-1 hover:text-rose-600 transition cursor-pointer text-slate-400 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Reply Form */}
                    {isReplying && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <textarea
                          rows={2}
                          required
                          placeholder={`Reply to ${commentUser.name || 'this post'}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingReply || !replyText.trim()}
                            onClick={() => handlePostReply(comment._id)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer disabled:opacity-50"
                          >
                            {submittingReply ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies Thread */}
                    {replies.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                        <button
                          onClick={() => toggleCollapseReplies(comment._id)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                        >
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                          <span>
                            {isCollapsed
                              ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                              : `Hide replies`}
                          </span>
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-3 pl-3 sm:pl-5 border-l-2 border-slate-200">
                            {replies.map((reply) => {
                              const replyUser = reply.user || {};
                              const isReplyAuthor =
                                user && String(user._id || user.id) === String(replyUser._id || replyUser);
                              const isReplyUpvoted = reply.upvotes?.some(
                                (id) => String(id) === String(user?._id || user?.id)
                              );
                              const replyUpvotesCount = reply.upvotes?.length || 0;

                              return (
                                <div
                                  key={reply._id}
                                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                                      {replyUser.name ? replyUser.name.charAt(0) : 'U'}
                                    </div>
                                    <span className="font-bold text-xs text-slate-900">
                                      {replyUser.name || 'User'}
                                    </span>
                                    {replyUser.role === 'instructor' && (
                                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                                        Instructor
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400">
                                      • {formatRelativeTime(reply.createdAt)}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-700 leading-relaxed font-normal pl-9">
                                    {reply.text}
                                  </p>

                                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 pl-9">
                                    <button
                                      onClick={() => handleToggleUpvote(reply._id, true, comment._id)}
                                      className={`flex items-center gap-1 hover:text-indigo-600 transition cursor-pointer ${
                                        isReplyUpvoted ? 'text-indigo-600' : ''
                                      }`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      <span>{replyUpvotesCount}</span>
                                    </button>

                                    {(isReplyAuthor || isInstructorOrAdmin) && (
                                      <button
                                        onClick={() => handleDeleteComment(reply._id, true, comment._id)}
                                        className="hover:text-rose-600 transition cursor-pointer text-slate-400 ml-auto"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No questions asked yet</h4>
          <p className="text-xs text-slate-500">
            Be the first student to ask a question or start a discussion for this lesson!
          </p>
        </div>
      )}
    </div>
  );
}
