import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Layers,
  Users,
  Star,
  ArrowRight,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';

export default function CompanyView({
  hierarchy,
  onSelectCompany,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('members_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const companies = hierarchy?.companies || [];

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.plans.some((p) => p.planName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || c.performance.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'members_desc') return b.totalMembers - a.totalMembers;
      if (sortBy === 'members_asc') return a.totalMembers - b.totalMembers;
      if (sortBy === 'star_desc') return b.starPct - a.starPct;
      if (sortBy === 'star_asc') return a.starPct - b.starPct;
      if (sortBy === 'plans_desc') return b.plansCount - a.plansCount;
      if (sortBy === 'name_asc') return a.companyName.localeCompare(b.companyName);
      return 0;
    });
  }, [companies, searchTerm, statusFilter, sortBy]);

  // Overall counts for summary cards
  const highPerfCount = companies.filter((c) => c.performance.status === 'high_performing').length;
  const atRiskCount = companies.filter((c) => c.performance.status === 'at_risk').length;
  const moderateCount = companies.filter((c) => c.performance.status === 'moderate').length;

  return (
    <div className="space-y-8">
      {/* 1. Executive Rollup Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Companies */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800 relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Insurance Companies</span>
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-ai-purple-light border border-violet-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{hierarchy.totalCompanies}</span>
            <span className="text-xs text-slate-400">parent entities</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{highPerfCount} High Perf</span>
            <span>·</span>
            <span className="text-rose-400 font-semibold">{atRiskCount} At Risk</span>
          </div>
        </div>

        {/* Total Plans */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800 relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Plans</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{hierarchy.totalPlans}</span>
            <span className="text-xs text-slate-400">Plan Benefit Packages</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Avg {hierarchy.totalCompanies > 0 ? (hierarchy.totalPlans / hierarchy.totalCompanies).toFixed(1) : 0} plans per company
          </div>
        </div>

        {/* Total Enrolled Members */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800 relative overflow-hidden group hover:border-teal/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled Members</span>
            <div className="w-10 h-10 rounded-2xl bg-teal/15 text-teal-light border border-teal/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{hierarchy.totalMembers}</span>
            <span className="text-xs text-slate-400">patients in cohort</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {hierarchy.overallStarMetrics?.gapFreeMembers || 0} gap-free compliant
          </div>
        </div>

        {/* Aggregate Network Star % */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network Star Rating</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{hierarchy.overallStarPct}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
              {hierarchy.overallStarValue} ★
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className={`font-semibold ${hierarchy.overallPerformance.textClass}`}>
              {hierarchy.overallPerformance.label}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter, and View Controls */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search insurance company or plan name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-navy-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-navy-950/90 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({companies.length})
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

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-navy-950/90 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500/60 font-medium"
          >
            <option value="members_desc">Sort: Members (High → Low)</option>
            <option value="members_asc">Sort: Members (Low → High)</option>
            <option value="star_desc">Sort: Star % (High → Low)</option>
            <option value="star_asc">Sort: Star % (Low → High)</option>
            <option value="plans_desc">Sort: Most Plans</option>
            <option value="name_asc">Sort: Company Name (A-Z)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-navy-950/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Company Cards Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, index) => {
            const perf = company.performance;
            return (
              <motion.div
                key={company.companyName}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                onClick={() => onSelectCompany(company)}
                className="glass-card rounded-3xl p-6 border border-slate-800/90 hover:border-violet-500/50 transition-all duration-300 hover:shadow-glow-purple/20 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-navy-900 to-slate-800 border border-slate-700/80 flex items-center justify-center shadow-md group-hover:border-violet-500/40 group-hover:scale-105 transition-transform">
                        <Building2 className="w-6 h-6 text-ai-purple-light" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-ai-purple-light transition-colors leading-snug">
                          {company.companyName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 font-mono">
                            {company.plansCount} {company.plansCount === 1 ? 'Plan' : 'Plans'}
                          </span>
                          {company.ownershipTypes.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold uppercase">
                              {company.ownershipTypes.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${perf.badgeClass} shrink-0`}
                    >
                      {perf.label}
                    </span>
                  </div>

                  {/* Star Rating Gauge & Progress Bar */}
                  <div className="mt-4 p-4 rounded-2xl bg-navy-950/80 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        Aggregate Quality Score
                      </span>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className={`text-base font-black ${perf.textClass}`}>
                          {company.starPct}%
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          ({company.starValue} ★)
                        </span>
                      </div>
                    </div>

                    {/* Quality Progress Bar */}
                    <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(5, company.starPct))}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${perf.barColor}`}
                      />
                    </div>

                    {/* Quick Metric Rollup Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Members</div>
                        <div className="text-xs font-bold text-white font-mono mt-0.5">{company.totalMembers}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Met Quality</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{company.metCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Open Gaps</div>
                        <div className="text-xs font-bold text-rose-400 font-mono mt-0.5">{company.gapCount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Plan Previews */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 px-1">Plans in this company:</div>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {company.plans.map((p) => (
                        <div
                          key={p.planName}
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60"
                        >
                          <span className="text-slate-300 font-medium truncate max-w-[180px]">{p.planName}</span>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="text-slate-400">{p.memberCount} pts</span>
                            <span className={`font-bold ${p.performance.textClass}`}>{p.starPct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-ai-purple-light group-hover:text-white transition-colors">
                  <span>Drill Into Plans ({company.plansCount})</span>
                  <div className="w-7 h-7 rounded-xl bg-violet-500/10 text-ai-purple-light flex items-center justify-center group-hover:bg-violet-500 group-hover:text-navy-950 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/90 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Company Name</th>
                  <th className="py-3.5 px-4 font-semibold">Ownership</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Plans Count</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Total Members</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Star Rating %</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Performance</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCompanies.map((c) => {
                  const perf = c.performance;
                  return (
                    <tr
                      key={c.companyName}
                      onClick={() => onSelectCompany(c)}
                      className="hover:bg-slate-850/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-ai-purple-light shrink-0" />
                        <span>{c.companyName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {c.ownershipTypes.join(', ') || 'PRIVATE'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                        {c.plansCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {c.totalMembers}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-mono">
                          <span className={`font-black ${perf.textClass}`}>{c.starPct}%</span>
                          <span className="text-slate-500 font-bold">({c.starValue}★)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${perf.badgeClass}`}>
                          {perf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="inline-flex items-center gap-1 text-xs font-bold text-ai-purple-light hover:text-white transition-colors">
                          <span>View Plans</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty Search State */}
      {filteredCompanies.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Companies Found</h4>
          <p className="text-xs text-slate-400 mt-1">
            No insurance companies matched your search query "{searchTerm}" or active filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-all shadow-glow-purple"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
