import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, HeartPulse, Pill, Syringe, ArrowRight, Star } from 'lucide-react';
import StatusBadge from './StatusBadge';

const MEASURE_ICONS = {
  diabetic_eye_exam: Eye,
  blood_pressure_control: HeartPulse,
  diabetes_med_adherence: Pill,
  flu_vaccination: Syringe,
};

export default function MeasureProgressCards({ measures = [] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">HEDIS Quality Measure Performance</h2>
          <p className="text-xs text-slate-400">Live compliance rates evaluated against NCQA MY2026 cutpoints</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {measures.map((m, idx) => {
          const Icon = MEASURE_ICONS[m.measure_key] || HeartPulse;
          const rate = m.rate_pct ?? 0;
          const stars = m.current_stars ?? 3.0;
          const cut3 = m.cutpoint_3star ?? 65;
          const cut4 = m.cutpoint_4star ?? 75;
          const cut5 = m.cutpoint_5star ?? 85;

          // Next target cutpoint
          let nextTarget = cut4;
          let nextLabel = '4-Star Target';
          if (rate >= cut4) {
            nextTarget = cut5;
            nextLabel = '5-Star Target';
          }
          if (rate >= cut5) {
            nextTarget = 100;
            nextLabel = 'Max 5-Star Cap';
          }

          const gapToNext = Math.max(0, (nextTarget - rate)).toFixed(1);

          return (
            <motion.div
              key={m.measure_key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800/80 text-teal-light border border-slate-700 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-tight">{m.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">{m.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-light border border-amber-500/20 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-light" />
                    <span>{stars.toFixed(1)}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>

                {/* Progress Bar & Rate */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-white">{rate}%</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {rate >= cut5 ? '5-Star Reached' : `${gapToNext}% to ${nextLabel}`}
                    </span>
                  </div>

                  {/* Visual multi-cutpoint progress bar */}
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                    {/* 4-Star marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-sky-400/60 z-10"
                      style={{ left: `${cut4}%` }}
                      title={`4-Star Cutpoint: ${cut4}%`}
                    />
                    {/* 5-Star marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-teal-light/70 z-10"
                      style={{ left: `${cut5}%` }}
                      title={`5-Star Cutpoint: ${cut5}%`}
                    />
                    
                    {/* Animated Fill Bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(rate, 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.15 }}
                      className={`h-full rounded-full ${
                        rate >= cut5
                          ? 'bg-gradient-to-r from-teal to-teal-light'
                          : rate >= cut4
                          ? 'bg-gradient-to-r from-sky-500 to-teal'
                          : rate >= cut3
                          ? 'bg-gradient-to-r from-amber to-sky-400'
                          : 'bg-gradient-to-r from-rose to-amber'
                      }`}
                    />
                  </div>

                  {/* Cutpoint legend ticks */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>0%</span>
                    <span>3★: {cut3}%</span>
                    <span>4★: {cut4}%</span>
                    <span>5★: {cut5}%</span>
                  </div>
                </div>

                {/* Counts breakdown */}
                <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-navy-950/70 border border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Eligible</span>
                    <span className="font-bold text-slate-200">{m.eligible_count}</span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[10px] text-teal-light block">Compliant</span>
                    <span className="font-bold text-teal-light">{m.compliant_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-light block">Open Gaps</span>
                    <span className="font-bold text-rose-light">{m.gap_count}</span>
                  </div>
                </div>
              </div>

              {/* Action link to filter members */}
              <button
                onClick={() => navigate(`/members?measure=${m.measure_key}`)}
                className="mt-4 w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/40 hover:bg-slate-800 hover:text-white transition-all group/btn"
              >
                <span>View {m.gap_count} Open Gaps</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-400 group-hover/btn:text-teal-light" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
