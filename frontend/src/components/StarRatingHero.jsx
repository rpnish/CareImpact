import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, CheckCircle, AlertCircle, ShieldAlert, Sparkles, Award } from 'lucide-react';

export default function StarRatingHero({ summary }) {
  const rating = summary?.overall_star_rating ?? 0.0;
  const total = summary?.total_members ?? 0;
  const completed = summary?.completed_count ?? 0;
  const pending = summary?.pending_count ?? 0;
  const completionRate = summary?.completion_rate_pct ?? 0.0;

  // Star color based on rating
  const getRatingTier = (r) => {
    if (r >= 4.5) return { label: '5-Star Quality', color: 'text-teal-light', bg: 'bg-teal/15', border: 'border-teal/30' };
    if (r >= 3.5) return { label: '4-Star Performance', color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' };
    if (r >= 2.5) return { label: '3-Star Standard', color: 'text-amber-light', bg: 'bg-amber/15', border: 'border-amber/30' };
    return { label: 'At Risk (<3 Stars)', color: 'text-rose-light', bg: 'bg-rose/15', border: 'border-rose/30' };
  };

  const tier = getRatingTier(rating);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl border border-slate-800"
    >
      {/* Subtle background glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Star Rating Hero */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${tier.bg} ${tier.color} border ${tier.border}`}>
              <Award className="w-3.5 h-3.5" />
              {tier.label}
            </span>
            <span className="text-xs text-slate-400">CMS Part C & D MY2026</span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-light bg-clip-text text-transparent"
            >
              {rating.toFixed(1)}
            </motion.span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-500">/ 5.0</span>
              <div className="flex gap-1 text-amber-light mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.floor(rating)
                        ? 'fill-amber-light text-amber-light'
                        : s - 0.5 <= rating
                        ? 'fill-amber-light/50 text-amber-light'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 mt-2 max-w-sm">
            Overall Medicare Advantage quality score evaluated across NCQA HEDIS quality clinical measures.
          </p>

          {/* Simulator highlight pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal/10 border border-teal/25 text-xs text-teal-light">
            <Sparkles className="w-4 h-4 shrink-0 text-teal-light animate-spin-slow" />
            <span>
              <strong>Simulator:</strong> Closing remaining <strong>{pending} open gaps</strong> raises score to <strong>5.0 Stars</strong>
            </span>
          </div>
        </div>

        {/* Right: Key Summary Metrics */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Cohort */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Cohort</span>
              <ShieldAlert className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-white">{total}</span>
              <p className="text-xs text-slate-400 mt-1">Medicare Members</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              Single source: <code className="text-slate-300 font-mono">data.csv</code>
            </div>
          </div>

          {/* Completed / Gap-Free */}
          <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal/20 flex flex-col justify-between hover:border-teal/40 transition-all">
            <div className="flex items-center justify-between text-teal-light text-xs font-medium">
              <span>All Gaps Closed</span>
              <CheckCircle className="w-4 h-4 text-teal-light" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-teal-light">{completed}</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-teal-light/80">
                <span className="font-semibold">{completionRate}%</span>
                <span>of population</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-teal/15 text-[11px] text-teal-light/70">
              Completed members
            </div>
          </div>

          {/* Open Care Gaps */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose/20 flex flex-col justify-between hover:border-rose/40 transition-all">
            <div className="flex items-center justify-between text-rose-light text-xs font-medium">
              <span>Actionable Gaps</span>
              <AlertCircle className="w-4 h-4 text-rose-light" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-rose-light">{pending}</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-light/80">
                <span className="font-semibold">{(100 - completionRate).toFixed(1)}%</span>
                <span>require outreach</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-rose/15 text-[11px] text-rose-light/70">
              Pending members
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
