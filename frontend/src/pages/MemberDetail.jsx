import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  MapPin,
  Shield,
  Activity,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Upload,
  Paperclip,
  Download,
  Building2,
  Layers,
  HeartPulse,
  Eye,
  Pill,
  Syringe,
  Clock,
  Sparkles,
  Check,
  X,
  FileCheck,
  Hospital,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useMemberStore } from '../context/MemberStoreContext';
import { useToast } from '../components/Toast';
import {
  CLINICAL_MEASURE_CATALOG,
  CMS_MEASURE_CUTPOINTS,
  PLAN_DISEASE_AFFILIATIONS,
} from '../utils/metricsEngine';

const ALL_MEASURE_CODES = ['CBP', 'HBD_C7', 'EED', 'SPD', 'KED', 'BCS', 'FVA', 'AWV', 'MRP'];

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getMemberById, updateMemberStatus, deleteMember, loading: storeLoading } = useMemberStore();

  const fileInputRef = useRef(null);

  const [member, setMember] = useState(null);
  const [selectedMeasureForEdit, setSelectedMeasureForEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit Form State (Clean & empty by default)
  const [editStatus, setEditStatus] = useState('MET');
  const [clinicalValue, setClinicalValue] = useState('');
  const [docName, setDocName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [docType, setDocType] = useState('Hospital Discharge Summary');
  const [doctorName, setDoctorName] = useState('');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');

  // Real Uploaded File State
  const [uploadedFileObj, setUploadedFileObj] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileSize, setAttachedFileSize] = useState('');
  const [attachedFileDataUrl, setAttachedFileDataUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load member record
  const reloadMember = () => {
    const data = getMemberById(id);
    setMember(data);
  };

  useEffect(() => {
    reloadMember();
  }, [id, storeLoading]);

  // Open Edit Modal for a specific measure
  const handleOpenEdit = (code) => {
    const currentResult = member?.measures?.[code] || 'GAP';
    const currentValue = member?.clinicalValues?.[code] || '';

    setSelectedMeasureForEdit(code);
    setEditStatus('MET'); // Default to MET when closing gap
    setClinicalValue(currentValue);

    // Reset document fields so user can enter their own real information
    setDocName('');
    setHospitalName('');
    setDocType('Hospital Discharge Summary');
    setDoctorName('');
    setCoordinatorNotes('');
    setUploadedFileObj(null);
    setAttachedFileName('');
    setAttachedFileSize('');
    setAttachedFileDataUrl('');
  };

  // Real file selection handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileObj(file);
    setAttachedFileName(file.name);

    // Format file size
    const sizeInKb = (file.size / 1024).toFixed(1);
    setAttachedFileSize(file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`);

    if (!docName) {
      setDocName(file.name);
    }

    // Convert to Data URL for in-browser download & preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFileDataUrl(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  // Save Modal Form with real file and document metadata
  const handleSaveUpdate = (e) => {
    e.preventDefault();
    if (!selectedMeasureForEdit) return;

    setIsSaving(true);
    try {
      const docPayload = attachedFileName || hospitalName || docName
        ? {
            id: `doc_${Date.now()}`,
            measureCode: selectedMeasureForEdit,
            fileName: attachedFileName || docName || `${selectedMeasureForEdit}_Proof.pdf`,
            documentName: docName || attachedFileName || 'Hospital Attestation Proof',
            hospitalName: hospitalName || 'Mass General Brigham',
            doctorName: doctorName || 'Attending Physician',
            documentType: docType,
            fileSize: attachedFileSize || '120 KB',
            fileDataUrl: attachedFileDataUrl || '',
            notes: coordinatorNotes,
            uploadedAt: new Date().toISOString(),
            status: 'VERIFIED',
          }
        : null;

      updateMemberStatus(
        member.patientId,
        selectedMeasureForEdit,
        editStatus,
        clinicalValue,
        docPayload
      );

      toast.success(
        `Updated ${selectedMeasureForEdit} to ${editStatus}${docPayload ? ' with document proof attached' : ''}!`
      );
      setSelectedMeasureForEdit(null);
      reloadMember();
    } catch (err) {
      console.error('Failed to update member status:', err);
      toast.error('Failed to save status update.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Member
  const handleConfirmDelete = () => {
    try {
      deleteMember(member.patientId);
      toast.success(`Member '${member.fullName}' deleted successfully.`);
      navigate('/members');
    } catch (err) {
      console.error('Failed to delete member:', err);
      toast.error('Failed to delete member.');
    }
  };

  // Download uploaded proof file
  const handleDownloadDoc = (doc) => {
    if (doc.fileDataUrl) {
      const link = document.createElement('a');
      link.href = doc.fileDataUrl;
      link.download = doc.fileName || doc.documentName || 'Proof_Document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${doc.fileName || 'document'}...`);
    } else {
      const blob = new Blob([
        `HOSPITAL CLINICAL ENCOUNTER PROOF\n=================================\nDocument Name: ${doc.documentName}\nHospital: ${doc.hospitalName}\nAttending Doctor: ${doc.doctorName}\nDocument Type: ${doc.documentType}\nMeasure Code: ${doc.measureCode}\nStatus: ${doc.status}\nVerification Date: ${doc.uploadedAt}\n\nClinical Notes:\n${doc.notes || 'Verified through clinical care coordinator review.'}\n`,
      ], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.fileName || doc.documentName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded proof document record`);
    }
  };

  if (!member && storeLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="bg-white border border-slate-200 rounded-3xl p-8 h-64 animate-pulse" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 space-y-4 shadow-sm">
          <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Member Record Not Found</h2>
          <p className="text-sm text-slate-600">
            The requested member identifier <code className="text-blue-600 font-mono">{id}</code> could not be located or has been deleted.
          </p>
          <button
            onClick={() => navigate('/members')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Members Roster</span>
          </button>
        </div>
      </div>
    );
  }

  // Assigned measures for this member's company/plan
  const planAffiliation = PLAN_DISEASE_AFFILIATIONS[member.company] || {
    company: member.company,
    targetPopulation: 'Enrolled Members',
    diseases: [],
  };

  const assignedMeasureCodes = planAffiliation.diseases.map((d) => d.code);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Navigation Top Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Members Roster</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Patient ID:</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {member.patientId}
            </span>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Member</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Member Profile Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Patient Bio */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-2xl shrink-0 font-mono shadow-2xs">
              {member.firstName?.[0]}
              {member.lastName?.[0]}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {member.fullName}
                </h1>
                {member.gender && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    Gender: {member.gender}
                  </span>
                )}
                {member.hasCareGap ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>OPEN CARE GAP</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>GAP-FREE (COMPLIANT)</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-3 flex-wrap pt-0.5">
                <span>Age: <strong className="text-slate-900">{member.age}</strong></span>
                <span>·</span>
                <span>DOB: <strong className="text-slate-900 font-mono">{member.birthdate || 'N/A'}</strong></span>
                <span>·</span>
                <span>Member ID: <strong className="text-slate-900 font-mono">{member.memberId}</strong></span>
              </p>
            </div>
          </div>

          {/* Plan & Priority Scoring Badge */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Payer & Plan</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{member.company}</div>
              <div className="text-xs text-slate-500 font-mono">{member.planName}</div>
            </div>

            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-right font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Priority Engine Score</span>
              <div className={`text-2xl font-black ${
                member.priority >= 75 ? 'text-rose-600' :
                member.priority >= 50 ? 'text-amber-600' :
                member.priority > 0 ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {member.priority}
              </div>
              <span className="text-[10px] text-slate-500 font-bold">Scale 1-100</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Location:</span>
            <span className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{member.state}, ZIP {member.zip || '02108'}</span>
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Plan Ownership:</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{member.planOwnership || 'PRIVATE'}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Total Evaluated Criteria:</span>
            <span className="font-mono font-bold text-slate-900 mt-0.5 block">{member.applicableCount} Measures</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Care Gap Status:</span>
            <span className={`font-mono font-bold mt-0.5 block ${member.gapCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {member.gapCount} Gaps / {member.metCount} Met
            </span>
          </div>
        </div>
      </div>

      {/* 3. Assigned NCQA HEDIS Clinical Measures & Gap Resolution Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Assigned Plan Measures & Clinical Gap Status</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Click <strong>"Close Gap & Upload Proof"</strong> on open gaps to upload your hospital proof document and update compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ALL_MEASURE_CODES.map((code) => {
            const result = member.measures?.[code] || 'N/A';
            const info = CLINICAL_MEASURE_CATALOG[code];
            const isAssigned = assignedMeasureCodes.includes(code) || result !== 'N/A';
            const isGap = result === 'GAP';
            const isMet = result === 'MET';
            const clinicalVal = member.clinicalValues?.[code];

            return (
              <div
                key={code}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs ${
                  isGap
                    ? 'border-rose-300 ring-1 ring-rose-100 bg-gradient-to-b from-rose-50/20 to-white'
                    : isMet
                    ? 'border-emerald-300 ring-1 ring-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                          {code}
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {info.cmsWeight}x Weight
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                        {info.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {info.domain}
                      </span>
                    </div>

                    {/* Result Badge */}
                    <div className="shrink-0">
                      {isGap && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>GAP</span>
                        </span>
                      )}
                      {isMet && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MET</span>
                        </span>
                      )}
                      {!isAssigned && (
                        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clinical reading value if present */}
                  {clinicalVal && (
                    <div className="mb-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
                      <span className="text-slate-500 text-[10px] block">Recorded Reading:</span>
                      <span className="text-slate-900 font-bold">{clinicalVal}</span>
                    </div>
                  )}

                  {/* Why Gaps Occur */}
                  {isAssigned && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Criteria Evaluation Rule:
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {info.criteriaRule}
                      </p>
                      {isGap && (
                        <div className="pt-1.5 border-t border-slate-200 text-rose-700 text-[11px]">
                          <strong>Gap Root Cause:</strong> {info.whyGapsOccur}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Section: ONLY open gaps can be edited / uploaded */}
                {isAssigned && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    {isGap ? (
                      <button
                        onClick={() => handleOpenEdit(code)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Close Gap & Upload Proof</span>
                      </button>
                    ) : isMet ? (
                      <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Compliant · No Gap Action Needed</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Hospital Proof Documents History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Hospital className="w-5 h-5 text-blue-600" />
              <span>Hospital Document Proof & Clinical Attestations</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified hospital encounter documents, lab panels, and doctor attestations uploaded for this member.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
            {member.proofDocuments?.length || 0} Uploaded Documents
          </span>
        </div>

        {member.proofDocuments && member.proofDocuments.length > 0 ? (
          <div className="space-y-3">
            {member.proofDocuments.map((doc, index) => (
              <div
                key={doc.id || index}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{doc.documentName || doc.fileName}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {doc.measureCode}
                      </span>
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      <strong>Hospital:</strong> {doc.hospitalName || 'Health Center'} · <strong>Doctor:</strong> {doc.doctorName || 'Attending Physician'} · <strong>Type:</strong> {doc.documentType || 'Clinical Record'}
                    </p>
                    {doc.notes && (
                      <p className="text-slate-700 text-[11px] mt-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        "{doc.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                  <div>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}</div>
                  <button
                    onClick={() => handleDownloadDoc(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold mt-1.5 transition-all border border-blue-200 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Proof</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <Paperclip className="w-8 h-8 text-slate-400 mx-auto" />
            <p>No hospital proof documents uploaded yet for this patient.</p>
            <p className="text-[11px] text-slate-400">
              Click "Close Gap & Upload Proof" on any open measure above to upload your document.
            </p>
          </div>
        )}
      </div>

      {/* 5. Update Status & Hospital Proof Document Modal */}
      <AnimatePresence>
        {selectedMeasureForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span>Update Status & Upload Hospital Document Proof</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Updating <strong className="text-slate-900">{selectedMeasureForEdit}: {CLINICAL_MEASURE_CATALOG[selectedMeasureForEdit]?.name}</strong> for {member.fullName}.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMeasureForEdit(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs">
                {/* Status Toggle */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1.5">
                    New Clinical Measure Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditStatus('MET')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        editStatus === 'MET'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>MET (Compliant / Resolved)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('GAP')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        editStatus === 'GAP'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      <span>GAP (Open Care Gap)</span>
                    </button>
                  </div>
                </div>

                {/* Clinical Reading Value */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-600 mb-1">
                    Clinical Reading / Lab Result
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BP: 122/78 mmHg, HbA1c: 6.8%, Retinal Exam Date: 2026-04-12"
                    value={clinicalValue}
                    onChange={(e) => setClinicalValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Real File Upload Section */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <span className="text-[11px] uppercase font-bold text-blue-700 block">
                    Upload Hospital Verification Document (PDF / Image / DOC)
                  </span>

                  {/* Hidden Real File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    className="hidden"
                  />

                  {/* Clickable Upload Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-50 cursor-pointer transition-all hover:bg-blue-50/30 group"
                  >
                    {attachedFileName ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div className="text-left">
                          <div className="text-slate-900 font-bold text-sm">{attachedFileName}</div>
                          <div className="text-slate-500 text-[11px] font-mono">{attachedFileSize} · Ready to upload</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFileObj(null);
                            setAttachedFileName('');
                            setAttachedFileSize('');
                            setAttachedFileDataUrl('');
                          }}
                          className="p-1 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mx-auto transition-colors" />
                        <div className="text-slate-900 font-bold text-xs">
                          Click to browse and upload your document
                        </div>
                        <div className="text-slate-500 text-[10px] font-mono">
                          Supports PDF, PNG, JPG, DOCX, TXT from hospital records
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hospital Details Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Hospital / Health System Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mass General Brigham"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Document Type
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                      >
                        <option>Hospital Discharge Summary</option>
                        <option>Outpatient Lab Panel</option>
                        <option>Specialist Consultation Note</option>
                        <option>Vaccination Registry Extract</option>
                        <option>Pharmacy Dispensing Claim</option>
                        <option>Inpatient Vitals Record</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Attending Doctor / Clinician
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. John Doe, MD"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Document Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BP_Clinical_Proof_2026.pdf"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Care Coordinator Notes / Comments
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Blood pressure reading verified by Dr. Doe during follow-up encounter..."
                      value={coordinatorNotes}
                      onChange={(e) => setCoordinatorNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 resize-none placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedMeasureForEdit(null)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:text-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Update Status</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Member Record?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                Are you sure you want to remove <strong className="text-slate-900">{member.fullName}</strong> ({member.patientId}) from <strong className="text-blue-700">{member.company}</strong>?
                This will recalculate the plan's Star ratings and remove this patient from the active roster.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Member</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
