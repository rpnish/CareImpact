import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Sparkles, CheckCircle2, HeartPulse, Eye, Pill, Syringe } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

const INITIAL_FORM_STATE = {
  name: '',
  age: 65,
  gender: 'M',
  city: 'Boston',
  state: 'Massachusetts',
  has_diabetes: false,
  has_hypertension: false,
  last_exam_date: '',
  last_bp_reading: '',
  adherence_pct: '',
  last_flu_shot_date: '',
};

export default function AddMemberModal({ isOpen, onClose, onMemberAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_STATE);
    onClose();
  };

  // Real-time client-side preview of what the backend gap engine will evaluate
  const computePreview = () => {
    const gaps = [];
    const completed = [];

    // Eye Exam
    if (formData.has_diabetes) {
      if (formData.last_exam_date && formData.last_exam_date >= '2024-08-14') {
        completed.push('Eye Exam');
      } else {
        gaps.push('Eye Exam (overdue/missing)');
      }
    }

    // BP
    if (formData.has_hypertension) {
      const match = formData.last_bp_reading?.match(/(\d+)\s*\/\s*(\d+)/);
      if (match && parseInt(match[1]) < 140 && parseInt(match[2]) < 90) {
        completed.push('BP Control');
      } else {
        gaps.push('BP Control (uncontrolled/missing)');
      }
    }

    // Med adherence
    if (formData.has_diabetes && formData.adherence_pct) {
      if (parseFloat(formData.adherence_pct) >= 80) {
        completed.push('Med Adherence');
      } else {
        gaps.push('Med Adherence (<80%)');
      }
    }

    // Flu shot
    if (formData.last_flu_shot_date && formData.last_flu_shot_date >= '2024-07-01') {
      completed.push('Flu Shot');
    } else {
      gaps.push('Flu Vaccine (due/overdue)');
    }

    return {
      gaps,
      completed,
      overallStatus: gaps.length > 0 ? 'pending' : 'completed',
    };
  };

  const preview = computePreview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim()) {
      toast.error('Please provide member name and city');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        city: formData.city.trim(),
        state: formData.state.trim() || 'Massachusetts',
        has_diabetes: formData.has_diabetes,
        has_hypertension: formData.has_hypertension,
        last_exam_date: formData.has_diabetes && formData.last_exam_date ? formData.last_exam_date : null,
        last_bp_reading: formData.has_hypertension && formData.last_bp_reading ? formData.last_bp_reading : null,
        adherence_pct: formData.has_diabetes && formData.adherence_pct ? parseFloat(formData.adherence_pct) : null,
        last_flu_shot_date: formData.last_flu_shot_date || null,
      };

      const newMember = await api.createMember(payload);

      // Section 7 Requirement: immediate confirmation toast with detected gaps
      const openGaps = [];
      const m = newMember.raw_doc?.measures || {};
      if (m.diabetic_eye_exam?.status === 'gap') openGaps.push('Eye Exam');
      if (m.blood_pressure_control?.status === 'gap') openGaps.push('BP Control');
      if (m.diabetes_med_adherence?.status === 'gap') openGaps.push('Med Adherence');
      if (m.flu_vaccination?.status === 'gap') openGaps.push('Flu Shot');

      const gapMsg =
        openGaps.length > 0
          ? `Added — ${openGaps.length} open gap${openGaps.length > 1 ? 's' : ''} found: ${openGaps.join(', ')}`
          : 'Added — All measures compliant (Completed)!';

      toast.success(gapMsg);
      
      // Reset form fields back to blank/initial values
      setFormData(INITIAL_FORM_STATE);

      // Notify parent and broadcast event
      if (onMemberAdded) {
        onMemberAdded(newMember);
      }
      window.dispatchEvent(new CustomEvent('medicare-member-added', { detail: newMember }));

      onClose();
    } catch (err) {
      toast.error(`Failed to add member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-card bg-navy-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-850">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal/15 text-teal-light border border-teal/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Add New Medicare Member</h3>
                <p className="text-xs text-slate-400">Raw clinical inputs are evaluated live by the HEDIS engine</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Demographics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Member Demographics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Boston"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>
              </div>
            </div>

            {/* Condition Flags */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosed Conditions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.has_diabetes
                    ? 'bg-sky-500/10 border-sky-500/40 text-white'
                    : 'bg-navy-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.has_diabetes}
                    onChange={(e) => handleChange('has_diabetes', e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold block">Type 2 Diabetes</span>
                    <span className="text-[10px] text-slate-400">Activates Eye Exam & Med Adherence</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.has_hypertension
                    ? 'bg-sky-500/10 border-sky-500/40 text-white'
                    : 'bg-navy-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.has_hypertension}
                    onChange={(e) => handleChange('has_hypertension', e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold block">Essential Hypertension</span>
                    <span className="text-[10px] text-slate-400">Activates BP Control Measure</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Clinical Measure Inputs */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Measurements & Dates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Eye Exam */}
                <div className={!formData.has_diabetes ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-light" />
                    Last Diabetic Eye Exam Date
                  </label>
                  <input
                    type="date"
                    value={formData.last_exam_date}
                    onChange={(e) => handleChange('last_exam_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if within last 24 months (≥ 2024-08-14)</p>
                </div>

                {/* Blood Pressure */}
                <div className={!formData.has_hypertension ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-light" />
                    Last BP Reading (Sys/Dia)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 120/80"
                    value={formData.last_bp_reading}
                    onChange={(e) => handleChange('last_bp_reading', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if &lt;140/90 mmHg in measurement window</p>
                </div>

                {/* Adherence % */}
                <div className={!formData.has_diabetes ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-sky-400" />
                    Diabetes Med Adherence (PDC %)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 100.0"
                    value={formData.adherence_pct}
                    onChange={(e) => handleChange('adherence_pct', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if PDC ≥ 80%</p>
                </div>

                {/* Flu Shot */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-amber-light" />
                    Last Flu Shot Date (All Members)
                  </label>
                  <input
                    type="date"
                    value={formData.last_flu_shot_date}
                    onChange={(e) => handleChange('last_flu_shot_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if on/after 2024-07-01</p>
                </div>
              </div>
            </div>

            {/* Live Gap Prediction Preview */}
            <div className="p-4 rounded-2xl bg-navy-950/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-light" />
                  Live Engine Prediction:
                </span>
                <span className={`font-bold uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full ${
                  preview.overallStatus === 'completed'
                    ? 'bg-teal/15 text-teal-light border border-teal/30'
                    : 'bg-rose/15 text-rose-light border border-rose/30'
                }`}>
                  {preview.overallStatus === 'completed' ? 'Will land in: Completed Tab' : 'Will land in: Pending Tab'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {preview.gaps.length > 0 ? (
                  <span className="text-rose-light">
                    Open Gaps ({preview.gaps.length}): {preview.gaps.join(', ')}
                  </span>
                ) : (
                  <span className="text-teal-light flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No care gaps detected — member is fully compliant!
                  </span>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal disabled:opacity-50"
              >
                {loading ? 'Evaluating & Saving...' : 'Save & Evaluate Member'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
