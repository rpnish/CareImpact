import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { COLUMNS_CONFIG } from '../utils/constants';

export default function MemberTable({
  members = [],
  activeTab = 'pending',
  onTabChange,
  onOpenAdd,
  onOpenEdit,
  onDeleteMember,
  selectedMeasureFilter = '',
  onMeasureFilterChange,
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortKey, setSortKey] = useState('member_name');
  const [sortDir, setSortDir] = useState('asc');

  // Pending count and Completed count
  const pendingCount = useMemo(
    () => members.filter((m) => m.overallStatus === 'pending').length,
    [members]
  );
  const completedCount = useMemo(
    () => members.filter((m) => m.overallStatus === 'completed').length,
    [members]
  );

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let rows = members.filter((m) => m.overallStatus === activeTab);

    // Filter by measure gap if selected
    if (selectedMeasureFilter) {
      const statusKey = `${selectedMeasureFilter}_status`;
      rows = rows.filter((m) => m[statusKey] === 'gap');
    }

    // Filter by condition
    if (conditionFilter === 'diabetes') {
      rows = rows.filter((m) => m.has_diabetes);
    } else if (conditionFilter === 'hypertension') {
      rows = rows.filter((m) => m.has_hypertension);
    } else if (conditionFilter === 'both') {
      rows = rows.filter((m) => m.has_diabetes && m.has_hypertension);
    }

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (m) =>
          m.member_name?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.member_id?.toLowerCase().includes(q) ||
          m.state?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];

        if (av === null || av === undefined) av = '';
        if (bv === null || bv === undefined) bv = '';

        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }

        if (typeof av === 'boolean' && typeof bv === 'boolean') {
          return sortDir === 'asc' ? (av === bv ? 0 : av ? -1 : 1) : av === bv ? 0 : av ? 1 : -1;
        }

        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [members, activeTab, selectedMeasureFilter, conditionFilter, search, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderCellContent = (row, key) => {
    const val = row[key];

    if (key.endsWith('_status') || key === 'overallStatus') {
      return <StatusBadge status={val} size="sm" />;
    }
    if (key === 'has_diabetes' || key === 'has_hypertension') {
      return val ? (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          Yes
        </span>
      ) : (
        <span className="text-slate-500 text-xs">No</span>
      );
    }
    if (key === 'member_id') {
      return (
        <span className="font-mono text-xs text-slate-300 group-hover:text-teal-light transition-colors truncate block max-w-[130px]" title={val}>
          {val}
        </span>
      );
    }
    if (key === 'member_name') {
      return (
        <span className="font-semibold text-white group-hover:text-teal-light transition-colors">
          {val}
        </span>
      );
    }
    if (key === 'priorityScore') {
      return <span className="font-mono text-xs text-slate-400">{val ?? 0}</span>;
    }
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-600">—</span>;
    }
    return <span className="text-xs text-slate-300">{String(val)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Two Main Tabs: Pending vs Completed */}
        <div className="flex items-center p-1 rounded-xl bg-navy-900 border border-slate-800 self-start">
          <button
            onClick={() => onTabChange('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-rose-950/70 text-rose-light border border-rose-800/60 shadow-glow-rose'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Gaps</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'pending' ? 'bg-rose/20 text-rose-light' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-teal-950/70 text-teal-light border border-teal-800/60 shadow-glow-teal'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed (Gap-Free)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'completed' ? 'bg-teal/20 text-teal-light' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Action button */}
        {onOpenAdd && (
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal hover:scale-105 active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, city, state, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal/50 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Condition Filter */}
          <div className="flex items-center gap-1.5 bg-navy-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-navy-900">All Conditions</option>
              <option value="diabetes" className="bg-navy-900">Diabetic Only</option>
              <option value="hypertension" className="bg-navy-900">Hypertensive Only</option>
              <option value="both" className="bg-navy-900">Both Conditions</option>
            </select>
          </div>

          {/* Specific Measure Gap Filter */}
          <div className="flex items-center gap-1.5 bg-navy-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Measure Gap:</span>
            <select
              value={selectedMeasureFilter}
              onChange={(e) => onMeasureFilterChange?.(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-navy-900">All Measures</option>
              <option value="diabetic_eye_exam" className="bg-navy-900">Eye Exam Gap</option>
              <option value="blood_pressure_control" className="bg-navy-900">BP Control Gap</option>
              <option value="diabetes_med_adherence" className="bg-navy-900">Med Adherence Gap</option>
              <option value="flu_vaccination" className="bg-navy-900">Flu Shot Gap</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full Columns Responsive Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-navy-900 border-b border-slate-800 shadow-sm">
              <tr>
                {COLUMNS_CONFIG.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3.5 py-3 font-semibold text-slate-400 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap ${
                      col.width || ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-teal-light" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-teal-light" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-50" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3.5 py-3 font-semibold text-slate-400 text-right sticky right-0 bg-navy-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS_CONFIG.length + 1} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No members found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((row, idx) => (
                  <tr
                    key={row.member_id}
                    className={`group hover:bg-slate-800/40 transition-colors ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-navy-900/30'
                    }`}
                  >
                    {COLUMNS_CONFIG.map((col) => (
                      <td
                        key={col.key}
                        onClick={() => navigate(`/members/${encodeURIComponent(row.member_id)}`)}
                        className="px-3.5 py-3 cursor-pointer whitespace-nowrap"
                      >
                        {renderCellContent(row, col.key)}
                      </td>
                    ))}
                    {/* Action buttons */}
                    <td className="px-3.5 py-3 text-right whitespace-nowrap sticky right-0 bg-navy-950/95 group-hover:bg-slate-850 transition-colors">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/members/${encodeURIComponent(row.member_id)}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-light hover:bg-slate-800 transition-colors"
                          title="View Member Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onOpenEdit && (
                          <button
                            onClick={() => onOpenEdit(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                            title="Edit Clinical Values"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteMember && (
                          <button
                            onClick={() => onDeleteMember(row.member_id, row.member_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-light hover:bg-slate-800 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 border-t border-slate-800 bg-navy-900/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredMembers.length}</strong> of{' '}
            <strong className="text-white">{members.length}</strong> total members
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-light"></span>
              <span>Pending: {pendingCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-light"></span>
              <span>Completed: {completedCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
