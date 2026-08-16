import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Sparkles, Target, ArrowRight, CheckCircle2, BarChart2 } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-glow-purple"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. ASYMMETRIC BENTO HERO: Star Command Center (7:5 Split) */}
      <StarRatingHero summary={summary} priorityInfo={priorityInfo} />

      {/* 2. ASYMMETRIC BENTO ROW: Quality Measures Matrix (8) + Cohort Donut (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <MeasureProgressCards measures={summary?.measures || []} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <StatusDonutChart
            completed={summary?.completed_count || 0}
            pending={summary?.pending_count || 0}
          />
        </div>
      </div>

      {/* 3. ASYMMETRIC BENTO ROW: Trajectory Trend (7) + Regional Map (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <RatingTrendChart trendData={trendData} />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <GeoMapView geoPoints={geoPoints} />
        </div>
      </div>
    </div>
  );
}
