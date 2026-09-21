'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/api';
import { 
  Sparkles, Bot, X, Send, RotateCcw, ChevronRight, 
  BookOpen, Star, Award, Zap, ArrowRight, ExternalLink,
  MessageSquare, Check, HelpCircle
} from 'lucide-react';

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! 👋 I'm **PulseAI**, your personal SkillPulse Learning Advisor.\n\nI can help you discover the perfect course for your goals, check pricing, explain how verifiable certificates work, or guide your curriculum path.\n\nHow can I help you today?`,
      matchedCourses: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'What courses are best for beginners?',
    'Do courses provide verifiable certificates?',
    'Show me the highest-rated courses',
    'How does lifetime access work?'
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Extract course slug if user is currently viewing a course page: /courses/[slug]
  const courseSlugMatch = pathname?.match(/^\/courses\/([^/]+)$/);
  const currentCourseSlug = courseSlugMatch ? courseSlugMatch[1] : null;

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // Load contextual suggestions based on current path
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const queryParam = currentCourseSlug ? `?courseSlug=${encodeURIComponent(currentCourseSlug)}` : '';
        const res = await api.get(`/ai/suggestions${queryParam}`);
        if (res.data?.success && Array.isArray(res.data.suggestions)) {
          setSuggestions(res.data.suggestions);
        }
      } catch (_) {
        // Fallback to default suggestions if endpoint is unreachable
      }
    };
    fetchSuggestions();
  }, [pathname, currentCourseSlug]);

  // Hide teaser after 10s or when opened
  useEffect(() => {
    const timer = setTimeout(() => setShowTeaser(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setShowTeaser(false);
    setHasOpenedBefore(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: `Chat cleared! ✨ How else can I assist with your learning journey?`,
        matchedCourses: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const handleSendMessage = async (textToSend) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || loading) return;

    const userMessageObj = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post('/ai/chat', {
        message,
        history,
        currentPath: pathname,
        courseSlug: currentCourseSlug,
      });

      if (res.data?.success && res.data.data) {
        const { reply, matchedCourses, suggestedQuestions, provider } = res.data.data;
        const botMessageObj = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: reply,
          matchedCourses: matchedCourses || [],
          provider,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botMessageObj]);

        if (Array.isArray(suggestedQuestions) && suggestedQuestions.length > 0) {
          setSuggestions(suggestedQuestions);
        }
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('[PulseAI Error]:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          role: 'assistant',
          content: `I'm having a brief connection hitch reaching the AI service. Feel free to browse all courses on the [Course Catalog](/courses) or try asking again in a few moments!`,
          matchedCourses: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Simple and safe inline markdown-to-HTML formatter
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading ###
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 mt-2 mb-1 text-sm">
            {formatSpans(line.replace('### ', ''))}
          </h4>
        );
      }
      // Bullet list item
      if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        const itemText = line.replace(/^[-•*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 text-xs text-slate-700">
            <span className="text-indigo-500 font-bold mt-0.5">•</span>
            <span>{formatSpans(itemText)}</span>
          </div>
        );
      }
      // Empty spacing line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed my-0.5">
          {formatSpans(line)}
        </p>
      );
    });
  };

  // Helper to parse bold **text**, links [label](url), and inline code
  const formatSpans = (raw) => {
    // Replace markdown links [label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push(raw.substring(lastIndex, match.index));
      }
      parts.push({ isLink: true, label: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < raw.length) {
      parts.push(raw.substring(lastIndex));
    }

    return parts.map((part, i) => {
      if (typeof part === 'string') {
        // Parse bold **text**
        const boldSplit = part.split(/\*\*([^*]+)\*\*/g);
        return boldSplit.map((seg, j) => {
          if (j % 2 === 1) {
            return <strong key={j} className="font-semibold text-slate-900">{seg}</strong>;
          }
          return seg;
        });
      }
      return (
        <Link 
          key={i} 
          href={part.url} 
          className="text-indigo-600 font-semibold underline underline-offset-2 hover:text-indigo-800 transition"
          onClick={() => {
            // Optional: close or keep open
          }}
        >
          {part.label}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Trigger */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        
        {/* Interactive Notification Teaser Pill */}
        {!isOpen && showTeaser && (
          <div 
            onClick={handleOpen}
            className="mb-3 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100 text-xs text-slate-700 cursor-pointer hover:border-indigo-300 hover:shadow-indigo-500/10 transition duration-300 animate-bounce-subtle group"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium text-slate-800">
              Need course guidance? <strong className="text-indigo-600 font-semibold group-hover:underline">Ask PulseAI!</strong>
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}
              className="text-slate-400 hover:text-slate-600 ml-1 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Action Button */}
        {!isOpen && (
          <button
            onClick={handleOpen}
            aria-label="Open AI Learning Assistant"
            className="relative group p-4 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition duration-300 flex items-center justify-center"
          >
            {/* Glowing Ring */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-40 group-hover:opacity-75 blur-sm transition duration-300" />
            
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 transform group-hover:rotate-6 transition duration-300" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white ring-2 ring-indigo-500/20" />
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden ring-1 ring-slate-900/5">
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-sm tracking-tight">PulseAI Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-medium text-indigo-100 tracking-wide">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100/90 font-normal">
                  SkillPulse Official Course Advisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={handleClearChat}
                title="Restart conversation"
                className="p-1.5 rounded-lg text-indigo-100 hover:text-white hover:bg-white/15 transition duration-150"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                title="Close chat"
                className="p-1.5 rounded-lg text-indigo-100 hover:text-white hover:bg-white/15 transition duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Page Context Ribbon (if viewing specific course) */}
          {currentCourseSlug && (
            <div className="bg-indigo-50/90 border-b border-indigo-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-indigo-900">
              <span className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span className="text-slate-600 font-medium">Context:</span>
                <span className="font-semibold truncate">Active Course Page</span>
              </span>
              <span className="text-[10px] bg-indigo-100/80 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                Tailored
              </span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white flex-shrink-0 mb-1 shadow-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-xs text-xs ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      ) : (
                        <div>{renderFormattedText(m.content)}</div>
                      )}
                    </div>
                  </div>

                  {/* Embedded Rich Course Cards recommended by AI */}
                  {!isUser && m.matchedCourses && m.matchedCourses.length > 0 && (
                    <div className="mt-2 space-y-2 w-full max-w-[90%] pl-8">
                      {m.matchedCourses.map((c) => (
                        <div
                          key={c._id || c.slug}
                          className="bg-white rounded-xl p-3 border border-indigo-100 shadow-xs hover:border-indigo-300 hover:shadow-md transition group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                                {c.level || 'All Levels'}
                              </span>
                              <h5 className="font-heading font-bold text-xs text-slate-900 mt-1 line-clamp-1 group-hover:text-indigo-600 transition">
                                {c.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                By {c.instructorName || 'SkillPulse Expert'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-bold text-xs text-indigo-700">
                                {c.price === 0 ? 'Free' : `${c.currency || 'INR'} ${c.price}`}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{c.rating || 4.8}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Award className="w-3 h-3 text-emerald-500" />
                              Certificate Included
                            </span>
                            <Link
                              href={`/courses/${c.slug}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
                            >
                              <span>View Syllabus</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 px-1 text-[9px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {!isUser && m.provider && (
                      <span className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[9px] ${
                        m.provider === 'gemini' 
                          ? 'text-indigo-600 bg-indigo-50 border border-indigo-200/80' 
                          : m.provider === 'openai'
                          ? 'text-emerald-600 bg-emerald-50 border border-emerald-200/80'
                          : 'text-amber-700 bg-amber-50 border border-amber-200/80'
                      }`}>
                        {m.provider === 'gemini' && '✨ Gemini 3.6 Flash'}
                        {m.provider === 'openai' && '🤖 OpenAI'}
                        {m.provider === 'smart-catalog-engine' && '📦 Catalog Fallback'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Typing dots */}
            {loading && (
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white flex-shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-300" />
                  <span className="text-[11px] text-slate-400 ml-1">PulseAI is analyzing courses...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3.5 py-2 bg-white/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {suggestions.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap text-[11px] bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/80 transition duration-150 flex-shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={currentCourseSlug ? "Ask about this course, topics, pricing..." : "Ask about courses, certificates, roadmaps..."}
                  disabled={loading}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition duration-150 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Live Course Intelligence
              </span>
              <span>SkillPulse AI Assistant</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
