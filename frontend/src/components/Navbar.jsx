import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Star, Users, LayoutDashboard, RefreshCw, Database, Plus, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';
import SyncModal from './SyncModal';

export default function Navbar({ onOpenAddMember }) {
  const location = useLocation();
  const toast = useToast();
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.getSyncStatus();
      setSyncStatus(data);
    } catch (err) {
      // silently fail if backend offline
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.resyncData();
      setSyncStatus(res);
      toast.success(`Successfully ingested ${res.rows_read} rows from data.csv!`);
    } catch (err) {
      toast.error(`Ingestion failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-dark via-teal to-teal-light flex items-center justify-center shadow-glow-teal group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5 text-navy-950 fill-navy-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white tracking-tight">StarRatings</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal/15 text-teal-light border border-teal/30">
                    Simulator
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Medicare Advantage Gap Closure</p>
              </div>
            </NavLink>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-slate-800">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-800 text-teal-light border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/members"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-800 text-teal-light border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <Users className="w-4 h-4" />
                Members & Gaps
              </NavLink>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick CSV Sync button & badge */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-navy-850 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all hover:border-teal/40"
              title="View CSV sync status and trigger resync"
            >
              <span className="w-2 h-2 rounded-full bg-teal-light animate-pulse"></span>
              <Database className="w-3.5 h-3.5 text-teal-light" />
              <span>data.csv Sync</span>
              {syncStatus?.rows_read ? (
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                  {syncStatus.rows_read}
                </span>
              ) : null}
            </button>

            {/* Quick Add Member button */}
            {onOpenAddMember && (
              <button
                onClick={onOpenAddMember}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">Add Member</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncStatus={syncStatus}
        onResync={handleResync}
        isSyncing={isSyncing}
      />
    </>
  );
}
