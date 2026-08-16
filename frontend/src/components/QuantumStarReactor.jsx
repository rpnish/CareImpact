import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, TrendingUp, Zap, Award, ArrowRight } from 'lucide-react';

export default function QuantumStarReactor({
  currentRating = 3.3,
  simulatedRating = 4.1,
  totalGapsClosed = 0,
  onApplyPreset,
}) {
  const delta = Math.max(0, simulatedRating - currentRating);
  const isFourStarPlus = simulatedRating >= 4.0;
  const isFiveStar = simulatedRating >= 4.75;

  // Arc calculation for reactor ring
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const simOffset = circumference - (Math.min(5, simulatedRating) / 5.0) * circumference;
  const currentOffset = circumference - (Math.min(5, currentRating) / 5.0) * circumference;

  return (
    <div className="glass-card-ai rounded-3xl p-6 sm:p-8 border border-violet-500/40 relative overflow-hidden shadow-2xl space-y-6">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Title & Scenario Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-500/20 text-ai-purple-light border border-violet-500/40">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-ai-purple-light">
              Quantum Star Reactor · MY2026
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dynamic Gap-Closure & Star Velocity Engine
          </h2>
        </div>

        {/* Quick Scenario Preset Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold hidden sm:inline">
            Smart Presets:
          </span>
          <button
            onClick={() => onApplyPreset('four_star')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-950/80 hover:bg-violet-900/90 text-ai-purple-light border border-violet-700/60 transition-all hover:scale-105 shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target 4.0★ Leap</span>
          </button>
          <button
            onClick={() => onApplyPreset('priority_one')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900/90 text-ai-cyan-light border border-cyan-700/60 transition-all hover:scale-105 shadow-sm active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Priority #1 Max</span>
          </button>
          <button
            onClick={() => onApplyPreset('five_star')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border border-amber-700/60 transition-all hover:scale-105 shadow-sm active:scale-95"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>5.0★ Maximum</span>
          </button>
        </div>
      </div>

      {/* Main Dual Gauge Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Stats Column (Span 4) */}
        <div className="md:col-span-4 space-y-4 text-center md:text-left">
          <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800/90 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Baseline Performance
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-3xl font-black text-white font-mono">{currentRating.toFixed(2)}</span>
              <span className="text-lg text-amber-400 font-mono">★</span>
            </div>
            <span className="text-xs text-slate-400 font-mono block">Current Star Tier</span>
          </div>

          <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800/90 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Total Interventions
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-3xl font-black text-ai-purple-light font-mono">{totalGapsClosed}</span>
              <span className="text-xs text-slate-400 font-mono">Gaps Closed</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono flex items-center justify-center md:justify-start gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{delta.toFixed(2)} Star Velocity</span>
            </span>
          </div>
        </div>

        {/* Center Quantum Ring Reactor (Span 4) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center relative py-4">
          {/* Animated glow rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute w-52 h-52 rounded-full border border-dashed border-violet-500/20 pointer-events-none"
          />

          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Baseline indicator */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-600/60"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={currentOffset}
                strokeLinecap="round"
                fill="transparent"
              />
              {/* Simulated active energy ring */}
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-ai-purple"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: currentOffset }}
                animate={{ strokeDashoffset: simOffset }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))',
                }}
              />
            </svg>

            {/* Inner Reactor Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-ai-purple-light">
                Projected Rating
              </span>
              <motion.span
                key={simulatedRating.toFixed(2)}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black text-white font-mono tracking-tight"
              >
                {simulatedRating.toFixed(2)}
              </motion.span>
              <div className="flex gap-0.5 text-amber-400 text-sm mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.floor(simulatedRating)
                        ? 'fill-amber-400 text-amber-400'
                        : s - simulatedRating < 1
                        ? 'fill-amber-400/50 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 text-center">
            <span className="text-xs font-mono font-bold text-ai-purple-light">
              {Math.round((simulatedRating / 5.0) * 100)}% Star Quality Index
            </span>
          </div>
        </div>

        {/* Right Status & Financial Bonus Spotlight (Span 4) */}
        <div className="md:col-span-4 space-y-3">
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isFourStarPlus
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-navy-950/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                {isFourStarPlus ? 'CMS QBP Bonus Unlocked!' : 'Targeting 4.0+ Threshold'}
              </h4>
            </div>
            <p className="text-xs leading-relaxed">
              {isFourStarPlus
                ? 'Plan qualifies for the 5% Medicare Quality Bonus Payment (QBP) rebate subsidy.'
                : `Need +${(4.0 - Math.min(4.0, simulatedRating)).toFixed(2)} Stars to unlock the 5% CMS QBP bonus.`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-950/80 border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Star Improvement:</span>
              <strong className="text-emerald-400 font-bold">+{delta.toFixed(2)} ★</strong>
            </div>
            <div className="flex justify-between">
              <span>Trajectory Status:</span>
              <strong className="text-ai-purple-light font-bold">
                {simulatedRating >= 4.5 ? 'Elite 5★ Status' : simulatedRating >= 4.0 ? '4★ High Performer' : 'Standard 3★'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
