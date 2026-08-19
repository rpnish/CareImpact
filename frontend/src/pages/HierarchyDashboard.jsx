import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Layers,
  Users,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { loadHierarchyFromCsv, parseCsvContent } from '../utils/hierarchyData';
import Breadcrumbs from '../components/hierarchy/Breadcrumbs';
import CompanyView from '../components/hierarchy/CompanyView';
import PlanView from '../components/hierarchy/PlanView';
import PlanMembersView from '../components/hierarchy/PlanMembersView';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export default function HierarchyDashboard() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  const [dataSource, setDataSource] = useState('data/newmembers.csv');

  // Selected hierarchy node
  const [selectedCompanyName, setSelectedCompanyName] = useState(
    searchParams.get('company') || null
  );
  const [selectedPlanName, setSelectedPlanName] = useState(
    searchParams.get('plan') || null
  );

  // Load default CSV
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadHierarchyFromCsv('/newmembers.csv');
      setHierarchy(data);
      setDataSource(data.sourceName || 'newmembers.csv');
    } catch (err) {
      console.error('Failed to load CSV hierarchy:', err);
      setError(err.message || 'Failed to parse newmembers.csv');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync state with URL search params
  const handleSelectCompany = (company) => {
    if (!company) {
      setSelectedCompanyName(null);
      setSelectedPlanName(null);
      setSearchParams({});
      return;
    }
    setSelectedCompanyName(company.companyName);
    setSelectedPlanName(null);
    setSearchParams({ company: company.companyName });
  };

  const handleSelectPlan = (plan) => {
    if (!plan) {
      setSelectedPlanName(null);
      if (selectedCompanyName) {
        setSearchParams({ company: selectedCompanyName });
      } else {
        setSearchParams({});
      }
      return;
    }
    setSelectedPlanName(plan.planName);
    setSearchParams({
      company: plan.companyName,
      plan: plan.planName,
    });
  };

  const handleResetToRoot = () => {
    setSelectedCompanyName(null);
    setSelectedPlanName(null);
    setSearchParams({});
  };

  // Handle custom CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') throw new Error('File content could not be read.');
        const customHierarchy = await parseCsvContent(text, file.name);
        setHierarchy(customHierarchy);
        setDataSource(file.name);
        setSelectedCompanyName(null);
        setSelectedPlanName(null);
        setSearchParams({});
        toast.success(`Loaded ${customHierarchy.rowCount} rows across ${customHierarchy.totalCompanies} companies from ${file.name}`);
      } catch (err) {
        toast.error(`CSV Parsing error: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file.');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  // Resolve currently selected objects from hierarchy
  const selectedCompany = hierarchy?.companies.find(
    (c) => c.companyName === selectedCompanyName
  ) || null;

  const selectedPlan = selectedCompany?.plans.find(
    (p) => p.planName === selectedPlanName
  ) || null;

  if (loading && !hierarchy) {
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

  if (error && !hierarchy) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-card p-8 rounded-3xl border border-rose-800/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Data Load Error</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-glow-purple"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Load
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload newmembers.csv
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Top Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Medicare Quality Hierarchy</span>
            </h1>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-violet-500/20 text-ai-purple-light border border-violet-500/40">
              3-Level MVP
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            <span className="text-slate-300 font-semibold">Company</span> ➔ <span className="text-slate-300 font-semibold">Plans</span> ➔ <span className="text-slate-300 font-semibold">Members Roster</span> with live clinical measure compliance.
          </p>
        </div>

        {/* Data Source Badge & Upload Trigger */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-light" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]" title={dataSource}>
              {dataSource}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all hover:border-violet-500/50"
            title="Upload another CSV file to test custom hierarchy"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Custom CSV</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 2. Persistent Breadcrumbs Bar */}
      <Breadcrumbs
        selectedCompany={selectedCompany}
        selectedPlan={selectedPlan}
        onSelectCompany={handleSelectCompany}
        onSelectPlan={handleSelectPlan}
        onResetToRoot={handleResetToRoot}
      />

      {/* 3. Dynamic Nested View Render */}
      <AnimatePresence mode="wait">
        {!selectedCompany ? (
          /* Level 1: Company View */
          <motion.div
            key="company-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <CompanyView
              hierarchy={hierarchy}
              onSelectCompany={handleSelectCompany}
            />
          </motion.div>
        ) : !selectedPlan ? (
          /* Level 2: Plan View (under selected company) */
          <motion.div
            key={`plan-view-${selectedCompany.companyName}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PlanView
              company={selectedCompany}
              onSelectPlan={handleSelectPlan}
              onBackToCompanies={handleResetToRoot}
            />
          </motion.div>
        ) : (
          /* Level 3: Members View (under selected plan) */
          <motion.div
            key={`members-view-${selectedPlan.planName}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PlanMembersView
              company={selectedCompany}
              plan={selectedPlan}
              onBackToPlans={() => handleSelectPlan(null)}
              onBackToCompanies={handleResetToRoot}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
