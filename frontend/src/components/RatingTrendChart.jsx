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
        <div className="glass-panel p-3 rounded-2xl border border-slate-700 text-xs shadow-2xl min-w-44">
          <p className="font-bold text-white mb-2 font-mono">{label}</p>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-ai-purple-light font-bold">
              <span>Star Rating:</span>
              <span>{d.star_rating} ★</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Compliance:</span>
              <span>{d.compliance_rate}%</span>
            </div>
            <div className="flex justify-between text-rose-400">
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
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800/80 flex flex-col justify-between h-full min-h-[340px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-500/15 text-ai-purple border border-violet-500/30">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">Star Rating Trajectory</h3>
          </div>
          <p className="text-xs text-slate-400">Measurement Year progression (Sep 2025 → Aug 2026)</p>
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="monospace"
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="monospace"
              unit="★"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="star_rating"
              stroke="#A78BFA"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#ratingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
