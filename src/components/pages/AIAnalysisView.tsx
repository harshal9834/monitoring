import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Building2,
  Users,
  Box,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Send,
  Loader2,
  Check,
  ChevronRight,
  FileVideo,
  FileImage,
  Image
} from 'lucide-react';
import { api, getAuthToken, formatVideoUrl, API_BASE } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface AIAnalysisViewProps {
  targetId?: string;
  centerId?: string;
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({ targetId, centerId, onNavigate, onBack }) => {
  const effectiveTargetId = centerId || targetId || 'tc_demo_001';
  const [loading, setLoading] = useState<boolean>(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10.0);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null);

  // Government Review Action states
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewResultMsg, setReviewResultMsg] = useState<string | null>(null);

  // Notice Creation Modal state
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [noticeTitle, setNoticeTitle] = useState<string>('Statutory Notice: Attendance Variance Detected');
  const [noticeDesc, setNoticeDesc] = useState<string>(
    'AI visual analysis identified significant discrepancies between reported attendance roster and physical presence in vocational bay. Immediate rectification required.'
  );
  const [noticeDays, setNoticeDays] = useState<number>(3);
  const [noticePriority, setNoticePriority] = useState<string>('HIGH');
  const [isSubmittingNotice, setIsSubmittingNotice] = useState<boolean>(false);
  const [noticeSuccessMsg, setNoticeSuccessMsg] = useState<string | null>(null);

  // Active media viewer tab: 'video' | 'image'
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'image'>('video');
  const [imageError, setImageError] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleImageError = () => {
    console.warn('Image failed to load from URL:', currentImageSrc);
    const token = getAuthToken() || '';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const fallback = analysisData?.image?.fallbackUrl || (analysisData?.submissionId ? `${API_BASE}/submissions/${analysisData.submissionId}/media/stream?type=image` : null);

    if (fallback && (!currentImageSrc.includes('/submissions/') || !currentImageSrc.includes('/media/stream'))) {
      console.info('Attempting fallback stream for image...');
      setCurrentImageSrc(`${fallback}${tokenParam}`);
    } else {
      setImageError(true);
      setImageLoaded(false);
    }
  };

  const handleRetryImage = () => {
    setImageError(false);
    setImageLoaded(false);
    const token = getAuthToken() || '';
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const fallback = analysisData?.image?.fallbackUrl || (analysisData?.submissionId ? `${API_BASE}/submissions/${analysisData.submissionId}/media/stream?type=image` : null);
    if (fallback) {
      setCurrentImageSrc(`${fallback}${tokenParam}`);
    } else if (analysisData?.image?.url) {
      setCurrentImageSrc(`${analysisData.image.url}?t=${Date.now()}`);
    }
  };

  const handleVideoError = () => {
    console.warn('Video failed to load from URL:', currentVideoSrc);
    const token = getAuthToken() || '';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const fallback = analysisData?.video?.fallbackUrl || (analysisData?.submissionId ? `${API_BASE}/submissions/${analysisData.submissionId}/media/stream?type=video` : null);

    if (fallback && (!currentVideoSrc.includes('/submissions/') || !currentVideoSrc.includes('/media/stream'))) {
      console.info('Attempting fallback stream for video...');
      setCurrentVideoSrc(`${fallback}${tokenParam}`);
    } else {
      setVideoError(true);
    }
  };

  const handleRetryVideo = () => {
    setVideoError(false);
    const token = getAuthToken() || '';
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const fallback = analysisData?.video?.fallbackUrl || (analysisData?.submissionId ? `${API_BASE}/submissions/${analysisData.submissionId}/media/stream?type=video` : null);
    if (fallback) {
      setCurrentVideoSrc(`${fallback}${tokenParam}`);
    } else if (analysisData?.video?.url) {
      setCurrentVideoSrc(formatVideoUrl(`${analysisData.video.url}?t=${Date.now()}`));
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchAnalysis = centerId
      ? api.getGovernmentCentreAIAnalysis(centerId)
      : api.getGovernmentAIAnalysis(effectiveTargetId);

    fetchAnalysis
      .then((data) => {
        if (!isMounted) return;
        setAnalysisData(data);
        if (data.video?.duration) setDuration(data.video.duration);
        if (data.video?.url) {
          setCurrentVideoSrc(formatVideoUrl(data.video.url));
          setVideoError(false);
        }
        if (data.image?.url) {
          setCurrentImageSrc(data.image.url);
          setImageError(false);
          setImageLoaded(false);
        }
        if (data.mediaType === 'IMAGE' || (!data.hasVideo && data.hasImage)) {
          setActiveMediaTab('image');
        } else {
          setActiveMediaTab('video');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load AI Analysis:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [centerId, effectiveTargetId]);

  // Video playback time synchronization
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 10.0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Extract closest frame detections
  const frameEvents: any[] = analysisData?.frameEvents || [];
  const currentFrameEvent = frameEvents.reduce((prev: any, curr: any) => {
    if (!prev) return curr;
    return Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime) ? curr : prev;
  }, null);

  const activeDetections: any[] = currentFrameEvent ? (currentFrameEvent.detections || []) : [];

  // Render Interactive Bounding Boxes Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = video.clientWidth || 640;
    const height = video.clientHeight || 360;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    activeDetections.forEach((det: any) => {
      const bbox = det.bbox;
      if (!Array.isArray(bbox) || bbox.length < 4) return;

      const [cx, cy, bw, bh] = bbox;
      const x = (cx - bw / 2) * width;
      const y = (cy - bh / 2) * height;
      const w = bw * width;
      const h = bh * height;

      const isPerson = det.class === 'person';
      const isSelectedTrack = selectedTrackId !== null && det.trackId === selectedTrackId;

      ctx.save();
      ctx.lineWidth = isSelectedTrack ? 3 : 2;
      ctx.strokeStyle = isSelectedTrack
        ? '#ec4899' // highlight pink
        : isPerson
        ? '#10b981' // emerald for person
        : '#3b82f6'; // blue for infra/machinery

      ctx.strokeRect(x, y, w, h);

      // Label badge
      const label = isPerson
        ? `Person #${det.trackId || 1} (${Math.round((det.confidence || 0.85) * 100)}%)`
        : `${det.class} (${Math.round((det.confidence || 0.8) * 100)}%)`;

      ctx.font = 'bold 11px system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = isSelectedTrack
        ? 'rgba(236, 72, 153, 0.9)'
        : isPerson
        ? 'rgba(16, 185, 129, 0.9)'
        : 'rgba(59, 130, 246, 0.9)';
      ctx.fillRect(x, Math.max(0, y - 18), textWidth + 10, 18);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 5, Math.max(13, y - 5));

      // Visual Tracking ID tag (No biometric face ID)
      if (isPerson && det.trackId) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y + h - 16, 70, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`TRK-${det.trackId}`, x + 4, y + h - 4);
      }

      ctx.restore();
    });
  }, [currentTime, activeDetections, selectedTrackId]);

  // Render Interactive Bounding Boxes over Image with aspect ratio and letterbox compensation
  const redrawImageCanvas = useCallback(() => {
    const canvas = imageCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || activeMediaTab !== 'image') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerW = canvas.parentElement?.clientWidth || img.clientWidth || 640;
    const containerH = canvas.parentElement?.clientHeight || img.clientHeight || 400;

    canvas.width = containerW;
    canvas.height = containerH;
    ctx.clearRect(0, 0, containerW, containerH);

    const natW = img.naturalWidth || containerW;
    const natH = img.naturalHeight || containerH;
    const imgRatio = natW / natH;
    const contRatio = containerW / containerH;

    let renderW = containerW;
    let renderH = containerH;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > contRatio) {
      renderW = containerW;
      renderH = containerW / imgRatio;
      offsetX = 0;
      offsetY = (containerH - renderH) / 2;
    } else {
      renderH = containerH;
      renderW = containerH * imgRatio;
      offsetY = 0;
      offsetX = (containerW - renderW) / 2;
    }

    // Detections from image analysis or first frame
    const imgDetections = (
      analysisData?.imageAnalysis?.frame_events?.[0]?.detections ||
      analysisData?.frameEvents?.[0]?.detections ||
      activeDetections || []
    );

    imgDetections.forEach((det: any) => {
      const bbox = det.bbox;
      if (!Array.isArray(bbox) || bbox.length < 4) return;

      const [cx, cy, bw, bh] = bbox;
      const x = offsetX + (cx - bw / 2) * renderW;
      const y = offsetY + (cy - bh / 2) * renderH;
      const w = bw * renderW;
      const h = bh * renderH;

      const isPerson = det.class === 'person';
      const isSelectedTrack = selectedTrackId !== null && det.trackId === selectedTrackId;

      ctx.save();
      ctx.lineWidth = isSelectedTrack ? 3 : 2;
      ctx.strokeStyle = isSelectedTrack
        ? '#ec4899'
        : isPerson
        ? '#10b981'
        : '#3b82f6';

      ctx.strokeRect(x, y, w, h);

      const label = isPerson
        ? `Person #${det.trackId || 1} (${Math.round((det.confidence || 0.85) * 100)}%)`
        : `${det.class} (${Math.round((det.confidence || 0.8) * 100)}%)`;

      ctx.font = 'bold 11px system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = isSelectedTrack
        ? 'rgba(236, 72, 153, 0.9)'
        : isPerson
        ? 'rgba(16, 185, 129, 0.9)'
        : 'rgba(59, 130, 246, 0.9)';
      ctx.fillRect(x, Math.max(0, y - 18), textWidth + 10, 18);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 5, Math.max(13, y - 5));

      if (isPerson && det.trackId) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y + h - 16, 70, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`TRK-${det.trackId}`, x + 4, y + h - 4);
      }

      ctx.restore();
    });
  }, [activeMediaTab, analysisData, selectedTrackId, activeDetections]);

  useEffect(() => {
    redrawImageCanvas();
    window.addEventListener('resize', redrawImageCanvas);
    return () => window.removeEventListener('resize', redrawImageCanvas);
  }, [redrawImageCanvas, activeMediaTab, imageLoaded]);

  // Review submission action
  const handleReviewAction = async (actionType: string) => {
    setIsSubmittingReview(true);
    setReviewResultMsg(null);
    try {
      const res = await api.reviewGovernmentAIAnalysis(targetId, {
        action: actionType,
        remarks: reviewRemarks || `Officer confirmed ${actionType} after video analysis`,
      });
      setReviewResultMsg(res.message || 'Review recorded successfully in MySQL.');
      setReviewAction(actionType);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Submit Notice to Centre
  const handleIssueNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNotice(true);
    setNoticeSuccessMsg(null);
    try {
      const centreId = analysisData?.centre?.id || 'tc_001';
      const res = await api.issueGovernmentNotice({
        centre_id: centreId,
        title: noticeTitle,
        description: noticeDesc,
        priority: noticePriority,
        days_allowed: Number(noticeDays),
      });
      setNoticeSuccessMsg(`Statutory Notice ${res.noticeNumber} successfully created in MySQL and notification sent to Training Centre.`);
      setTimeout(() => {
        setShowNoticeModal(false);
        setNoticeSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to issue statutory notice');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading AI video analytics & detection tracks from MySQL...</p>
      </div>
    );
  }

  const pAnalysis = analysisData?.personAnalysis || {
    reportedAttendance: 40,
    aiEstimatedPresence: 2,
    discrepancyCount: 38,
    discrepancyPercentage: 95.0,
    status: 'CRITICAL VARIANCE',
  };

  const infraList = analysisData?.infrastructureAnalysis || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {analysisData?.mediaType === 'IMAGE' || (!analysisData?.hasVideo && analysisData?.hasImage)
                ? 'Government Monitoring Portal • AI Image Vision Inspection'
                : 'Government Monitoring Portal • AI Video Inspection'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {analysisData?.mediaType === 'IMAGE' || (!analysisData?.hasVideo && analysisData?.hasImage)
              ? `AI Image Vision Analytics: ${analysisData?.centre?.name || 'Training Centre'}`
              : `AI Video Analytics: ${analysisData?.centre?.name || 'Training Centre'}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accreditation Code: <span className="font-mono font-bold text-slate-700">{analysisData?.centre?.code || 'TC-CODE'}</span> • Category: <span className="font-semibold text-indigo-700">{analysisData?.centre?.category || 'Vocational'}</span> • Model: <span className="font-mono text-slate-700">Ultralytics YOLOv8m (PyTorch)</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              ← Back to AI Analysis
            </button>
          ) : (
            <button
              onClick={() => onNavigate('centres')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              ← Centres Registry
            </button>
          )}
          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Create Notice</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video/Image Player on Left, Person & Infra Analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Media Viewer & Bounding Boxes (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Media Switcher Tabs ONLY IF both video and image are uploaded */}
          {(analysisData?.hasVideo && analysisData?.hasImage) && (
            <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMediaTab === 'video'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileVideo className="w-3.5 h-3.5" />
                <span>Video Analysis</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('image')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMediaTab === 'image'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Image Analysis</span>
              </button>
            </div>
          )}

          {/* MEDIA VIEWER CONTAINER */}
          {(() => {
            const showVideo = (activeMediaTab === 'video' && analysisData?.hasVideo) || (analysisData?.hasVideo && !analysisData?.hasImage);
            const showImage = !showVideo && ((activeMediaTab === 'image' && analysisData?.hasImage) || (!analysisData?.hasVideo && analysisData?.hasImage));

            if (showVideo) {
              return (
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-md relative">
                  {/* Video Container */}
                  <div className="relative aspect-video w-full flex items-center justify-center bg-slate-950">
                    {videoError ? (
                      <div className="p-8 text-center space-y-3 z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Unable to load media</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          The classroom evidence video could not be loaded from the storage server.
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
                      <>
                        <video
                          ref={videoRef}
                          src={formatVideoUrl(currentVideoSrc || analysisData?.video?.url || '')}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleVideoLoadedMetadata}
                          onEnded={() => setIsPlaying(false)}
                          onError={handleVideoError}
                          playsInline
                          muted
                          className="w-full h-full object-contain"
                        />
                        {/* Overlay Canvas for Bounding Boxes */}
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                        />

                        {/* Watermark badge: Biometric-Safe */}
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PRIVACY PROTECTED (TRACK ID ONLY • NO FACE/BIOMETRIC ID)</span>
                        </div>

                        {/* Active Persons In Bay Badge */}
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Detected: {activeDetections.filter((d: any) => d.class === 'person').length} Persons</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Video Controls Bar */}
                  {!videoError && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
                      {/* Scrubber */}
                      <div className="flex items-center space-x-3 text-xs text-slate-300">
                        <span className="font-mono text-[11px] w-10 text-right">
                          {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                        </span>
                        <input
                          type="range"
                          min="0"
                          max={duration || 10}
                          step="0.1"
                          value={currentTime}
                          onChange={(e) => {
                            const time = parseFloat(e.target.value);
                            setCurrentTime(time);
                            if (videoRef.current) videoRef.current.currentTime = time;
                          }}
                          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                        <span className="font-mono text-[11px] w-10">
                          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={togglePlay}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 font-semibold text-xs"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                            <span>{isPlaying ? 'Pause' : 'Play Video'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = 0;
                                setCurrentTime(0);
                              }
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restart</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="font-mono">FPS: {analysisData?.video?.fps || 5}</span>
                          <span>•</span>
                          <span className="font-mono">Frames: {analysisData?.video?.totalFrames || 50}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (showImage) {
              return (
                /* IMAGE VIEWER */
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-md relative">
                  <div className="relative aspect-video w-full flex items-center justify-center bg-slate-950">
                    {!imageLoaded && !imageError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      </div>
                    )}

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
                      <>
                        <img
                          ref={imageRef}
                          src={currentImageSrc || analysisData?.image?.url || ''}
                          alt="Classroom Evidence"
                          className="w-full h-full object-contain"
                          onLoad={() => {
                            setImageLoaded(true);
                            setImageError(false);
                            redrawImageCanvas();
                          }}
                          onError={handleImageError}
                        />
                        <canvas
                          ref={imageCanvasRef}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                        />

                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                          <span>IMAGE AI INFERENCE • BOUNDING BOXES & LABELS SYNCHRONIZED</span>
                        </div>

                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Detected: {analysisData?.personAnalysis?.aiEstimatedPresence || 0} Persons</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">Classroom Photograph:</span>
                      <span className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {analysisData?.image?.fileName || 'evidence_photo.jpg'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                      Model: YOLOv8m Inference
                    </span>
                  </div>
                </div>
              );
            }

            return (
              /* NO MEDIA ATTACHED */
              <div className="bg-slate-900 rounded-2xl p-12 text-center text-slate-400 border border-slate-800 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-500" />
                <h3 className="text-sm font-bold text-slate-200">No Media Uploaded</h3>
                <p className="text-xs max-w-sm mx-auto text-slate-400">
                  This submission contains attendance data without video/image evidence.
                </p>
              </div>
            );
          })()}

          {/* Tracked Persons Selector (Manual Tracking Verification) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Manual Visual Tracking Verification (Track IDs)
              </h3>
              <span className="text-[11px] text-slate-500">Click a Track ID to highlight bounding box</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(() => {
                const availableTracks = Array.from(
                  new Set(
                    frameEvents.flatMap((f: any) =>
                      (f.detections || [])
                        .filter((d: any) => d.trackId)
                        .map((d: any) => d.trackId)
                    )
                  )
                ).sort((a: any, b: any) => a - b);
                const tracksToShow = availableTracks.length > 0 ? availableTracks.slice(0, 15) : [1, 2, 3];
                return tracksToShow.map((trk: any) => {
                  const isSelected = selectedTrackId === trk;
                  return (
                    <button
                      key={trk}
                      onClick={() => setSelectedTrackId(isSelected ? null : trk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                        isSelected
                          ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      TRK-{trk}
                    </button>
                  );
                });
              })()}
              {selectedTrackId !== null && (
                <button
                  onClick={() => setSelectedTrackId(null)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Government Review Action Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Government Officer Official Review</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Official Verification Remarks:
              </label>
              <textarea
                rows={2}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Enter mandatory regulatory audit remarks for inspection record..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {reviewResultMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{reviewResultMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                disabled={isSubmittingReview}
                onClick={() => handleReviewAction('CONFIRM_ISSUE')}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirm Issue</span>
              </button>

              <button
                disabled={isSubmittingReview}
                onClick={() => handleReviewAction('FALSE_POSITIVE')}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark False Positive</span>
              </button>

              <button
                disabled={isSubmittingReview}
                onClick={() => handleReviewAction('REQUIRES_VERIFICATION')}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Requires Verification</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Person & Infrastructure Analytics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SECTION A: Person Analysis Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Person Analysis</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                pAnalysis.discrepancyPercentage >= 10
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pAnalysis.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Reported Attendance</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {pAnalysis.reportedAttendance} Trainees
                </span>
                <span className="text-[10px] text-slate-400">Centre Claimed</span>
              </div>

              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                <span className="text-[11px] text-indigo-700 block font-semibold">AI Estimated</span>
                <span className="text-xl font-bold text-indigo-950 mt-1 block">
                  {pAnalysis.aiEstimatedPresence} Trainees
                </span>
                <span className="text-[10px] text-indigo-600">YOLOv8m Vision</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-800 font-semibold">Discrepancy (Ghost Attendance):</span>
                <span className="font-bold text-rose-900 text-sm">
                  -{pAnalysis.discrepancyCount} Trainees ({pAnalysis.discrepancyPercentage}%)
                </span>
              </div>
              <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, pAnalysis.discrepancyPercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-rose-700">
                Statutory threshold: Variances exceeding 10% warrant mandatory formal notice and financial withholding.
              </p>
            </div>
          </div>

          {/* SECTION B: Infrastructure Analysis Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Box className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Approved Infrastructure Verification</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Approved vs Reported vs Detected</span>
            </div>

            <div className="space-y-3">
              {infraList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No approved infrastructure items registered for this centre.
                </div>
              ) : (
                infraList.map((item: any, idx: number) => {
                  const approvedQty = item.approvedQuantity ?? item.approved ?? 0;
                  const reportedQty = item.reportedQuantity ?? item.reported ?? 0;
                  const detectedQty = item.detectedQuantity ?? item.detected ?? 0;
                  const isUnder = detectedQty < approvedQty;
                  return (
                    <div
                      key={item.assetKey || item.assetCode || idx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.assetType || item.assetName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isUnder ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="bg-white p-1.5 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[9px] uppercase">Approved</span>
                          <span className="font-bold text-slate-800">{approvedQty}</span>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[9px] uppercase">Reported</span>
                          <span className="font-bold text-slate-800">{reportedQty}</span>
                        </div>
                        <div className={`p-1.5 rounded border ${isUnder ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-white border-slate-200'}`}>
                          <span className="text-slate-400 block text-[9px] uppercase">Detected</span>
                          <span className="font-bold">{detectedQty}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION C: Extra / Unregistered Objects Detected */}
          {Array.isArray(analysisData?.extraObjects) && analysisData.extraObjects.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Extra / Unregistered Objects Detected</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Requires Review
                </span>
              </div>

              <div className="space-y-2.5">
                {analysisData.extraObjects.map((extra: any, eIdx: number) => (
                  <div
                    key={eIdx}
                    className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{extra.className}</span>
                        <span className="text-[10px] bg-white border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">
                          Count: {extra.detectedCount}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{extra.note}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      {extra.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE STATUTORY NOTICE MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Issue Statutory Compliance Notice</span>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueNotice} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Training Centre:</label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 font-bold">
                  {analysisData?.centre?.name || 'Training Centre'} ({analysisData?.centre?.code || 'TC-CODE'})
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Title / Subject:</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Findings & Direction:</label>
                <textarea
                  rows={3}
                  required
                  value={noticeDesc}
                  onChange={(e) => setNoticeDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-normal text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Days Allowed for Response:</label>
                  <select
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value={2}>2 Business Days</option>
                    <option value={3}>3 Business Days</option>
                    <option value={5}>5 Business Days</option>
                    <option value={7}>7 Business Days</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notice Priority:</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              {noticeSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                  {noticeSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNotice}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingNotice ? 'Dispatching...' : 'Dispatch Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
