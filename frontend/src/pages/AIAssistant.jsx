import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Zap,
  RotateCcw,
  Copy,
  Check,
  Building2,
  Users,
  Activity,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useCompanyScope } from '../context/CompanyScopeContext';
import { useMemberStore } from '../context/MemberStoreContext';
import { useToast } from '../components/Toast';
import {
  PLAN_DISEASE_AFFILIATIONS,
  CLINICAL_MEASURE_CATALOG,
  computeStarRating,
} from '../utils/metricsEngine';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function AIAssistant() {
  const messagesEndRef = useRef(null);
  const { selectedCompanyName, selectedPlanName } = useCompanyScope();
  const { hierarchy, customMembers, memberUpdates, deletedMemberIds } = useMemberStore();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [lastLatency, setLastLatency] = useState(null);
  const [lastModel, setLastModel] = useState('openai/gpt-oss-120b');

  // Active Company and Plan resolution
  const activeCompany = useMemo(() => {
    if (!hierarchy) return null;
    return (
      hierarchy.companies.find((c) => c.companyName === selectedCompanyName) ||
      hierarchy.companies.find((c) => c.companyName === 'Medicare') ||
      hierarchy.companies[0]
    );
  }, [hierarchy, selectedCompanyName]);

  const activePlan = useMemo(() => {
    if (!activeCompany || !selectedPlanName) return null;
    return activeCompany.plans.find((p) => p.planName === selectedPlanName) || null;
  }, [activeCompany, selectedPlanName]);

  // Active members for this company
  const activeMembers = useMemo(() => {
    let rawList = [];
    if (activePlan) {
      rawList = activePlan.members;
    } else if (activeCompany) {
      rawList = activeCompany.allMembers;
    }

    // Exclude deleted members
    rawList = rawList.filter(
      (m) => !deletedMemberIds.includes(m.patientId) && !deletedMemberIds.includes(m.id)
    );

    // Append custom added members
    const compName = activeCompany?.companyName || 'Medicare';
    const relevantCustom = customMembers.filter((m) => {
      if (deletedMemberIds.includes(m.patientId) || deletedMemberIds.includes(m.id)) return false;
      if (activePlan) {
        return m.company === compName && m.planName === activePlan.planName;
      }
      return m.company === compName;
    });

    const combined = [...relevantCustom, ...rawList];

    // Apply local gap updates
    return combined.map((m) => {
      const updates = memberUpdates[m.patientId] || memberUpdates[m.id];
      if (!updates) return m;

      const mergedMeasures = {
        ...m.measures,
        ...(updates.measures || {}),
      };

      let gapCount = 0;
      let metCount = 0;
      let applicableCount = 0;
      for (const res of Object.values(mergedMeasures)) {
        if (res === 'MET') {
          metCount++;
          applicableCount++;
        } else if (res === 'GAP') {
          gapCount++;
          applicableCount++;
        }
      }

      return {
        ...m,
        measures: mergedMeasures,
        gapCount,
        metCount,
        applicableCount,
        hasCareGap: gapCount > 0,
      };
    });
  }, [hierarchy, activeCompany, activePlan, customMembers, memberUpdates, deletedMemberIds]);

  // Clinical Summary & Star Stats for active company
  const companyClinicalContext = useMemo(() => {
    const compName = activeCompany?.companyName || 'Medicare';
    const affiliation = PLAN_DISEASE_AFFILIATIONS[compName] || {
      company: compName,
      targetPopulation: 'Enrolled Members',
      diseases: [],
    };

    const starMetrics = computeStarRating(activeMembers, compName);

    // Patients with gaps sorted by Priority
    const patientsWithGaps = activeMembers
      .filter((m) => m.hasCareGap)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Summary of prioritized patients text
    const patientLines = patientsWithGaps.slice(0, 10).map((m) => {
      const openMeasures = Object.entries(m.measures || {})
        .filter(([_, status]) => status === 'GAP')
        .map(([code]) => `${code} (${CLINICAL_MEASURE_CATALOG[code]?.name || code})`)
        .join(', ');

      return `- ${m.fullName} (Age: ${m.age}, ZIP: ${m.zip || 'N/A'}, Priority: ${m.priority || 0}) | Open Gaps: ${openMeasures || 'None'}`;
    });

    const criteriaLines = affiliation.diseases.map(
      (d) => `- ${d.code} (${d.measureName}, ${d.cmsWeight}x Weight): Target Disease "${d.diseaseName}". Rule: ${CLINICAL_MEASURE_CATALOG[d.code]?.criteriaRule}`
    );

    return {
      companyName: compName,
      targetPopulation: affiliation.targetPopulation,
      totalMembers: activeMembers.length,
      gapCount: starMetrics.totalGaps,
      metCount: starMetrics.totalMet,
      gapFreeMembers: starMetrics.gapFreeMembers,
      membersWithGaps: starMetrics.membersWithGaps,
      compliancePct: starMetrics.starPct,
      starRating: `${starMetrics.weightedStarValue || starMetrics.starValue}★`,
      assignedDiseases: affiliation.diseases,
      criteriaSummary: criteriaLines.join('\n'),
      prioritizedPatients: patientLines.join('\n') || 'All members in this cohort are gap-free!',
      patientList: patientsWithGaps,
    };
  }, [activeCompany, activeMembers]);

  // Dynamic Suggested Prompts based on active company
  const dynamicSuggestedPrompts = useMemo(() => {
    const compName = companyClinicalContext.companyName;
    const diseaseCodes = companyClinicalContext.assignedDiseases.map((d) => d.code).join(', ');

    return [
      {
        id: 'outreach_priority',
        title: `📞 Who should I call first in ${compName}?`,
        prompt: `Who are the highest-priority members in ${compName} I should call first today, and why are their priority scores highest?`,
      },
      {
        id: 'star_cutpoint',
        title: `🎯 Next Star Strategy for ${compName}`,
        prompt: `What is the fastest way for ${compName} to reach the next Star rating cutpoint across our assigned criteria (${diseaseCodes})?`,
      },
      {
        id: 'gap_summary',
        title: `📋 Overview of Open Care Gaps in ${compName}`,
        prompt: `Provide a detailed breakdown of all open care gaps in ${compName} and why they were triggered under NCQA HEDIS criteria.`,
      },
      {
        id: 'clinical_protocol',
        title: `🩺 Recommended Interventions for ${compName}`,
        prompt: `What specific clinical interventions and doctor protocols should we deploy to close care gaps in ${compName}?`,
      },
    ];
  }, [companyClinicalContext]);

  // Set initial greeting when company changes
  useEffect(() => {
    const compName = companyClinicalContext.companyName;
    const diseaseList = companyClinicalContext.assignedDiseases.map((d) => `${d.code} (${d.diseaseName})`).join(', ');

    setMessages([
      {
        role: 'assistant',
        content: `### 👋 Welcome! I am your ${compName} Quality Intelligence AI Copilot

I am currently scoped to **${compName}** with live clinical context:

| Plan Metric | Live Cohort Value |
| :--- | :--- |
| **Enrolled Population** | **${companyClinicalContext.totalMembers}** members (${companyClinicalContext.membersWithGaps} with care gaps, ${companyClinicalContext.gapFreeMembers} gap-free) |
| **Current Performance** | **${companyClinicalContext.compliancePct}%** (${companyClinicalContext.starRating}) |
| **Assigned Quality Criteria** | ${diseaseList || 'No quality criteria assigned'} |

Ask me anything about **${compName}'s** prioritized patients, care gap resolution, NCQA HEDIS rules, or next-Star cutpoint optimization!`,
        model: 'openai/gpt-oss-120b',
        latency_ms: 30,
      },
    ]);
  }, [selectedCompanyName, companyClinicalContext.companyName]);

  // Auto-scroll inside chat box on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  // Send message to Groq
  const handleSendMessage = async (textToSend) => {
    const msg = (textToSend || inputMessage).trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const systemPrompt = `You are the CareImpact Clinical AI Assistant & Quality Intelligence Copilot for ${companyClinicalContext.companyName}.
You specialize in NCQA HEDIS Quality Measures, CMS Star Ratings (MY2026), chronic disease management, care gap closure, and clinical outreach prioritization for ${companyClinicalContext.companyName}.

ACTIVE INSURANCE COMPANY SCOPE:
- Company Name: ${companyClinicalContext.companyName}
- Target Population: ${companyClinicalContext.targetPopulation}
- Enrolled Patients: ${companyClinicalContext.totalMembers}
- Overall Compliance Rate: ${companyClinicalContext.compliancePct}%
- Current Star Rating: ${companyClinicalContext.starRating}
- Open Care Gaps: ${companyClinicalContext.gapCount} (${companyClinicalContext.membersWithGaps} patients)

ASSIGNED CHRONIC DISEASE CRITERIA FOR ${companyClinicalContext.companyName}:
${companyClinicalContext.criteriaSummary}

HIGH PRIORITY PATIENTS WITH OPEN CARE GAPS IN ${companyClinicalContext.companyName}:
${companyClinicalContext.prioritizedPatients}

CRITICAL FORMATTING & CLINICAL RULES:
1. You are strictly focused on ${companyClinicalContext.companyName}. Only discuss members, measures, and data belonging to ${companyClinicalContext.companyName}.
2. Always format tabular information using standard GitHub Markdown tables with clear header rows (| Patient Name | Age | Priority | Open Care Gap | Outreach Action |).
3. Do NOT output raw HTML tags like <br> inside tables. Use separate columns or bullet points.
4. When asked who to call first ("whom should I call?", "high priority members"):
   - Present a clean markdown table of the top prioritized patients.
   - For each patient, provide: Name, Age, Priority Score, Open Gap Measure, and a concise clinical outreach script for the nurse/care coordinator.
5. When discussing Star Ratings:
   - Highlight the 3x triple weight impact of Blood Pressure (CBP) vs 1x process measures.
   - Explain how closing specific gaps moves ${companyClinicalContext.companyName} across the next Star cutpoint.
6. Use clean Markdown headings (###), bold highlights (**text**), and bullet lists.`;

    try {
      // Direct call to Groq API with fast models
      const groqPayload = {
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: msg },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      };

      const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groqPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqResp.ok) {
        const errText = await groqResp.text();
        throw new Error(`Groq API (${groqResp.status}): ${errText}`);
      }

      const groqData = await groqResp.json();
      const rawReply = groqData.choices?.[0]?.message?.content || 'No response received.';
      const cleanReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const latency = Date.now() - startTime;

      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: cleanReply || rawReply,
          model: 'openai/gpt-oss-120b',
          latency_ms: latency,
        },
      ]);
      setLastLatency(latency);
      setLastModel('openai/gpt-oss-120b');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Groq AI inference error:', err);
      toast.error('AI response error');

      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `⚠️ **Service Notification**: ${err.name === 'AbortError' ? 'Request timed out after 25 seconds.' : err.message}\n\nPlease try asking your question again.`,
          model: 'error',
          latency_ms: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    const compName = companyClinicalContext.companyName;
    setMessages([
      {
        role: 'assistant',
        content: `Chat session reset for **${compName}**. How can I help you today?`,
        model: 'openai/gpt-oss-120b',
        latency_ms: 10,
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Scoped Header (NO DROPDOWN AS REQUESTED, Shows Active Company Intelligence) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Bot className="w-7 h-7 text-indigo-400" />
              <span>AI Quality & Star Rating Assistant</span>
            </h1>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scoped to: {companyClinicalContext.companyName}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Clinical intelligence copilot trained on NCQA HEDIS criteria, CareImpact Priority Engine rankings, and{' '}
            <strong className="text-slate-200">{companyClinicalContext.companyName}'s</strong> live patient data.
          </p>
        </div>

        {/* Intelligence Status Badge */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Groq Llama-3.3 70B Active</span>
          </div>
        </div>
      </div>

      {/* 2. Company Live Scope Stats Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Payer Scope:</span>
            <strong className="text-white">{companyClinicalContext.companyName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400">Enrolled Members:</span>
            <strong className="text-white">{companyClinicalContext.totalMembers}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Star Rating:</span>
            <strong className="text-amber-400">{companyClinicalContext.starRating}</strong>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="text-slate-400">Open Gaps:</span>
            <strong className="text-rose-400">{companyClinicalContext.gapCount} Gaps</strong>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          To switch company, change the dropdown on Dashboard/Members/Simulator.
        </div>
      </div>

      {/* 3. Suggested Prompt Chips for this Company */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Suggested Questions for {companyClinicalContext.companyName}:</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {dynamicSuggestedPrompts.map((p) => (
            <button
              key={p.id}
              disabled={loading}
              onClick={() => handleSendMessage(p.prompt)}
              className="text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 transition-all text-xs group disabled:opacity-50"
            >
              <div className="font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                <span>{p.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Conversation Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
        {/* Chat Messages Scrollable Area */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble with ReactMarkdown & remarkGfm */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 space-y-2 text-xs leading-relaxed relative group overflow-hidden ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="prose prose-invert max-w-none text-xs">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-xl border border-slate-800 bg-slate-900/80">
                            <table className="w-full text-left text-xs border-collapse divide-y divide-slate-800" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-950 text-slate-300 font-mono text-[11px] uppercase tracking-wider font-bold" {...props} />
                        ),
                        tbody: ({ node, ...props }) => (
                          <tbody className="divide-y divide-slate-800/60 font-sans" {...props} />
                        ),
                        tr: ({ node, ...props }) => (
                          <tr className="hover:bg-slate-850/50 transition-colors" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="py-2.5 px-3.5 text-slate-300 font-semibold border-b border-slate-800" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="py-2.5 px-3.5 text-slate-200 text-xs leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-indigo-400" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-indigo-400 font-mono" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-slate-200 pl-1" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="my-1.5 leading-relaxed text-slate-200" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="text-white font-bold" {...props} />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1 className="text-base font-bold text-white mt-3 mb-1.5" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-sm font-bold text-white mt-3 mb-1.5" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-xs font-bold text-indigo-300 mt-2 mb-1 uppercase font-mono" {...props} />
                        ),
                        code: ({ node, inline, ...props }) => (
                          <code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[11px] text-indigo-300 border border-slate-800" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Assistant Footer Info */}
                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[10px] font-mono text-slate-500">
                      <span>{msg.model || 'Groq Llama-3.3 70B'} · {msg.latency_ms || 120}ms</span>
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 rounded-tl-none flex items-center gap-2 text-xs text-slate-400 font-mono">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1">Analyzing {companyClinicalContext.companyName} clinical data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition-all shrink-0"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Ask about ${companyClinicalContext.companyName}'s care gaps, members, or Star targets...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
