import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

export default function StatusDonutChart({ completed = 0, pending = 0 }) {
  const total = completed + pending;
  const data = [
    { name: 'Completed (Gap-Free)', value: completed, color: '#14B8A6' },
    { name: 'Pending (Open Gaps)', value: pending, color: '#F43F5E' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="glass-panel p-2.5 rounded-xl border border-slate-700 text-xs shadow-xl">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.color }}></span>
            {d.name}
          </p>
          <p className="text-slate-300 mt-1">
            <strong>{d.value}</strong> members ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-80">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-teal-light" />
            Population Gap Status Split
          </h3>
          <p className="text-xs text-slate-400">Completed vs Actionable Pending Members</p>
        </div>
      </div>

      <div className="relative h-44 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={74}
              paddingAngle={4}
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

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-white">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Members</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/50">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-light shrink-0"></span>
          <div className="truncate">
            <span className="text-slate-300 block leading-tight">Completed</span>
            <span className="text-teal-light font-bold">{completed} ({total > 0 ? ((completed / total) * 100).toFixed(0) : 0}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/50">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-light shrink-0"></span>
          <div className="truncate">
            <span className="text-slate-300 block leading-tight">Pending Gaps</span>
            <span className="text-rose-light font-bold">{pending} ({total > 0 ? ((pending / total) * 100).toFixed(0) : 0}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
