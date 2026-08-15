import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import MemberTable from '../components/MemberTable';
import EditMemberModal from '../components/EditMemberModal';
import { SkeletonTable } from '../components/Skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Members({ onOpenAddMember }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active tab ("pending" or "completed")
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'pending');
  const [measureFilter, setMeasureFilter] = useState(searchParams.get('measure') || '');

  // Edit Modal State
  const [editingMember, setEditingMember] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
      setError(err.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Listen to member added event from global modal
  useEffect(() => {
    const handleMemberAddedEvent = (e) => {
      const newMember = e.detail;
      if (newMember) {
        setMembers((prev) => [newMember, ...prev.filter((m) => m.member_id !== newMember.member_id)]);
        setActiveTab(newMember.overallStatus);
        setMeasureFilter('');
      }
    };

    window.addEventListener('medicare-member-added', handleMemberAddedEvent);
    return () => {
      window.removeEventListener('medicare-member-added', handleMemberAddedEvent);
    };
  }, []);

  useEffect(() => {
    const qMeasure = searchParams.get('measure');
    if (qMeasure) {
      setMeasureFilter(qMeasure);
      setActiveTab('pending'); // automatically switch to pending tab to see gaps
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('status', tab);
      return p;
    });
  };

  const handleMeasureFilterChange = (mKey) => {
    setMeasureFilter(mKey);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (mKey) p.set('measure', mKey);
      else p.delete('measure');
      return p;
    });
  };

  const handleMemberUpdated = (updatedMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.member_id === updatedMember.member_id ? updatedMember : m))
    );
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove member '${memberName}' (${memberId})?`)) {
      try {
        await api.deleteMember(memberId);
        setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
        toast.success(`Member '${memberName}' removed.`);
      } catch (err) {
        toast.error(`Delete failed: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-card p-8 rounded-3xl border border-rose-800/40 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-light mx-auto" />
          <h2 className="text-lg font-bold text-white">Error Loading Members</h2>
          <p className="text-xs text-slate-300">{error}</p>
          <button
            onClick={fetchMembers}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Medicare Advantage Members</h1>
        <p className="text-xs text-slate-400 mt-1">
          Full-column cohort view with live HEDIS measure status badges, pending care gap tracking, and clinical editing.
        </p>
      </div>

      {/* Member Table */}
      <MemberTable
        members={members}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAdd={onOpenAddMember}
        onOpenEdit={(m) => setEditingMember(m)}
        onDeleteMember={handleDeleteMember}
        selectedMeasureFilter={measureFilter}
        onMeasureFilterChange={handleMeasureFilterChange}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onMemberUpdated={handleMemberUpdated}
      />
    </div>
  );
}
