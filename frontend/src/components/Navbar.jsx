import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Star, Users, LayoutDashboard, RefreshCw, Database, Plus, ShieldCheck, Sparkles, Bot } from 'lucide-react';
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
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ai-violet via-ai-purple to-ai-cyan flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-navy-950 fill-navy-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white tracking-tight">CareImpact</span>
                  <span className="text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md bg-violet-500/20 text-ai-purple-light border border-violet-500/40">
                    Quality AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Medicare Advantage Quality Engine</p>
              </div>
            </NavLink>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-slate-800/80">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 text-teal-light" />
                Dashboard
              </NavLink>

              <NavLink
                to="/members"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`
                }
              >
                <Users className="w-4 h-4 text-sky-400" />
                Members
              </NavLink>

              <NavLink
                to="/simulator"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-violet-950/80 text-ai-purple-light border border-violet-800/60 shadow-glow-purple'
                      : 'text-slate-400 hover:text-ai-purple-light hover:bg-violet-950/30'
                  }`
                }
              >
                <Star className="w-4 h-4 text-ai-purple" />
                Star Simulator
              </NavLink>

              <NavLink
                to="/assistant"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 text-ai-cyan-light border border-cyan-700/60 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-ai-cyan-light hover:bg-cyan-950/30'
                  }`
                }
              >
                <Bot className="w-4 h-4 text-ai-cyan" />
                AI Assistant
              </NavLink>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick CSV Sync button & badge */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-navy-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all hover:border-violet-500/40"
              title="View CSV sync status and trigger resync"
            >
              <Database className="w-3.5 h-3.5 text-ai-purple-light" />
              <span>data.csv</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Quick Add Member Action */}
            <button
              onClick={onOpenAddMember}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-ai-violet via-ai-purple to-ai-purple-light text-navy-950 hover:opacity-90 transition-all shadow-glow-purple active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 py-2 px-4 bg-navy-950/95">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold ${
                isActive ? 'text-teal-light' : 'text-slate-400'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>
          <NavLink
            to="/members"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold ${
                isActive ? 'text-sky-400' : 'text-slate-400'
              }`
            }
          >
            <Users className="w-4 h-4" />
            Members
          </NavLink>
          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold ${
                isActive ? 'text-ai-purple-light' : 'text-slate-400'
              }`
            }
          >
            <Star className="w-4 h-4" />
            Simulator
          </NavLink>
          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold ${
                isActive ? 'text-ai-cyan-light' : 'text-slate-400'
              }`
            }
          >
            <Bot className="w-4 h-4" />
            AI Copilot
          </NavLink>
        </div>
      </header>

      {/* Re-sync Modal */}
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
