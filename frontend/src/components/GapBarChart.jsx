import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Filter } from 'lucide-react';

export default function GapBarChart({ measures = [] }) {
  const [includeAdherence, setIncludeAdherence] = useState(false);

  // Filter measures: by default focus on primary 3 measures (Eye Exam, BP, Flu)
  const filteredMeasures = measures.filter((m) =>
    includeAdherence ? true : m.measure_key !== 'diabetes_med_adherence'
  );

  const chartData = filteredMeasures.map((m) => ({
    name: m.name.replace('Diabetic ', '').replace('Annual ', ''),
    fullName: m.name,
    code: m.code,
    gaps: m.gap_count,
    compliant: m.compliant_count,
    eligible: m.eligible_count,
    rate: m.rate_pct,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl min-w-44">
          <p className="font-bold text-white mb-1">{d.fullName}</p>
          <span className="text-[10px] font-mono text-slate-400 block mb-2">{d.code}</span>
          <div className="space-y-1">
            <div className="flex justify-between text-rose-light font-semibold">
              <span>Open Gaps:</span>
              <span>{d.gaps}</span>
            </div>
            <div className="flex justify-between text-teal-light">
              <span>Compliant:</span>
              <span>{d.compliant}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Denominator:</span>
              <span>{d.eligible}</span>
            </div>
            <div className="flex justify-between text-slate-200 border-t border-slate-700 pt-1 font-bold">
              <span>Rate:</span>
              <span>{d.rate}%</span>
            </div>
          </div>
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
            <BarChart3 className="w-4 h-4 text-rose-light" />
            Open Gaps by Measure
          </h3>
          <p className="text-xs text-slate-400">Unclosed opportunities requiring outreach</p>
        </div>
        <button
          onClick={() => setIncludeAdherence(!includeAdherence)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            includeAdherence
              ? 'bg-teal/20 text-teal-light border border-teal/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
          }`}
          title="Toggle inclusion of 4th measure (Diabetes Med Adherence)"
        >
          <Filter className="w-3 h-3" />
          <span>{includeAdherence ? '4 Measures' : 'Top 3'}</span>
        </button>
      </div>

      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="gaps" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.gaps > 5 ? '#E11D48' : '#F59E0B'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>Higher bar = higher gap volume</span>
        <span className="text-[11px] text-slate-400 font-mono">
          Total Gaps: <strong className="text-rose-light">{chartData.reduce((acc, c) => acc + c.gaps, 0)}</strong>
        </span>
      </div>
    </div>
  );
}
