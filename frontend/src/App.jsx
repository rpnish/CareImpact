import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import StarSimulator from './pages/StarSimulator';
import AIAssistant from './pages/AIAssistant';
import { ToastProvider } from './components/Toast';
import { CompanyScopeProvider } from './context/CompanyScopeContext';
import { MemberStoreProvider } from './context/MemberStoreContext';

function AppContent() {
  // Smooth cursor-tracking animation for background blueprint grid
  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-grid-blueprint text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Top Sticky Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1 pb-16 relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/simulator" element={<StarSimulator />} />
          <Route path="/simulation" element={<StarSimulator />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/chat" element={<AIAssistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Clean Enterprise Healthcare Footer */}
      <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-md py-6 text-center text-xs text-slate-500 shadow-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">CareImpact · Medicare Star Ratings & Quality Gap Intelligence</span>
            <span>·</span>
            <span className="text-blue-600 font-medium">NCQA HEDIS MY2026</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Data Source: <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">data/newmembers.csv</code>
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
