import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import StarSimulator from './pages/StarSimulator';
import AIAssistant from './pages/AIAssistant';
import { ToastProvider } from './components/Toast';
import AddMemberModal from './components/AddMemberModal';

function AppContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleMemberAdded = (newMember) => {
    // Navigate to members page on the appropriate tab
    navigate(`/members?status=${newMember.overallStatus}`);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white font-sans">
      {/* Top Sticky Navigation */}
      <Navbar onOpenAddMember={() => setIsAddModalOpen(true)} />

      {/* Main Page Content */}
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/members"
            element={
              <Members
                onOpenAddMember={() => setIsAddModalOpen(true)}
              />
            }
          />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/simulator" element={<StarSimulator />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Shared Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-navy-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">CareImpact · Medicare Star Ratings & Gap-Closure Simulator</span>
            <span>·</span>
            <span>NCQA HEDIS MY2026</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Single Source of Truth: <code className="text-slate-400 font-mono">/data/data.csv</code> · FastAPI + Neon PostgreSQL + Groq AI
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}
