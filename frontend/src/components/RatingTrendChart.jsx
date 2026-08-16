import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function RatingTrendChart({ trendData = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl min-w-40">
          <p className="font-bold text-white mb-1.5">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-teal-light font-semibold">
              <span>Star Rating:</span>
              <span>{d.star_rating} ★</span>
            </div>
            <div className="flex justify-between text-sky-400">
              <span>Compliance:</span>
              <span>{d.compliance_rate}%</span>
            </div>
            <div className="flex justify-between text-rose-light">
              <span>Open Gaps:</span>
              <span>{d.open_gaps}</span>
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
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Star Rating & Gap Closure Trajectory
          </h3>
          <p className="text-xs text-slate-400">Measurement year progression (Sep 2025 → Aug 2026)</p>
        </div>
      </div>

      <div className="h-48 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[2.0, 5.0]}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}★`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="star_rating"
              stroke="#14B8A6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#ratingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>Trajectory: +1.4 Stars gained via gap closure</span>
        <span className="text-[11px] text-teal-light font-semibold">Current: 4.2★</span>
      </div>
    </div>
  );
}
