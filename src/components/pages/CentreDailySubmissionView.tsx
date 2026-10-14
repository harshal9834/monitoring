import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Users,
  Box,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileImage,
  Image,
  Camera,
  Video,
  Play,
  Sparkles,
  ShieldCheck,
  X,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

interface CentreDailySubmissionViewProps {
  onNavigate: (tab: any) => void;
}

export const CentreDailySubmissionView: React.FC<CentreDailySubmissionViewProps> = ({ onNavigate }) => {
  const currentUser = appState.currentUser;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [centreData, setCentreData] = useState<any>(null);

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [submissionDate] = useState(todayStr);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [sessionStart, setSessionStart] = useState('09:00 AM');
  const [sessionEnd, setSessionEnd] = useState('01:00 PM');

  // Trainees Attendance
  const [totalRegistered, setTotalRegistered] = useState(40);
  const [totalPresent, setTotalPresent] = useState(40);

  // Infrastructure items: { [assetKey]: quantity }
  const [infraReported, setInfraReported] = useState<Record<string, number>>({
    computers: 20,
    machines: 3,
    workbenches: 5,
    chairs: 40,
  });

  // Optional Video Upload
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);

  // Optional Image Upload
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);

  // Modal & Success States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OPTION C: Demo CCTV States
  const [showCctvModal, setShowCctvModal] = useState(false);
  const [isStartingCctv, setIsStartingCctv] = useState(false);
  const [cctvData, setCctvData] = useState<any | null>(null);
  const [cctvError, setCctvError] = useState<string | null>(null);
  const [cctvActiveSeconds, setCctvActiveSeconds] = useState<number>(0);

  // Load centre batches and approved assets dynamically from MySQL
  useEffect(() => {
    let isMounted = true;
    api.getCentreSummary()
      .then((data) => {
        if (!isMounted) return;
        setCentreData(data);
        if (data.batches && data.batches.length > 0) {
          const firstBatch = data.batches[0];
          setSelectedBatchId(firstBatch.id);
          setBatchCode(firstBatch.batchCode);
          setCourseName(firstBatch.courseName);
          setTrainerName(firstBatch.trainerName || currentUser.name);
          setTotalRegistered(firstBatch.sanctionedStrength || 40);
          setTotalPresent(firstBatch.sanctionedStrength || 40);
        } else {
          setBatchCode('AI-102');
          setCourseName('Industrial Automation & Embedded Systems');
          setTrainerName(currentUser.name || 'Master Trainer');
        }

        // Initialize infrastructure defaults from approved assets
        if (data.infrastructureAssets && data.infrastructureAssets.length > 0) {
          const initInfra: Record<string, number> = {};
          data.infrastructureAssets.forEach((a: any) => {
            initInfra[a.id] = a.approvedQuantity;
          });
          setInfraReported(initInfra);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load centre data:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Handle batch selection change
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    if (!centreData?.batches) return;
    const b = centreData.batches.find((item: any) => item.id === batchId);
    if (b) {
      setBatchCode(b.batchCode);
      setCourseName(b.courseName);
      setTrainerName(b.trainerName || currentUser.name);
      setTotalRegistered(b.sanctionedStrength || 40);
      setTotalPresent(b.sanctionedStrength || 40);
    }
  };

  // Trainees calculations
  const totalAbsent = Math.max(0, totalRegistered - totalPresent);
  const isPresentInvalid = totalPresent > totalRegistered || totalPresent < 0;

  // Handle Video file selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!validTypes.includes(file.type) && !['mp4', 'avi', 'mov', 'webm'].includes(ext || '')) {
        alert('Please select a valid video format: MP4, AVI, MOV, or WebM.');
        return;
      }
      setSelectedVideoFile(file);
    }
  };

  const handleRemoveVideo = () => {
    setSelectedVideoFile(null);
  };

  // Handle Image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        alert('Please select a valid image format: JPG, JPEG, PNG, or WEBP.');
        return;
      }
      setSelectedImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
  };

  // Start Demo CCTV Monitoring
  const handleStartDemoCCTV = async () => {
    setIsStartingCctv(true);
    setCctvError(null);
    setShowCctvModal(true);
    setCctvActiveSeconds(0);

    try {
      const res = await api.startDemoCCTV();
      setCctvData(res);
      // Dispatch refresh event so Government Alerts and Header/Sidebar badges update dynamically
      window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
    } catch (err: any) {
      console.error('Failed to start Demo CCTV:', err);
      setCctvError(err.message || 'Failed to connect to simulated CCTV feed.');
    } finally {
      setIsStartingCctv(false);
    }
  };

  // Live timer for CCTV monitoring
  useEffect(() => {
    let timer: any = null;
    if (showCctvModal) {
      timer = setInterval(() => {
        setCctvActiveSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCctvActiveSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showCctvModal]);

  // Validate before showing confirmation modal
  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalPresent > totalRegistered) {
      setErrorMessage('Trainees Present cannot exceed Total Registered Trainees.');
      return;
    }
    if (totalPresent < 0 || totalRegistered <= 0) {
      setErrorMessage('Please provide valid trainee counts.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Final Submission Execution
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('batchId', selectedBatchId || batchCode);
      formData.append('batch_code', batchCode);
      formData.append('course_name', courseName);
      formData.append('submissionDate', submissionDate);
      formData.append('date', submissionDate);
      formData.append('registeredTrainees', String(totalRegistered));
      formData.append('total_registered', String(totalRegistered));
      formData.append('reportedAttendance', String(totalPresent));
      formData.append('total_present', String(totalPresent));
      formData.append('infrastructureStatus', 'SUFFICIENT');
      formData.append('instructorName', trainerName);
      formData.append('infrastructure_reported', JSON.stringify(infraReported));

      if (selectedVideoFile) {
        setVideoUploadProgress(0);
        formData.append('video', selectedVideoFile);
      }

      if (selectedImageFile) {
        setImageUploadProgress(0);
        formData.append('image', selectedImageFile);
      }

      const res = await api.createSubmission(formData, (percentage) => {
        if (selectedVideoFile) setVideoUploadProgress(percentage);
        if (selectedImageFile) setImageUploadProgress(percentage);
      });

      if (selectedVideoFile) setVideoUploadProgress(100);
      if (selectedImageFile) setImageUploadProgress(100);

      const sub = res.submission || res;
      setShowConfirmModal(false);
      setSubmissionSuccess({
        submissionId: sub.submissionId || sub.id,
        status: sub.status || 'Submitted',
        videoStatus: selectedVideoFile ? 'Uploaded' : 'Not Uploaded',
        imageStatus: selectedImageFile ? 'Uploaded' : 'Not Uploaded',
        mediaAttached: [
          selectedVideoFile ? 'Video (MP4/WebM)' : null,
          selectedImageFile ? 'Image (JPG/PNG)' : null,
        ].filter(Boolean).join(' + ') || 'None (Form Only)',
        aiProcessing: (selectedVideoFile || selectedImageFile) ? 'Pending' : 'N/A',
        submittedAt: sub.submittedAt || new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setSubmitting(false);
      setVideoUploadProgress(null);
      setImageUploadProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading Training Centre submission form...</p>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Daily Data Successfully Submitted!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your official attendance and infrastructure record has been transmitted to the Government Monitoring Portal.
            </p>
          </div>

          {/* Submission Receipt Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left divide-y divide-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2">
              <span className="text-slate-500">Submission ID:</span>
              <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                {submissionSuccess.submissionId}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Centre ID:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {submissionSuccess.centreId || centreData?.centreCode || 'TC-ALLOCATED'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Submission Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {submissionSuccess.status}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Video Evidence:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded ${
                  submissionSuccess.videoStatus === 'Uploaded'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {submissionSuccess.videoStatus}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Image Evidence:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded ${
                  submissionSuccess.imageStatus === 'Uploaded'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {submissionSuccess.imageStatus}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">AI Vision Processing:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded ${
                  submissionSuccess.aiProcessing === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {submissionSuccess.aiProcessing}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Timestamp:</span>
              <span className="text-slate-700">{submissionSuccess.submittedAt}</span>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('centre_submissions')}
              className="flex-1 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>View My Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 px-5 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT SUBMISSION FORM VIEW
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Daily Centre Compliance Report</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit Today's Data</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter registered trainee attendance, active facility equipment, and optional monitoring video.
          </p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors self-start md:self-auto"
        >
          Cancel & Return
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleInitiateSubmit} className="space-y-6">
        {/* SECTION 1: Centre & Session Identification (Auto-filled) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>1. Centre & Batch Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Training Centre Name</label>
              <input
                type="text"
                value={centreData?.centreName || 'Apex Vocational Training Institute'}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Centre ID / Code</label>
              <input
                type="text"
                value={centreData?.centreCode || 'MH-PUN-TC-0842'}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Submission Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={submissionDate}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono font-medium cursor-not-allowed"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Code</label>
              {centreData?.batches && centreData.batches.length > 0 ? (
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {centreData.batches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode} - {b.courseName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="e.g. AI-102"
                  required
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course / Program</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Course Title"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Trainer Name</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Instructor Name"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Trainee Attendance (Auto-calculated Absent) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>2. Trainee Attendance Record</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Total Registered Trainees</label>
              <input
                type="number"
                min="1"
                max="200"
                value={totalRegistered}
                onChange={(e) => setTotalRegistered(parseInt(e.target.value) || 0)}
                className="w-full text-lg font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
              <p className="text-xs text-slate-500 font-medium">Official batch roster strength</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Trainees Present Today</label>
              <input
                type="number"
                min="0"
                max={totalRegistered}
                value={totalPresent}
                onChange={(e) => setTotalPresent(parseInt(e.target.value) || 0)}
                className={`w-full text-lg font-extrabold bg-white border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                  isPresentInvalid ? 'border-rose-300 text-rose-600' : 'border-slate-300 text-slate-900'
                }`}
                required
              />
              <p className="text-xs text-slate-500 font-medium">Physical trainees verified in class</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Trainees Absent (Auto-Calculated)</label>
              <div className="w-full text-lg font-extrabold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span>{totalAbsent}</span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {totalRegistered > 0 ? `${Math.round(((totalRegistered - totalPresent) / totalRegistered) * 100)}% absent` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Automatically calculated: Registered - Present</p>
            </div>
          </div>

          {isPresentInvalid && (
            <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Present count cannot exceed Total Registered Trainees ({totalRegistered}).</span>
            </div>
          )}
        </div>

        {/* SECTION 3: Dynamic Infrastructure Reporting */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Box className="w-4 h-4 text-indigo-600" />
              <span>3. Facility & Infrastructure Verification</span>
            </div>
            <span className="text-xs text-slate-500">Live operational count</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {centreData?.infrastructureAssets && centreData.infrastructureAssets.length > 0 ? (
              centreData.infrastructureAssets.map((asset: any) => (
                <div key={asset.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 capitalize">{asset.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Approved: {asset.approvedQuantity}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={infraReported[asset.id] ?? asset.approvedQuantity}
                    onChange={(e) =>
                      setInfraReported((prev) => ({
                        ...prev,
                        [asset.id]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              ))
            ) : (
              <>
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Computers</span>
                    <span className="text-[10px] font-mono text-slate-500">Approved: 20</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={infraReported.computers ?? 20}
                    onChange={(e) =>
                      setInfraReported((prev) => ({ ...prev, computers: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Machines</span>
                    <span className="text-[10px] font-mono text-slate-500">Approved: 3</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={infraReported.machines ?? 3}
                    onChange={(e) =>
                      setInfraReported((prev) => ({ ...prev, machines: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Workbenches</span>
                    <span className="text-[10px] font-mono text-slate-500">Approved: 5</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={infraReported.workbenches ?? 5}
                    onChange={(e) =>
                      setInfraReported((prev) => ({ ...prev, workbenches: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Chairs</span>
                    <span className="text-[10px] font-mono text-slate-500">Approved: 40</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={infraReported.chairs ?? 40}
                    onChange={(e) =>
                      setInfraReported((prev) => ({ ...prev, chairs: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 4: Optional Attendance / Centre Media (Option A Video + Option B Image) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>4. Optional Attendance / Centre Media</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              OPTIONAL
            </span>
          </div>

          {/* Statutory Prompt Banner */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Video or image upload is optional.</p>
              <p className="text-indigo-700 mt-0.5">
                If provided, the Government Monitoring Portal will process the submitted media using the AI vision model to cross-verify trainee attendance and infrastructure.
              </p>
            </div>
          </div>

          {/* THREE SEPARATE OPTIONS: Option A Video | Option B Image | Option C CCTV Camera */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* OPTION A: UPLOAD VIDEO */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <FileVideo className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Attendance / Centre Video</h4>
                      <p className="text-[10px] text-slate-500">MP4, AVI, MOV, WebM</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">OPTION A</span>
                </div>

                <p className="text-[11px] text-slate-600">
                  Upload a recorded classroom or centre video for AI attendance and infrastructure analysis.
                </p>
              </div>

              {!selectedVideoFile ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-9 h-9 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors mb-2">
                    <FileVideo className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click or Drag & Drop
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    MP4, AVI, MOV, WebM (Stored locally)
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/avi,video/quicktime,video/webm,.mp4,.avi,.mov,.webm"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-3 border border-indigo-200 bg-indigo-50/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0">
                        <FileVideo className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedVideoFile.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="Remove video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {videoUploadProgress !== null && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Uploading...</span>
                        <span>{videoUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OPTION B: UPLOAD IMAGE */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Attendance / Centre Image</h4>
                      <p className="text-[10px] text-slate-500">JPG, JPEG, PNG, WEBP</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">OPTION B</span>
                </div>

                <p className="text-[11px] text-slate-600">
                  Upload a classroom or centre image for AI-based person counting and infrastructure detection.
                </p>
              </div>

              {!selectedImageFile ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-9 h-9 bg-slate-100 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors mb-2">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click or Drag & Drop
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    JPG, PNG, WEBP (Stored locally)
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-3 border border-emerald-200 bg-emerald-50/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                        <FileImage className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedImageFile.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {(selectedImageFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {imageUploadProgress !== null && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Uploading...</span>
                        <span>{imageUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${imageUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OPTION C: CCTV CAMERA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">CCTV Camera</h4>
                      <p className="text-[10px] text-purple-700 font-semibold">Simulated Live Feed</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    OPTION C
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  Run a simulated CCTV feed for continuous AI-based attendance and infrastructure monitoring.
                </p>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Camera Feed:</span>
                    <span className="font-semibold text-slate-800">Classroom CCTV 01</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Stream Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Demo / Simulated Feed
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleStartDemoCCTV}
                  disabled={isStartingCctv}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isStartingCctv ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting Feed...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Demo CCTV</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Demo CCTV • No physical camera required
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPresentInvalid || submitting}
            className={`px-8 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
              isPresentInvalid || submitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transmitting Data...</span>
              </>
            ) : (
              <>
                <span>Review & Submit to Government</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Confirm Daily Submission</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Please verify that the attendance and infrastructure records below are accurate before final transmission:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Centre:</span>
                  <span className="font-semibold text-slate-800">{centreData?.centreName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Session:</span>
                  <span className="font-semibold text-slate-800">
                    {submissionDate} ({sessionStart} - {sessionEnd})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch / Course:</span>
                  <span className="font-semibold text-slate-800">
                    {batchCode} - {courseName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendance:</span>
                  <span className="font-bold text-slate-900">
                    {totalPresent} Present / {totalRegistered} Registered ({totalAbsent} Absent)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Video Attached:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedVideoFile ? selectedVideoFile.name : 'None (Optional)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Image Attached:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedImageFile ? selectedImageFile.name : 'None (Optional)'}
                  </span>
                </div>
              </div>
            </div>

            {(videoUploadProgress !== null || imageUploadProgress !== null) && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Uploading media evidence...</span>
                  <span>{Math.max(videoUploadProgress || 0, imageUploadProgress || 0)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.max(videoUploadProgress || 0, imageUploadProgress || 0)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm & Transmit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPTION C: CCTV MONITORING MODAL */}
      {showCctvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {cctvData?.cameraName || 'Classroom CCTV 01 • Live Feed'}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse tracking-wide shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      LIVE • DEMO CCTV
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous AI vision pipeline monitoring attendance & infrastructure
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCctvModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Close CCTV Feed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {cctvError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{cctvError}</span>
              </div>
            )}

            {/* Live Video Feed Screen */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 shadow-inner flex items-center justify-center">
              {cctvData?.videoUrl ? (
                <video
                  src={cctvData.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  <span className="text-xs font-mono">Connecting to simulated camera stream...</span>
                </div>
              )}

              {/* Feed Overlays */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  REC 1080p • 30 FPS
                </span>
                <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/90">
                  {new Date().toISOString().split('T')[0]} {String(Math.floor(cctvActiveSeconds / 60)).padStart(2, '0')}:{String(cctvActiveSeconds % 60).padStart(2, '0')}
                </span>
              </div>

              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 backdrop-blur-xs text-[10px] font-bold text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                  AI Monitoring Pipeline Active
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-slate-300">
                  Centre: {centreData?.centreName || 'Skill Training Centre'}
                </span>
                <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-purple-300">
                  Stream ID: CAM-01-SIM
                </span>
              </div>
            </div>

            {/* Live Detected Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Persons Detected
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900">
                    {cctvData?.personCount ?? 18}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Trainees</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  AI Confidence: 95.8%
                </span>
              </div>

              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">
                    Benches
                  </span>
                  <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">
                    -3 Units
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-rose-600">
                    {cctvData?.infrastructure?.benches?.current ?? 17}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">/ 20 Approved</span>
                </div>
                <span className="text-[10px] text-rose-600 font-bold block truncate">
                  Count Reduction Detected
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Computers
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">
                    OK
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">
                    {cctvData?.infrastructure?.computers?.current ?? 20}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">/ 20 Approved</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  Sufficient Baseline
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Chairs
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">
                    OK
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">
                    {cctvData?.infrastructure?.chairs?.current ?? 40}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">/ 40 Approved</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  Sufficient Baseline
                </span>
              </div>
            </div>

            {/* Generated Alert & Cloudinary Evidence Notice */}
            {cctvData?.alert && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-900">
                        {cctvData.alert.title}
                      </h4>
                      <span className="text-[10px] font-bold font-mono bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">
                        DISCREPANCY SAVED
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Approved benches: <strong>{cctvData.alert.approvedCount}</strong> &bull; Initial detected count: <strong>{cctvData.alert.previousCount}</strong> &bull; Current detected: <strong>{cctvData.alert.currentCount}</strong> (Difference: <strong>{cctvData.alert.reduction}</strong>). Discrepancy confirmed across temporal monitoring frames.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-amber-900">
                      Evidence Clip ({cctvData.alert.evidenceWindow}):
                    </span>
                    <a
                      href={cctvData.alert.evidenceClipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                    >
                      <span>View Cloudinary Clip</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCctvModal(false);
                      onNavigate('issues');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>View in Issues & Alerts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCctvModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Close CCTV Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
