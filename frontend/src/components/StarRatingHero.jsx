import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award, Sparkles, TrendingUp, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StarRatingHero({ summary, priorityInfo }) {
  const rating = summary?.overall_star_rating ?? 0.0;
  const total = summary?.total_members ?? 0;
  const completed = summary?.completed_count ?? 0;
  const pending = summary?.pending_count ?? 0;
  const completionRate = summary?.completion_rate_pct ?? 0.0;

  // Star color based on rating
  const getRatingTier = (r) => {
    if (r >= 4.5) return { label: '5-Star Quality Tier', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
    if (r >= 3.5) return { label: '4-Star Quality Tier', color: 'text-ai-purple-light', bg: 'bg-violet-500/15', border: 'border-violet-500/30' };
    if (r >= 2.5) return { label: '3-Star Standard Tier', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
    return { label: 'At Risk Tier (<3 Stars)', color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
  };

  const tier = getRatingTier(rating);
  const pm = priorityInfo?.priority_measure;

  // Radial progress calculations
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rating / 5.0) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Star Rating Command Center (Span 7) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 relative overflow-hidden flex flex-col justify-between shadow-2xl"
      >
        {/* Glow ambient background */}
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Top Pill Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${tier.bg} ${tier.color} border ${tier.border}`}>
              <Award className="w-3.5 h-3.5" />
              {tier.label}
            </span>
            <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-full bg-navy-950/80 border border-slate-800">
              CMS Part C & D · MY2026
            </span>
          </div>

          {/* Main Rating Score Display */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 my-2">
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono block">
                Overall Plan Performance
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-6xl sm:text-7xl font-black tracking-tight font-mono text-white">
                  {rating.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-500 font-mono">/ 5.0</span>
                  <div className="flex gap-1 text-amber-400 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.floor(rating)
                            ? 'fill-amber-400 text-amber-400'
                            : s - rating < 1
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-32 h-32 shrink-0 hidden sm:flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="stroke-ai-purple"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-mono font-bold text-ai-purple-light">{Math.round((rating / 5.0) * 100)}%</span>
                <span className="text-[9px] uppercase font-mono text-slate-500">Quality Cap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3">
          <div className="bg-navy-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Total Cohort</span>
            <strong className="text-sm font-black text-white font-mono">{total} Active</strong>
          </div>
          <div className="bg-navy-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">Completed</span>
            <strong className="text-sm font-black text-white font-mono">{completed} ({completionRate}%)</strong>
          </div>
          <div className="bg-navy-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block font-mono">Pending Gaps</span>
            <strong className="text-sm font-black text-white font-mono">{pending} Open</strong>
          </div>
        </div>
      </motion.div>

      {/* Right: AI Strategic Spotlight Card (Span 5) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-5 glass-card-ai rounded-3xl p-6 sm:p-7 border border-violet-500/30 flex flex-col justify-between shadow-glow-purple relative overflow-hidden"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-violet-500/20 text-ai-purple-light border border-violet-500/40">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ai-purple-light font-mono block">
                  AI Recommended Target
                </span>
                <h3 className="text-sm font-bold text-white">Highest Star ROI Opportunity</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              Priority #1
            </span>
          </div>

          {pm ? (
            <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-white">{pm.measure_name}</h4>
                <span className="text-xs font-mono font-bold text-slate-400">{pm.measure_code}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Currently at <strong className="text-white font-mono">{pm.current_pct}%</strong> ({pm.current_star}★). Closing just{' '}
                <strong className="text-ai-purple-light font-bold">+{pm.distance_to_target}%</strong> reaches{' '}
                <strong className="text-amber-400 font-bold">{pm.target_pct}% ({pm.target_star}★)</strong>.
              </p>

              {/* Progress bar to target */}
              <div className="space-y-1 pt-1">
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ai-violet to-ai-purple-light rounded-full"
                    style={{ width: `${Math.min(100, (pm.current_pct / pm.target_pct) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 text-xs text-slate-400">
              All core Part C measures are operating at high quality. Run simulator to test forward scenarios.
            </div>
          )}
        </div>

        {/* Quick Launch Buttons */}
        <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-800/80">
          <Link
            to="/simulator"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light text-navy-950 hover:opacity-90 transition-all shadow-glow-purple"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Star Simulator</span>
          </Link>

          {pm && (
            <Link
              to={`/members?status=pending&measure=${pm.measure_key || 'flu_vaccination'}`}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Cohort</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
