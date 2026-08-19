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

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    return baseCohort.filter((m) => {
      // Search text
      const matchesSearch =
        m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.zip?.includes(searchTerm);

      // Gap Status
      let matchesGap = true;
      if (gapFilter === 'GAP_ONLY') matchesGap = m.hasCareGap;
      if (gapFilter === 'MET_ONLY') matchesGap = !m.hasCareGap;

      // Specific Measure Gap
      let matchesMeasure = true;
      if (measureFilter !== 'ALL') {
        matchesMeasure = m.measures?.[measureFilter] === 'GAP';
      }

      // Gender
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
  }, [baseCohort, searchTerm, gapFilter, measureFilter, genderFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  // Delete Action Handler
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-400" />
              <span>{activeCompany?.companyName || 'Medicare'} Member Roster</span>
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {baseCohort.length} Enrolled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Click any member to view clinical details, close care gaps with hospital document proof, or manage enrollment.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Enroll New Member</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID, ZIP, or plan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Gap Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setGapFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                gapFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
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
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'text-slate-400 hover:text-rose-400'
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
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-emerald-400'
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
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none font-medium"
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
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none font-medium"
          >
            <option value="ALL">Gender: All</option>
            <option value="F">Female (F)</option>
            <option value="M">Male (M)</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none font-medium"
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
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
                      <span className="text-white font-bold">{code}</span>
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
            <tbody className="divide-y divide-slate-800">
              {paginatedMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className={`hover:bg-slate-850/80 transition-colors cursor-pointer ${
                    member.hasCareGap ? 'bg-rose-950/5' : 'bg-transparent'
                  }`}
                >
                  {/* Demographics */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{member.fullName}</span>
                      {member.proofDocuments?.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1 font-mono">
                          <FileCheck className="w-3 h-3 text-indigo-400" />
                          <span>Doc Proof</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>ID: {member.patientId?.slice(0, 8)}...</span>
                      <span>·</span>
                      <span>Age {member.age}</span>
                      <span>·</span>
                      <span>ZIP {member.zip || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Insurance & Plan */}
                  <td className="py-3.5 px-3 font-mono text-xs">
                    <div className="font-semibold text-slate-200">{member.company}</div>
                    <div className="text-slate-400 text-[11px] truncate max-w-[140px]" title={member.planName}>
                      {member.planName}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 text-center">
                    {member.hasCareGap ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                        <AlertOctagon className="w-3 h-3" />
                        <span>GAP</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
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
                            className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold text-[10px]"
                            title={`${CLINICAL_MEASURE_CATALOG[code]?.name}: MET`}
                          >
                            MET
                          </span>
                        )}
                        {result === 'GAP' && (
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold text-[10px]"
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

                  {/* Priority Column */}
                  <td className="py-3.5 px-4 text-center font-mono">
                    {member.priority >= 75 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-xs">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{member.priority}</span>
                      </span>
                    ) : member.priority >= 50 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold text-xs">
                        <span>{member.priority}</span>
                      </span>
                    ) : member.priority > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold text-xs">
                        <span>{member.priority}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 text-slate-500 border border-slate-800 text-[11px]">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-all"
                      >
                        <span>Update</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToDelete(member);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 transition-all"
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
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{filteredMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
            <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
            <span className="font-bold text-white">{filteredMembers.length}</span> members
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-800/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 rounded-2xl bg-rose-950 border border-rose-800 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Member Record?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                Are you sure you want to remove <strong className="text-white">{memberToDelete.fullName}</strong> ({memberToDelete.patientId}) from <strong className="text-indigo-300">{memberToDelete.company}</strong>?
                This will recalculate the plan quality metrics and remove this patient from the active roster.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md flex items-center gap-1.5"
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
