import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function SimulatorSliderCard({
  measureKey,
  code,
  name,
  currentRate,
  openGaps,
  eligibleCount,
  compliantCount,
  selectedGaps,
  onSliderChange,
  colorScheme = 'purple',
}) {
  // Calculate projected rate
  const simulatedCompliant = compliantCount + selectedGaps;
  const projectedRate = eligibleCount > 0 ? (simulatedCompliant / eligibleCount) * 100 : currentRate;
  const improvement = projectedRate - currentRate;

  // Percentage of slider filled
  const sliderFillPct = openGaps > 0 ? (selectedGaps / openGaps) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800/80 space-y-4 hover:border-violet-500/30 transition-all shadow-lg"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-xl bg-violet-500/15 text-ai-purple border border-violet-500/30 font-mono text-xs font-black tracking-wider uppercase shadow-sm">
            {code}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{name}</h3>
            <p className="text-xs text-slate-400">
              Current compliance: <strong className="text-slate-200">{currentRate.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Open Gaps</span>
          <span className="text-xl font-black text-white font-mono">{openGaps}</span>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="space-y-2 pt-2">
        <div className="relative">
          {/* Custom track fill */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-slate-800 w-full pointer-events-none overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light transition-all duration-75 shadow-glow-purple"
              style={{ width: `${sliderFillPct}%` }}
            />
          </div>

          <input
            type="range"
            min="0"
            max={openGaps}
            value={selectedGaps}
            disabled={openGaps === 0}
            onChange={(e) => onSliderChange(parseInt(e.target.value) || 0)}
            className="ai-slider relative z-10 opacity-90 hover:opacity-100"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>0</span>
          <span className="text-ai-purple-light font-bold">
            Close {selectedGaps} gap{selectedGaps === 1 ? '' : 's'}
          </span>
          <span>{openGaps}</span>
        </div>
      </div>

      {/* Bottom 3 KPI Metric Boxes */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        {/* Selected */}
        <div className="bg-navy-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Selected</span>
          <span className="text-base font-extrabold text-white font-mono">{selectedGaps}</span>
        </div>

        {/* Projected */}
        <div className="bg-navy-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Projected</span>
          <span className="text-base font-extrabold text-ai-purple-light font-mono">
            {projectedRate.toFixed(1)}%
          </span>
        </div>

        {/* Improvement */}
        <div className="bg-navy-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Improvement</span>
          <span className="text-base font-extrabold text-emerald-400 font-mono flex items-center justify-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            +{improvement.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
