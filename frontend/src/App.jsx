import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import { ToastProvider } from './components/Toast';
import { CompanyScopeProvider } from './context/CompanyScopeContext';
import { MemberStoreProvider } from './context/MemberStoreContext';

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Sticky Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Clean Enterprise Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">CareImpact · Medicare Star Ratings & Quality Gap Intelligence</span>
            <span>·</span>
            <span>NCQA HEDIS MY2026</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Data Source: <code className="text-slate-400 font-mono">data/newmembers.csv</code>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CompanyScopeProvider>
        <MemberStoreProvider>
          <Router>
            <AppContent />
          </Router>
        </MemberStoreProvider>
      </CompanyScopeProvider>
    </ToastProvider>
  );
}
