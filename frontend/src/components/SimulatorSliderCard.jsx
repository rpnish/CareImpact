import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Plus, Minus, Maximize2, RotateCcw, Star, Eye, HeartPulse, Pill, Syringe } from 'lucide-react';

const MEASURE_ICONS = {
  diabetic_eye_exam: Eye,
  blood_pressure_control: HeartPulse,
  diabetes_med_adherence: Pill,
  flu_vaccination: Syringe,
};

export default function SimulatorSliderCard({
  measureKey,
  code,
  name,
  weight = 1,
  currentRate,
  openGaps,
  eligibleCount,
  compliantCount,
  selectedGaps,
  cutpoints = { '3star': 65, '4star': 75, '5star': 85 },
  onSliderChange,
}) {
  const Icon = MEASURE_ICONS[measureKey] || HeartPulse;

  // Calculate projected rate
  const simulatedCompliant = compliantCount + selectedGaps;
  const projectedRate = eligibleCount > 0 ? (simulatedCompliant / eligibleCount) * 100 : currentRate;
  const improvement = projectedRate - currentRate;

  // Percentage of slider filled
  const sliderFillPct = openGaps > 0 ? (selectedGaps / openGaps) * 100 : 0;

  // Quick increment handlers
  const handleAdd = (delta) => {
    const newVal = Math.min(openGaps, Math.max(0, selectedGaps + delta));
    onSliderChange(newVal);
  };

  const handleMax = () => {
    onSliderChange(openGaps);
  };

  const handleReset = () => {
    onSliderChange(0);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800/80 hover:border-violet-500/50 transition-all shadow-xl space-y-4 relative overflow-hidden group"
    >
      {/* Top Banner with Weight & Code */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-violet-500/15 text-ai-purple-light border border-violet-500/30 group-hover:scale-105 transition-transform shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-ai-purple-light px-2 py-0.5 rounded-md bg-violet-950/80 border border-violet-800/60">
                {code}
              </span>
              {weight > 1 && (
                <span className="font-mono text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/50">
                  {weight}x CMS Weight
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-1">{name}</h3>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 block">
            Open Gaps
          </span>
          <span className="text-xl font-black text-white font-mono">{openGaps}</span>
        </div>
      </div>

      {/* Compliance Meter with CMS Cutpoint Markers */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">
            Baseline: <strong className="text-slate-200">{currentRate.toFixed(1)}%</strong>
          </span>
          <span className="text-ai-purple-light font-bold">
            Projected: <strong className="text-white">{projectedRate.toFixed(1)}%</strong>
          </span>
        </div>

        <div className="relative h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          {/* Baseline fill */}
          <div
            className="absolute left-0 top-0 h-full bg-slate-700/80 rounded-full"
            style={{ width: `${Math.min(100, currentRate)}%` }}
          />
          {/* Projected dynamic energy bar */}
          <motion.div
            initial={{ width: `${Math.min(100, currentRate)}%` }}
            animate={{ width: `${Math.min(100, projectedRate)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 14 }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-ai-violet via-ai-purple to-ai-cyan rounded-full shadow-glow-purple"
          />
        </div>

        {/* CMS Cutpoints Ticks */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-0.5 px-0.5">
          <span>3★: {cutpoints['3star']}%</span>
          <span>4★: {cutpoints['4star']}%</span>
          <span>5★: {cutpoints['5star']}%</span>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="space-y-2 pt-1">
        <div className="relative">
          <input
            type="range"
            min="0"
            max={openGaps}
            value={selectedGaps}
            disabled={openGaps === 0}
            onChange={(e) => onSliderChange(parseInt(e.target.value) || 0)}
            className="ai-slider relative z-10"
          />
        </div>

        {/* Quick Stepper Buttons */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAdd(-1)}
              disabled={selectedGaps <= 0}
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs transition-colors"
              title="-1 Gap"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdd(1)}
              disabled={selectedGaps >= openGaps}
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs transition-colors"
              title="+1 Gap"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdd(5)}
              disabled={selectedGaps >= openGaps}
              className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-[11px] font-bold disabled:opacity-30 transition-colors"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleAdd(10)}
              disabled={selectedGaps >= openGaps}
              className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-[11px] font-bold disabled:opacity-30 transition-colors"
            >
              +10
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMax}
              disabled={selectedGaps >= openGaps || openGaps === 0}
              className="px-2.5 py-0.5 rounded-lg bg-violet-950/80 hover:bg-violet-900 text-ai-purple-light border border-violet-800/60 font-mono text-[11px] font-bold disabled:opacity-30 transition-colors"
            >
              Max All
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={selectedGaps === 0}
              className="p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 text-xs transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom KPI Metric Boxes */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <div className="bg-navy-950/80 p-2.5 rounded-2xl border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Selected</span>
          <span className="text-base font-black text-white font-mono">{selectedGaps}</span>
        </div>

        <div className="bg-navy-950/80 p-2.5 rounded-2xl border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Projected</span>
          <span className="text-base font-black text-ai-purple-light font-mono">
            {projectedRate.toFixed(1)}%
          </span>
        </div>

        <div className="bg-navy-950/80 p-2.5 rounded-2xl border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Gain</span>
          <span className="text-base font-black text-emerald-400 font-mono flex items-center justify-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            +{improvement.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
