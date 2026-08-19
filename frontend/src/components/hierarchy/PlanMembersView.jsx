import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Download,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Building2,
  Layers,
  Star,
} from 'lucide-react';
import { CLINICAL_MEASURE_CATALOG } from '../../utils/metricsEngine';

const MEASURE_CODES = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];

export default function PlanMembersView({
  company,
  plan,
  onBackToPlans,
  onBackToCompanies,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gapFilter, setGapFilter] = useState('ALL'); // 'ALL' | 'GAP_ONLY' | 'MET_ONLY'
  const [measureFilter, setMeasureFilter] = useState('ALL'); // 'ALL' | measure code
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('gaps_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMemberModal, setSelectedMemberModal] = useState(null);
  const itemsPerPage = 15;

  const members = plan?.members || [];

  // Filter & sort members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search filter
      const matchesSearch =
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.zip.includes(searchTerm);

      // Gap status filter
      let matchesGap = true;
      if (gapFilter === 'GAP_ONLY') matchesGap = m.hasCareGap;
      if (gapFilter === 'MET_ONLY') matchesGap = !m.hasCareGap;

      // Specific measure filter
      let matchesMeasure = true;
      if (measureFilter !== 'ALL') {
        matchesMeasure = m.measures[measureFilter] === 'GAP';
      }

      // Gender filter
      let matchesGender = true;
      if (genderFilter !== 'ALL') {
        matchesGender = m.gender === genderFilter;
      }

      return matchesSearch && matchesGap && matchesMeasure && matchesGender;
    }).sort((a, b) => {
      if (sortBy === 'gaps_desc') return b.gapCount - a.gapCount;
      if (sortBy === 'gaps_asc') return a.gapCount - b.gapCount;
      if (sortBy === 'priority_desc') return b.priority - a.priority;
      if (sortBy === 'priority_asc') return a.priority - b.priority;
      if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'age_desc') return (Number(b.age) || 0) - (Number(a.age) || 0);
      return 0;
    });
  }, [members, searchTerm, gapFilter, measureFilter, genderFilter, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  // Export filtered roster to CSV
  const handleExportCsv = () => {
    const headers = [
      'PATIENT_ID',
      'MEMBER_ID',
      'FIRST_NAME',
      'LAST_NAME',
      'BIRTHDATE',
      'AGE',
      'GENDER',
      'STATE',
      'ZIP',
      'INSURANCE_COMPANY',
      'PLAN_NAME',
      ...MEASURE_CODES,
      'TOTAL_APPLICABLE',
      'TOTAL_GAPS',
      'HAS_CARE_GAP',
      'PRIORITY',
    ];

    const csvRows = [
      headers.join(','),
      ...filteredMembers.map((m) =>
        [
          `"${m.patientId}"`,
          `"${m.memberId}"`,
          `"${m.firstName}"`,
          `"${m.lastName}"`,
          `"${m.birthdate}"`,
          `"${m.age}"`,
          `"${m.gender}"`,
          `"${m.state}"`,
          `"${m.zip}"`,
          `"${m.company}"`,
          `"${m.planName}"`,
          ...MEASURE_CODES.map((c) => `"${m.measures[c] || 'N/A'}"`),
          m.applicableCount,
          m.gapCount,
          `"${m.hasCareGap ? 'Y' : 'N'}"`,
          m.priority,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${plan.planName.replace(/\s+/g, '_')}_Members.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Plan Banner & Quick Hierarchy Context */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-gradient-to-r from-navy-900 via-navy-950 to-slate-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToPlans}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-sm"
            title={`Back to Plans under ${company.companyName}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40">
                {company.companyName}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-teal/20 text-teal-light border border-teal/40">
                Plan Roster
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${plan.performance.badgeClass}`}>
                {plan.performance.label} ({plan.starPct}%)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>{plan.planName}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed patient-level NCQA HEDIS quality measure compliance and open care gaps.
            </p>
          </div>
        </div>

        {/* Plan Header Summary Metrics */}
        <div className="flex items-center gap-4 bg-navy-950/80 p-4 rounded-2xl border border-slate-800/90 self-stretch lg:self-auto justify-around">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Plan Members</div>
            <div className="text-lg font-black text-white font-mono">{plan.memberCount}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Gap-Free</div>
            <div className="text-lg font-black text-emerald-400 font-mono">{plan.gapFreeMembers}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-rose-400">With Gaps</div>
            <div className="text-lg font-black text-rose-400 font-mono">{plan.membersWithGaps}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Star Rating</div>
            <div className={`text-lg font-black font-mono ${plan.performance.textClass}`}>
              {plan.starPct}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter & Export Action Bar */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID, ZIP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-navy-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal/60 focus:ring-1 focus:ring-teal/40 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Gap Filter */}
          <div className="flex items-center gap-1 bg-navy-950/90 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setGapFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                gapFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => {
                setGapFilter('GAP_ONLY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                gapFilter === 'GAP_ONLY'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Has Gaps ({plan.membersWithGaps})
            </button>
            <button
              onClick={() => {
                setGapFilter('MET_ONLY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                gapFilter === 'MET_ONLY'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Gap-Free ({plan.gapFreeMembers})
            </button>
          </div>

          {/* Specific Measure Filter */}
          <select
            value={measureFilter}
            onChange={(e) => {
              setMeasureFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-navy-950/90 border border-slate-800 text-xs text-slate-300 focus:outline-none font-medium"
          >
            <option value="ALL">Filter by Measure: All</option>
            {MEASURE_CODES.map((c) => (
              <option key={c} value={c}>
                {c} Gap ({CLINICAL_MEASURE_CATALOG[c]?.name || c})
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-navy-950/90 border border-slate-800 text-xs text-slate-300 focus:outline-none font-medium"
          >
            <option value="gaps_desc">Sort: Most Gaps First</option>
            <option value="gaps_asc">Sort: Least Gaps First</option>
            <option value="priority_desc">Sort: Priority High → Low</option>
            <option value="priority_asc">Sort: Priority Low → High</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="age_desc">Sort: Age (Oldest First)</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            title="Export filtered roster to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. Patient Members Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-navy-950/95 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Patient Demographics</th>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-3 font-semibold text-center">Status</th>
                {/* 9 Clinical Measures Columns */}
                {MEASURE_CODES.map((code) => (
                  <th
                    key={code}
                    className="py-3.5 px-2 font-semibold text-center cursor-help"
                    title={`${code}: ${CLINICAL_MEASURE_CATALOG[code]?.name} (Weight: ${CLINICAL_MEASURE_CATALOG[code]?.cmsWeight}x)`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-white font-bold">{code}</span>
                      <span className="text-[9px] text-slate-500 lowercase">
                        {CLINICAL_MEASURE_CATALOG[code]?.cmsWeight}x
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-3 font-semibold text-center">Applicable / Gaps</th>
                <th className="py-3.5 px-4 font-semibold text-center">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedMembers.map((member) => (
                <tr
                  key={member.id}
                  className={`hover:bg-slate-850/60 transition-colors ${
                    member.hasCareGap ? 'bg-rose-950/10' : 'bg-transparent'
                  }`}
                >
                  {/* Demographics */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{member.fullName}</span>
                      {member.gender && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 font-mono">
                          {member.gender}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>ID: {member.patientId.slice(0, 8)}...</span>
                      <span>·</span>
                      <span>Age {member.age}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                    <div>{member.state}</div>
                    <div className="text-slate-500 text-[11px]">ZIP {member.zip || 'N/A'}</div>
                  </td>

                  {/* Overall Gap Status */}
                  <td className="py-3.5 px-3 text-center">
                    {member.hasCareGap ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80">
                        <AlertOctagon className="w-3 h-3" />
                        <span>GAP</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>MET</span>
                      </span>
                    )}
                  </td>

                  {/* 9 Clinical Measure Badges */}
                  {MEASURE_CODES.map((code) => {
                    const result = member.measures[code] || 'N/A';
                    return (
                      <td key={code} className="py-3.5 px-1.5 text-center">
                        {result === 'MET' && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-bold text-[10px] shadow-sm"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name}: MET`}
                          >
                            MET
                          </span>
                        )}
                        {result === 'GAP' && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800/80 font-mono font-bold text-[10px] shadow-glow-rose/20"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name}: OPEN CARE GAP`}
                          >
                            GAP
                          </span>
                        )}
                        {result === 'N/A' && (
                          <span
                            className="inline-block px-1.5 py-0.5 text-slate-600 font-mono text-[10px]"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name}: Not Applicable`}
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Applicable & Gap Count */}
                  <td className="py-3.5 px-3 text-center font-mono">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-slate-300 font-bold">{member.applicableCount} App</span>
                      <span>·</span>
                      <span className={`font-black ${member.gapCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {member.gapCount} Gaps
                      </span>
                    </div>
                  </td>

                  {/* Priority Column (rendered directly) */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 font-mono font-bold text-xs">
                      <span>{member.priority}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination Footer */}
        <div className="p-4 bg-navy-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{filteredMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
            <span className="font-bold text-white">{filteredMembers.length}</span> members
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 max-w-lg mx-auto">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Members Match Filters</h4>
          <p className="text-xs text-slate-400 mt-1">
            No patient records matched your active search query or filters in {plan.planName}.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setGapFilter('ALL');
              setMeasureFilter('ALL');
              setGenderFilter('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-teal text-navy-950 hover:bg-teal-light transition-all shadow-glow-teal"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
