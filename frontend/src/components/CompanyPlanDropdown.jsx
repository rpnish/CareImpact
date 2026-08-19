import React from 'react';
import { Building2, Layers, Users, Star, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { useCompanyScope } from '../context/CompanyScopeContext';

export default function CompanyPlanDropdown({
  hierarchy,
  selectedCompanyName: propCompanyName,
  selectedPlanName: propPlanName,
  onSelectCompany: propOnSelectCompany,
  onSelectPlan: propOnSelectPlan,
}) {
  const {
    selectedCompanyName: contextCompanyName,
    selectedPlanName: contextPlanName,
    setSelectedCompany: contextSetCompany,
    setSelectedPlan: contextSetPlan,
  } = useCompanyScope();

  const companies = hierarchy?.companies || [];

  const effectiveCompanyName = propCompanyName || contextCompanyName || 'Medicare';
  const effectivePlanName = propPlanName !== undefined ? propPlanName : contextPlanName;

  // Active company (default to Medicare if not specified)
  const currentCompany =
    companies.find((c) => c.companyName === effectiveCompanyName) ||
    companies.find((c) => c.companyName === 'Medicare') ||
    companies[0] ||
    null;

  const availablePlans = currentCompany?.plans || [];

  const handleCompanyChange = (comp) => {
    if (propOnSelectCompany) {
      propOnSelectCompany(comp);
    }
    contextSetCompany(comp?.companyName || 'Medicare');
  };

  const handlePlanChange = (plan) => {
    if (propOnSelectPlan) {
      propOnSelectPlan(plan);
    }
    contextSetPlan(plan?.planName || null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
        {/* 1. Company / Plan Selector Dropdown */}
        <div className="flex-1 relative min-w-[220px]">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Insurance Company / Plan</span>
          </label>
          <div className="relative">
            <select
              value={currentCompany?.companyName || 'Medicare'}
              onChange={(e) => {
                const comp = companies.find((c) => c.companyName === e.target.value);
                if (comp) handleCompanyChange(comp);
              }}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 pr-8 appearance-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-xs"
            >
              {companies.map((c) => (
                <option key={c.companyName} value={c.companyName}>
                  {c.companyName} ({c.totalMembers} members · {c.starPct}% Star)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Plan Variant Sub-dropdown (if multiple plans exist under the company) */}
        {availablePlans.length > 1 && (
          <div className="flex-1 relative min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Plan Benefit Package (PBP)</span>
            </label>
            <div className="relative">
              <select
                value={effectivePlanName || 'ALL'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ALL') {
                    handlePlanChange(null);
                  } else {
                    const pl = availablePlans.find((p) => p.planName === val);
                    handlePlanChange(pl);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 pr-8 appearance-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="ALL">
                  All Plans under {currentCompany?.companyName} ({availablePlans.length})
                </option>
                {availablePlans.map((p) => (
                  <option key={p.planName} value={p.planName}>
                    {p.planName} ({p.memberCount} pts · {p.starPct}%)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Active Scope Badge */}
      {currentCompany && (
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Plan Ownership</span>
            <span className="text-xs font-mono font-bold text-slate-800">
              {currentCompany.ownershipTypes.join(', ') || 'PRIVATE'}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Plan Star Rating</span>
            <span className="text-sm font-black text-blue-600">
              {currentCompany.starPct}% ({currentCompany.starValue}★)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
