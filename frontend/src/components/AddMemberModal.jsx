import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Sparkles, CheckCircle2, AlertOctagon, HeartPulse, Hospital, FileText, Check, Upload, Trash2, FileCheck } from 'lucide-react';
import { useMemberStore } from '../context/MemberStoreContext';
import { useToast } from './Toast';
import { PLAN_DISEASE_AFFILIATIONS, CLINICAL_MEASURE_CATALOG } from '../utils/metricsEngine';

const COMPANIES = [
  'Medicare',
  'Humana',
  'Dual Eligible',
  'Blue Cross Blue Shield',
  'UnitedHealthcare',
  'Cigna Health',
  'Medicaid',
  'Aetna',
  'Anthem',
];

export default function AddMemberModal({ isOpen, onClose, onMemberAdded }) {
  const toast = useToast();
  const { addNewMember } = useMemberStore();
  const fileInputRef = useRef(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState(65);
  const [gender, setGender] = useState('F');
  const [birthdate, setBirthdate] = useState('');
  const [zip, setZip] = useState('02108');
  const [company, setCompany] = useState('Medicare');
  const [planName, setPlanName] = useState('');
  const [planOwnership, setPlanOwnership] = useState('GOVERNMENT');

  // Measures Initial State
  const [measuresState, setMeasuresState] = useState({
    CBP: 'MET',
    HBD_C7: 'MET',
    FVA: 'GAP',
  });

  // Attached Proof Document
  const [attachProof, setAttachProof] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [docName, setDocName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState('');

  // Update measures when company changes
  const handleCompanyChange = (comp) => {
    setCompany(comp);
    const affiliation = PLAN_DISEASE_AFFILIATIONS[comp] || { diseases: [] };
    const defaultMeasures = {};

    affiliation.diseases.forEach((d, idx) => {
      defaultMeasures[d.code] = idx === 0 ? 'MET' : 'GAP';
    });

    setMeasuresState(defaultMeasures);
    setPlanName(`${comp} Quality Advantage`);
    setPlanOwnership(comp === 'Medicare' || comp === 'Medicaid' || comp === 'Dual Eligible' ? 'GOVERNMENT' : 'PRIVATE');
  };

  const assignedDiseases = PLAN_DISEASE_AFFILIATIONS[company]?.diseases || [];

  const handleMeasureChange = (code, value) => {
    setMeasuresState((prev) => ({ ...prev, [code]: value }));
  };

  // Real File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadedFileName(file.name);
    const sizeInKb = (file.size / 1024).toFixed(1);
    setUploadedFileSize(file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`);

    if (!docName) {
      setDocName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFileDataUrl(event.target.result);
    };
    reader.readAsDataURL(file);

    toast.info(`Selected document: ${file.name}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter patient first and last name.');
      return;
    }

    try {
      const proofDocs = [];
      if (attachProof && (uploadedFileName || docName || hospitalName)) {
        proofDocs.push({
          id: `DOC-${Date.now()}`,
          documentName: docName || uploadedFileName || 'Intake_Verification_Document.pdf',
          hospitalName: hospitalName || 'Hospital / Health Center',
          documentType: 'Clinical Intake Summary',
          doctorName: 'Attending Physician',
          notes: 'New member enrollment verified with electronic hospital proof.',
          fileName: uploadedFileName || docName || 'intake_record.pdf',
          fileSize: uploadedFileSize || '1.0 MB',
          fileDataUrl: uploadedFileDataUrl || null,
          uploadedAt: new Date().toISOString(),
        });
      }

      const newMember = addNewMember({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age),
        gender,
        birthdate: birthdate || '1961-05-14',
        zip: zip.trim() || '02108',
        company,
        planName: planName || `${company} Standard Plan`,
        planOwnership,
        measures: measuresState,
        proofDocuments: proofDocs,
      });

      toast.success(`Successfully enrolled ${newMember.fullName} into ${company}!`);

      if (onMemberAdded) {
        onMemberAdded(newMember);
      }
      onClose();
    } catch (err) {
      console.error('Failed to add member:', err);
      toast.error('Failed to add new member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Enroll New Member & Assign Plan Criteria</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Add a patient to the live roster with automatic NCQA HEDIS criteria evaluation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Patient Demographics */}
          <div>
            <span className="text-[11px] uppercase font-bold text-blue-700 block mb-2">
              1. Patient Demographics
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vance"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                >
                  <option value="F">Female (F)</option>
                  <option value="M">Male (M)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Massachusetts ZIP
                </label>
                <input
                  type="text"
                  placeholder="e.g. 02108"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Insurance & Plan Assignment */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[11px] uppercase font-bold text-blue-700 block mb-2">
              2. Insurance Company & Plan Benefit Package
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Insurance Company
                </label>
                <select
                  value={company}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                >
                  {COMPANIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medicare Quality Advantage"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Plan-Specific Clinical Measures */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[11px] uppercase font-bold text-blue-700 block mb-2">
              3. Assigned Disease Criteria for {company} ({assignedDiseases.length} Measures)
            </span>

            <div className="space-y-2.5">
              {assignedDiseases.map((d) => {
                const currentVal = measuresState[d.code] || 'GAP';

                return (
                  <div
                    key={d.code}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 px-2 py-0.2 rounded bg-white border border-slate-200 text-[10px] shadow-2xs">
                          {d.code}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{d.diseaseName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({d.cmsWeight}x Weight)</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{d.measureName}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <button
                        type="button"
                        onClick={() => handleMeasureChange(d.code, 'MET')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          currentVal === 'MET'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        MET
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMeasureChange(d.code, 'GAP')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          currentVal === 'GAP'
                            ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        GAP
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hospital Document Proof */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-blue-700">
                4. Initial Hospital Document Proof (Optional)
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachProof}
                  onChange={(e) => setAttachProof(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-600 text-[11px]">Upload Document Proof</span>
              </label>
            </div>

            {attachProof && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* File picker */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-blue-50/20"
                >
                  {uploadedFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-xs">{uploadedFileName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({uploadedFileSize})</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setUploadedFileName('');
                          setUploadedFileSize('');
                          setUploadedFileDataUrl('');
                        }}
                        className="p-1 rounded bg-slate-200 text-slate-600 hover:text-rose-700 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-slate-900 font-bold text-xs">Click to browse & upload medical proof file</div>
                      <div className="text-slate-500 text-[10px] font-mono">PDF, PNG, JPG, DOCX, TXT</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Issuing Hospital Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mass General Brigham"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Intake_Clinical_Verification.pdf"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:text-slate-900 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Enroll & Save Member</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
