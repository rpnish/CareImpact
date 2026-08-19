import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Star,
  Activity,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Zap,
  Sliders,
  Bot,
  FileCheck,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  PhoneCall,
  Target,
  Layers,
  Building2,
  Calendar,
  Eye,
  Info,
} from 'lucide-react';
import { loadHierarchyFromCsv } from '../utils/hierarchyData';
import {
  computeStarRating,
  getPerformanceStatus,
  PLAN_DISEASE_AFFILIATIONS,
  CLINICAL_MEASURE_CATALOG,
  CMS_MEASURE_CUTPOINTS,
  evaluateMeasurePriority,
  findNextStar,
} from '../utils/metricsEngine';
import CompanyPlanDropdown from '../components/CompanyPlanDropdown';
import GeographicMapCard from '../components/GeographicMapCard';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { useCompanyScope } from '../context/CompanyScopeContext';
import { useMemberStore } from '../context/MemberStoreContext';

const ALL_MEASURE_CODES = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    selectedCompanyName,
    selectedPlanName,
    setSelectedCompany,
    setSelectedPlan,
  } = useCompanyScope();

  const {
    hierarchy,
    loading: storeLoading,
    customMembers,
    memberUpdates,
    deletedMemberIds,
  } = useMemberStore();

  const [viewMode, setViewMode] = useState('ASSIGNED_ONLY'); // 'ASSIGNED_ONLY' | 'ALL_CATALOG'
  const [expandedCode, setExpandedCode] = useState(null);

  // Handlers for dropdown selection
  const handleSelectCompany = (company) => {
    const compName = company ? company.companyName : 'Medicare';
    setSelectedCompany(compName);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan ? plan.planName : null);
  };

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

  // Active members taking into account custom additions, gap updates, and deletions
  const activeMembers = useMemo(() => {
    let rawList = [];
    if (activePlan) {
      rawList = activePlan.members;
    } else if (activeCompany) {
      rawList = activeCompany.allMembers;
    }

    rawList = rawList.filter(
      (m) => !deletedMemberIds.includes(m.patientId) && !deletedMemberIds.includes(m.id)
    );

    const compName = activeCompany?.companyName || 'Medicare';
    const relevantCustom = customMembers.filter((m) => {
      if (deletedMemberIds.includes(m.patientId) || deletedMemberIds.includes(m.id)) return false;
      if (activePlan) {
        return m.company === compName && m.planName === activePlan.planName;
      }
      return m.company === compName;
    });

    const combined = [...relevantCustom, ...rawList];

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

  const activeStarMetrics = useMemo(() => {
    return computeStarRating(activeMembers, activeCompany?.companyName || 'Medicare');
  }, [activeMembers, activeCompany]);

  const activePerformance = useMemo(() => {
    return getPerformanceStatus(activeStarMetrics.starPct);
  }, [activeStarMetrics]);

  // Plan Disease Affiliation Data
  const diseaseAffiliation = useMemo(() => {
    const compName = activeCompany?.companyName || 'Medicare';
    return PLAN_DISEASE_AFFILIATIONS[compName] || {
      company: compName,
      targetPopulation: 'Enrolled Members',
      diseases: [],
    };
  }, [activeCompany]);

  // Assigned measure codes
  const assignedCodes = useMemo(() => {
    return diseaseAffiliation.diseases.map((d) => d.code);
  }, [diseaseAffiliation]);

  // Codes to display in matrix based on view toggle
  const codesToDisplay = useMemo(() => {
    if (viewMode === 'ALL_CATALOG') return ALL_MEASURE_CODES;
    return assignedCodes.length > 0 ? assignedCodes : ALL_MEASURE_CODES;
  }, [viewMode, assignedCodes]);

  // Detailed measure calculation matrix
  const planMeasureMatrix = useMemo(() => {
    const maxGaps = Math.max(1, ...codesToDisplay.map((code) => {
      let g = 0;
      activeMembers.forEach((m) => {
        if (m.measures?.[code] === 'GAP') g++;
      });
      return g;
    }));

    return codesToDisplay.map((code) => {
      let compliant = 0;
      let gaps = 0;
      activeMembers.forEach((m) => {
        const val = m.measures?.[code];
        if (val === 'MET') compliant++;
        else if (val === 'GAP') gaps++;
      });

      const eligible = compliant + gaps;
      const rate = eligible > 0 ? Math.round((compliant / eligible) * 1000) / 10 : 0;
      const info = CLINICAL_MEASURE_CATALOG[code];
      const prio = evaluateMeasurePriority(eligible, compliant, code, maxGaps);
      const cutpoints = CMS_MEASURE_CUTPOINTS[code] || { 1: 0, 2: 50, 3: 65, 4: 75, 5: 85 };
      const nextInfo = findNextStar(rate, cutpoints);
      const isAssigned = assignedCodes.includes(code) || eligible > 0;

      return {
        code,
        name: info?.name || code,
        domain: info?.domain || 'Clinical Care',
        cmsWeight: info?.cmsWeight || 1,
        eligible,
        compliant,
        gaps,
        rate,
        isAssigned,
        currentStar: prio.currentStar,
        nextStar: nextInfo.nextStar,
        nextCutpoint: nextInfo.nextCutpoint,
        gapsNeeded: prio.gapsNeededForNextStar,
        reachabilityPct: prio.reachabilityPct,
        priorityScore: prio.priorityScore,
        clinicalAction: info?.clinicalAction,
        criteriaRule: info?.criteriaRule,
        whyGapsOccur: info?.whyGapsOccur,
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [codesToDisplay, assignedCodes, activeMembers]);

  // Top prioritized members with open care gaps
  const prioritizedPatientsQueue = useMemo(() => {
    return activeMembers
      .filter((m) => m.hasCareGap)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 6);
  }, [activeMembers]);

  // Highest strategic ROI measure (top weighted priority)
  const highestRoiMeasure = useMemo(() => {
    return planMeasureMatrix.find((m) => m.isAssigned) || planMeasureMatrix[0] || null;
  }, [planMeasureMatrix]);

  if (storeLoading && !hierarchy) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE COMMAND BAR & PLAN SELECTOR */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>NCQA HEDIS MY2026 AUDIT COMPLIANT</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {activeCompany?.ownershipTypes?.join(', ') || 'GOVERNMENT'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {activeMembers.length} Enrolled Members · {activeStarMetrics.totalGaps || activeStarMetrics.gapCount || 0} Open Gaps
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
              {activeCompany?.companyName || 'Medicare'} Quality & Clinical Intelligence Center
            </h1>
          </div>

          {/* Quick Action Navigation Hub */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => navigate('/members')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Prioritized Roster ({activeMembers.length})</span>
            </button>

            <button
              onClick={() => navigate('/simulator')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Star Simulator</span>
            </button>

            <button
              onClick={() => navigate('/assistant')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Unified Company & Plan Selector Dropdown */}
        <div className="pt-3 border-t border-slate-100">
          <CompanyPlanDropdown
            hierarchy={hierarchy}
            selectedCompanyName={activeCompany?.companyName || 'Medicare'}
            selectedPlanName={selectedPlanName}
            onSelectCompany={handleSelectCompany}
            onSelectPlan={handleSelectPlan}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEAMLESS ASYMMETRIC BENTO GRID: LEFT (65%) & RIGHT SIDEBAR (35%)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ===================================================================== */}
        {/* LEFT COLUMN: 8 COLS (66.6%) - CLINICAL PERFORMANCE & MEASURE MATRIX   */}
        {/* ===================================================================== */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          {/* Bento Card 1: CMS Star Rating Performance Hub */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-500 font-mono block">
                  CMS Star Rating Scorecard
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{activeCompany?.companyName} Performance Rating</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    {activeStarMetrics.weightedStarValue || activeStarMetrics.starValue} ★ Tier
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Compliance</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{activeStarMetrics.starPct}%</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center font-bold text-lg shadow-2xs">
                  ★
                </div>
              </div>
            </div>

            {/* Visual Star continuum rail */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-600 font-semibold">Live Score: <strong className="text-slate-900">{activeStarMetrics.starPct}%</strong></span>
                <span className="text-blue-700 font-semibold">{activePerformance.label}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200 relative">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, activeStarMetrics.starPct))}%` }}
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-0.5">
                <span>1.0 ★ (0%)</span>
                <span>2.0 ★ (50%)</span>
                <span>3.0 ★ (65%)</span>
                <span>4.0 ★ (75%)</span>
                <span>5.0 ★ (85%+)</span>
              </div>
            </div>

            {/* Quick 3-Tile Breakdown */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 font-mono text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Enrolled Cohort</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">{activeMembers.length} Members</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Gap-Free Members</span>
                <span className="text-base font-bold text-emerald-700 mt-0.5 block">{activeStarMetrics.gapFreeMembers} Compliant</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Members With Gaps</span>
                <span className="text-base font-bold text-rose-600 mt-0.5 block">{activeStarMetrics.membersWithGaps} Actionable</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Interactive Clinical Measure & Root-Cause Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>Clinical Quality & Gap Root-Cause Matrix ({planMeasureMatrix.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live NCQA HEDIS criteria rules, next-Star cutpoint reachability, and root-cause analysis.
                  </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setViewMode('ASSIGNED_ONLY')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      viewMode === 'ASSIGNED_ONLY'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Assigned ({assignedCodes.length})
                  </button>
                  <button
                    onClick={() => setViewMode('ALL_CATALOG')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      viewMode === 'ALL_CATALOG'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All Catalog (9)
                  </button>
                </div>
              </div>

              {/* High-Density Matrix Table */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                      <th className="py-2.5 px-3 font-semibold">Measure / Protocol</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Weight</th>
                      <th className="py-2.5 px-3 font-semibold">Compliance Rate</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Gaps</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Next Star Leap</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Priority</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {planMeasureMatrix.map((item) => {
                      const isTriple = item.cmsWeight >= 3;
                      const isExpanded = expandedCode === item.code;

                      return (
                        <React.Fragment key={item.code}>
                          <tr
                            onClick={() => setExpandedCode(isExpanded ? null : item.code)}
                            className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                                  {item.code}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{item.name}</span>
                                    {!item.isAssigned && (
                                      <span className="text-[9px] font-mono text-slate-400 font-normal">
                                        (Not in Plan)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal">{item.domain}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-2 text-center font-mono">
                              {isTriple ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                                  3x Triple
                                </span>
                              ) : (
                                <span className="text-slate-600 font-medium text-[11px]">
                                  {item.cmsWeight}x
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 min-w-[130px]">
                              {item.eligible > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between font-mono text-[11px]">
                                    <span className="font-bold text-slate-900">{item.rate}%</span>
                                    <span className="text-slate-500">{item.compliant}/{item.eligible}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex border border-slate-200">
                                    <div style={{ width: `${item.rate}%` }} className="bg-emerald-500 h-full rounded-full" />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">N/A</span>
                              )}
                            </td>

                            <td className="py-3 px-2 text-center font-mono font-bold text-rose-600">
                              {item.eligible > 0 ? item.gaps : '—'}
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-[11px]">
                              {item.eligible > 0 ? (
                                item.nextStar ? (
                                  <span className="text-blue-700 font-semibold" title={`Need ${item.gapsNeeded} more gap closures for ${item.nextStar}★`}>
                                    {item.nextStar}★ <span className="text-slate-400">({item.gapsNeeded} needed)</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold">5★ Top Tier</span>
                                )
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-3 px-2 text-center font-mono">
                              {item.eligible > 0 ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  item.priorityScore >= 75
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {item.priorityScore}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Root Cause & Action Protocol Row */}
                          {isExpanded && (
                            <tr className="bg-blue-50/20">
                              <td colSpan={7} className="p-4 border-b border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-rose-600 uppercase text-[10px] tracking-wider block">
                                      Why Gap Occurs (Root Cause):
                                    </span>
                                    <p className="text-slate-700 text-[11px] leading-relaxed">
                                      {item.whyGapsOccur}
                                    </p>
                                  </div>
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-blue-700 uppercase text-[10px] tracking-wider block">
                                      Recommended Clinical Outreach Action:
                                    </span>
                                    <p className="text-slate-700 text-[11px] leading-relaxed">
                                      {item.clinicalAction}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Click on any measure row to view clinical action plans and root causes.</span>
              <button
                onClick={() => navigate('/members')}
                className="text-blue-600 font-bold hover:underline"
              >
                Inspect All Members in Roster →
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: 4 COLS (33.3%) - ACTIONABLE QUEUE & STRATEGIC SIDEBAR   */}
        {/* ===================================================================== */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          {/* Sidebar Card 1: Urgent Nurse Outreach Queue */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Urgent Outreach Queue</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Top Priority
              </span>
            </div>

            <div className="space-y-2.5">
              {prioritizedPatientsQueue.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/members/${patient.id}`)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 flex items-center gap-1.5">
                      <span className="truncate">{patient.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({patient.age}y)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      Gaps: <strong className="text-rose-600">{patient.gapCount} Open</strong> · ZIP {patient.zip || 'N/A'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono font-black text-xs">
                      {patient.priority}
                    </span>
                  </div>
                </div>
              ))}

              {prioritizedPatientsQueue.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-slate-700">All members are 100% compliant!</p>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/members')}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>View All {activeMembers.length} Members</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Sidebar Card 2: Highest Strategic Star ROI Callout */}
          {highestRoiMeasure && (
            <div className="bg-gradient-to-br from-blue-50 via-white to-white border border-blue-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-blue-700 font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Strategic Star Lever</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                  {highestRoiMeasure.cmsWeight}x CMS Weight
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {highestRoiMeasure.name} ({highestRoiMeasure.code})
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Closing <strong className="text-slate-900">{highestRoiMeasure.gaps} open gaps</strong> in {highestRoiMeasure.code} provides the fastest mathematical path to move {activeCompany?.companyName} to the next Star cutpoint.
                </p>
              </div>

              <button
                onClick={() => navigate('/simulator')}
                className="w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate {highestRoiMeasure.code} Gap Closure</span>
              </button>
            </div>
          )}

          {/* Sidebar Card 3: Quick AI Clinical Copilot Launch */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Clinical AI Quality Assistant</h4>
                <p className="text-[11px] text-slate-500">Live for {activeCompany?.companyName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ask questions about {activeCompany?.companyName}'s high-priority members, nurse outreach phone scripts, or NCQA HEDIS criteria rules.
            </p>

            <button
              onClick={() => navigate('/assistant')}
              className="w-full py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>Launch AI Copilot</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FULL-WIDTH LOWER BENTO SECTION: GEOGRAPHIC REGIONAL HEATMAP MAP        */}
      {/* ========================================================================= */}
      <div>
        <GeographicMapCard
          members={activeMembers}
          scopeTitle={activeCompany?.companyName || 'Medicare'}
        />
      </div>
    </div>
  );
}
