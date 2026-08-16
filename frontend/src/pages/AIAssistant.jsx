import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Zap,
  RotateCcw,
  Copy,
  Check,
  PhoneCall,
  Target,
  FileSpreadsheet,
  HelpCircle,
  Database,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Flame,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import PeekingRobot from '../components/PeekingRobot';

export default function AIAssistant() {
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [lastLatency, setLastLatency] = useState(null);
  const [lastModel, setLastModel] = useState('llama-3.3-70b-versatile');
  const [dataSummary, setDataSummary] = useState(null);

  // Load suggestions on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getSuggestedPrompts();
        setSuggestions(res.suggestions || []);
      } catch (err) {
        // Fallback suggestions
        setSuggestions([
          {
            id: 'call_priority',
            title: '📞 High-Priority Outreach Call List',
            prompt: 'Who are the top high-priority members I should call first today, and why are they ranked highest?',
            category: 'Outreach',
          },
          {
            id: 'star_target',
            title: '🎯 #1 Target Measure Analysis',
            prompt: 'What is our #1 target measure to increase our Star Rating with the least effort according to CMS cutpoints?',
            category: 'Strategy',
          },
          {
            id: 'sim_projection',
            title: '🔮 4.0 Star Leap Simulation',
            prompt: 'How many total care gaps do we need to close to cross the 4.0-Star threshold and unlock the 5% Quality Bonus Payment?',
            category: 'Simulation',
          },
          {
            id: 'eye_exam_boston',
            title: '👁️ Diabetic Eye Gaps in Boston',
            prompt: 'List all members in Boston with open Diabetic Eye Exam gaps and their diagnosed conditions.',
            category: 'Clinical',
          },
        ]);
      }
    }
    loadData();
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Auto-scroll inside chat box only on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history for backend
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendChatMessage(textToSend.trim(), historyPayload);

      const aiMsg = {
        role: 'assistant',
        content: res.reply,
        model: res.model,
        latency_ms: res.latency_ms,
      };

      setMessages([...newHistory, aiMsg]);
      setLastLatency(res.latency_ms);
      setLastModel(res.model);
      setDataSummary(res.data_context_summary);
    } catch (err) {
      toast.error(`Assistant error: ${err.message}`);
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `⚠️ **Error communicating with AI engine:** ${err.message}. Please verify the Groq connection.`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Response copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.info('Conversation history cleared.');
  };

  // Helper to format basic markdown (bold, lists, code, headers)
  const renderFormattedContent = (content) => {
    return (
      <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2 font-sans">
        {content.split('\n').map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm sm:text-base font-extrabold text-ai-purple-light pt-2 pb-1 border-b border-slate-800 font-mono">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-base sm:text-lg font-black text-white pt-3 pb-1 border-b border-slate-700">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-lg sm:text-xl font-black text-white pt-2">
                {line.replace('# ', '')}
              </h1>
            );
          }
          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const itemText = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-ai-purple-light font-bold mt-1 shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }
          // Sub-bullets (indented)
          if (line.trim().startsWith('+ ') || line.startsWith('  * ') || line.startsWith('  - ')) {
            const itemText = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-6 text-slate-300">
                <span className="text-cyan-400 shrink-0 mt-1">◦</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }
          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          // Regular paragraph
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text) => {
    // Bold: **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    // Inline code: `text`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-navy-950 text-ai-purple-light border border-slate-800 font-mono text-[11px]">$1</code>');
    return formatted;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Header & Live Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Quality Analytics</span>
            <span>/</span>
            <span className="text-ai-purple-light font-mono">Clinical AI Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>CareImpact AI Copilot</span>
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-ai-violet via-ai-purple to-ai-cyan text-navy-950 font-black shadow-glow-purple">
              <Bot className="w-5 h-5" />
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time clinical outreach triage, Star Rating simulation advisor, and patient cohort intelligence.
          </p>
        </div>

        {/* Live Engine Badges */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-950/80 text-ai-purple-light border border-violet-800/60 shadow-glow-purple">
            <Zap className="w-3.5 h-3.5" />
            <span>Groq LPU Llama-3.3 70B</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Database className="w-3.5 h-3.5" />
            <span>Neon PostgreSQL Live</span>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Copilot Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar (Span 4): Cohort Intelligence & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Context Summary Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-ai-purple-light" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Live Plan Context
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Synced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Baseline Rating</span>
                <strong className="text-base text-amber-400 font-bold">3.30 ★</strong>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Active Cohort</span>
                <strong className="text-base text-white font-bold">33 Members</strong>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
                <span className="text-[10px] text-emerald-400 block">Completed</span>
                <strong className="text-base text-emerald-400 font-bold">22 (66.7%)</strong>
              </div>
              <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
                <span className="text-[10px] text-rose-400 block">Pending Gaps</span>
                <strong className="text-base text-rose-400 font-bold">11 Open</strong>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-800/50 space-y-1">
              <div className="flex items-center gap-1.5 text-ai-purple-light">
                <Target className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold font-mono uppercase">#1 Target Focus</span>
              </div>
              <p className="text-xs text-white font-bold">Annual Flu Vaccine (C03)</p>
              <p className="text-[11px] text-slate-300">
                Only <strong className="text-ai-purple-light">+0.3%</strong> needed to reach 5★ threshold.
              </p>
            </div>
          </div>

          {/* Suggested Questions Pill Panel */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai-purple-light" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Suggested Prompts
              </h3>
            </div>

            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSend(s.prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-2xl bg-navy-950/70 hover:bg-violet-950/50 border border-slate-800 hover:border-violet-500/40 transition-all text-xs text-slate-200 hover:text-white space-y-1 group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-ai-purple-light font-mono block">
                      {s.title}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-ai-purple-light group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {s.prompt}
                  </p>
                </button>
              ))}
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="w-full mt-2 flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 transition-all font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Conversation</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Chat Console (Span 8) */}
        <div className="lg:col-span-8 glass-card rounded-3xl border border-slate-800/80 flex flex-col h-[700px] overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-navy-950/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ai-violet via-ai-purple to-ai-cyan flex items-center justify-center shadow-glow-purple">
                <Bot className="w-5 h-5 text-navy-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>CareImpact AI Copilot</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {lastModel} {lastLatency ? `· ${lastLatency}ms latency` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/members"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                <span>Members Roster</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-ai-purple shadow-glow-purple">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-white">How can I assist your Quality Team today?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ask me for prioritized member outreach lists, HEDIS measure strategy, Star Rating simulation breakdowns, or clinical care gap closure advice.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-2">
                  <button
                    onClick={() => handleSend('Who are the top high-priority members I should call first today, and why?')}
                    className="p-3 rounded-2xl bg-navy-950/80 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/40 text-left text-xs text-slate-300 hover:text-white transition-all space-y-0.5"
                  >
                    <span className="text-ai-purple-light font-bold block">📞 Who to Call First?</span>
                    <span className="text-[11px] text-slate-500">Triage Rank-3 members by reachability</span>
                  </button>

                  <button
                    onClick={() => handleSend('What is our #1 target measure to increase our Star Rating with the least effort according to CMS cutpoints?')}
                    className="p-3 rounded-2xl bg-navy-950/80 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/40 text-left text-xs text-slate-300 hover:text-white transition-all space-y-0.5"
                  >
                    <span className="text-ai-purple-light font-bold block">🎯 #1 Star ROI Measure</span>
                    <span className="text-[11px] text-slate-500">Analyze distance to next cutpoint</span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-ai-purple-light border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm space-y-2 relative group ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-ai-violet to-violet-600 text-white rounded-br-none shadow-md'
                        : m.isError
                        ? 'bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-bl-none'
                        : 'bg-navy-950/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    ) : (
                      <>
                        {renderFormattedContent(m.content)}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                          <span>{m.model || lastModel}</span>
                          <button
                            onClick={() => handleCopy(m.content, idx)}
                            className="hover:text-ai-purple-light flex items-center gap-1 transition-colors"
                            title="Copy response"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-xs text-ai-purple-light font-mono p-4 rounded-2xl bg-navy-950/80 border border-violet-500/30 w-fit"
              >
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center animate-spin">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Groq Llama-3.3 70B reasoning over clinical dataset...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Console */}
          <div className="p-4 border-t border-slate-800 bg-navy-950/90 space-y-2">
            <div className="relative flex items-center">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about patient outreach, gap closure talking points, or Star Rating simulation..."
                rows={1}
                className="w-full px-4 py-3.5 pr-24 rounded-2xl bg-navy-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none shadow-inner"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || !inputMessage.trim()}
                className="absolute right-2.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-ai-violet via-ai-purple to-ai-cyan text-navy-950 hover:opacity-90 disabled:opacity-40 transition-all shadow-glow-purple flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Shift+Enter</kbd> for newline</span>
              <span className="hidden sm:inline">Neon PostgreSQL + Groq LPUs Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Peeking Robot Companion */}
      <PeekingRobot onQuickPrompt={handleSend} />
    </div>
  );
}
