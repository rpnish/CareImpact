import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StatusDonutChart({ completed = 0, pending = 0 }) {
  const total = completed + pending;
  const data = [
    { name: 'Completed (Gap-Free)', value: completed, color: '#10B981' },
    { name: 'Pending (Open Gaps)', value: pending, color: '#F43F5E' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="glass-panel p-3 rounded-2xl border border-slate-700 text-xs shadow-2xl">
          <p className="font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.color }}></span>
            {d.name}
          </p>
          <p className="text-slate-300 mt-1 font-mono">
            <strong>{d.value}</strong> members ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const compPct = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800/80 flex flex-col justify-between h-full min-h-[340px] space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <PieIcon className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-white tracking-tight">Cohort Health Split</h3>
        </div>
        <p className="text-xs text-slate-400">Completed vs Actionable Pending Gaps</p>
      </div>

      <div className="relative h-48 w-full flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={56}
              outerRadius={78}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Percentage Stat */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-white font-mono">{compPct}%</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Compliant</span>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
        <div className="bg-navy-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-mono">Completed</span>
            <strong className="text-xs font-black text-white font-mono">{completed} ({compPct}%)</strong>
          </div>
        </div>

        <div className="bg-navy-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-mono">Pending</span>
            <strong className="text-xs font-black text-white font-mono">{pending} Gaps</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
