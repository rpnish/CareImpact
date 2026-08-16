import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, HeartPulse, Pill, Syringe, ArrowRight, Star, SlidersHorizontal } from 'lucide-react';

const MEASURE_ICONS = {
  diabetic_eye_exam: Eye,
  blood_pressure_control: HeartPulse,
  diabetes_med_adherence: Pill,
  flu_vaccination: Syringe,
};

export default function MeasureProgressCards({ measures = [] }) {
  const navigate = useNavigate();
  const [showAllFour, setShowAllFour] = useState(true);

  const displayedMeasures = showAllFour ? measures : measures.slice(0, 3);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-6">
      {/* Header with 3 vs 4 toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-500/15 text-ai-purple border border-violet-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              HEDIS Quality Measures Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Live compliance rates mapped against official 2026 CMS Part C cutpoints
          </p>
        </div>

        {/* 3 vs 4 measure toggle */}
        <div className="flex items-center p-1 rounded-xl bg-navy-950 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setShowAllFour(false)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              !showAllFour
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Core 3 Measures
          </button>
          <button
            onClick={() => setShowAllFour(true)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              showAllFour
                ? 'bg-violet-950/80 text-ai-purple-light border border-violet-800/60 shadow-glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 4 Measures
          </button>
        </div>
      </div>

      {/* Asymmetric Clinical Measures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedMeasures.map((m, idx) => {
          const Icon = MEASURE_ICONS[m.measure_key] || HeartPulse;
          const rate = m.rate_pct ?? 0;
          const stars = m.current_stars ?? 3.0;
          const cut3 = m.cutpoint_3star ?? 65;
          const cut4 = m.cutpoint_4star ?? 75;
          const cut5 = m.cutpoint_5star ?? 85;

          let targetCut = cut4;
          let targetStar = 4;
          if (rate >= cut4) {
            targetCut = cut5;
            targetStar = 5;
          }
          if (rate >= cut5) {
            targetCut = 100;
            targetStar = 5;
          }

          const gapToNext = Math.max(0, targetCut - rate).toFixed(1);

          return (
            <motion.div
              key={m.measure_key}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              onClick={() => navigate(`/members?status=pending&measure=${m.measure_key}`)}
              className="p-5 rounded-2xl bg-navy-950/80 border border-slate-800/80 hover:border-violet-500/40 cursor-pointer transition-all space-y-3 group"
            >
              {/* Top info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/15 text-ai-purple-light border border-violet-500/30 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-ai-purple-light transition-colors">
                      {m.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">{m.code}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-white font-mono">{rate.toFixed(1)}%</span>
                  <div className="flex items-center gap-0.5 text-amber-400 text-xs justify-end">
                    <span>{stars.toFixed(1)}</span>
                    <Star className="w-3 h-3 fill-amber-400" />
                  </div>
                </div>
              </div>

              {/* Multi-tiered progress bar with cutpoint benchmarks */}
              <div className="space-y-1.5 pt-1">
                <div className="relative h-2.5 rounded-full bg-slate-850 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, rate)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light rounded-full shadow-glow-purple"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>3★: {cut3}%</span>
                  <span>4★: {cut4}%</span>
                  <span>5★: {cut5}%</span>
                </div>
              </div>

              {/* Bottom footer tags */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  {m.gap_count > 0 ? (
                    <span className="text-rose-400 font-bold">{m.gap_count} Open Gaps</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">100% Compliant</span>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ai-purple-light group-hover:translate-x-0.5 transition-transform">
                  <span>{rate >= cut5 ? 'At Top Tier' : `+${gapToNext}% to ${targetStar}★`}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
