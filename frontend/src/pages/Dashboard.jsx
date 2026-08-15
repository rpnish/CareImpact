import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, geoRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsTrend(),
        api.getAnalyticsGeo(),
      ]);
      setSummary(sumRes);
      setTrendData(trendRes);
      setGeoPoints(geoRes);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Hero Star Rating & Summary */}
      <StarRatingHero summary={summary} />

      {/* 2. HEDIS Measure Progress Cards */}
      <MeasureProgressCards measures={summary?.measures || []} />

      {/* 3. Visual Analytics Charts Grid */}
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

      {/* 4. Geographic Map View */}
      <GeoMapView geoPoints={geoPoints} />
    </div>
  );
}
