import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Download,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Building2,
  Layers,
  UserPlus,
  ArrowRight,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { CLINICAL_MEASURE_CATALOG } from '../utils/metricsEngine';
import CompanyPlanDropdown from '../components/CompanyPlanDropdown';
import AddMemberModal from '../components/AddMemberModal';
import { SkeletonCard } from '../components/Skeleton';
import { useCompanyScope } from '../context/CompanyScopeContext';
import { useMemberStore } from '../context/MemberStoreContext';
import { useToast } from '../components/Toast';

const MEASURE_CODES = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];

export default function Members() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    selectedCompanyName,
    selectedPlanName,
    setSelectedCompany,
    setSelectedPlan,
  } = useCompanyScope();

  const {
    hierarchy,
    loading,
    customMembers,
    memberUpdates,
    deletedMemberIds,
    deleteMember,
  } = useMemberStore();

  // Add Member Modal State & Delete Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [gapFilter, setGapFilter] = useState('ALL'); // 'ALL' | 'GAP_ONLY' | 'MET_ONLY'
  const [measureFilter, setMeasureFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('gaps_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSelectCompany = (company) => {
    const compName = company ? company.companyName : 'Medicare';
    setSelectedCompany(compName);
    setCurrentPage(1);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan ? plan.planName : null);
    setCurrentPage(1);
  };

  // Resolve active member cohort including local updates and custom added members, excluding deleted members
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

  const baseCohort = useMemo(() => {
    let rawList = [];
    if (activePlan) {
      rawList = activePlan.members;
    } else if (activeCompany) {
      rawList = activeCompany.allMembers;
    }

    // Filter out deleted members from base CSV list
    rawList = rawList.filter(
      (m) => !deletedMemberIds.includes(m.patientId) && !deletedMemberIds.includes(m.id)
    );

    // Append any custom added members belonging to this company/plan
    const compName = activeCompany?.companyName || 'Medicare';
    const relevantCustom = customMembers.filter((m) => {
      if (deletedMemberIds.includes(m.patientId) || deletedMemberIds.includes(m.id)) return false;
      if (activePlan) {
        return m.company === compName && m.planName === activePlan.planName;
      }
      return m.company === compName;
    });

    const combined = [...relevantCustom, ...rawList];

    // Apply any local updates/gap closures to the displayed records
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
        proofDocuments: updates.proofDocuments || m.proofDocuments || [],
      };
    });
  }, [hierarchy, activeCompany, activePlan, customMembers, memberUpdates, deletedMemberIds]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return baseCohort
      .filter((m) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = m.fullName.toLowerCase().includes(q);
          const matchId = (m.patientId || '').toLowerCase().includes(q) || (m.memberId || '').toLowerCase().includes(q);
          const matchZip = (m.zip || '').includes(q);
          const matchPlan = (m.planName || '').toLowerCase().includes(q);
          if (!matchName && !matchId && !matchZip && !matchPlan) return false;
        }

        // Gap filter
        if (gapFilter === 'GAP_ONLY' && !m.hasCareGap) return false;
        if (gapFilter === 'MET_ONLY' && m.hasCareGap) return false;

        // Specific measure filter
        if (measureFilter !== 'ALL') {
          if (m.measures?.[measureFilter] !== 'GAP') return false;
        }

        // Gender filter
        if (genderFilter !== 'ALL') {
          if (m.gender !== genderFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority_desc') return (b.priority || 0) - (a.priority || 0);
        if (sortBy === 'priority_asc') return (a.priority || 0) - (b.priority || 0);
        if (sortBy === 'gaps_desc') return b.gapCount - a.gapCount;
        if (sortBy === 'gaps_asc') return a.gapCount - b.gapCount;
        if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
        if (sortBy === 'age_desc') return b.age - a.age;
        return 0;
      });
  }, [baseCohort, searchTerm, gapFilter, measureFilter, genderFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!memberToDelete) return;
    try {
      deleteMember(memberToDelete.patientId);
      toast.success(`Member '${memberToDelete.fullName}' deleted.`);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Failed to delete member:', err);
      toast.error('Failed to delete member.');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'PATIENT_ID',
      'MEMBER_ID',
      'FIRST_NAME',
      'LAST_NAME',
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
          `"${m.age}"`,
          `"${m.gender}"`,
          `"${m.state}"`,
          `"${m.zip}"`,
          `"${m.company}"`,
          `"${m.planName}"`,
          ...MEASURE_CODES.map((c) => `"${m.measures?.[c] || 'N/A'}"`),
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
    link.setAttribute('download', `${activeCompany?.companyName || 'CareImpact'}_Members_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !hierarchy) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-blue-600" />
              <span>{activeCompany?.companyName || 'Medicare'} Member Roster</span>
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {baseCohort.length} Enrolled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Click any member to view clinical details, close care gaps with hospital document proof, or manage enrollment.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Enroll New Member</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV ({filteredMembers.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Dropdown Company & Plan Selector (Shared Two-Way with Dashboard) */}
      <CompanyPlanDropdown
        hierarchy={hierarchy}
        selectedCompanyName={activeCompany?.companyName || 'Medicare'}
        selectedPlanName={selectedPlanName}
        onSelectCompany={handleSelectCompany}
        onSelectPlan={handleSelectPlan}
      />

      {/* 3. Search and Multi-Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID, ZIP, or plan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Gap Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setGapFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                gapFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({baseCohort.length})
            </button>
            <button
              onClick={() => {
                setGapFilter('GAP_ONLY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                gapFilter === 'GAP_ONLY'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              With Gaps ({baseCohort.filter((m) => m.hasCareGap).length})
            </button>
            <button
              onClick={() => {
                setGapFilter('MET_ONLY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                gapFilter === 'MET_ONLY'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Gap-Free ({baseCohort.filter((m) => !m.hasCareGap).length})
            </button>
          </div>

          {/* Specific Measure Filter */}
          <select
            value={measureFilter}
            onChange={(e) => {
              setMeasureFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none font-medium"
          >
            <option value="ALL">Filter by Measure: All</option>
            {MEASURE_CODES.map((c) => (
              <option key={c} value={c}>
                {c} Gap ({CLINICAL_MEASURE_CATALOG[c]?.name || c})
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none font-medium"
          >
            <option value="ALL">Gender: All</option>
            <option value="F">Female (F)</option>
            <option value="M">Male (M)</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none font-medium"
          >
            <option value="priority_desc">Sort: Priority High → Low</option>
            <option value="gaps_desc">Sort: Most Gaps First</option>
            <option value="gaps_asc">Sort: Least Gaps First</option>
            <option value="priority_asc">Sort: Priority Low → High</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="age_desc">Sort: Age (Oldest First)</option>
          </select>
        </div>
      </div>

      {/* 4. Full Patient Members Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Patient Demographics</th>
                <th className="py-3.5 px-3 font-semibold">Insurance & Plan</th>
                <th className="py-3.5 px-3 font-semibold text-center">Status</th>
                {/* 9 Clinical Measure Columns */}
                {MEASURE_CODES.map((code) => (
                  <th
                    key={code}
                    className="py-3.5 px-2 font-semibold text-center cursor-help"
                    title={`${code}: ${CLINICAL_MEASURE_CATALOG[code]?.name} (Weight: ${CLINICAL_MEASURE_CATALOG[code]?.cmsWeight}x)`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-slate-900 font-bold">{code}</span>
                      <span className="text-[9px] text-slate-500 lowercase">
                        {CLINICAL_MEASURE_CATALOG[code]?.cmsWeight}x
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-3 font-semibold text-center">Applicable / Gaps</th>
                <th className="py-3.5 px-4 font-semibold text-center">Priority</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                    member.hasCareGap ? 'bg-rose-50/10' : 'bg-transparent'
                  }`}
                >
                  {/* Demographics */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{member.fullName}</span>
                      {member.proofDocuments?.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-mono font-bold">
                          <FileCheck className="w-3 h-3 text-blue-600" />
                          <span>Doc Proof</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>ID: {member.patientId?.slice(0, 8)}...</span>
                      <span>·</span>
                      <span>Age {member.age}</span>
                      <span>·</span>
                      <span>ZIP {member.zip || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Insurance & Plan */}
                  <td className="py-3.5 px-3 font-mono text-xs">
                    <div className="font-semibold text-slate-900">{member.company}</div>
                    <div className="text-slate-500 text-[11px] truncate max-w-[140px]" title={member.planName}>
                      {member.planName}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 text-center">
                    {member.hasCareGap ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                        <AlertOctagon className="w-3 h-3 text-rose-600" />
                        <span>GAP</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>MET</span>
                      </span>
                    )}
                  </td>

                  {/* 9 Clinical Measures */}
                  {MEASURE_CODES.map((code) => {
                    const result = member.measures?.[code] || 'N/A';
                    return (
                      <td key={code} className="py-3.5 px-1 text-center">
                        {result === 'MET' && (
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px]"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name}: MET`}
                          >
                            MET
                          </span>
                        )}
                        {result === 'GAP' && (
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono font-bold text-[10px]"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name}: OPEN CARE GAP`}
                          >
                            GAP
                          </span>
                        )}
                        {result === 'N/A' && (
                          <span
                            className="inline-block px-1.5 py-0.5 text-slate-400 font-mono text-[10px]"
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
                      <span className="text-slate-700 font-bold">{member.applicableCount} App</span>
                      <span>·</span>
                      <span className={`font-black ${member.gapCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {member.gapCount} Gaps
                      </span>
                    </div>
                  </td>

                  {/* Priority Column */}
                  <td className="py-3.5 px-4 text-center font-mono">
                    {member.priority >= 75 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{member.priority}</span>
                      </span>
                    ) : member.priority >= 50 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                        <span>{member.priority}</span>
                      </span>
                    ) : member.priority > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs">
                        <span>{member.priority}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px]">
                        <span>0</span>
                      </span>
                    )}
                  </td>

                  {/* Action Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/members/${member.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all shadow-2xs"
                      >
                        <span>Update</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToDelete(member);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title={`Delete ${member.fullName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
            <span className="font-bold text-slate-900">{filteredMembers.length}</span> members
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2 text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={(newM) => {
          setSelectedCompany(newM.company);
          setCurrentPage(1);
        }}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Member Record?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                Are you sure you want to remove <strong className="text-slate-900">{memberToDelete.fullName}</strong> ({memberToDelete.patientId}) from <strong className="text-blue-700">{memberToDelete.company}</strong>?
                This will recalculate the plan quality metrics and remove this patient from the active roster.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Member</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
