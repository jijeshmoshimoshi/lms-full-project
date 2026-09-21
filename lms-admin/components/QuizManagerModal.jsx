'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import {
  X, Plus, Trash2, Save, BookOpen, CheckCircle2,
  AlertCircle, RotateCcw, ChevronDown, ChevronUp,
  HelpCircle, Pencil, Target, Award
} from 'lucide-react';

const EMPTY_QUESTION = () => ({
  question: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
});

/**
 * Admin Quiz Manager Modal
 * @param {string} lessonId - the lesson to manage quiz for
 * @param {string} lessonTitle - display name
 * @param {Function} onClose - close callback
 */
export default function QuizManagerModal({ lessonId, lessonTitle, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quiz data
  const [quizId, setQuizId] = useState(null); // null = no quiz yet
  const [title, setTitle] = useState(`${lessonTitle} — Quiz`);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);

  // UI: which question is expanded
  const [expandedIdx, setExpandedIdx] = useState(0);

  // ── Fetch existing quiz on mount ──────────────────────────────────────────
  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Use the admin-level endpoint that returns answers too
      const res = await api.get(`/quizzes/lesson/${lessonId}?admin=true`);
      const quiz = res.data;
      setQuizId(quiz._id);
      setTitle(quiz.title);
      setPassingScore(quiz.passingScore ?? 70);
      // Rebuild questions — admin gets correctOptionIndex back
      setQuestions(
        quiz.questions.map((q) => ({
          _id: q._id,
          question: q.question,
          options: q.options.length >= 2 ? [...q.options] : [...q.options, '', '', ''].slice(0, 4),
          correctOptionIndex: q.correctOptionIndex ?? 0,
        }))
      );
    } catch (err) {
      if (err.response?.status === 404) {
        // No quiz yet — start fresh
        setQuizId(null);
        setTitle(`${lessonTitle} — Quiz`);
        setPassingScore(70);
        setQuestions([EMPTY_QUESTION()]);
      } else {
        setError('Failed to load quiz data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [lessonId, lessonTitle]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  // Block background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Question helpers ──────────────────────────────────────────────────────
  const addQuestion = () => {
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
    setExpandedIdx(questions.length); // expand new question
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return; // keep at least one
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(Math.max(0, expandedIdx - 1));
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  const setCorrect = (qIdx, optIdx) => {
    updateQuestion(qIdx, 'correctOptionIndex', optIdx);
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!title.trim()) return 'Quiz title is required.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1} text is empty.`;
      const filledOptions = q.options.filter((o) => o.trim());
      if (filledOptions.length < 2) return `Question ${i + 1} needs at least 2 answer options.`;
      if (!q.options[q.correctOptionIndex]?.trim())
        return `Question ${i + 1}: the correct answer option is empty.`;
    }
    return null;
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      lesson: lessonId,
      title: title.trim(),
      passingScore: Number(passingScore),
      questions: questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        correctOptionIndex: q.correctOptionIndex,
      })),
    };

    try {
      if (quizId) {
        // Update existing
        const res = await api.put(`/quizzes/${quizId}`, payload);
        setQuizId(res.data._id || quizId);
      } else {
        // Create new
        const res = await api.post('/quizzes', payload);
        setQuizId(res.data._id);
      }
      setSuccess(quizId ? 'Quiz updated successfully!' : 'Quiz created successfully!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete quiz ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!quizId) return;
    if (!confirm('Delete this quiz? Students who have taken it will lose their results.')) return;
    setDeleting(true);
    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizId(null);
      setQuestions([EMPTY_QUESTION()]);
      setSuccess('Quiz deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div
      id="quiz-manager-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200"
        style={{ maxHeight: '92vh', animation: 'qmSlideIn 0.28s cubic-bezier(.22,1,.36,1) both' }}
      >
        <style>{`
          @keyframes qmSlideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Quiz Manager</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{lessonTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quizId && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Quiz'}
              </button>
            )}
            <button
              id="quiz-manager-close"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading quiz...</p>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              {quizId ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>This lesson has an active quiz. Edit below and save to update.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-2xl text-xs font-semibold text-violet-800">
                  <BookOpen className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>No quiz yet for this lesson. Create one below.</span>
                </div>
              )}

              {/* Alerts */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Quiz Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Quiz Title *</label>
                  <input
                    id="quiz-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Module 1 Check-in Quiz"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Passing Score (%)
                  </label>
                  <input
                    id="quiz-passing-score"
                    type="number"
                    min="1"
                    max="100"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Questions ({questions.length})
                  </span>
                  <button
                    id="add-question-btn"
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Question
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs"
                  >
                    {/* Question Header / Accordion Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedIdx(expandedIdx === qIdx ? -1 : qIdx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          Q{qIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 truncate">
                          {q.question.trim() || <span className="text-slate-400 italic">Untitled question</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {questions.length > 1 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), removeQuestion(qIdx))}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {expandedIdx === qIdx
                          ? <ChevronUp className="w-4 h-4 text-slate-400" />
                          : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                    </button>

                    {/* Question Body */}
                    {expandedIdx === qIdx && (
                      <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4 bg-slate-50/50">
                        {/* Question Text */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                            Question Text *
                          </label>
                          <textarea
                            id={`question-text-${qIdx}`}
                            rows={2}
                            placeholder="e.g. What does JSX stand for?"
                            value={q.question}
                            onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                          />
                        </div>

                        {/* Answer Options */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                            Answer Options — click the circle to mark correct answer *
                          </label>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.correctOptionIndex === optIdx;
                              return (
                                <div key={optIdx} className="flex items-center gap-2.5">
                                  {/* Correct toggle */}
                                  <button
                                    id={`correct-toggle-${qIdx}-${optIdx}`}
                                    type="button"
                                    onClick={() => setCorrect(qIdx, optIdx)}
                                    title={isCorrect ? 'Correct answer' : 'Mark as correct'}
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition cursor-pointer ${
                                      isCorrect
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-slate-300 hover:border-emerald-400 text-slate-300'
                                    }`}
                                  >
                                    {isCorrect
                                      ? <CheckCircle2 className="w-4 h-4" />
                                      : <span className="text-[10px] font-bold">{OPTION_LETTERS[optIdx]}</span>
                                    }
                                  </button>
                                  <input
                                    id={`option-${qIdx}-${optIdx}`}
                                    type="text"
                                    placeholder={`Option ${OPTION_LETTERS[optIdx]}`}
                                    value={opt}
                                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                    className={`flex-1 px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                                      isCorrect
                                        ? 'border-emerald-300 bg-emerald-50/60 focus:ring-emerald-500/20 focus:border-emerald-400'
                                        : 'border-slate-200 bg-white focus:ring-violet-500/20 focus:border-violet-400'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white rounded-b-3xl shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Award className="w-4 h-4 text-violet-400" />
              <span>{questions.length} question{questions.length !== 1 ? 's' : ''} · Passing: {passingScore}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="save-quiz-btn"
                onClick={handleSave}
                disabled={saving || loading}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> {quizId ? 'Update Quiz' : 'Create Quiz'}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
