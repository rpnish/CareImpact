import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Users,
  Star,
  ArrowRight,
  ArrowLeft,
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { CLINICAL_MEASURE_CATALOG } from '../../utils/metricsEngine';

export default function PlanView({
  company,
  onSelectPlan,
  onBackToCompanies,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('members_desc');

  const plans = company?.plans || [];

  // Filter & sort plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        p.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.planId && p.planId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || p.performance.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'members_desc') return b.memberCount - a.memberCount;
      if (sortBy === 'members_asc') return a.memberCount - b.memberCount;
      if (sortBy === 'star_desc') return b.starPct - a.starPct;
      if (sortBy === 'star_asc') return a.starPct - b.starPct;
      if (sortBy === 'name_asc') return a.planName.localeCompare(b.planName);
      return 0;
    });
  }, [plans, searchTerm, statusFilter, sortBy]);

  const highPerfCount = plans.filter((p) => p.performance.status === 'high_performing').length;
  const atRiskCount = plans.filter((p) => p.performance.status === 'at_risk').length;
  const moderateCount = plans.filter((p) => p.performance.status === 'moderate').length;

  return (
    <div className="space-y-8">
      {/* 1. Parent Company Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-gradient-to-r from-navy-900 via-navy-950 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToCompanies}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-sm"
            title="Back to All Companies"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-ai-purple-light border border-violet-500/40">
                Insurance Company
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${company.performance.badgeClass}`}>
                {company.performance.label}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>{company.companyName}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a plan below to inspect individual patient rosters, clinical measures, and care gaps.
            </p>
          </div>
        </div>

        {/* Company Summary Quick Stats */}
        <div className="flex items-center gap-4 bg-navy-950/80 p-4 rounded-2xl border border-slate-800/90 self-stretch md:self-auto justify-around">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Plans</div>
            <div className="text-lg font-black text-white font-mono">{company.plansCount}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Members</div>
            <div className="text-lg font-black text-white font-mono">{company.totalMembers}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Aggregate Star</div>
            <div className={`text-lg font-black font-mono ${company.performance.textClass}`}>
              {company.starPct}% ({company.starValue}★)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Plan Search & Filter Toolbar */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search plans under ${company.companyName}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-navy-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1 bg-navy-950/90 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({plans.length})
            </button>
            <button
              onClick={() => setStatusFilter('high_performing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'high_performing'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              High ({highPerfCount})
            </button>
            <button
              onClick={() => setStatusFilter('moderate')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'moderate'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Mod ({moderateCount})
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'at_risk'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              At Risk ({atRiskCount})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-navy-950/90 border border-slate-800 text-xs text-slate-300 focus:outline-none font-medium"
          >
            <option value="members_desc">Sort: Member Count (High → Low)</option>
            <option value="members_asc">Sort: Member Count (Low → High)</option>
            <option value="star_desc">Sort: Star % (High → Low)</option>
            <option value="star_asc">Sort: Star % (Low → High)</option>
            <option value="name_asc">Sort: Plan Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 3. Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan, index) => {
          const perf = plan.performance;
          return (
            <motion.div
              key={plan.planName}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              onClick={() => onSelectPlan(plan)}
              className="glass-card rounded-3xl p-6 border border-slate-800/90 hover:border-sky-500/50 transition-all duration-300 hover:shadow-glow-teal/20 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Plan Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-950 to-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-500/40 transition-transform">
                      <Layers className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                        {plan.planName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-mono">
                          {plan.memberCount} Members
                        </span>
                        {plan.ownership && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold uppercase">
                            {plan.ownership}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${perf.badgeClass} shrink-0`}>
                    {perf.label}
                  </span>
                </div>

                {/* Plan Star Score Gauge */}
                <div className="mt-4 p-4 rounded-2xl bg-navy-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      Plan Star Performance
                    </span>
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className={`text-base font-black ${perf.textClass}`}>
                        {plan.starPct}%
                      </span>
                      <span className="text-xs text-slate-500 font-bold">
                        ({plan.starValue} ★)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(5, plan.starPct))}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${perf.barColor}`}
                    />
                  </div>

                  {/* Met vs Gap Count Comparison */}
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/60 text-center">
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-900/40">
                      <div className="text-[10px] uppercase font-bold text-emerald-400/80">Met Measures</div>
                      <div className="text-sm font-black text-emerald-300 font-mono mt-0.5">
                        {plan.metCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/40">
                      <div className="text-[10px] uppercase font-bold text-rose-400/80">Open Care Gaps</div>
                      <div className="text-sm font-black text-rose-300 font-mono mt-0.5">
                        {plan.gapCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Measure Compliance Pills */}
                {plan.measureBreakdown && (
                  <div className="mt-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 px-1">Clinical Measure Snapshot:</div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {['CBP', 'EED', 'FVA'].map((code) => {
                        const m = plan.measureBreakdown[code];
                        if (!m) return null;
                        return (
                          <div
                            key={code}
                            className="p-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px]"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name || code}: ${m.met} Met, ${m.gap} Gap`}
                          >
                            <div className="font-bold text-slate-400 font-mono">{code}</div>
                            <div className={`font-mono font-black text-xs mt-0.5 ${
                              m.totalApplicable === 0 ? 'text-slate-500' :
                              m.compliancePct >= 80 ? 'text-emerald-400' :
                              m.compliancePct >= 60 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {m.totalApplicable > 0 ? `${m.compliancePct}%` : 'N/A'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Action Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-sky-400 group-hover:text-white transition-colors">
                <span>View {plan.memberCount} Members Roster</span>
                <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-navy-950 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 max-w-lg mx-auto">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Plans Found</h4>
          <p className="text-xs text-slate-400 mt-1">
            No plans matched your search query in {company.companyName}.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition-all shadow-glow-teal"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
