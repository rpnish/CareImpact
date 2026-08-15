import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, HeartPulse, Eye, Pill, Syringe, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function EditMemberModal({ isOpen, onClose, member, onMemberUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    city: '',
    state: '',
    has_diabetes: false,
    has_hypertension: false,
    last_exam_date: '',
    last_bp_reading: '',
    adherence_pct: '',
    last_flu_shot_date: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.member_name || '',
        age: member.age ?? '',
        gender: member.gender || 'M',
        city: member.city || '',
        state: member.state || 'Massachusetts',
        has_diabetes: Boolean(member.has_diabetes),
        has_hypertension: Boolean(member.has_hypertension),
        last_exam_date: member.last_exam_date || '',
        last_bp_reading: member.last_bp_reading || '',
        adherence_pct: member.adherence_pct ?? '',
        last_flu_shot_date: member.last_flu_shot_date || '',
      });
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        city: formData.city.trim(),
        state: formData.state.trim(),
        has_diabetes: formData.has_diabetes,
        has_hypertension: formData.has_hypertension,
        last_exam_date: formData.has_diabetes && formData.last_exam_date ? formData.last_exam_date : null,
        last_bp_reading: formData.has_hypertension && formData.last_bp_reading ? formData.last_bp_reading : null,
        adherence_pct: formData.has_diabetes && formData.adherence_pct ? parseFloat(formData.adherence_pct) : null,
        last_flu_shot_date: formData.last_flu_shot_date || null,
      };

      const updated = await api.updateMember(member.member_id, payload);
      toast.success(`Updated ${updated.member_name} — HEDIS status re-evaluated live!`);
      onMemberUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
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
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Edit Clinical Member Records</h3>
                <p className="text-xs text-slate-400 font-mono">Member ID: {member.member_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Demographics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Demographics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
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
                  <label className="block text-xs text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
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

            {/* Conditions */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Conditions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.has_diabetes
                    ? 'bg-sky-500/10 border-sky-500/40 text-white'
                    : 'bg-navy-950/60 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.has_diabetes}
                    onChange={(e) => handleChange('has_diabetes', e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold">Type 2 Diabetes</span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.has_hypertension
                    ? 'bg-sky-500/10 border-sky-500/40 text-white'
                    : 'bg-navy-950/60 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.has_hypertension}
                    onChange={(e) => handleChange('has_hypertension', e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold">Essential Hypertension</span>
                </label>
              </div>
            </div>

            {/* Clinical measure fields */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Measure Entries</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Eye Exam */}
                <div className={!formData.has_diabetes ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-light" />
                    Last Eye Exam Date
                  </label>
                  <input
                    type="date"
                    value={formData.last_exam_date}
                    onChange={(e) => handleChange('last_exam_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>

                {/* Blood Pressure */}
                <div className={!formData.has_hypertension ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-light" />
                    Last BP Reading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 118/76"
                    value={formData.last_bp_reading}
                    onChange={(e) => handleChange('last_bp_reading', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>

                {/* Med Adherence */}
                <div className={!formData.has_diabetes ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-sky-400" />
                    Med Adherence % (PDC)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 95.0"
                    value={formData.adherence_pct}
                    onChange={(e) => handleChange('adherence_pct', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>

                {/* Flu Shot */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-amber-light" />
                    Last Flu Shot Date
                  </label>
                  <input
                    type="date"
                    value={formData.last_flu_shot_date}
                    onChange={(e) => handleChange('last_flu_shot_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal/50"
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal hover:bg-teal-light text-navy-950 transition-all shadow-glow-teal disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Re-Evaluate'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
