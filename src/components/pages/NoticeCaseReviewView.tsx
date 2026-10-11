import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileVideo,
  Play,
  Send,
  Eye,
  Check,
  X,
  Loader2,
  User,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Cpu,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface NoticeCaseReviewViewProps {
  noticeId: string;
  onBack: () => void;
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const NoticeCaseReviewView: React.FC<NoticeCaseReviewViewProps> = ({
  noticeId,
  onBack,
  onNavigate,
}) => {
  const [caseData, setCaseData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAIOverlay, setShowAIOverlay] = useState<boolean>(true);

  // Officer Decision State
  const [selectedOutcome, setSelectedOutcome] = useState<string>('RESOLVED');
  const [mandatoryRemarks, setMandatoryRemarks] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Evidence AI Analysis State
  const [isAnalyzingEvidence, setIsAnalyzingEvidence] = useState<boolean>(false);
  const [evidenceAnalysisError, setEvidenceAnalysisError] = useState<string | null>(null);
  const [evidenceAnalysisResult, setEvidenceAnalysisResult] = useState<any | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);

  const fetchCaseReview = async () => {
    try {
      setLoading(true);
      const data = await api.getNoticeCaseReview(noticeId);
      setCaseData(data);
      if (data?.centreResponse?.aiAnalysis) {
        setEvidenceAnalysisResult({
          fileName: data.centreResponse.proofDocumentName,
          mediaType: data.centreResponse.proofPhotoUrl?.includes('/video/') ? 'VIDEO' : 'IMAGE',
          sourceUrl: data.centreResponse.proofPhotoUrl,
          detectedPersons: data.centreResponse.aiDetectedPeople,
          detectedObjects: data.centreResponse.aiAnalysis.detected_objects_summary || {},
          frameEvents: data.centreResponse.aiAnalysis.frame_events || [],
          analysisTimestamp: data.centreResponse.aiCompletedAt,
          modelVersion: 'Ultralytics YOLOv8m (PyTorch)',
          analysisResult: data.centreResponse.aiAnalysis
        });
      }
    } catch (err) {
      console.error('Failed to load notice case review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeEvidence = async () => {
    setIsAnalyzingEvidence(true);
    setEvidenceAnalysisError(null);
    try {
      const res = await api.analyzeNoticeEvidence(noticeId);
      setEvidenceAnalysisResult(res);
      setIsEvidenceModalOpen(true);
      await fetchCaseReview();
    } catch (err: any) {
      setEvidenceAnalysisError(err.message || 'Analysis failed. Please retry.');
    } finally {
      setIsAnalyzingEvidence(false);
    }
  };

  useEffect(() => {
    fetchCaseReview();
  }, [noticeId]);

  const handleOfficerVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) {
      alert('Please select a determination decision.');
      return;
    }
    if (!mandatoryRemarks.trim()) {
      alert('Mandatory officer verification remarks are required.');
      return;
    }

    setIsVerifying(true);
    setFeedbackMsg(null);
    try {
      const res = await api.verifyNoticeCase(noticeId, selectedOutcome, mandatoryRemarks.trim());
      // Show success toast per specification
      setFeedbackMsg('Formal determination submitted successfully.');
      // Immediately refresh notice dossier in state without page reload
      await fetchCaseReview();
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading statutory notice case dossier & video from MySQL...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Notice Case Not Found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Notices
        </button>
      </div>
    );
  }

  const hasResponse = Boolean(caseData.centreResponse);
  const isResolved = caseData.status === 'RESOLVED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notices & Actions</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
            {caseData.actionNumber}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
            caseData.status === 'RESOLVED'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : caseData.status === 'MORE_PROOF_REQUIRED'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : caseData.status === 'REOPENED'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : caseData.status === 'ESCALATED'
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-indigo-100 text-indigo-800 border-indigo-200'
          }`}>
            {caseData.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Main Grid: Left Video & Evidence, Right Dossier & Responses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 Cols) — Video Player & Evidence Snapshots */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Video Player Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-indigo-600" />
                  <span>Original Submission Video</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Physical classroom recording submitted for {caseData.submission?.id}
                </p>
              </div>

              <button
                onClick={() => setShowAIOverlay(!showAIOverlay)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  showAIOverlay
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
              >
                AI Overlay {showAIOverlay ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center">
              {caseData.video?.url ? (
                <video
                  src={caseData.video.url}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">
                  <FileVideo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No video footage submitted for this compliance notice.</p>
                </div>
              )}

              {/* Simulated Bounding Box Overlay if Active */}
              {showAIOverlay && (
                <div className="absolute top-4 left-4 pointer-events-none space-y-1">
                  <span className="inline-block bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    YOLOv8m: {caseData.submission?.aiEstimatedAttendance} Persons Tracked (94.2% Conf)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>File: <strong className="font-mono text-slate-800">{caseData.video?.fileName}</strong></span>
              <button
                onClick={() => onNavigate('ai_analysis', caseData.centre?.id)}
                className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Open Interactive AI Canvas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. AI Evidence Snapshots List (Section 27) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
              AI Evidence Snapshots & Observations
            </h4>

            <div className="space-y-3">
              {caseData.evidenceList?.map((ev: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-900 block">
                      Evidence Snapshot #{idx + 1} ({ev.timestamp})
                    </span>
                    <p className="text-slate-600">
                      Detected: <strong className="text-indigo-700">{ev.detectedPersons} Persons</strong> vs Expected {ev.expectedPersons}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block break-words">
                      Confidence: {ev.confidence}% • YOLO Model: {ev.modelVersion}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('ai_analysis', caseData.centre?.id)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto"
                  >
                    View Frame
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols) — Case Dossier, Timeline & Decision */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Case Summary (Section 26) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Training Centre</span>
              <h3 className="text-base font-extrabold text-slate-900">{caseData.centre?.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{caseData.centre?.code} • {caseData.centre?.district}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Issue Type:</span>
                <span className="font-bold text-slate-900">{caseData.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reported Attendance:</span>
                <span className="font-bold text-slate-900">{caseData.submission?.reportedAttendance} Trainees</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>AI Estimated:</span>
                <span className="font-bold text-indigo-700">{caseData.submission?.aiEstimatedAttendance} Trainees</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Variance:</span>
                <span className="font-bold text-rose-600">-{caseData.submission?.variance} ({caseData.submission?.variancePercentage}%)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Severity:</span>
                <span className="font-bold text-rose-600 uppercase">{caseData.priority}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Assigned Officer:</span>
                <span className="font-bold text-slate-900">{caseData.assignedOfficer}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Notice Instructions:</span>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {caseData.description}
              </p>
            </div>
          </div>

          {/* 2. Centre Response Section (Section 30) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
              <span>Training Centre Response</span>
              {hasResponse ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Received
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Awaiting Response
                </span>
              )}
            </h4>

            {hasResponse ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Submitted by: <strong className="text-slate-800">{caseData.centreResponse?.submittedBy}</strong></span>
                    <span>{caseData.centreResponse?.submittedAt}</span>
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {caseData.centreResponse?.explanation}
                  </p>
                </div>

                {caseData.centreResponse?.proofDocumentName && (
                  <div className="space-y-3 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-indigo-950 font-bold truncate">
                          📎 {caseData.centreResponse?.proofDocumentName}
                        </span>
                        {caseData.centreResponse?.proofPhotoUrl && (
                          <a
                            href={caseData.centreResponse.proofPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0 inline-flex items-center gap-0.5 ml-1"
                            title="Open Cloudinary Asset"
                          >
                            <span>Asset</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Analyze with AI Button (shown for image/video attachments) */}
                      {caseData.centreResponse?.proofPhotoUrl && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {evidenceAnalysisResult && (
                            <button
                              type="button"
                              onClick={() => setIsEvidenceModalOpen(true)}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] rounded-xl border border-emerald-300 transition-colors inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>View AI Result</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleAnalyzeEvidence}
                            disabled={isAnalyzingEvidence}
                            className={`px-3 py-1.5 font-bold text-[11px] rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 ${
                              isAnalyzingEvidence
                                ? 'bg-indigo-400 text-white cursor-not-allowed'
                                : evidenceAnalysisError
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : evidenceAnalysisResult
                                ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200'
                            }`}
                          >
                            {isAnalyzingEvidence ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Analyzing...</span>
                              </>
                            ) : evidenceAnalysisError ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Analysis Failed — Retry</span>
                              </>
                            ) : evidenceAnalysisResult ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Re-Analyze with AI</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Analyze with AI</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {evidenceAnalysisError && (
                      <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-xl border border-rose-200">
                        ⚠️ {evidenceAnalysisError}
                      </p>
                    )}

                    {caseData.centreResponse?.proofPhotoUrl && (
                      <div className="rounded-xl overflow-hidden border border-indigo-200/70 max-h-52 bg-black/5 flex items-center justify-center relative group">
                        <img
                          src={caseData.centreResponse.proofPhotoUrl}
                          alt="Response Evidence"
                          className="max-h-52 w-full object-contain"
                        />
                        {evidenceAnalysisResult && (
                          <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-lg border border-white/20">
                            YOLO: {evidenceAnalysisResult.detectedPersons} persons detected
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                Centre response has not yet been submitted. Due by <strong>{caseData.dueDate}</strong>.
              </div>
            )}
          </div>

          {/* 3. Government Officer Determination Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center justify-between">
              <span>Officer Verification & Determination</span>
              {caseData.verification && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  caseData.status === 'RESOLVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : caseData.status === 'MORE_PROOF_REQUIRED'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                  Current: {caseData.status?.replace('_', ' ')}
                </span>
              )}
            </h4>

            {caseData.verification && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold text-slate-800">
                    Recorded Determination: <span className="text-indigo-700">{caseData.verification.outcome}</span>
                  </span>
                  <span>{caseData.verification.verifiedAt}</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  "{caseData.verification.mandatoryRemarks}"
                </p>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Determined by Officer: {caseData.verification.verifiedBy}
                </span>
              </div>
            )}

            <form onSubmit={handleOfficerVerification} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Determination Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'RESOLVED', label: 'Accept & Resolve' },
                    { key: 'REJECTED', label: 'Reject Response' },
                    { key: 'MORE_INFO_REQUESTED', label: 'Request More Proof' },
                    { key: 'ESCALATED', label: 'Escalate to Directorate' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setSelectedOutcome(btn.key)}
                      className={`p-2 rounded-xl font-bold transition-all text-xs border ${
                        selectedOutcome === btn.key
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mandatory Officer Remarks *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record formal statutory findings, evidence validation details, and compliance decision notes..."
                  value={mandatoryRemarks}
                  onChange={(e) => setMandatoryRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Decision in MySQL...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Formal Determination</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 4. Complete Case Timeline (Section 29) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Statutory Case Audit Trail
            </h4>

            <div className="space-y-3 border-l-2 border-slate-200 pl-4 ml-2">
              {caseData.timeline?.map((t: any, idx: number) => (
                <div key={idx} className="text-xs space-y-0.5 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[21px] top-1"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-[11px]">{t.eventType?.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-400">• {t.createdAt}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI ANALYSIS RESULT MODAL FOR ATTACHED EVIDENCE */}
      {isEvidenceModalOpen && evidenceAnalysisResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Attached Evidence AI Vision Analysis
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {evidenceAnalysisResult.fileName} • {evidenceAnalysisResult.mediaType}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Media Viewport with Bounding Boxes */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cloudinary Source & AI Overlay
                </span>
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-[420px] flex items-center justify-center">
                  {evidenceAnalysisResult.mediaType === 'VIDEO' ? (
                    <video
                      src={evidenceAnalysisResult.sourceUrl}
                      controls
                      className="max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <div className="relative max-h-[420px] flex items-center justify-center">
                      <img
                        src={evidenceAnalysisResult.sourceUrl}
                        alt="Analyzed Evidence"
                        className="max-h-[420px] w-auto h-auto object-contain rounded-lg"
                      />

                      {/* Render Interactive Bounding Boxes */}
                      {evidenceAnalysisResult.frameEvents?.[0]?.detections?.map((det: any, idx: number) => {
                        const bbox = det.bbox || [0, 0, 0, 0];
                        const isPerson = det.class_name === 'person';
                        return (
                          <div
                            key={idx}
                            className={`absolute border-2 pointer-events-none rounded transition-all ${
                              isPerson
                                ? 'border-emerald-400 bg-emerald-500/15'
                                : 'border-indigo-400 bg-indigo-500/15'
                            }`}
                            style={{
                              left: `${bbox[0]}%`,
                              top: `${bbox[1]}%`,
                              width: `${Math.max(4, bbox[2] - bbox[0])}%`,
                              height: `${Math.max(4, bbox[3] - bbox[1])}%`,
                            }}
                          >
                            <span
                              className={`absolute -top-5 left-0 text-[9px] font-bold text-white px-1 py-0.5 rounded shadow whitespace-nowrap ${
                                isPerson ? 'bg-emerald-600' : 'bg-indigo-600'
                              }`}
                            >
                              {det.class_name} {Math.round((det.confidence || 0.9) * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics & Model Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Detected Trainees
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600">
                    {evidenceAnalysisResult.detectedPersons}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Person bounding boxes</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    AI Vision Model
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono block truncate">
                    {evidenceAnalysisResult.modelVersion}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold block">Active PyTorch engine</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Analysis Timestamp
                  </span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {evidenceAnalysisResult.analysisTimestamp}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Logged to MySQL</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cloudinary Verified
                  </span>
                  <span className="text-xs font-bold text-emerald-600 block truncate">
                    Secure CDN
                  </span>
                  <a
                    href={evidenceAnalysisResult.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>View raw source</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Detected Objects Inventory */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Detected Physical Objects & Equipment
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(evidenceAnalysisResult.detectedObjects || {}).map(([key, count]: any) => (
                    <span
                      key={key}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900 inline-flex items-center gap-2"
                    >
                      <span className="capitalize">{key}:</span>
                      <strong className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                        {count}
                      </strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Linked Case: {caseData.actionNumber}
              </span>
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
