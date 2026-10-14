import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  Box,
  FileVideo,
  Play,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  FileText,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { api, getAuthToken, formatVideoUrl, API_BASE } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface SubmissionDetailViewProps {
  submissionId: string;
  onBack: () => void;
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const SubmissionDetailView: React.FC<SubmissionDetailViewProps> = ({
  submissionId,
  onBack,
  onNavigate,
}) => {
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [archiveReason, setArchiveReason] = useState<string>('');
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [vidSrc, setVidSrc] = useState<string>('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getSubmissionDetail(submissionId);
      setDetail(data);
      if (data?.image?.secureUrl || data?.image?.filePath) {
        setImgSrc(data.image.secureUrl || data.image.filePath);
        setImageError(false);
      }
      if (data?.video?.secureUrl || data?.video?.filePath) {
        setVidSrc(formatVideoUrl(data.video.secureUrl || data.video.filePath));
        setVideoError(false);
      }
    } catch (err) {
      console.error('Failed to load submission detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    const token = getAuthToken() || '';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const fallback = `${API_BASE}/submissions/${submissionId}/media/stream?type=image`;
    if (!imgSrc.includes('/submissions/') || !imgSrc.includes('/media/stream')) {
      setImgSrc(`${fallback}${tokenParam}`);
    } else {
      setImageError(true);
    }
  };

  const handleVideoError = () => {
    const token = getAuthToken() || '';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const fallback = `${API_BASE}/submissions/${submissionId}/media/stream?type=video`;
    if (!vidSrc.includes('/submissions/') || !vidSrc.includes('/media/stream')) {
      setVidSrc(`${fallback}${tokenParam}`);
    } else {
      setVideoError(true);
    }
  };

  const handleRetryImage = () => {
    setImageError(false);
    const token = getAuthToken() || '';
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    setImgSrc(`${API_BASE}/submissions/${submissionId}/media/stream?type=image${tokenParam}`);
  };

  const handleRetryVideo = () => {
    setVideoError(false);
    const token = getAuthToken() || '';
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    setVidSrc(`${API_BASE}/submissions/${submissionId}/media/stream?type=video${tokenParam}`);
  };

  const analysisTimerRef = React.useRef<any>(null);
  const redirectTimerRef = React.useRef<any>(null);

  useEffect(() => {
    fetchDetail();
    return () => {
      if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [submissionId]);

  const handleRunAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(20);
    setAnalysisMessage('Initializing YOLOv8 inference & loading video stream...');

    console.info('[AI ANALYSIS REQUEST]', {
      method: 'POST',
      url: `${API_BASE}/government/submissions/${submissionId}/analyze`,
      submission_id: submissionId,
      submission_media_id: detail?.video?.id || detail?.image?.id || detail?.mediaList?.[0]?.id || 'N/A',
      center_id: detail?.centre?.id || detail?.centreId || 'N/A'
    });

    if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
    analysisTimerRef.current = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 85) {
          if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
          return 85;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const res = await api.triggerSubmissionAIAnalysis(submissionId);
      setAnalysisMessage('YOLOv8 neural inference running in background...');

      // If backend returns COMPLETED immediately (e.g. cached or fast image), finish
      if (res.status === 'COMPLETED') {
        if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
        setAnalysisProgress(100);
        // Dispatch refresh events so Government Alerts and Sidebar badge update immediately without page reload
        window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
        window.dispatchEvent(new CustomEvent('skillguard:ai-analysis-completed', { detail: { submissionId } }));

        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = setTimeout(() => {
          setIsAnalyzing(false);
          fetchDetail();
          onNavigate('ai_analysis', res.submissionId || submissionId);
        }, 800);
        return;
      }

      // If PROCESSING, poll getSubmissionDetail until aiResult.status is COMPLETED or max 45s
      const startTime = Date.now();
      const pollInterval = setInterval(async () => {
        try {
          const updatedDetail = await api.getSubmissionDetail(submissionId);
          if (updatedDetail?.aiResult?.status === 'COMPLETED' || updatedDetail?.aiStatus === 'COMPLETED') {
            clearInterval(pollInterval);
            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
            setAnalysisProgress(100);
            setAnalysisMessage('AI Analysis Complete! Opening visual analysis review...');
            setDetail(updatedDetail);

            // Dispatch refresh events so Government Alerts and Sidebar badge update immediately without page reload
            window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
            window.dispatchEvent(new CustomEvent('skillguard:ai-analysis-completed', { detail: { submissionId } }));

            if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = setTimeout(() => {
              setIsAnalyzing(false);
              onNavigate('ai_analysis', submissionId);
            }, 800);
          } else if (Date.now() - startTime > 45000) {
            // Timeout after 45s: stop spinner and navigate to AI analysis view anyway
            clearInterval(pollInterval);
            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
            setIsAnalyzing(false);
            fetchDetail();
            onNavigate('ai_analysis', submissionId);
          }
        } catch {
          // ignore transient poll error
        }
      }, 2500);

    } catch (err: any) {
      if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
      setIsAnalyzing(false);
      const errMsg = err?.message || 'Failed to trigger AI analysis';
      console.error('[AI ANALYSIS ERROR]', errMsg);
      alert(errMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading submission records from MySQL database...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Submission Not Found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Submissions
        </button>
      </div>
    );
  }

  const hasVideo = detail.video?.hasVideo;
  const hasImage = detail.image?.hasImage;
  const hasMedia = hasVideo || hasImage;
  const isAICompleted = detail.aiResult?.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {isAICompleted && (
            <button
              onClick={() => onNavigate('ai_analysis', detail.submissionId)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              {hasVideo ? <FileVideo className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              <span>
                {hasVideo
                  ? 'Open Video AI Analysis →'
                  : 'Open Image AI Analysis →'}
              </span>
            </button>
          )}

          {hasMedia && (
            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzing}
              className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                isAICompleted
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isAnalyzing
                  ? 'Processing AI Pipeline...'
                  : isAICompleted
                  ? 'Re-run AI Analysis'
                  : hasVideo
                  ? 'Run Video AI Analysis'
                  : 'Run Image AI Analysis'}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowArchiveModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Archive / Remove Submission"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Remove / Archive</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Modal during AI analysis */}
      {isAnalyzing && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-indigo-900 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{analysisMessage || 'Processing YOLO Neural Inference...'}</span>
            </span>
            <span className="font-mono text-indigo-700">{analysisProgress}%</span>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 1. Submission Overview Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{detail.centre?.category || 'Vocational Training Centre'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {detail.centre?.name}
            </h1>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-1">
              <span>Code:</span>
              <strong className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {detail.centre?.code}
              </strong>
              <span>• Submission:</span>
              <strong className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {detail.submissionId}
              </strong>
              <span>• Media:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold tracking-wide border ${
                (detail.mediaTypeBadge === 'VIDEO + IMAGE' || (hasVideo && hasImage))
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : (detail.mediaTypeBadge === 'VIDEO' || (hasVideo && !hasImage))
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : (detail.mediaTypeBadge === 'IMAGE' || (!hasVideo && hasImage))
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {detail.mediaTypeBadge || (hasVideo && hasImage ? 'VIDEO + IMAGE' : hasVideo ? 'VIDEO' : hasImage ? 'IMAGE' : 'NONE')}
              </span>
              {detail.centre?.district && (
                <span className="text-slate-400">• {detail.centre.district}, {detail.centre.state}</span>
              )}
            </p>
          </div>

          <div className="flex flex-col md:items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Submission Date
            </span>
            <span className="font-mono text-sm font-bold text-slate-800">
              {detail.date}
            </span>
            <span className="text-[11px] text-slate-400">
              Recorded at {detail.submittedAt}
            </span>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reported Trainees</span>
            <span className="text-xl font-extrabold text-slate-900">{detail.attendance?.reportedPresent} Present</span>
            <span className="text-[10px] text-slate-500 block">Total registered: {detail.attendance?.totalRegistered}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course & Batch</span>
            <span className="text-sm font-bold text-slate-900 truncate block">{detail.batch?.courseName}</span>
            <span className="text-[10px] font-mono text-slate-500 block">{detail.batch?.code}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Media Evidence</span>
            <span className={`text-sm font-bold ${
              (hasVideo && hasImage)
                ? 'text-purple-700'
                : hasVideo
                ? 'text-indigo-700'
                : hasImage
                ? 'text-emerald-700'
                : 'text-slate-500'
            }`}>
              {hasVideo && hasImage
                ? 'Video + Image'
                : hasVideo
                ? 'Video Only'
                : hasImage
                ? 'Image Only'
                : 'No Media'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {hasVideo && hasImage
                ? `${(detail.video?.fileSize / 1024 / 1024).toFixed(1)} MB Vid + ${(detail.image?.fileSize / 1024).toFixed(0)} KB Img`
                : hasVideo
                ? `${((detail.video?.fileSize || 0) / 1024 / 1024).toFixed(1)} MB Video`
                : hasImage
                ? `${((detail.image?.fileSize || 0) / 1024).toFixed(0)} KB Image`
                : 'Attendance Roster Only'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Review Status</span>
            <span className={`text-sm font-bold ${
              isAICompleted ? 'text-emerald-700' : hasMedia ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {detail.aiResult?.status}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {isAICompleted ? `${detail.aiResult.estimatedPersons} Persons detected` : (hasMedia ? 'Awaiting engine' : 'No media to inspect')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Media Player / Viewer Section (Strict conditional rendering) */}
      {hasVideo && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-indigo-600" />
                <span>Original Centre Submission Video</span>
              </h3>
              <p className="text-xs text-slate-500">
                Cloud-verified video stream from Cloudinary
              </p>
            </div>

            {isAICompleted && (
              <button
                onClick={() => onNavigate('ai_analysis', detail.submissionId)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-1"
              >
                <span>Switch to AI Overlay</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video w-full max-h-[480px] flex items-center justify-center">
            {videoError ? (
              <div className="p-8 text-center space-y-3 z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Unable to load media</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The classroom evidence video stream could not be loaded from the storage server.
                </p>
                <button
                  type="button"
                  onClick={handleRetryVideo}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <video
                src={formatVideoUrl(vidSrc || detail.video?.secureUrl || detail.video?.filePath || '')}
                controls
                playsInline
                onError={handleVideoError}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
            <span>File: <strong className="font-mono text-slate-800">{detail.video?.fileName}</strong></span>
            {detail.video?.duration > 0 && (
              <span>Duration: <strong className="font-mono text-slate-800">{detail.video?.duration}s</strong></span>
            )}
            <span>Status: <strong className="font-mono text-emerald-600">Cloudinary Verified</strong></span>
          </div>
        </div>
      )}

      {hasImage && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <span>Submitted Classroom Image</span>
              </h3>
              <p className="text-xs text-slate-500">
                Cloud-verified evidence image from Cloudinary
              </p>
            </div>

            {isAICompleted && (
              <button
                onClick={() => onNavigate('ai_analysis', detail.submissionId)}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
              >
                <span>Open AI Image Vision Review</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-[480px] w-full flex items-center justify-center p-2">
            {imageError ? (
              <div className="p-8 text-center space-y-3 z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Unable to load media</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The classroom evidence image could not be loaded from the storage server.
                </p>
                <button
                  type="button"
                  onClick={handleRetryImage}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <img
                src={imgSrc || detail.image?.secureUrl || detail.image?.filePath || ''}
                alt="Classroom submission"
                onError={handleImageError}
                className="max-h-[460px] max-w-full w-auto h-auto object-contain rounded-lg shadow"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
            <span>File: <strong className="font-mono text-slate-800">{detail.image?.fileName}</strong></span>
            <span>Size: <strong className="font-mono text-slate-800">{((detail.image?.fileSize || 0) / 1024).toFixed(1)} KB</strong></span>
            <span>Status: <strong className="font-mono text-emerald-600">Cloudinary Verified</strong></span>
          </div>
        </div>
      )}

      {!hasVideo && !hasImage && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">No Media Uploaded</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              This submission contains attendance data without video/image evidence. The self-reported roster numbers and equipment checklist have been logged in the MySQL database.
            </p>
          </div>
        </div>
      )}

      {/* 3. Declared Infrastructure vs Approved Comparison */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-600" />
            <span>Infrastructure Declaration & Verification</span>
          </h3>
          <p className="text-xs text-slate-500">
            Self-declared physical equipment compared against Government approved capacity
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Equipment / Asset Type</th>
                <th className="py-2.5 px-3">Approved Quantity</th>
                <th className="py-2.5 px-3">Declared in Submission</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {['computers', 'machines', 'workbenches', 'chairs'].map((key) => {
                const approved = detail.infrastructure?.approved?.[key] ?? 20;
                const reported = detail.infrastructure?.reported?.[key] ?? approved;
                const isMatch = reported >= approved;
                return (
                  <tr key={key}>
                    <td className="py-3 px-3 font-semibold text-slate-800 capitalize">{key}</td>
                    <td className="py-3 px-3 font-mono">{approved}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{reported}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        isMatch ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {isMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{isMatch ? 'Sufficient' : `Deficit (-${approved - reported})`}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM ARCHIVE / REMOVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Archive Submission Record</h3>
              </div>
              <button
                onClick={() => { setShowArchiveModal(false); setArchiveReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove and archive this submission? In compliance with national audit standards, the record will be soft-deleted and an audit event logged in MySQL Sih245.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Submission ID:</span>
                <span className="font-mono font-bold text-slate-800">{detail.submissionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Centre:</span>
                <span className="font-semibold text-slate-800">{detail.centre?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-800">{detail.date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Audit Reason for Removal:
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Duplicate daily roster submission or invalid test entry..."
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowArchiveModal(false); setArchiveReason(''); }}
                disabled={isArchiving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={async () => {
                  try {
                    setIsArchiving(true);
                    await api.removeGovernmentSubmission(
                      detail.submissionId,
                      archiveReason || 'Removed / Archived by Government Monitoring Officer'
                    );
                    setShowArchiveModal(false);
                    onBack();
                  } catch (err: any) {
                    alert(err.message || 'Failed to archive submission');
                  } finally {
                    setIsArchiving(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isArchiving ? 'Archiving...' : 'Confirm Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
