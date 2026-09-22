'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { useGamification } from '../context/GamificationContext';
import {
  X, BookOpen, CheckCircle2, XCircle, RotateCcw, Trophy,
  ChevronRight, AlertCircle, Clock, Zap, Target, Award,
  CheckCheck, ChevronLeft,
} from 'lucide-react';

// ─── Tiny CSS-only confetti pieces rendered on pass ───────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 30 });
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 1.2}s`;
        const size = `${6 + Math.random() * 8}px`;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-10px',
              left,
              width: size,
              height: size,
              background: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${1.5 + Math.random()}s ${delay} ease-in forwards`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(420px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── SCREEN 1: Intro ──────────────────────────────────────────────────────────
function IntroScreen({ quiz, onStart, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-10 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
        <BookOpen className="w-9 h-9 text-white" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Lesson Quiz</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{quiz.title}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { icon: Target, label: 'Questions', value: quiz.questions.length },
          { icon: Award, label: 'To Pass', value: `${quiz.passingScore}%` },
          { icon: Zap, label: 'Format', value: 'MCQ' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Icon className="w-4 h-4 text-indigo-400" />
            <span className="text-lg font-extrabold text-white">{value}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-400 max-w-xs">
        Select the best answer for each question. You can review your results after submitting.
      </p>

      <button
        id="quiz-start-btn"
        onClick={onStart}
        className="mt-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 text-base cursor-pointer"
      >
        Start Quiz
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── SCREEN 2: Question-by-question ──────────────────────────────────────────
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function QuestionScreen({ quiz, currentIndex, answers, onSelectAnswer, onNext, onPrev, onSubmit }) {
  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const selected = answers[question._id];
  const isLast = currentIndex === total - 1;
  const progressPct = Math.round(((currentIndex + 1) / total) * 100);
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Bar: progress ── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Question {currentIndex + 1} of {total}</span>
          <span className="text-indigo-400">{answeredCount}/{total} answered</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Question Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
          <span className="text-indigo-400 mr-2">Q{currentIndex + 1}.</span>
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3" role="radiogroup" aria-label="Answer options">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                id={`quiz-option-${currentIndex}-${i}`}
                key={i}
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectAnswer(question._id, i)}
                className={`w-full text-left px-5 py-4 rounded-2xl border font-medium text-sm transition-all duration-200 cursor-pointer flex items-center gap-4 group
                  ${isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-[1.01]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
              >
                <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-extrabold border transition-colors
                  ${isSelected
                    ? 'bg-indigo-500 border-indigo-400 text-white'
                    : 'bg-white/10 border-white/20 text-slate-400 group-hover:border-white/40 group-hover:text-white'
                  }`}>
                  {OPTION_LETTERS[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="px-6 pb-6 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {isLast ? (
          <button
            id="quiz-submit-btn"
            onClick={onSubmit}
            disabled={answeredCount < total}
            className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Submit Quiz
            {answeredCount < total && (
              <span className="text-xs opacity-70">({total - answeredCount} unanswered)</span>
            )}
          </button>
        ) : (
          <button
            id="quiz-next-btn"
            onClick={onNext}
            className="flex-1 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 3: Results ────────────────────────────────────────────────────────
function ResultsScreen({ quiz, result, answers, onRetry, onClose, isSavedAttempt }) {
  const passed = result.passed;
  const total = quiz.questions.length;
  const correctCount = Math.round((result.score / 100) * total);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Score Banner ── */}
      <div className={`relative px-6 pt-8 pb-6 flex flex-col items-center text-center gap-3 ${passed ? 'bg-gradient-to-b from-emerald-900/40 to-transparent' : 'bg-gradient-to-b from-rose-900/30 to-transparent'}`}>
        {/* Only show confetti on first-time pass, not when reopening saved result */}
        {passed && !isSavedAttempt && <Confetti />}

        {/* Previous attempt notice */}
        {isSavedAttempt && (
          <div className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl text-xs text-slate-400 font-semibold mb-1">
            <RotateCcw className="w-3 h-3" />
            Showing your previous attempt
          </div>
        )}

        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-xl
          ${passed ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/40 text-white' : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/40 text-white'}`}>
          {result.score}%
        </div>

        {passed ? (
          <>
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-extrabold text-white">You Passed! 🎉</h2>
            <p className="text-sm text-emerald-400 font-semibold">
              {correctCount}/{total} correct · Passing score: {quiz.passingScore}%
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-rose-400" />
            <h2 className="text-2xl font-extrabold text-white">Not Quite There</h2>
            <p className="text-sm text-rose-400 font-semibold">
              {correctCount}/{total} correct · You needed {quiz.passingScore}% to pass
            </p>
          </>
        )}
      </div>

      {/* ── Per-question Review ── */}
      <div className="px-6 pb-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-2">Question Review</h3>
        {quiz.questions.map((q, i) => {
          const selectedIdx = answers[q._id];
          // correctOptionIndex only returned for instructor/admin — after submit the full quiz (with answers) is locally reconstructed
          // We show selected answer; correctness is derived from overall score so we can't show per-Q correct answer
          // (backend strips answers for security — we only know total score)
          const wasAnswered = selectedIdx !== undefined;
          return (
            <div key={q._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white">
                <span className="text-slate-400 mr-1">Q{i + 1}.</span> {q.question}
              </p>
              {wasAnswered ? (
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600/40 flex items-center justify-center text-indigo-300 font-bold text-[10px]">
                    {OPTION_LETTERS[selectedIdx]}
                  </span>
                  <span>You answered: <span className="text-white font-semibold">{q.options[selectedIdx]}</span></span>
                </div>
              ) : (
                <p className="text-xs text-rose-400 font-semibold">⚠ Skipped</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Actions ── */}
      <div className="sticky bottom-0 bg-[#13131f] px-6 py-4 border-t border-white/10 flex items-center gap-3">
        {/* Always show retake — both for fail and if they want to improve a pass */}
        <button
          id="quiz-retry-btn"
          onClick={onRetry}
          className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          {passed ? 'Retake Quiz' : 'Retry Quiz'}
        </button>
        <button
          id="quiz-close-results-btn"
          onClick={onClose}
          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm border border-white/10"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Root QuizPlayer component ────────────────────────────────────────────────
/**
 * @param {string} lessonId - The lesson ID to fetch the quiz for
 * @param {string} userId   - Current user's ID (for localStorage key isolation)
 * @param {Function} onClose - Callback to close/unmount the player
 */
export default function QuizPlayer({ lessonId, userId, onClose }) {
  const { triggerReward } = useGamification();
  const [screen, setScreen] = useState('loading'); // 'loading' | 'error' | 'noQuiz' | 'intro' | 'questions' | 'submitting' | 'results'
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [result, setResult] = useState(null);
  const [isSavedAttempt, setIsSavedAttempt] = useState(false);

  // Derive a localStorage key once quiz is known
  const storageKey = (quizId) => `lms_quiz_${quizId}_${userId || 'guest'}`;

  // Fetch quiz when mounted
  const fetchQuiz = useCallback(async () => {
    setScreen('loading');
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setIsSavedAttempt(false);
    try {
      const res = await api.get(`/quizzes/lesson/${lessonId}`);
      const quizData = res.data;
      setQuiz(quizData);

      // ── Check for a previously saved attempt ──────────────────────────────
      try {
        const saved = localStorage.getItem(storageKey(quizData._id));
        if (saved) {
          const { result: savedResult, answers: savedAnswers } = JSON.parse(saved);
          setResult(savedResult);
          setAnswers(savedAnswers || {});
          setIsSavedAttempt(true);
          setScreen('results');
          return;
        }
      } catch (_) { /* ignore localStorage errors */ }

      setScreen('intro');
    } catch (err) {
      if (err.response?.status === 404) {
        setScreen('noQuiz');
      } else {
        setScreen('error');
      }
    }
  }, [lessonId, userId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Block background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSelectAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setScreen('submitting');
    try {
      const answersPayload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));
      const res = await api.post(`/quizzes/${quiz._id}/submit`, { answers: answersPayload });
      const resultData = res.data;
      setResult(resultData);
      setIsSavedAttempt(false);

      // Trigger gamification XP celebration
      if (resultData.gamification && triggerReward) {
        triggerReward(resultData.gamification);
      }

      // ── Persist the attempt to localStorage ──────────────────────────────
      try {
        localStorage.setItem(
          storageKey(quiz._id),
          JSON.stringify({ result: resultData, answers })
        );
      } catch (_) { /* ignore storage errors */ }

      setScreen('results');
    } catch (err) {
      console.error('Quiz submission failed:', err);
      setScreen('error');
    }
  };

  const handleRetry = () => {
    // Clear saved attempt so the student can retake from scratch
    if (quiz) {
      try { localStorage.removeItem(storageKey(quiz._id)); } catch (_) {}
    }
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setIsSavedAttempt(false);
    setScreen('intro');
  };

  return (
    /* ── Overlay backdrop ── */
    <div
      id="quiz-player-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal card ── */}
      <div
        className="relative w-full max-w-lg bg-[#13131f] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh', minHeight: '520px', animation: 'quizSlideIn 0.3s cubic-bezier(.22,1,.36,1) both' }}
      >
        <style>{`
          @keyframes quizSlideIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* ── Close button ── */}
        <button
          id="quiz-close-btn"
          onClick={onClose}
          aria-label="Close quiz"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Screen router ── */}
        {screen === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading quiz...</p>
          </div>
        )}

        {screen === 'submitting' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Submitting your answers...</p>
          </div>
        )}

        {screen === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <AlertCircle className="w-12 h-12 text-rose-400" />
            <h3 className="text-lg font-bold text-white">Something went wrong</h3>
            <p className="text-sm text-slate-400">Could not load or submit the quiz. Please try again.</p>
            <button
              onClick={fetchQuiz}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {screen === 'noQuiz' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <BookOpen className="w-12 h-12 text-slate-600" />
            <h3 className="text-lg font-bold text-white">No Quiz Available</h3>
            <p className="text-sm text-slate-400">This lesson doesn't have a quiz yet. Check back later.</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer text-sm border border-white/10"
            >
              Close
            </button>
          </div>
        )}

        {screen === 'intro' && quiz && (
          <IntroScreen quiz={quiz} onStart={() => setScreen('questions')} onClose={onClose} />
        )}

        {screen === 'questions' && quiz && (
          <QuestionScreen
            quiz={quiz}
            currentIndex={currentIndex}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onNext={() => setCurrentIndex(i => Math.min(i + 1, quiz.questions.length - 1))}
            onPrev={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            onSubmit={handleSubmit}
          />
        )}

        {screen === 'results' && quiz && result && (
          <ResultsScreen
            quiz={quiz}
            result={result}
            answers={answers}
            onRetry={handleRetry}
            onClose={onClose}
            isSavedAttempt={isSavedAttempt}
          />
        )}
      </div>
    </div>
  );
}
