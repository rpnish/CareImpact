import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  TrendingUp,
  Award,
  Sparkles,
  RotateCcw,
  Target,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Users,
  Star,
  Zap,
  Info,
  Check,
  Building2,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import CompanyPlanDropdown from '../components/CompanyPlanDropdown';
import { useCompanyScope } from '../context/CompanyScopeContext';
import { useMemberStore } from '../context/MemberStoreContext';
import {
  CLINICAL_MEASURE_CATALOG,
  CMS_MEASURE_CUTPOINTS,
  PLAN_DISEASE_AFFILIATIONS,
  determineStar,
  findNextStar,
  evaluateMeasurePriority,
} from '../utils/metricsEngine';
import { SkeletonCard } from '../components/Skeleton';

export default function StarSimulator() {
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

  // Active cohort of members for this company/plan
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

    // Apply local gap closure updates
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

  // Assigned measures for this company
  const assignedMeasureCodes = useMemo(() => {
    const compName = activeCompany?.companyName || 'Medicare';
    const affiliation = PLAN_DISEASE_AFFILIATIONS[compName];
    if (affiliation && affiliation.diseases.length > 0) {
      return affiliation.diseases.map((d) => d.code);
    }
    return ['CBP', 'HBD_C7', 'FVA'];
  }, [activeCompany]);

  // Baseline Measure Stats for the current company cohort
  const baselineMeasureStats = useMemo(() => {
    const stats = {};
    const totalCohortSize = activeMembers.length;

    for (const code of assignedMeasureCodes) {
      let compliant = 0;
      let gaps = 0;
      const eligibleMembers = [];

      for (const m of activeMembers) {
        const val = m.measures?.[code];
        if (val === 'MET') {
          compliant++;
          eligibleMembers.push(m);
        } else if (val === 'GAP') {
          gaps++;
          eligibleMembers.push(m);
        }
      }

      const eligible = compliant + gaps;
      const currentRate = eligible > 0 ? (compliant / eligible) * 100 : 0;
      const cutpoints = CMS_MEASURE_CUTPOINTS[code] || { 1: 0, 2: 50, 3: 65, 4: 75, 5: 85 };
      const currentStar = determineStar(currentRate, cutpoints);
      const nextStarInfo = findNextStar(currentRate, cutpoints);
      const info = CLINICAL_MEASURE_CATALOG[code];

      // CareImpact Priority Engine
      const priorityData = evaluateMeasurePriority(eligible, compliant, code, Math.max(gaps, 1));

      stats[code] = {
        code,
        name: info?.name || code,
        domain: info?.domain || 'Clinical Care',
        cmsWeight: info?.cmsWeight || 1,
        eligible,
        compliant,
        gaps,
        currentRate: Math.round(currentRate * 10) / 10,
        currentStar,
        nextStar: nextStarInfo.nextStar,
        nextStarCutpoint: nextStarInfo.nextCutpoint,
        priorityData,
        info,
      };
    }

    return stats;
  }, [activeMembers, assignedMeasureCodes]);

  // Sliders state: code -> gaps to close
  const [sliderGaps, setSliderGaps] = useState({});

  // Reset sliders when company changes
  useEffect(() => {
    setSliderGaps({});
  }, [selectedCompanyName, selectedPlanName]);

  const handleSliderChange = (code, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSliderGaps((prev) => ({
      ...prev,
      [code]: num,
    }));
  };

  const handleReset = () => {
    setSliderGaps({});
  };

  // Calculation of Simulated Star Ratings
  const simulationResults = useMemo(() => {
    let baselineWeightedStarsSum = 0;
    let simulatedWeightedStarsSum = 0;
    let totalWeights = 0;
    let totalBaselineMet = 0;
    let totalSimulatedMet = 0;
    let totalApplicableInstances = 0;
    let totalOpenGaps = 0;
    let totalGapsClosedSelected = 0;

    const measureBreakdowns = [];

    for (const code of assignedMeasureCodes) {
      const base = baselineMeasureStats[code];
      if (!base) continue;

      const gapsToClose = sliderGaps[code] || 0;
      totalGapsClosedSelected += gapsToClose;
      totalOpenGaps += base.gaps;

      const simulatedCompliant = Math.min(base.compliant + gapsToClose, base.eligible);
      const simulatedRate = base.eligible > 0 ? (simulatedCompliant / base.eligible) * 100 : 0;

      const cutpoints = CMS_MEASURE_CUTPOINTS[code] || { 1: 0, 2: 50, 3: 65, 4: 75, 5: 85 };
      const simulatedStar = determineStar(simulatedRate, cutpoints);
      const simulatedNext = findNextStar(simulatedRate, cutpoints);

      const weight = base.cmsWeight;
      totalWeights += weight;

      baselineWeightedStarsSum += base.currentStar * weight;
      simulatedWeightedStarsSum += simulatedStar * weight;

      totalBaselineMet += base.compliant;
      totalSimulatedMet += simulatedCompliant;
      totalApplicableInstances += base.eligible;

      const rateImprovement = Math.round((simulatedRate - base.currentRate) * 10) / 10;
      const starImprovement = simulatedStar - base.currentStar;

      measureBreakdowns.push({
        code,
        name: base.name,
        domain: base.domain,
        cmsWeight: weight,
        eligible: base.eligible,
        baselineCompliant: base.compliant,
        baselineGaps: base.gaps,
        baselineRate: base.currentRate,
        baselineStar: base.currentStar,
        gapsToClose,
        remainingGaps: Math.max(0, base.gaps - gapsToClose),
        simulatedCompliant,
        simulatedRate: Math.round(simulatedRate * 10) / 10,
        simulatedStar,
        rateImprovement,
        starImprovement,
        priorityScore: base.priorityData?.priorityScore || 0,
        nextStar: simulatedNext.nextStar,
        nextCutpoint: simulatedNext.nextCutpoint,
        info: base.info,
      });
    }

    const baselineWeightedStar = totalWeights > 0 ? baselineWeightedStarsSum / totalWeights : 1.0;
    const simulatedWeightedStar = totalWeights > 0 ? simulatedWeightedStarsSum / totalWeights : 1.0;
    const starDelta = Math.round((simulatedWeightedStar - baselineWeightedStar) * 100) / 100;

    const baselineCompliancePct =
      totalApplicableInstances > 0 ? Math.round((totalBaselineMet / totalApplicableInstances) * 1000) / 10 : 0;
    const simulatedCompliancePct =
      totalApplicableInstances > 0 ? Math.round((totalSimulatedMet / totalApplicableInstances) * 1000) / 10 : 0;
    const complianceDelta = Math.round((simulatedCompliancePct - baselineCompliancePct) * 10) / 10;

    // Sort by priority and potential improvement
    measureBreakdowns.sort((a, b) => b.priorityScore - a.priorityScore);

    const highestOpportunity = measureBreakdowns[0] || null;

    return {
      baselineWeightedStar: Math.round(baselineWeightedStar * 100) / 100,
      simulatedWeightedStar: Math.round(simulatedWeightedStar * 100) / 100,
      starDelta,
      baselineCompliancePct,
      simulatedCompliancePct,
      complianceDelta,
      totalOpenGaps,
      totalGapsClosedSelected,
      remainingGaps: Math.max(0, totalOpenGaps - totalGapsClosedSelected),
      measureBreakdowns,
      highestOpportunity,
    };
  }, [assignedMeasureCodes, baselineMeasureStats, sliderGaps]);

  if (storeLoading && !hierarchy) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* 1. Header & Scoping */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sliders className="w-7 h-7 text-amber-500" />
              <span>Star Rating Simulator</span>
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {activeCompany?.companyName || 'Medicare'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Simulate how closing care gaps could improve your{' '}
            <strong className="text-slate-900">{activeCompany?.companyName} Advantage</strong> Star Rating with live NCQA HEDIS criteria.
          </p>
        </div>

        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-2xs shrink-0"
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>View Prioritized Members Roster</span>
        </button>
      </div>

      {/* 2. Company & Plan Selector Dropdown */}
      <CompanyPlanDropdown
        hierarchy={hierarchy}
        selectedCompanyName={activeCompany?.companyName || 'Medicare'}
        selectedPlanName={selectedPlanName}
        onSelectCompany={handleSelectCompany}
        onSelectPlan={handleSelectPlan}
      />

      {/* 3. Top KPI Cards: Current Rating vs Simulated Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Current Rating */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Current Plan Baseline
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {Math.round(simulationResults.baselineWeightedStar)} ★ Tier
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
              {simulationResults.baselineWeightedStar.toFixed(2)}
            </span>
            <span className="text-2xl text-amber-500">★</span>
          </div>

          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Overall Compliance: <strong className="text-slate-900 font-semibold">{simulationResults.baselineCompliancePct}%</strong></span>
            <span>·</span>
            <span>{simulationResults.totalOpenGaps} Total Gaps</span>
          </div>
        </div>

        {/* Simulated Rating */}
        <div className="bg-white border border-blue-200 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs bg-gradient-to-br from-blue-50/40 via-white to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Simulated Projected Rating</span>
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {Math.round(simulationResults.simulatedWeightedStar)} ★ Projected
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-blue-700 font-mono tracking-tight">
              {simulationResults.simulatedWeightedStar.toFixed(2)}
            </span>
            <span className="text-2xl text-amber-500">★</span>
            {simulationResults.starDelta > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>+{simulationResults.starDelta.toFixed(2)} Star Gain</span>
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Projected Compliance: <strong className="text-emerald-700 font-semibold">{simulationResults.simulatedCompliancePct}%</strong></span>
            <span>·</span>
            <span>{simulationResults.totalGapsClosedSelected} Gaps Simulated</span>
          </div>
        </div>
      </div>

      {/* 4. Projected Star Impact Visual Continuum Track */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Projected Star Impact Track</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700">
            {simulationResults.starDelta > 0 ? `+${simulationResults.starDelta.toFixed(2)} ★ Improvement` : 'Baseline'}
          </span>
        </div>

        {/* Visual Progress Line */}
        <div className="relative pt-6 pb-2">
          {/* Baseline Rail */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200 relative">
            {/* Projected Fill */}
            <div
              style={{ width: `${((simulationResults.simulatedWeightedStar - 1.0) / 4.0) * 100}%` }}
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
            />
          </div>

          {/* Markers 1★ to 5★ */}
          <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-2 font-bold">
            <span>1.0 ★</span>
            <span>2.0 ★</span>
            <span>3.0 ★</span>
            <span>4.0 ★</span>
            <span>5.0 ★ (Top Tier)</span>
          </div>
        </div>
      </div>

      {/* 5. Interactive Gap Closure Simulator Sliders */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <span>Gap Closure Simulator</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Adjust sliders to choose how many open care gaps you want to close for each assigned measure.
            </p>
          </div>

          <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            {simulationResults.totalGapsClosedSelected} / {simulationResults.totalOpenGaps} Gaps Selected
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-6">
          {simulationResults.measureBreakdowns.map((item) => {
            const isTripleWeight = item.cmsWeight >= 3;
            const currentSelected = item.gapsToClose;

            return (
              <div
                key={item.code}
                className={`bg-slate-50 p-5 rounded-2xl border transition-all ${
                  isTripleWeight
                    ? 'border-blue-300 ring-1 ring-blue-100 bg-gradient-to-b from-blue-50/20 to-slate-50'
                    : 'border-slate-200'
                }`}
              >
                {/* Measure Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                        {item.code}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{item.name}</span>
                      {isTripleWeight && (
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          3x CMS Weight
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Prio: {item.priorityScore}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Current Compliance: <strong className="text-slate-900 font-mono">{item.baselineRate}%</strong> ({item.baselineCompliant}/{item.eligible}) · <span className="text-rose-600 font-semibold">{item.baselineGaps} Open Gaps</span>
                    </p>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="text-xs text-slate-500 block">Open Gaps in Plan</span>
                    <span className="text-xl font-black text-slate-900">{item.baselineGaps}</span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={item.baselineGaps}
                    value={currentSelected}
                    disabled={item.baselineGaps === 0}
                    onChange={(e) => handleSliderChange(item.code, e.target.value)}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>0 gaps</span>
                    <span className="text-blue-700 font-bold">
                      {currentSelected > 0 ? `Simulating ${currentSelected} gap closure${currentSelected > 1 ? 's' : ''}` : 'No gaps selected'}
                    </span>
                    <span>{item.baselineGaps} max</span>
                  </div>
                </div>

                {/* Dynamic Metric Feedback Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 font-mono text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase">Selected Gaps</span>
                    <span className="text-base font-bold text-slate-900 mt-0.5 block">{currentSelected}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase">Projected Rate</span>
                    <span className="text-base font-bold text-blue-700 mt-0.5 block">{item.simulatedRate}%</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase">Improvement</span>
                    <span className={`text-base font-bold mt-0.5 block ${item.rateImprovement > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {item.rateImprovement > 0 ? `↑ +${item.rateImprovement}%` : '0.0%'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase">Star Tier</span>
                    <span className="text-base font-bold text-amber-600 mt-0.5 block flex items-center gap-1">
                      <span>{item.simulatedStar} ★</span>
                      {item.starImprovement > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold">(+{item.starImprovement}★)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Dual Grid: Before vs After Chart & Impact Priority Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before vs After Visual Comparison */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Before vs After Comparison</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Measure compliance comparison under current scenario.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 font-mono text-xs">
              {simulationResults.measureBreakdowns.map((item) => (
                <div key={item.code} className="space-y-1.5">
                  <div className="flex justify-between text-slate-800">
                    <span className="font-bold">{item.code} ({item.name})</span>
                    <span className="text-slate-500">{item.baselineRate}% → <strong className="text-emerald-700 font-semibold">{item.simulatedRate}%</strong></span>
                  </div>

                  {/* Dual Bar */}
                  <div className="space-y-1">
                    {/* Baseline Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200">
                      <div style={{ width: `${item.baselineRate}%` }} className="bg-slate-400 h-full rounded-full" />
                    </div>
                    {/* Simulated Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
                      <div
                        style={{ width: `${item.simulatedRate}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-600 pt-3 border-t border-slate-200">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /> Current Baseline</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Simulated Projected</span>
          </div>
        </div>

        {/* Impact & Priority Analysis */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Impact & Priority Analysis</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Potential quality improvement ranked by CareImpact Priority Engine.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 font-mono">
              {simulationResults.measureBreakdowns.map((item, idx) => (
                <div
                  key={item.code}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500">{`0${idx + 1}`}</span>
                    <span className="font-bold text-slate-900">{item.code}</span>
                    <span className="text-[11px] text-slate-600">({item.name})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">
                      {item.rateImprovement > 0 ? `+${item.rateImprovement}%` : '0.0%'}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Prio: {item.priorityScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest Opportunity Callout */}
          {simulationResults.highestOpportunity && (
            <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-700 block font-mono">
                ★ Highest Strategic ROI Target
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                {simulationResults.highestOpportunity.name} ({simulationResults.highestOpportunity.code})
              </h4>
              <p className="text-xs text-slate-700">
                With a {simulationResults.highestOpportunity.cmsWeight}x CMS weight and priority score of {simulationResults.highestOpportunity.priorityScore},
                closing gaps in this measure provides the fastest trajectory to upgrade {activeCompany?.companyName}'s Star Rating.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Recommended Interventions Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Recommended Clinical Interventions</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Focus clinical outreach on measures with the highest potential Star rating impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {simulationResults.measureBreakdowns.map((item, idx) => (
            <div
              key={item.code}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="font-bold text-amber-600 uppercase tracking-wider">
                    PRIORITY #{idx + 1}
                  </span>
                  <span className="font-bold px-2 py-0.2 rounded bg-white text-slate-800 border border-slate-200">
                    {item.code}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.info?.clinicalAction}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="font-mono text-xs text-slate-600">
                  <span>{item.baselineGaps} Open Gaps</span>
                  <span className="mx-1.5">·</span>
                  <span className="text-emerald-700 font-bold">+{item.rateImprovement}% gain</span>
                </div>

                <button
                  onClick={() => navigate('/members')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>View Members</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Floating / Sticky Simulation Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-slate-200 py-4 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Numbers Summary */}
          <div className="flex items-center gap-6 font-mono text-xs flex-wrap justify-center sm:justify-start">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Gaps Selected</span>
              <span className="text-base font-bold text-slate-900">{simulationResults.totalGapsClosedSelected}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Remaining Gaps</span>
              <span className="text-base font-bold text-slate-700">{simulationResults.remainingGaps}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Projected Rating</span>
              <span className="text-base font-bold text-blue-700">{simulationResults.simulatedWeightedStar.toFixed(2)} ★</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Star Improvement</span>
              <span className={`text-base font-bold ${simulationResults.starDelta > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {simulationResults.starDelta > 0 ? `+${simulationResults.starDelta.toFixed(2)}` : '0.00'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulation</span>
            </button>

            <button
              onClick={() => navigate('/members')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>View Actionable Roster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
