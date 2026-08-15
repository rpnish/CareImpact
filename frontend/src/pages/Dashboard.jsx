import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Sparkles, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StarRatingHero from '../components/StarRatingHero';
import MeasureProgressCards from '../components/MeasureProgressCards';
import StatusDonutChart from '../components/StatusDonutChart';
import GapBarChart from '../components/GapBarChart';
import RatingTrendChart from '../components/RatingTrendChart';
import GeoMapView from '../components/GeoMapView';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [geoPoints, setGeoPoints] = useState([]);
  const [priorityInfo, setPriorityInfo] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, geoRes, prioRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getTrend(),
        api.getGeoData(),
        api.getPriority().catch(() => null),
      ]);
      setSummary(sumRes);
      setTrendData(trendRes);
      setGeoPoints(geoRes);
      setPriorityInfo(prioRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-card p-8 rounded-3xl border border-rose-800/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-light flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Dashboard Service Unavailable</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
          <p className="text-xs text-slate-500 font-mono">Ensure backend is running at http://127.0.0.1:8000</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const pm = priorityInfo?.priority_measure;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Dynamic Measure-First Priority Banner */}
      {pm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 sm:p-5 rounded-2xl border border-teal/40 bg-gradient-to-r from-teal/15 via-navy-900 to-sky-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-teal/10"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-teal/20 text-teal-light border border-teal/40">
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal/20 text-teal-light border border-teal/30">
                  Dynamic CMS Priority Target #{pm.measure_priority || 1}
                </span>
                <span className="text-xs text-slate-400 font-mono">{pm.measure_code}</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Highest Star ROI: Focus Outreach on <span className="text-teal-light">{pm.measure_name}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Current performance is <strong className="text-white">{pm.current_pct}%</strong> ({pm.current_star}★). Only{' '}
                <strong className="text-teal-light font-bold">+{pm.distance_to_target}%</strong> improvement needed to reach{' '}
                <strong className="text-amber-light">{pm.target_pct}% ({pm.target_star}★)</strong>.
              </p>
            </div>
          </div>

          <Link
            to={`/members?status=pending&measure=${pm.measure_key || 'flu_vaccination'}`}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal"
          >
            <span>View Prioritized Cohort</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* 2. Hero Star Rating & Summary */}
      <StarRatingHero summary={summary} />

      {/* 3. HEDIS Measure Progress Cards */}
      <MeasureProgressCards measures={summary?.measures || []} />

      {/* 4. Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Completed vs Pending */}
        <StatusDonutChart
          completed={summary?.completed_count || 0}
          pending={summary?.pending_count || 0}
        />

        {/* Bar Chart: Open Gaps by Measure */}
        <GapBarChart measures={summary?.measures || []} />

        {/* Trend Area Chart: Star Rating Over Time */}
        <RatingTrendChart trendData={trendData} />
      </div>

      {/* 5. Geographic Map View */}
      <GeoMapView geoPoints={geoPoints} />
    </div>
  );
}
