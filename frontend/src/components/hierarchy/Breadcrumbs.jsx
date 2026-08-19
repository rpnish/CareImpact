import React from 'react';
import { ChevronRight, Building2, Layers, Users, Home, RotateCcw } from 'lucide-react';

export default function Breadcrumbs({
  selectedCompany,
  selectedPlan,
  onSelectCompany,
  onSelectPlan,
  onResetToRoot,
}) {
  return (
    <nav aria-label="Hierarchy Breadcrumb" className="flex items-center justify-between flex-wrap gap-3 py-3 px-4 bg-navy-900/90 rounded-2xl border border-slate-800 backdrop-blur-md">
      <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-medium">
        {/* Root Level: All Companies */}
        <button
          onClick={onResetToRoot}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
            !selectedCompany
              ? 'bg-violet-500/20 text-ai-purple-light border border-violet-500/40 font-bold shadow-glow-purple/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Building2 className="w-4 h-4 text-ai-purple" />
          <span>All Companies</span>
        </button>

        {/* Level 2: Company Selected */}
        {selectedCompany && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <button
              onClick={() => onSelectPlan(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
                !selectedPlan
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-glow-teal/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>{selectedCompany.companyName}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                {selectedCompany.plansCount} {selectedCompany.plansCount === 1 ? 'Plan' : 'Plans'}
              </span>
            </button>
          </>
        )}

        {/* Level 3: Plan Selected (Members View) */}
        {selectedCompany && selectedPlan && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal/20 text-teal-light border border-teal/40 font-bold shadow-glow-teal/20">
              <Users className="w-4 h-4 text-teal" />
              <span>{selectedPlan.planName}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-teal/30 text-white font-mono">
                {selectedPlan.memberCount} Members
              </span>
            </div>
          </>
        )}
      </div>

      {/* Quick Reset Button if not at root */}
      {selectedCompany && (
        <button
          onClick={onResetToRoot}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-ai-purple-light transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
          title="Back to All Companies"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Top Level</span>
        </button>
      )}
    </nav>
  );
}
