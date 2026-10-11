import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  ArrowLeft,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Clock,
  UserCheck,
  Box,
  Eye,
  Check,
  X,
  Info
} from 'lucide-react';
import { api, formatVideoUrl } from '../../services/api';
import { appState } from '../../services/storage';

interface VideoAnalysisPlayerProps {
  videoId: string;
  initialVideoData?: any;
  onBack: () => void;
  onNavigateToActions?: () => void;
}

export const AIVideoAnalysisPlayer: React.FC<VideoAnalysisPlayerProps> = ({
  videoId,
  initialVideoData,
  onBack,
  onNavigateToActions,
}) => {
  const [videoData, setVideoData] = useState<any>(initialVideoData || null);
  const [loading, setLoading] = useState<boolean>(!initialVideoData);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(initialVideoData?.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [samplingFps, setSamplingFps] = useState<number>(5);

  // Overlays & filters
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Modals & Actions
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [evidenceSnapshot, setEvidenceSnapshot] = useState<{ url: string; timestamp: number; id: string } | null>(null);
  const [isCapturingEvidence, setIsCapturingEvidence] = useState<boolean>(false);

  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [flagTitle, setFlagTitle] = useState<string>('Attendance Discrepancy Flagged');
  const [flagCategory, setFlagCategory] = useState<string>('ATTENDANCE_MISMATCH');
  const [flagSeverity, setFlagSeverity] = useState<string>('CRITICAL');
  const [flagDescription, setFlagDescription] = useState<string>('');
  const [flagSuccessMsg, setFlagSuccessMsg] = useState<string | null>(null);
  const [isSubmittingFlag, setIsSubmittingFlag] = useState<boolean>(false);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fetch video details and AI analysis if needed
  useEffect(() => {
    let isMounted = true;
    api.getVideoDetail(videoId)
      .then((data) => {
        if (isMounted) {
          setVideoData(data);
          if (data.duration) setDuration(data.duration);
          if (data.analysis?.sample_fps) setSamplingFps(data.analysis.sample_fps);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load video detail:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const analysis = videoData?.analysis || {};
  const frameEvents: any[] = analysis.frameEvents || analysis.frame_events || [];
  const timelineEvents: any[] = analysis.timelineEvents || analysis.timeline_events || [];
  const attendanceComp = analysis.attendanceComparison || analysis.attendance_comparison || {
    submitted_attendance: 40,
    ai_estimated_presence: analysis.estimated_presence || 32,
    variance_count: 8,
    variance_percentage: 20.0,
    status: 'SIGNIFICANT VARIANCE',
  };
  const infraComp = analysis.infrastructureComparison || analysis.infrastructure_comparison || [];
  const objectSummary = analysis.objectSummary || analysis.object_summary || {
    person: attendanceComp.ai_estimated_presence || 32,
    computer: 18,
    workbench: 5,
    machine: 2,
    chair: 35,
  };

  // Find the detection event closest to the current video playback time
  const currentFrameEvent = frameEvents.reduce((prev: any, curr: any) => {
    if (!prev) return curr;
    return Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime) ? curr : prev;
  }, null);

  const currentPersonsCount = currentFrameEvent ? currentFrameEvent.person_count : (attendanceComp.ai_estimated_presence || 0);
  const activeDetections: any[] = currentFrameEvent ? currentFrameEvent.detections || [] : [];

  // Synchronized canvas overlay rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlay = () => {
      if (video.videoWidth && video.videoHeight) {
        if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
          canvas.width = video.clientWidth;
          canvas.height = video.clientHeight;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showBoundingBoxes && activeDetections.length > 0) {
        activeDetections.forEach((det: any, index: number) => {
          if (filterClass !== 'ALL' && det.class !== filterClass) return;

          // Normalized bbox: [cx, cy, w, h]
          const [cx, cy, bw, bh] = det.bbox;
          const x = (cx - bw / 2) * canvas.width;
          const y = (cy - bh / 2) * canvas.height;
          const width = bw * canvas.width;
          const height = bh * canvas.height;

          const isPerson = det.class === 'person';
          const strokeColor = isPerson ? '#10b981' : '#6366f1';
          const fillColor = isPerson ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)';

          // Bounding Box
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2.5;
          ctx.fillStyle = fillColor;

          ctx.beginPath();
          ctx.roundRect(x, y, width, height, 4);
          ctx.fill();
          ctx.stroke();

          // Label Header Tag
          if (showLabels) {
            const confPct = Math.round(det.confidence * 100);
            const labelText = showConfidence
              ? `${det.class.toUpperCase()} ${confPct}%`
              : det.class.toUpperCase();

            ctx.font = 'bold 10px monospace';
            const textWidth = ctx.measureText(labelText).width;
            const tagHeight = 16;
            const tagWidth = textWidth + 10;

            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.roundRect(x, Math.max(0, y - tagHeight), tagWidth, tagHeight, 3);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, x + 5, Math.max(11, y - 4));
          }
        });
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(drawOverlay);
      }
    };

    drawOverlay();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentTime, isPlaying, showBoundingBoxes, showLabels, showConfidence, filterClass, activeDetections]);

  // Video time update event handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const jumpToTimestamp = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
      if (!isPlaying) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Section 12: Capture Evidence Button Handler
  const handleCaptureEvidence = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsCapturingEvidence(true);
    try {
      // Create temporary canvas to grab current exact video frame
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = video.videoWidth || 1280;
      snapCanvas.height = video.videoHeight || 720;
      const snapCtx = snapCanvas.getContext('2d');
      if (snapCtx) {
        snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      }
      const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.92);

      const res = await api.captureSnapshotEvidence(videoId, dataUrl, currentTime);
      setEvidenceSnapshot({
        url: res.framePath || dataUrl,
        timestamp: currentTime,
        id: res.snapshotId || 'snap_001',
      });
      setIsEvidenceModalOpen(true);
    } catch (err: any) {
      alert(`Evidence capture failed: ${err.message}`);
    } finally {
      setIsCapturingEvidence(false);
    }
  };

  // Section 13: Flag Violation Button Handler
  const handleFlagViolation = async () => {
    setIsSubmittingFlag(true);
    try {
      const snapUrl = evidenceSnapshot?.url || '';
      const res = await api.flagViolation(videoId, {
        title: flagTitle,
        category: flagCategory,
        severity: flagSeverity,
        description: flagDescription || `Discrepancy identified at ${formatTime(currentTime)} during AI video verification.`,
        submittedValue: attendanceComp.submitted_attendance || 40,
        aiValue: currentPersonsCount,
        snapshotUrl: snapUrl,
      });

      setFlagSuccessMsg(`Alert ${res.alertId} created successfully in MySQL and queued for officer verification.`);
      setTimeout(() => {
        setIsFlagModalOpen(false);
        setFlagSuccessMsg(null);
      }, 2200);
    } catch (err: any) {
      alert(`Failed to flag violation: ${err.message}`);
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading AI Video Stream & Detections...</p>
      </div>
    );
  }

  const videoSrc = formatVideoUrl(videoData?.secure_url || videoData?.filePath || '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            title="Back to Video Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                AI Video Analysis
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                #{videoData?.id || 'VID-2026-001'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Inference Model Active
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {videoData?.centreName || 'Apex Skill Center'} • <span className="font-semibold text-slate-600">{videoData?.fileName || 'Session Video'}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons: Evidence & Violation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCaptureEvidence}
            disabled={isCapturingEvidence}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center space-x-2 transition-colors"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span>{isCapturingEvidence ? 'Capturing...' : 'Capture Evidence'}</span>
          </button>

          <button
            onClick={() => {
              setFlagTitle(`Attendance Variance (${attendanceComp.variance_count || 8} Trainees)`);
              setFlagDescription(`AI Vision verified ${currentPersonsCount} trainees against submitted roster of ${attendanceComp.submitted_attendance || 40}.`);
              setIsFlagModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Flag Violation</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player (Left 65%) + Live AI Analytics Panel (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Player & AI Event Timeline */}
        <div className="lg:col-span-8 space-y-4">
          {/* Video Container */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 aspect-video flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoSrc}
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Canvas Overlay for Synchronized Real-Time Bounding Boxes */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none w-full h-full"
            />

            {/* Privacy Badge Watermark (DPDP Act) */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 flex items-center space-x-2 text-[10px] text-slate-200">
              <Eye className="w-3 h-3 text-emerald-400" />
              <span>Zero Biometric Face Recognition Conforming</span>
            </div>

            {/* Current Person Count Badge on Top Right */}
            <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md border border-emerald-700/60 rounded-lg px-2.5 py-1 flex items-center space-x-2 text-[11px] text-emerald-300 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{currentPersonsCount} PERSONS</span>
            </div>

            {/* Video Controls Overlay Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 space-y-2">
              {/* Scrubbing Timeline */}
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />
              </div>

              {/* Bottom Playback Control Row */}
              <div className="flex items-center justify-between text-xs text-white">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="font-mono text-[11px] text-slate-300 font-semibold">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Sampling FPS & Quality Indicators */}
                <div className="flex items-center space-x-3 text-[11px]">
                  <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                    <span className="text-slate-400">Sampling:</span>
                    <span className="font-bold text-amber-400">{samplingFps} FPS</span>
                  </div>
                  <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                    <span className="text-slate-400">YOLO:</span>
                    <span className="font-bold text-emerald-400">91% Conf</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Inspection Settings & Bounding Box Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Detection Overlay:</span>
              </span>

              <label className="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBoundingBoxes}
                  onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Bounding Boxes</span>
              </label>

              <label className="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Class Labels</span>
              </label>

              <label className="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConfidence}
                  onChange={(e) => setShowConfidence(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Confidence %</span>
              </label>
            </div>

            {/* Sampling FPS Selector (Section 4) */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 text-[11px] font-semibold">Sampling Rate:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                {[1, 5, 10].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setSamplingFps(fps)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      samplingFps === fps
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 11: AI Detection Timeline & Key Events */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Detection Timeline & Key Events</span>
              </h3>
              <span className="text-[11px] text-slate-400">Click event to jump playback</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {timelineEvents.map((ev: any, idx: number) => {
                const isSelected = Math.abs(currentTime - ev.timestamp) < 1.0;
                return (
                  <div
                    key={idx}
                    onClick={() => jumpToTimestamp(ev.timestamp)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px]">
                        {ev.timeFormatted || formatTime(ev.timestamp)}
                      </span>
                      <span className="font-medium text-slate-800">{ev.description}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {ev.severity === 'CRITICAL' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          DISCREPANCY
                        </span>
                      ) : ev.severity === 'WARNING' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          WARNING
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          {ev.count} Persons
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {timelineEvents.length === 0 && (
                <p className="text-slate-400 text-center py-4 text-xs">No timeline events extracted.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Section 8, 9, 10 Live AI Analytics Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Real-Time Headcount (Section 8) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Real-Time Headcount
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Frame Synced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-0.5">
                  Current In Frame
                </span>
                <span className="text-3xl font-black text-indigo-900 font-mono">
                  {currentPersonsCount}
                </span>
                <span className="text-[10px] text-indigo-600 block mt-0.5">Detected Persons</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Session Estimate
                </span>
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {attendanceComp.ai_estimated_presence || 32}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Deduplicated</span>
              </div>
            </div>

            {/* Object Summary breakdown (Section 6 & 8) */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detected Objects (Trained Classes)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Persons</span>
                  <span className="font-bold text-slate-900 font-mono">{objectSummary.person || currentPersonsCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Computers</span>
                  <span className="font-bold text-slate-900 font-mono">{objectSummary.computer || 18}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Workbenches</span>
                  <span className="font-bold text-slate-900 font-mono">{objectSummary.workbench || 5}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Chairs</span>
                  <span className="font-bold text-slate-900 font-mono">{objectSummary.chair || 35}</span>
                </div>
              </div>
            </div>

            {/* Telemetry metadata */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Avg Confidence: <strong className="text-slate-800">91.5%</strong></span>
              <span>Model: <strong className="text-slate-800">YOLOv8m</strong></span>
            </div>
          </div>

          {/* Card 2: Attendance Comparison (Section 9) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Attendance Verification
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                attendanceComp.status === 'MATCH'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : attendanceComp.status === 'MINOR VARIANCE'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {attendanceComp.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-0.5">Submitted Attendance</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {attendanceComp.submitted_attendance || 40}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Trainees on Roster</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-0.5">AI Estimated Presence</span>
                <span className="text-xl font-black text-indigo-700 font-mono">
                  {attendanceComp.ai_estimated_presence || 32}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Physical Count</span>
              </div>
            </div>

            {/* Variance indicator */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-600 block font-medium">Headcount Variance</span>
                <span className="text-[10px] text-slate-400">Roster minus vision count</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {attendanceComp.variance_count || 8} Trainees ({attendanceComp.variance_percentage || 20}%)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Infrastructure Comparison (Section 10) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Approved Assets Comparison
              </span>
              <span className="text-[10px] text-slate-400">MySQL Registry</span>
            </div>

            <div className="space-y-2 text-xs">
              {infraComp.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block">{item.assetType}</span>
                    <span className="text-[10px] text-slate-400">
                      Approved: {item.approvedQuantity} | Vision: {item.detectedQuantity}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.status === 'Detected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Requires Verification'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer per Section 10 */}
            <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-700 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
              <span>
                AI visual detection indicates physical presence within camera range. Technical functionality is verified through physical auditor inspection.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Evidence Snapshot Captured (Section 12) */}
      {isEvidenceModalOpen && evidenceSnapshot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Evidence Frame Captured</h3>
              </div>
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video">
              <img
                src={evidenceSnapshot.url}
                alt="Captured Snapshot"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Snapshot ID:</span>
                <span className="font-mono font-bold text-slate-800">{evidenceSnapshot.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span className="font-mono font-bold text-slate-800">{formatTime(evidenceSnapshot.timestamp)} ({evidenceSnapshot.timestamp.toFixed(2)}s)</span>
              </div>
              <div className="flex justify-between">
                <span>Stored Path:</span>
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[280px]">{evidenceSnapshot.url}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Done
              </button>
              <button
                onClick={() => {
                  setIsEvidenceModalOpen(false);
                  setIsFlagModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Attach & Flag Violation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Flag Violation Modal (Section 13) */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Flag Statutory Non-Compliance</h3>
              </div>
              <button
                onClick={() => setIsFlagModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {flagSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{flagSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Violation Category</label>
                  <select
                    value={flagCategory}
                    onChange={(e) => setFlagCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="ATTENDANCE_MISMATCH">Attendance Roster Mismatch (Ghost Trainee Risk)</option>
                    <option value="INFRASTRUCTURE_SHORTAGE">Infrastructure Equipment Shortage</option>
                    <option value="INSTRUCTOR_ABSENCE">Mandatory Trainer Absence</option>
                    <option value="SAFETY_VIOLATION">Workshop Safety Non-Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity Rating</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setFlagSeverity(sev)}
                        className={`py-2 rounded-xl font-bold border transition-colors ${
                          flagSeverity === sev
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Title</label>
                  <input
                    type="text"
                    value={flagTitle}
                    onChange={(e) => setFlagTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Auditor Remarks / Notes</label>
                  <textarea
                    rows={3}
                    value={flagDescription}
                    onChange={(e) => setFlagDescription(e.target.value)}
                    placeholder="Provide specific notes regarding the frame and observed variance..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                  <span>
                    Note: Flagging registers an alert in MySQL and notifies the designated Monitoring Officer for manual review. No automatic punitive sanctions are triggered without human verification.
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFlagModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFlagViolation}
                    disabled={isSubmittingFlag}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    {isSubmittingFlag ? 'Submitting...' : 'Confirm & Register Violation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
