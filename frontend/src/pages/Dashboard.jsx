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
} from 'lucide-react';
import { loadHierarchyFromCsv } from '../utils/hierarchyData';
import {
  computeStarRating,
  getPerformanceStatus,
  PLAN_DISEASE_AFFILIATIONS,
  CLINICAL_MEASURE_CATALOG,
} from '../utils/metricsEngine';
import CompanyPlanDropdown from '../components/CompanyPlanDropdown';
import CriteriaAnalysisCards from '../components/CriteriaAnalysisCards';
import GeographicMapCard from '../components/GeographicMapCard';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { useCompanyScope } from '../context/CompanyScopeContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    selectedCompanyName,
    selectedPlanName,
    setSelectedCompany,
    setSelectedPlan,
  } = useCompanyScope();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadHierarchyFromCsv('/newmembers.csv');
      setHierarchy(data);
    } catch (err) {
      console.error('Error loading hierarchy:', err);
      setError(err.message || 'Failed to load CSV data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const activeMembers = useMemo(() => {
    if (activePlan) return activePlan.members;
    if (activeCompany) return activeCompany.allMembers;
    return [];
  }, [activeCompany, activePlan]);

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

  if (loading && !hierarchy) {
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

  if (error && !hierarchy) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 space-y-4 shadow-sm">
          <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Failed to Load Dashboard Data</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Load
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Page Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeCompany?.companyName || 'Medicare'} Quality & Clinical Intelligence
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {activeCompany?.ownershipTypes?.join(', ') || 'GOVERNMENT'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time NCQA HEDIS criteria analysis, CareImpact Priority Engine rankings, and affiliated chronic disease tracking.
          </p>
        </div>

        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs shrink-0"
        >
          <Users className="w-4 h-4" />
          <span>View {activeCompany?.companyName} Prioritized Roster ({activeMembers.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Company & Plan Selector Dropdown (Shared Two-Way with Members page) */}
      <CompanyPlanDropdown
        hierarchy={hierarchy}
        selectedCompanyName={activeCompany?.companyName || 'Medicare'}
        selectedPlanName={selectedPlanName}
        onSelectCompany={handleSelectCompany}
        onSelectPlan={handleSelectPlan}
      />

      {/* 3. Plan-Specific KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Star Rating Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeCompany?.companyName} Star Rating
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {activeStarMetrics.starPct}%
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
              {activeStarMetrics.weightedStarValue || activeStarMetrics.starValue} ★
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 text-blue-600">
            <span>{activePerformance.label}</span>
          </div>
        </div>

        {/* Member Population */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Patients</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{activeMembers.length}</span>
            <span className="text-xs text-slate-500">members in plan</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="text-emerald-700 font-semibold">{activeStarMetrics.gapFreeMembers} Gap-Free</span>
            <span>·</span>
            <span className="text-rose-700 font-semibold">{activeStarMetrics.membersWithGaps} With Gaps</span>
          </div>
        </div>

        {/* Assigned Criteria Count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Criteria</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{diseaseAffiliation.diseases.length}</span>
            <span className="text-xs text-slate-500">measures evaluated</span>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-mono font-medium truncate">
            {diseaseAffiliation.diseases.map((d) => d.code).join(', ') || 'None (Exempt)'}
          </div>
        </div>

        {/* Members Requiring Outreach */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outreach Action List</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">
              {activeStarMetrics.membersWithGaps}
            </span>
            <span className="text-xs text-slate-500">patients with care gaps</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Actionable clinical priority cohort
          </div>
        </div>
      </div>

      {/* 4. Plan Affiliated Chronic Diseases & Measure Mapping Architecture */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-blue-600" />
              <span>{activeCompany?.companyName} Affiliated Chronic Disease & Clinical Measure Architecture</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Target clinical cohort: <span className="text-slate-900 font-semibold">{diseaseAffiliation.targetPopulation}</span>.
              Each disease is evaluated through an NCQA HEDIS criteria standard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseaseAffiliation.diseases.map((item) => (
            <div
              key={item.code}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.code}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    {item.cmsWeight}x CMS Weight
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                  {item.diseaseName}
                </h4>
                <div className="text-xs text-blue-700 mt-0.5 font-medium">
                  {item.measureName}
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {item.clinicalRationale}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Criteria Rule:</span>
                <span className="text-slate-800 font-semibold truncate max-w-[170px]" title={CLINICAL_MEASURE_CATALOG[item.code]?.criteriaRule}>
                  {CLINICAL_MEASURE_CATALOG[item.code]?.criteriaRule || 'Evaluation Rule'}
                </span>
              </div>
            </div>
          ))}

          {diseaseAffiliation.diseases.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              Uninsured cohort (NO_INSURANCE) has no payer quality rating criteria.
            </div>
          )}
        </div>
      </div>

      {/* 5. Criteria-Based Quality & "Why Gaps Occur" Root Cause Analysis */}
      <CriteriaAnalysisCards
        members={activeMembers}
        scopeTitle={activeCompany?.companyName || 'Medicare'}
      />

      {/* 6. Geographic Map Analysis for this specific company */}
      <GeographicMapCard
        members={activeMembers}
        scopeTitle={activeCompany?.companyName || 'Medicare'}
      />
    </div>
  );
}
