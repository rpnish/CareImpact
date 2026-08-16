import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Award,
  Sliders,
  Target,
  ArrowRight,
  Bell,
  Activity,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import SimulatorSliderCard from '../components/SimulatorSliderCard';
import BeforeAfterChart from '../components/BeforeAfterChart';
import { SkeletonCard } from '../components/Skeleton';

// Measure definitions with CMS weights and codes
const MEASURE_DEFINITIONS = [
  {
    key: 'diabetic_eye_exam',
    code: 'EED',
    fullName: 'Diabetic Eye Exam',
    weight: 1,
    cutpoints: { '3star': 72, '4star': 80, '5star': 86 },
  },
  {
    key: 'blood_pressure_control',
    code: 'CBP',
    fullName: 'Blood Pressure Control',
    weight: 3,
    cutpoints: { '3star': 75, '4star': 80, '5star': 86 },
  },
  {
    key: 'diabetes_med_adherence',
    code: 'PDC',
    fullName: 'Diabetes Medication Adherence',
    weight: 1,
    cutpoints: { '3star': 78, '4star': 84, '5star': 90 },
  },
  {
    key: 'flu_vaccination',
    code: 'AIS-E',
    fullName: 'Annual Flu Vaccine',
    weight: 1,
    cutpoints: { '3star': 61, '4star': 68, '5star': 73 },
  },
];

function calculateStars(rate, cutpoints) {
  const p3 = cutpoints['3star'];
  const p4 = cutpoints['4star'];
  const p5 = cutpoints['5star'];

  if (rate >= p5) {
    const bonus = Math.min(((rate - p5) / 10.0) * 0.5, 0.5);
    return Math.min(4.5 + bonus, 5.0);
  } else if (rate >= p4) {
    return 4.0 + ((rate - p4) / (p5 - p4)) * 0.9;
  } else if (rate >= p3) {
    return 3.0 + ((rate - p3) / (p4 - p3)) * 0.9;
  } else if (rate >= p3 * 0.7) {
    return 2.0 + ((rate - p3 * 0.7) / (p3 * 0.3)) * 0.9;
  } else {
    return Math.max(1.0 + rate / (p3 * 0.7), 1.0);
  }
}

export default function StarSimulator() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [priorityInfo, setPriorityInfo] = useState(null);

  // Sliders state: { [measureKey]: number of gaps to close }
  const [sliderValues, setSliderValues] = useState({
    diabetic_eye_exam: 0,
    blood_pressure_control: 0,
    diabetes_med_adherence: 0,
    flu_vaccination: 0,
  });

  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sumRes, prioRes] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getPriority().catch(() => null),
        ]);
        setSummary(sumRes);
        setPriorityInfo(prioRes);
      } catch (err) {
        console.error('Failed to load simulator base data:', err);
        toast.error('Failed to load live cohort metrics for simulation');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Map summary measures to dictionary
  const measureStatsMap = useMemo(() => {
    const map = {};
    (summary?.measures || []).forEach((m) => {
      map[m.measure_key] = m;
    });
    return map;
  }, [summary]);

  // Total open gaps in the entire population
  const totalOpenGapsAll = useMemo(() => {
    return MEASURE_DEFINITIONS.reduce((acc, def) => {
      const stats = measureStatsMap[def.key];
      return acc + (stats ? stats.gap_count : 0);
    }, 0);
  }, [measureStatsMap]);

  // Total selected gaps to close across all sliders
  const totalSelectedGaps = useMemo(() => {
    return Object.values(sliderValues).reduce((a, b) => a + b, 0);
  }, [sliderValues]);

  const remainingGaps = Math.max(0, totalOpenGapsAll - totalSelectedGaps);

  // Calculate live simulation results
  const simulationResults = useMemo(() => {
    let currentTotalWeightedStars = 0;
    let simulatedTotalWeightedStars = 0;
    let totalWeight = 0;

    const perMeasureSim = MEASURE_DEFINITIONS.map((def) => {
      const stats = measureStatsMap[def.key];
      const elig = stats ? stats.eligible_count : 0;
      const comp = stats ? stats.compliant_count : 0;
      const gaps = stats ? stats.gap_count : 0;
      const currentRate = stats ? stats.rate_pct : 0;

      const selected = sliderValues[def.key] || 0;
      const simComp = comp + selected;
      const simRate = elig > 0 ? (simComp / elig) * 100 : currentRate;
      const improvement = simRate - currentRate;

      const currentStars = elig > 0 ? calculateStars(currentRate, def.cutpoints) : 3.0;
      const simStars = elig > 0 ? calculateStars(simRate, def.cutpoints) : 3.0;

      currentTotalWeightedStars += currentStars * def.weight;
      simulatedTotalWeightedStars += simStars * def.weight;
      totalWeight += def.weight;

      return {
        key: def.key,
        code: def.code,
        name: def.fullName,
        weight: def.weight,
        eligibleCount: elig,
        compliantCount: comp,
        openGaps: gaps,
        currentRate,
        simulatedRate: simRate,
        improvement,
        selectedGaps: selected,
        currentStars,
        simStars,
      };
    });

    const currentOverallRating = totalWeight > 0 ? currentTotalWeightedStars / totalWeight : 3.42;
    const simulatedOverallRating = totalWeight > 0 ? simulatedTotalWeightedStars / totalWeight : 4.08;
    const starImprovement = Math.max(0, simulatedOverallRating - currentOverallRating);

    return {
      currentOverallRating,
      simulatedOverallRating,
      starImprovement,
      perMeasureSim,
    };
  }, [measureStatsMap, sliderValues]);

  const handleSliderChange = (measureKey, val) => {
    setSliderValues((prev) => ({ ...prev, [measureKey]: val }));
  };

  const handleReset = () => {
    setSliderValues({
      diabetic_eye_exam: 0,
      blood_pressure_control: 0,
      diabetes_med_adherence: 0,
      flu_vaccination: 0,
    });
    toast.info('Simulation reset to baseline plan performance.');
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      toast.success(
        `Simulation calculated: Projected Star Rating jumps to ${simulationResults.simulatedOverallRating.toFixed(2)} ★ (+${simulationResults.starImprovement.toFixed(2)} gain)!`
      );
    }, 400);
  };

  const handleApplySimulation = () => {
    toast.success(
      `Simulation Scenario Saved! Target: Close ${totalSelectedGaps} gaps for ${simulationResults.simulatedOverallRating.toFixed(2)} ★.`
    );
  };

  // Ranked measures by potential improvement
  const rankedImprovements = useMemo(() => {
    return [...simulationResults.perMeasureSim].sort((a, b) => b.improvement - a.improvement);
  }, [simulationResults]);

  const highestOpportunityMeasure = rankedImprovements[0];

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

  const currentStarScore = summary?.overall_star_rating || simulationResults.currentOverallRating;
  const simulatedStarScore = simulationResults.simulatedOverallRating;
  const currentStarBucket = Math.floor(currentStarScore);
  const simulatedStarBucket = Math.floor(simulatedStarScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Quality Analytics</span>
            <span>/</span>
            <span className="text-ai-purple-light">Star Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Star Rating Simulator</span>
            <span className="p-1.5 rounded-xl bg-violet-500/15 text-ai-purple border border-violet-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate how closing care gaps could improve your Medicare Advantage Star Rating in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-950/80 text-ai-purple-light border border-violet-800/60 shadow-glow-purple">
            MY 2026
          </span>
          <button
            onClick={() => toast.info('Notification: NCQA HEDIS MY2026 dynamic CMS cut-points active.')}
            className="p-2 rounded-xl bg-navy-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="System Status"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Current vs Simulated Star Rating Top Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Rating */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800/80 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Current Rating
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {currentStarBucket} ★
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              {currentStarScore.toFixed(2)}
            </span>
            <span className="text-2xl text-amber-400">★</span>
          </div>

          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>Current plan performance</span>
          </p>
        </motion.div>

        {/* Simulated Rating */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card-ai rounded-3xl p-6 sm:p-7 border border-violet-500/40 relative overflow-hidden shadow-glow-purple"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ai-purple-light font-mono">
              Simulated Rating
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-violet-500/20 text-ai-purple-light border border-violet-500/40 font-mono">
              {simulatedStarBucket} ★
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              {simulatedStarScore.toFixed(2)}
            </span>
            <span className="text-2xl text-amber-400">★</span>
          </div>

          <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{simulationResults.starImprovement.toFixed(2)} improvement</span>
          </p>
        </motion.div>
      </div>

      {/* 3. Projected Star Impact Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800/80 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/15 text-ai-purple border border-violet-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Projected Star Impact</h3>
              <p className="text-xs text-slate-400">Current rating compared with simulated performance</p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />+{simulationResults.starImprovement.toFixed(2)} ★
          </span>
        </div>

        {/* Timeline Bar with 1-5 Star Markers */}
        <div className="space-y-3 pt-2">
          <div className="relative h-3 rounded-full bg-slate-800 w-full overflow-hidden">
            {/* Base Current track */}
            <div
              className="absolute left-0 top-0 h-full bg-slate-600 rounded-full"
              style={{ width: `${(currentStarScore / 5.0) * 100}%` }}
            />
            {/* Simulated Projected track */}
            <motion.div
              initial={{ width: `${(currentStarScore / 5.0) * 100}%` }}
              animate={{ width: `${(simulatedStarScore / 5.0) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light rounded-full shadow-glow-purple"
            />
          </div>

          {/* Star Benchmark Ticks */}
          <div className="flex justify-between items-center text-xs font-mono text-slate-500 px-1">
            <span>1 ★</span>
            <span>2 ★</span>
            <span className="text-slate-400 font-bold">3 ★</span>
            <span className="text-ai-purple-light font-bold">4 ★</span>
            <span className="text-amber-400 font-bold">5 ★</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Gap Closure Simulator Section (Sliders) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/15 text-ai-purple border border-violet-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Gap Closure Simulator</h2>
              <p className="text-xs text-slate-400">Choose how many open care gaps you want to close.</p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-navy-900 px-3.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <strong className="text-ai-purple-light font-bold">{totalSelectedGaps}</strong> / {totalOpenGapsAll} gaps selected
          </div>
        </div>

        {/* 4 Measure Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulationResults.perMeasureSim.map((m) => (
            <SimulatorSliderCard
              key={m.key}
              measureKey={m.key}
              code={m.code}
              name={m.name}
              currentRate={m.currentRate}
              openGaps={m.openGaps}
              eligibleCount={m.eligibleCount}
              compliantCount={m.compliantCount}
              selectedGaps={m.selectedGaps}
              onSliderChange={(val) => handleSliderChange(m.key, val)}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light text-navy-950 hover:opacity-90 transition-all shadow-glow-purple active:scale-98"
          >
            <Play className="w-4 h-4 fill-navy-950" />
            <span>{isSimulating ? 'Computing Simulation...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* 5. Before vs After & Impact Analysis 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Before vs After Chart */}
        <BeforeAfterChart measuresData={simulationResults.perMeasureSim} />

        {/* Column 2: Impact Analysis */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Impact Analysis</h3>
                <p className="text-xs text-slate-400">Potential improvement by measure</p>
              </div>
            </div>

            {/* Ranked Gain List */}
            <div className="space-y-3 pt-2">
              {rankedImprovements.map((item, idx) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between p-3 rounded-2xl bg-navy-950/80 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white">{item.code}</span>
                    <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                      {item.name}
                    </span>
                  </div>

                  <span className="text-xs font-bold font-mono text-emerald-400">
                    +{item.improvement.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Highest Opportunity Box */}
          {highestOpportunityMeasure && (
            <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-800/50 space-y-1 shadow-glow-purple/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ai-purple-light block font-mono">
                Highest Opportunity
              </span>
              <h4 className="text-sm font-bold text-white">
                {highestOpportunityMeasure.name} ({highestOpportunityMeasure.code})
              </h4>
              <p className="text-xs text-slate-300">
                This measure provides the greatest projected compliance improvement (+
                {highestOpportunityMeasure.improvement.toFixed(1)}%).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Recommended Interventions Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recommended Interventions</h3>
            <p className="text-xs text-slate-400">Focus on measures with the highest potential impact.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rankedImprovements.slice(0, 2).map((rec, idx) => (
            <div
              key={rec.code}
              className="glass-card rounded-3xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    Priority #{idx + 1}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">{rec.code}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">{rec.name}</h4>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-navy-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Open Gaps</span>
                    <strong className="text-sm text-white font-mono">{rec.openGaps}</strong>
                  </div>
                  <div className="bg-navy-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Potential Improvement</span>
                    <strong className="text-sm text-emerald-400 font-mono">+{rec.improvement.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              <Link
                to={`/members?status=pending&measure=${rec.key}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ai-purple-light hover:text-white transition-colors"
              >
                <span>View Members</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Simulation Summary Bottom Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-ai rounded-3xl p-6 sm:p-7 border border-violet-500/40 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/15 text-ai-purple border border-violet-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Simulation Summary</h3>
            <p className="text-xs text-slate-400">Overview of your projected scenario</p>
          </div>
        </div>

        {/* 4 Bottom Metric KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-navy-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Gaps Selected</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">{totalSelectedGaps}</span>
          </div>

          <div className="bg-navy-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Remaining Gaps</span>
            <span className="text-lg sm:text-xl font-black text-slate-300 font-mono">{remainingGaps}</span>
          </div>

          <div className="bg-navy-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Projected Rating</span>
            <span className="text-lg sm:text-xl font-black text-ai-purple-light font-mono">
              {simulatedStarScore.toFixed(2)} ★
            </span>
          </div>

          <div className="bg-navy-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Star Improvement</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              +{simulationResults.starImprovement.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>

          <button
            onClick={handleApplySimulation}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light text-navy-950 hover:opacity-90 transition-all shadow-glow-purple"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Simulation</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
