import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function BeforeAfterChart({ measuresData }) {
  // measuresData: Array of { key, code, name, currentRate, simulatedRate }
  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-violet-500/15 text-ai-purple border border-violet-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Before vs After</h3>
            <p className="text-xs text-slate-400">Measure compliance comparison</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 mb-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-700"></span>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-ai-purple shadow-glow-purple"></span>
            <span className="text-ai-purple-light font-medium">Simulated</span>
          </div>
        </div>

        {/* Horizontal Bars */}
        <div className="space-y-5">
          {measuresData.map((m) => {
            const currentPct = Math.min(100, Math.max(0, m.currentRate || 0));
            const simPct = Math.min(100, Math.max(0, m.simulatedRate || currentPct));
            const delta = (simPct - currentPct).toFixed(1);

            return (
              <div key={m.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 font-mono">{m.code}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {currentPct.toFixed(1)}% <span className="text-slate-600">→</span>{' '}
                      <strong className="text-ai-purple-light font-bold">{simPct.toFixed(1)}%</strong>
                    </span>
                    {parseFloat(delta) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        +{delta}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Bars Stack */}
                <div className="space-y-1 bg-navy-950/80 p-2 rounded-xl border border-slate-800/80">
                  {/* Current Bar */}
                  <div className="h-3.5 bg-slate-800/90 rounded-md overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-slate-600 rounded-md flex items-center justify-end pr-1.5 text-[9px] font-bold text-slate-200"
                    >
                      {currentPct > 15 && `${currentPct.toFixed(0)}%`}
                    </motion.div>
                  </div>

                  {/* Simulated Bar */}
                  <div className="h-4 bg-navy-900 rounded-md overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${simPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light rounded-md flex items-center justify-end pr-2 text-[10px] font-black text-navy-950 shadow-glow-purple"
                    >
                      {simPct > 15 && `${simPct.toFixed(1)}%`}
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
