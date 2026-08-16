import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  MapPin,
  Shield,
  Activity,
  HeartPulse,
  Eye,
  Pill,
  Syringe,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Info,
  Paperclip,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { api, API_BASE_URL } from '../api/client';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import EditMemberModal from '../components/EditMemberModal';
import { MEASURES } from '../utils/constants';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchMember = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMember(id);
      setMember(data);
    } catch (err) {
      console.error('Failed to load member detail:', err);
      setError(err.message || 'Member not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete member '${member.member_name}'?`)) {
      try {
        await api.deleteMember(member.member_id);
        toast.success(`Member '${member.member_name}' deleted.`);
        navigate('/members');
      } catch (err) {
        toast.error(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleMemberUpdated = (updated) => {
    setMember(updated);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-32 bg-slate-800 rounded animate-pulse"></div>
        <div className="glass-card p-8 rounded-3xl h-64 bg-slate-900/50 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl h-48 bg-slate-900/50 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-card p-8 rounded-3xl border border-rose-800/40 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-light mx-auto" />
          <h2 className="text-xl font-bold text-white">Member Not Found</h2>
          <p className="text-xs text-slate-300">The requested member ID '{id}' could not be located in MongoDB.</p>
          <button
            onClick={() => navigate('/members')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  const rawDoc = member.raw_doc || {};
  const measuresDoc = rawDoc.measures || {};

  const measureCardDefs = [
    {
      key: 'diabetic_eye_exam',
      cfg: MEASURES.diabetic_eye_exam,
      icon: Eye,
      status: member.diabetic_eye_exam_status,
      value: member.last_exam_date,
      valueLabel: 'Last Exam Date',
      eligibility: member.has_diabetes ? 'Eligible (Diabetic)' : 'Not Eligible (Non-diabetic)',
      ruleText: 'Compliant if retinal exam occurred in last 24 months (≥ 2024-08-14).',
    },
    {
      key: 'blood_pressure_control',
      cfg: MEASURES.blood_pressure_control,
      icon: HeartPulse,
      status: member.blood_pressure_control_status,
      value: member.last_bp_reading,
      valueLabel: 'Last BP Reading',
      eligibility: member.has_hypertension ? 'Eligible (Hypertensive)' : 'Not Eligible (Non-hypertensive)',
      ruleText: 'Compliant if most recent reading in measurement window is <140/90 mmHg.',
    },
    {
      key: 'diabetes_med_adherence',
      cfg: MEASURES.diabetes_med_adherence,
      icon: Pill,
      status: member.diabetes_med_adherence_status,
      value: member.adherence_pct !== null ? `${member.adherence_pct}%` : null,
      valueLabel: 'Adherence % (PDC)',
      eligibility: member.has_diabetes ? 'Eligible (Diabetic on Meds)' : 'Not Eligible',
      ruleText: 'Compliant if Proportion of Days Covered (PDC) is ≥ 80%.',
    },
    {
      key: 'flu_vaccination',
      cfg: MEASURES.flu_vaccination,
      icon: Syringe,
      status: member.flu_vaccination_status,
      value: member.last_flu_shot_date,
      valueLabel: 'Last Flu Shot Date',
      eligibility: 'All Medicare Members',
      ruleText: 'Compliant if flu shot administered between July 1 prior year & MY end (2024-07-01 → 2026-08-14).',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Nav & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Members</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-navy-950 transition-all shadow-md"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Member</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-light hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-all"
            title="Delete Member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Member Header Card */}
      <div className="glass-card rounded-3xl p-6 lg:p-8 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-navy-800 to-slate-800 border border-slate-700 flex items-center justify-center text-teal-light font-black text-xl shadow-lg shrink-0">
              {member.member_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{member.member_name}</h1>
                <StatusBadge status={member.overallStatus} size="md" />
                {member.priorityScore === 3 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    Priority 3 (High)
                  </span>
                ) : member.priorityScore === 2 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Priority 2 (Medium)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
                    Priority 1 (Low)
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">ID: {member.member_id}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {member.age ? `${member.age} yrs` : 'Age N/A'} · {member.gender === 'F' ? 'Female' : 'Male'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {member.city}, {member.state}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-teal-light" />
                  {member.insurance_company} (Medicare Advantage)
                </span>
              </div>
            </div>
          </div>

          {/* Condition Chips */}
          <div className="flex flex-col sm:items-end gap-2 bg-navy-950/60 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Diagnosed Conditions</span>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                member.has_diabetes
                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}>
                {member.has_diabetes ? '● Type 2 Diabetes' : 'No Diabetes'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                member.has_hypertension
                  ? 'bg-amber/15 text-amber-light border-amber/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}>
                {member.has_hypertension ? '● Hypertension' : 'No Hypertension'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Clinical Measure Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">HEDIS Quality Measures Breakdown</h2>
          <span className="text-xs text-slate-400">NCQA Technical Specifications</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {measureCardDefs.map((m) => {
            const Icon = m.icon;
            const isGap = m.status === 'gap';
            const isCompliant = m.status === 'compliant';

            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  isGap
                    ? 'border-rose-800/50 bg-rose-950/10'
                    : isCompliant
                    ? 'border-teal/30 bg-teal-950/10'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div>
                  {/* Measure Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isGap
                          ? 'bg-rose-950/40 text-rose-light border-rose-800/40'
                          : isCompliant
                          ? 'bg-teal-950/40 text-teal-light border-teal/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{m.cfg.name}</h3>
                        <span className="text-[11px] font-mono text-slate-400">{m.cfg.code}</span>
                      </div>
                    </div>
                    <StatusBadge status={m.status} size="md" />
                  </div>

                  {/* Recorded Value */}
                  <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800/80 mb-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{m.valueLabel}:</span>
                      <strong className="text-white font-mono">{m.value || 'None recorded'}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Denominator:</span>
                      <span>{m.eligibility}</span>
                    </div>
                  </div>

                  {/* Criteria Note */}
                  <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{m.ruleText}</span>
                  </p>
                </div>

                {/* Quick Edit Prompt */}
                {isGap && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-light border border-rose-800/60 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Record Clinical Care to Close Gap</span>
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 5. Clinical Proof & Hospital Documents Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-teal-light" />
            <h2 className="text-base font-bold text-white tracking-tight">Clinical Proof & Hospital Documents</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-teal/15 text-teal-light border border-teal/30">
              {(member.proof_documents || rawDoc.proof_documents || []).length} Verified
            </span>
          </div>
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Proof</span>
          </button>
        </div>

        {(member.proof_documents || rawDoc.proof_documents || []).length === 0 ? (
          <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-300">No hospital proof documents attached yet</p>
            <p className="text-[11px] text-slate-500">
              Upload signed physician notes, lab results, retinal scan PDFs, or vaccine cards to verify closed gaps.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(member.proof_documents || rawDoc.proof_documents || []).map((doc) => (
              <div
                key={doc.id}
                className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-teal/40 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-2 rounded-xl bg-teal/15 text-teal-light border border-teal/30 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate" title={doc.original_filename || doc.filename}>
                        {doc.original_filename || doc.filename}
                      </h4>
                      <span className="text-[10px] text-teal-light uppercase tracking-wider font-semibold block">
                        {doc.measure_key?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`${API_BASE_URL}${doc.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-light hover:bg-slate-800 transition-colors shrink-0"
                    title="Open Document"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {doc.notes && (
                  <p className="text-[11px] text-slate-300 italic bg-navy-950/60 p-2 rounded-lg border border-slate-850">
                    "{doc.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Size: {Math.round((doc.size_bytes || 0) / 1024)} KB</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        member={member}
        onMemberUpdated={handleMemberUpdated}
      />
    </div>
  );
}
