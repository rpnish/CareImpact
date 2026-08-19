import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Sliders, Bot, FileSpreadsheet } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">CareImpact</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Quality Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">Medicare Advantage & Plan Analysis</p>
            </div>
          </NavLink>

          {/* 4 Navigation Tabs: Dashboard, Members, Star Simulator, AI Assistant */}
          <nav className="hidden sm:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-800">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/members"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Members Roster</span>
            </NavLink>

            <NavLink
              to="/simulator"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Star Simulator</span>
            </NavLink>

            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>AI Assistant</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Data Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-400">Source:</span>
            <span className="text-slate-200">newmembers.csv</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="sm:hidden flex items-center justify-around border-t border-slate-800 py-2 px-4 bg-slate-950">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all ${
              isActive ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/members"
          className={({ isActive }) =>
            `flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all ${
              isActive ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'
            }`
          }
        >
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span>Members</span>
        </NavLink>
        <NavLink
          to="/simulator"
          className={({ isActive }) =>
            `flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all ${
              isActive ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'
            }`
          }
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulator</span>
        </NavLink>
        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all ${
              isActive ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'
            }`
          }
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Copilot</span>
        </NavLink>
      </div>
    </header>
  );
}
