import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { loadHierarchyFromCsv } from '../utils/hierarchyData';
import {
  computeStarRating,
  getPerformanceStatus,
  PLAN_DISEASE_AFFILIATIONS,
  CLINICAL_MEASURE_CATALOG,
  CMS_MEASURE_CUTPOINTS,
} from '../utils/metricsEngine';
import CompanyPlanDropdown from '../components/CompanyPlanDropdown';
import CriteriaAnalysisCards from '../components/CriteriaAnalysisCards';
import GeographicMapCard from '../components/GeographicMapCard';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { useCompanyScope } from '../context/CompanyScopeContext';
import { useMemberStore } from '../context/MemberStoreContext';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // High priority gap members (Priority >= 75)
  const highPriorityCount = useMemo(() => {
    return activeMembers.filter((m) => m.hasCareGap && (m.priority || 0) >= 75).length;
  }, [activeMembers]);

  if (storeLoading && !hierarchy) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Executive Summary Command Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE COHORT SYNC · NCQA HEDIS MY2026</span>
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {activeCompany?.ownershipTypes?.join(', ') || 'GOVERNMENT'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
              <span>{activeCompany?.companyName || 'Medicare'} Quality & Clinical Intelligence</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Executive performance monitoring, real-time NCQA HEDIS criteria analysis, CareImpact Priority Engine rankings, and affiliated chronic disease gap closure.
            </p>
          </div>

          {/* Quick Action Navigation Hub */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => navigate('/members')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Prioritized Roster ({activeMembers.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/simulator')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Star Simulator</span>
            </button>

            <button
              onClick={() => navigate('/assistant')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Company & Plan Selector Dropdown Bar */}
        <div className="pt-4 border-t border-slate-100">
          <CompanyPlanDropdown
            hierarchy={hierarchy}
            selectedCompanyName={activeCompany?.companyName || 'Medicare'}
            selectedPlanName={selectedPlanName}
            onSelectCompany={handleSelectCompany}
            onSelectPlan={handleSelectPlan}
          />
        </div>
      </div>

      {/* 2. Executive KPI Bento Grid (4 High-Density Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Star Rating */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                CMS Star Rating (MY2026)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-2xs">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {activeStarMetrics.starPct}%
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                {activeStarMetrics.weightedStarValue || activeStarMetrics.starValue} ★ Tier
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-600">{activePerformance.label}</span>
            <span className="text-[11px] font-mono text-slate-500">Cutpoint: MY2026</span>
          </div>
        </div>

        {/* Card 2: Enrolled Population */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Active Enrolled Patients
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">{activeMembers.length}</span>
              <span className="text-xs text-slate-500">members in plan</span>
            </div>
          </div>

          {/* Mini Split Progress Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200">
              <div
                style={{ width: `${(activeStarMetrics.gapFreeMembers / Math.max(1, activeMembers.length)) * 100}%` }}
                className="bg-emerald-500 h-full rounded-l-full"
              />
              <div
                style={{ width: `${(activeStarMetrics.membersWithGaps / Math.max(1, activeMembers.length)) * 100}%` }}
                className="bg-rose-400 h-full rounded-r-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-700 font-semibold">{activeStarMetrics.gapFreeMembers} Gap-Free</span>
              <span className="text-rose-700 font-semibold">{activeStarMetrics.membersWithGaps} With Gaps</span>
            </div>
          </div>
        </div>

        {/* Card 3: Evaluated Criteria & Triple Weight */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Assigned Plan Criteria
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">{diseaseAffiliation.diseases.length}</span>
              <span className="text-xs text-slate-500">measures evaluated</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <span className="text-blue-700 font-medium truncate max-w-[170px]" title={diseaseAffiliation.diseases.map(d => d.code).join(', ')}>
              {diseaseAffiliation.diseases.map(d => d.code).join(', ') || 'Exempt'}
            </span>
            <span className="text-[11px] text-slate-500">NCQA Standard</span>
          </div>
        </div>

        {/* Card 4: Actionable Care Gap List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Clinical Outreach Queue
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 font-mono">
                {activeStarMetrics.membersWithGaps}
              </span>
              <span className="text-xs text-slate-500">actionable patients</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-bold font-mono">
              {highPriorityCount} Urgent Priority
            </span>
            <button
              onClick={() => navigate('/members')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Review Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Structured Clinical Measure Architecture Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-blue-600" />
              <span>{activeCompany?.companyName} Affiliated Chronic Disease & Clinical Measure Architecture</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Target Clinical Population: <strong className="text-slate-900">{diseaseAffiliation.targetPopulation}</strong>.
              Each disease is scored under standardized NCQA HEDIS criteria rules.
            </p>
          </div>

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0 shadow-2xs">
            {diseaseAffiliation.diseases.length} Active Plan Protocols
          </span>
        </div>

        {/* Matrix Table Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseaseAffiliation.diseases.map((item) => {
            const catalog = CLINICAL_MEASURE_CATALOG[item.code];
            const isTriple = item.cmsWeight >= 3;

            return (
              <div
                key={item.code}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                  isTriple
                    ? 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200 shadow-2xs">
                        {item.code}
                      </span>
                      {isTriple ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                          3x CMS Weight
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                          {item.cmsWeight}x Weight
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
                      {catalog?.domain || 'Clinical'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                    {item.diseaseName}
                  </h4>
                  <div className="text-xs text-blue-700 font-semibold mt-0.5">
                    {item.measureName}
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {item.clinicalRationale}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Criteria Rule:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[180px]" title={catalog?.criteriaRule}>
                      {catalog?.criteriaRule || 'Evaluation Rule'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {diseaseAffiliation.diseases.length === 0 && (
            <div className="col-span-full py-10 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              Uninsured cohort (NO_INSURANCE) has no payer quality rating criteria.
            </div>
          )}
        </div>
      </div>

      {/* 4. Criteria Analysis & Root Cause Deep-Dive */}
      <CriteriaAnalysisCards
        members={activeMembers}
        scopeTitle={activeCompany?.companyName || 'Medicare'}
      />

      {/* 5. Regional Geographic Mapping & Cluster Heatmap */}
      <GeographicMapCard
        members={activeMembers}
        scopeTitle={activeCompany?.companyName || 'Medicare'}
      />
    </div>
  );
}
