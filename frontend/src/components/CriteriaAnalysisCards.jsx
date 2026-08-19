import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { CLINICAL_MEASURE_CATALOG, evaluateMeasurePriority } from '../utils/metricsEngine';

const ALL_MEASURE_CODES = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];

export default function CriteriaAnalysisCards({ members = [], scopeTitle = 'Medicare' }) {
  const [viewMode, setViewMode] = useState('ASSIGNED_ONLY'); // 'ASSIGNED_ONLY' | 'ALL_CATALOG'
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [expandedCode, setExpandedCode] = useState(null);

  // Compute criteria breakdown & CareImpact Priority Engine stats for the active member set
  const criteriaStats = useMemo(() => {
    const rawCounts = {};

    for (const code of ALL_MEASURE_CODES) {
      let met = 0;
      let gap = 0;
      let na = 0;
      const gapMembers = [];

      for (const m of members) {
        const result = m.measures?.[code] || 'N/A';
        if (result === 'MET') {
          met++;
        } else if (result === 'GAP') {
          gap++;
          gapMembers.push(m);
        } else {
          na++;
        }
      }

      rawCounts[code] = { met, gap, na, gapMembers };
    }

    const maxGaps = Math.max(
      ...Object.values(rawCounts).map((c) => c.gap),
      1
    );

    const stats = {};
    for (const code of ALL_MEASURE_CODES) {
      const { met, gap, na, gapMembers } = rawCounts[code];
      const totalApplicable = met + gap;
      const info = CLINICAL_MEASURE_CATALOG[code];

      const priorityData = evaluateMeasurePriority(totalApplicable, met, code, maxGaps);

      stats[code] = {
        code,
        info,
        met,
        gap,
        na,
        totalApplicable,
        compliancePct: priorityData.currentPerformancePct,
        gapMembers,
        isAssignedToPlan: totalApplicable > 0,
        priorityData,
      };
    }

    return stats;
  }, [members]);

  // Codes assigned to this plan vs all
  const assignedCodes = useMemo(() => {
    return ALL_MEASURE_CODES.filter((code) => criteriaStats[code]?.totalApplicable > 0);
  }, [criteriaStats]);

  const activeCodesToDisplay = useMemo(() => {
    const baseList = viewMode === 'ASSIGNED_ONLY' && assignedCodes.length > 0
      ? assignedCodes
      : ALL_MEASURE_CODES;

    return baseList.filter((code) => {
      if (selectedDomain === 'ALL') return true;
      return CLINICAL_MEASURE_CATALOG[code]?.domain === selectedDomain;
    });
  }, [viewMode, assignedCodes, selectedDomain]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Assigned Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Assigned Disease Criteria & Care Gap Analysis</span>
            </h3>
            {assignedCodes.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {assignedCodes.length} Assigned Criteria
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Evaluating real NCQA HEDIS criteria rules, next-Star reachability, and priority rankings for{' '}
            <span className="text-slate-900 font-semibold">{scopeTitle}</span> ({members.length} members).
          </p>
        </div>

        {/* View Toggle: Assigned Criteria vs All */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs">
          <button
            onClick={() => {
              setViewMode('ASSIGNED_ONLY');
              setSelectedDomain('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'ASSIGNED_ONLY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assigned Measures ({assignedCodes.length})
          </button>
          <button
            onClick={() => setViewMode('ALL_CATALOG')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'ALL_CATALOG'
                ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Catalog (9)
          </button>
        </div>
      </div>

      {/* 2. Criteria Measure Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeCodesToDisplay.map((code) => {
          const item = criteriaStats[code];
          const info = item.info;
          const prio = item.priorityData;
          const isExpanded = expandedCode === code;
          const isTripleWeight = info.cmsWeight >= 3;
          const isAssigned = item.totalApplicable > 0;

          return (
            <motion.div
              key={code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs ${
                isTripleWeight && isAssigned
                  ? 'border-blue-300 ring-1 ring-blue-100 bg-gradient-to-b from-blue-50/30 to-white'
                  : isAssigned
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200/80 opacity-60'
              }`}
            >
              <div>
                {/* Card Top Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        {code}
                      </span>
                      {isTripleWeight ? (
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          3x CMS Weight
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {info.cmsWeight}x Weight
                        </span>
                      )}
                      {isAssigned && prio && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Prio: {prio.priorityScore}</span>
                        </span>
                      )}
                      {!isAssigned && (
                        <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          Not in Plan
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                      {info.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {info.domain}
                    </span>
                  </div>

                  {/* Compliance Rate & Current Star */}
                  <div className="text-right font-mono shrink-0">
                    <div className={`text-base font-black ${
                      !isAssigned ? 'text-slate-400' :
                      item.compliancePct >= 80 ? 'text-emerald-600' :
                      item.compliancePct >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {isAssigned ? `${item.compliancePct}%` : 'N/A'}
                    </div>
                    {isAssigned && prio && (
                      <div className="text-[11px] font-bold text-amber-600 flex items-center justify-end gap-1">
                        <span>{prio.currentStar} ★</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compliance Progress Bar */}
                {isAssigned ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
                      <div
                        style={{ width: `${item.compliancePct}%` }}
                        className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                      />
                      <div
                        style={{ width: `${100 - item.compliancePct}%` }}
                        className="bg-rose-400 h-full rounded-r-full transition-all duration-500"
                      />
                    </div>

                    {/* Numbers breakdown */}
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item.met} Met
                      </span>
                      <span className="text-slate-500 font-medium">
                        {item.totalApplicable} Eligible
                      </span>
                      <span className="flex items-center gap-1 text-rose-700 font-semibold">
                        <AlertOctagon className="w-3 h-3 text-rose-600" />
                        {item.gap} Gaps
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded-lg bg-slate-50 text-slate-500 text-[11px] font-mono text-center border border-slate-200">
                    This measure is not in this plan's benefit package.
                  </div>
                )}

                {/* Next-Star Decision & Reachability Box */}
                {isAssigned && prio && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        <span>Next Target:</span>
                      </span>
                      <span className="text-blue-700 font-bold">
                        {prio.nextStar ? `${prio.nextStar}★ (at ${prio.nextStarCutpoint}%)` : 'Top Tier (5★ Max)'}
                      </span>
                    </div>

                    {prio.nextStar && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Gaps Needed to Flip Star:</span>
                        <span className="text-emerald-700 font-bold">
                          {prio.gapsNeededForNextStar} members ({prio.reachabilityPct}% reachability)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Why Gaps Occur (Root Cause Criteria Callout) */}
                <div className="mt-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Why Gaps Occur (Criteria Trigger):</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {info.whyGapsOccur}
                  </p>
                </div>
              </div>

              {/* Expand Action for Clinical Protocol */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setExpandedCode(isExpanded ? null : code)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Action Protocol' : 'View Recommended Action'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs space-y-2"
                    >
                      <div>
                        <span className="text-slate-500 font-semibold text-[10px] uppercase">Clinical Action Plan:</span>
                        <p className="text-slate-800 text-[11px] mt-0.5">{info.clinicalAction}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold text-[10px] uppercase">Evaluation Rule:</span>
                        <p className="text-slate-600 font-mono text-[10px] mt-0.5">{info.criteriaRule}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
