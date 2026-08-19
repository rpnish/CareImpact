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
import PeekingRobot from '../components/PeekingRobot';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function AIAssistant() {
  const messagesEndRef = useRef(null);
  const toast = useToast();
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
    const totalGapsCount =
      starMetrics.totalGaps !== undefined
        ? starMetrics.totalGaps
        : starMetrics.gapCount !== undefined
        ? starMetrics.gapCount
        : activeMembers.reduce((acc, m) => acc + (m.gapCount || 0), 0);

    const membersWithGapsList = activeMembers
      .filter((m) => m.hasCareGap)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const topPrioritizedSummary = membersWithGapsList.slice(0, 8).map((m) => {
      const openGaps = Object.entries(m.measures || {})
        .filter(([_, status]) => status === 'GAP')
        .map(([code]) => code)
        .join(', ');
      return `- Patient: ${m.fullName}, Age: ${m.age}, Gender: ${m.gender}, ID: ${m.patientId}, Priority: ${m.priority || 0}, Open Gaps: [${openGaps}]`;
    }).join('\n');

    const criteriaSummary = affiliation.diseases.map((d) => {
      const catalogInfo = CLINICAL_MEASURE_CATALOG[d.code];
      return `• ${d.code} (${d.diseaseName}) [${d.cmsWeight}x Weight]: ${d.measureName}. Criteria: ${catalogInfo?.criteriaRule}. Why Gap Occurs: ${catalogInfo?.whyGapsOccur}`;
    }).join('\n');

    return {
      companyName: compName,
      totalMembers: activeMembers.length,
      starRating: `${starMetrics.starPct}% (${starMetrics.weightedStarValue || starMetrics.starValue}★)`,
      compliancePct: starMetrics.starPct,
      membersWithGaps: starMetrics.membersWithGaps ?? membersWithGapsList.length,
      gapFreeMembers: starMetrics.gapFreeMembers ?? (activeMembers.length - membersWithGapsList.length),
      gapCount: totalGapsCount,
      targetPopulation: affiliation.targetPopulation,
      criteriaSummary: criteriaSummary || 'No specific quality measures assigned (Uninsured cohort).',
      prioritizedPatients: topPrioritizedSummary || 'No patients with open gaps found in this plan.',
      topMembersList: membersWithGapsList.slice(0, 5),
    };
  }, [activeCompany, activeMembers]);

  // Suggested Prompts
  const dynamicSuggestedPrompts = useMemo(() => {
    const comp = companyClinicalContext.companyName;
    return [
      {
        id: 'call_first',
        title: `Who should I call first in ${comp}?`,
        prompt: `Who should I call first in ${comp}? Please present a prioritized table of members with open care gaps and outreach scripts.`,
      },
      {
        id: 'next_star',
        title: `Next Star Strategy for ${comp}`,
        prompt: `How can ${comp} reach the next Star rating tier? Explain the highest impact measures and weight calculations.`,
      },
      {
        id: 'gap_overview',
        title: `Overview of Open Care Gaps in ${comp}`,
        prompt: `Give me a breakdown of all open care gaps in ${comp} by measure and explain why they are triggering gaps.`,
      },
      {
        id: 'interventions',
        title: `Recommended Interventions for ${comp}`,
        prompt: `What specific clinical interventions should our care team execute this week for ${comp} patients?`,
      },
    ];
  }, [companyClinicalContext.companyName]);

  // Initialize initial greeting scoped to active company
  useEffect(() => {
    const compName = companyClinicalContext.companyName;
    setMessages([
      {
        role: 'assistant',
        content: `**Hello!** I am your CareImpact Clinical AI Assistant for **${compName}**.\n\nI am scoped to **${companyClinicalContext.totalMembers} enrolled members** (${companyClinicalContext.gapCount} open care gaps) in **${compName}**.\n\nAsk me anything about **${compName}'s** prioritized patients, care gap resolution, NCQA HEDIS rules, or next-Star cutpoint optimization!`,
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
      // 1. Try Backend /assistant/chat endpoint first
      let resolved = false;
      try {
        const backendResp = await fetch('http://127.0.0.1:8000/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
            company_name: companyClinicalContext.companyName,
            company_context: {
              totalMembers: companyClinicalContext.totalMembers,
              compliancePct: companyClinicalContext.compliancePct,
              starRating: companyClinicalContext.starRating,
              totalGaps: companyClinicalContext.gapCount,
              criteriaSummary: companyClinicalContext.criteriaSummary,
              prioritizedPatients: companyClinicalContext.prioritizedPatients,
            },
          }),
          signal: controller.signal,
        });

        if (backendResp.ok) {
          clearTimeout(timeoutId);
          const data = await backendResp.json();
          const rawReply = data.reply || 'No response received.';
          const cleanReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          const latency = data.latency_ms || (Date.now() - startTime);

          setMessages([
            ...newHistory,
            {
              role: 'assistant',
              content: cleanReply || rawReply,
              model: data.model || 'openai/gpt-oss-120b',
              latency_ms: latency,
            },
          ]);
          setLastLatency(latency);
          setLastModel(data.model || 'openai/gpt-oss-120b');
          resolved = true;
        }
      } catch (backendErr) {
        console.warn('Backend assistant endpoint call failed, attempting direct Groq API fallback:', backendErr);
      }

      // 2. Direct call to Groq API if backend wasn't resolved
      if (!resolved) {
        if (!GROQ_API_KEY) {
          throw new Error('Backend assistant server is unreachable. Please verify backend is running on port 8000.');
        }

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
      }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bot className="w-7 h-7 text-blue-600" />
              <span>AI Quality & Star Rating Assistant</span>
            </h1>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Scoped to: {companyClinicalContext.companyName}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Clinical intelligence copilot trained on NCQA HEDIS criteria, CareImpact Priority Engine rankings, and{' '}
            <strong className="text-slate-900">{companyClinicalContext.companyName}'s</strong> live patient data.
          </p>
        </div>

        {/* Intelligence Status Badge */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">Groq LPU Active</span>
          </div>
        </div>
      </div>

      {/* 2. Company Live Scope Stats Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500">Payer Scope:</span>
            <strong className="text-slate-900">{companyClinicalContext.companyName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500">Enrolled Members:</span>
            <strong className="text-slate-900">{companyClinicalContext.totalMembers}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span className="text-slate-500">Star Rating:</span>
            <strong className="text-amber-600 font-bold">{companyClinicalContext.starRating}</strong>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="text-slate-500">Open Gaps:</span>
            <strong className="text-rose-600 font-bold">{companyClinicalContext.gapCount} Gaps</strong>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          To switch company, change the dropdown on Dashboard/Members/Simulator.
        </div>
      </div>

      {/* 3. Suggested Prompt Chips for this Company */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Suggested Questions for {companyClinicalContext.companyName}:</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {dynamicSuggestedPrompts.map((p) => (
            <button
              key={p.id}
              disabled={loading}
              onClick={() => handleSendMessage(p.prompt)}
              className="text-left p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all text-xs group disabled:opacity-50 shadow-2xs"
            >
              <div className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                <span>{p.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Conversation Container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[580px]">
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
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed relative group overflow-hidden ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-none shadow-2xs space-y-2'
                  }`}
                >
                  {isUser ? (
                    <div className="text-white font-medium text-xs leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none text-xs">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase tracking-wider font-bold" {...props} />
                          ),
                          tbody: ({ node, ...props }) => (
                            <tbody className="divide-y divide-slate-200 font-sans" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr className="hover:bg-slate-50 transition-colors" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="py-2.5 px-3.5 text-slate-700 font-semibold border-b border-slate-200" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="py-2.5 px-3.5 text-slate-800 text-xs leading-relaxed" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-blue-600" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-blue-600 font-mono" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="text-slate-800 pl-1" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="my-1.5 leading-relaxed text-slate-800" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="text-slate-900 font-bold" {...props} />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 className="text-base font-bold text-slate-900 mt-3 mb-1.5" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-sm font-bold text-slate-900 mt-3 mb-1.5" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-xs font-bold text-blue-700 mt-2 mb-1 uppercase font-mono" {...props} />
                          ),
                          code: ({ node, inline, ...props }) => (
                            <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-blue-700 border border-slate-200" {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Assistant Footer Info */}
                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                      <span>{msg.model || 'Groq Active Model'} · {msg.latency_ms || 120}ms</span>
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-900 flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 rounded-tl-none flex items-center gap-2 text-xs text-slate-600 font-mono shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1">Analyzing {companyClinicalContext.companyName} clinical data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
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
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all shrink-0"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Ask about ${companyClinicalContext.companyName}'s care gaps, members, or Star targets...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Interactive Pop-up & Peeking Animated Robot Assistant */}
      <PeekingRobot
        companyName={companyClinicalContext.companyName}
        onInteract={() => {
          const inputEl = document.querySelector('input[type="text"]');
          if (inputEl) inputEl.focus();
        }}
      />
    </div>
  );
}
