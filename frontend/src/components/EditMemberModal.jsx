import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, HeartPulse, Eye, Pill, Syringe, Sparkles, Upload, FileText, CheckCircle2, Trash2, Paperclip, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function EditMemberModal({ isOpen, onClose, member, onMemberUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  // Proof document state
  const [selectedFile, setSelectedFile] = useState(null);
  const [proofMeasure, setProofMeasure] = useState('flu_vaccination');
  const [proofNotes, setProofNotes] = useState('');
  const [proofDocuments, setProofDocuments] = useState([]);

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
      setProofDocuments(member.proof_documents || member.raw_doc?.proof_documents || []);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload (PDF, PNG, JPG)');
      return;
    }

    setUploadingDoc(true);
    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('measure_key', proofMeasure);
      if (proofNotes.trim()) {
        data.append('notes', proofNotes.trim());
      }

      const res = await api.uploadProofDocument(member.member_id, data);
      toast.success(`Proof document '${selectedFile.name}' uploaded successfully!`);
      setSelectedFile(null);
      setProofNotes('');
      setProofDocuments((prev) => [...prev, res.document]);
      if (res.member) {
        onMemberUpdated(res.member);
      }
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteProof = async (docId, fileName) => {
    try {
      await api.deleteProofDocument(member.member_id, docId);
      setProofDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success(`Proof '${fileName}' removed.`);
    } catch (err) {
      toast.error(`Failed to delete proof: ${err.message}`);
    }
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
                <h3 className="text-base font-semibold text-white">Edit Clinical Member & Hospital Proof</h3>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500/50"
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
                    <span className="text-[10px] text-slate-400">Activates Blood Pressure Control</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Clinical Value Inputs */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Measurements & Dates (Live Re-Evaluation)</h4>
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
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if ≥ 2024-08-14 (last 24 months)</p>
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
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if &lt;140/90 mmHg</p>
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
                    placeholder="e.g. 85.0"
                    value={formData.adherence_pct}
                    onChange={(e) => handleChange('adherence_pct', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if PDC ≥ 80%</p>
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
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Compliant if on/after 2024-07-01</p>
                </div>
              </div>
            </div>

            {/* Upload Hospital Proof Documents Section */}
            <div className="space-y-3 pt-3 border-t border-slate-800 bg-navy-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-light flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4" />
                  Attach Hospital Proof Documents
                </h4>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG, or DOC</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Target Care Measure</label>
                  <select
                    value={proofMeasure}
                    onChange={(e) => setProofMeasure(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal/50"
                  >
                    <option value="flu_vaccination">Annual Flu Vaccine</option>
                    <option value="blood_pressure_control">Blood Pressure Control</option>
                    <option value="diabetic_eye_exam">Diabetic Eye Exam</option>
                    <option value="diabetes_med_adherence">Diabetes Med Adherence</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Hospital / Clinic Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Mass General eye clinic report signed by Dr. Smith"
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="file"
                  id="proof-file-input"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={uploadingDoc || !selectedFile}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal/20 text-teal-light hover:bg-teal/30 border border-teal/40 transition-all disabled:opacity-40"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingDoc ? 'Uploading...' : 'Upload Proof'}
                </button>
              </div>

              {/* List of currently attached documents */}
              {proofDocuments.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Attached Documents ({proofDocuments.length}):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {proofDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-navy-900 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-teal-light shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-200 truncate block text-[11px]">
                              {doc.original_filename || doc.filename}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {doc.measure_key} · {Math.round((doc.size_bytes || 0) / 1024)} KB
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`${API_BASE_URL}${doc.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-teal-light"
                            title="View Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteProof(doc.id, doc.original_filename || doc.filename)}
                            className="p-1 text-slate-500 hover:text-rose-light"
                            title="Remove Proof"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-navy-950 transition-all shadow-glow-sky disabled:opacity-50"
              >
                {loading ? 'Saving & Re-Evaluating...' : 'Save & Re-Evaluate Member'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
