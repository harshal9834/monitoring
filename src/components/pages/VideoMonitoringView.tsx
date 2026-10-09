import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Upload,
  Camera,
  Play,
  Pause,
  AlertTriangle,
  CameraOff,
  Maximize2,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Wifi,
  FileCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { appState } from '../../services/storage';
import {
  generateSyntheticFrameDetections,
  renderDetectionsOnCanvas,
  renderSimulatedClassroomBackground,
  CLASS_COLORS,
} from '../../services/videoSimulation';
import { DetectedClass, FrameDetectionResult } from '../../types';

interface VideoMonitoringViewProps {
  onOpenAlertDetail?: (alertId: string) => void;
  onNavigateToActions?: () => void;
}

export const VideoMonitoringView: React.FC<VideoMonitoringViewProps> = () => {
  const [selectedCentreId, setSelectedCentreId] = useState<string>('tc_001');
  const [activeInputSource, setActiveInputSource] = useState<'UPLOAD' | 'CCTV' | 'CAMERA'>('CCTV');

  // Video playback & canvas state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [samplingFps, setSamplingFps] = useState<number>(5);
  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(appState.settings.lowBandwidthModeEnabled);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showTrackId, setShowTrackId] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(true);

  // Scenario selection
  const [scenario, setScenario] = useState<'CLASSROOM_DISCREPANCY' | 'WORKSHOP_DEFECT' | 'COMPLIANT_LAB'>(
    'CLASSROOM_DISCREPANCY'
  );

  // Upload state
  const [uploadedFileName, setUploadedFileName] = useState<string>('cctv_batch_session_1080p.mp4');
  const [uploadProgress, setUploadProgress] = useState<number>(100);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // CCTV state
  const [rtspUrl, setRtspUrl] = useState<string>('rtsp://cam01.apex-skill.gov.in:554/h264/ch1/main');
  const [cctvConnected, setCctvConnected] = useState<boolean>(true);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Live detection result
  const [currentFrameResult, setCurrentFrameResult] = useState<FrameDetectionResult | null>(null);
  const [snapshotTaken, setSnapshotTaken] = useState<string | null>(null);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const activeCentre = appState.centres.find((c) => c.id === selectedCentreId) || appState.centres[0];

  // Browser Camera Stream handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeInputSource === 'CAMERA' && isCameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
        .then((s) => {
          stream = s;
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = s;
            userVideoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn('Browser webcam not available or permission denied:', err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeInputSource, isCameraActive]);

  // Main canvas animation & inference loop
  useEffect(() => {
    let lastRenderTime = performance.now();
    const frameInterval = 1000 / samplingFps;

    const renderLoop = (timestamp: number) => {
      if (!isPlaying) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const elapsed = timestamp - lastRenderTime;
      if (elapsed >= frameInterval) {
        lastRenderTime = timestamp;
        timeRef.current += elapsed / 1000;

        const canvas = canvasRef.current;
        if (canvas) {
          const detectionsResult = generateSyntheticFrameDetections(timeRef.current, scenario);
          setCurrentFrameResult(detectionsResult);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (activeInputSource === 'CAMERA' && userVideoRef.current && isCameraActive) {
              // Draw real user camera frame underneath
              ctx.drawImage(userVideoRef.current, 0, 0, canvas.width, canvas.height);
            } else {
              // Render synthetic simulated training centre room
              renderSimulatedClassroomBackground(canvas, scenario);
            }

            // Draw bounding boxes on top
            renderDetectionsOnCanvas(canvas, detectionsResult.detections, {
              showLabels,
              showConf: showConfidence,
              showTrackId,
              filterClass,
            });

            // If low bandwidth mode, draw overlay watermark
            if (lowBandwidthMode) {
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.fillRect(10, 10, 220, 36);
              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 11px Inter, sans-serif';
              ctx.fillText('⚡ EDGE LOW-BANDWIDTH MODE', 18, 26);
              ctx.fillStyle = '#94a3b8';
              ctx.font = '10px Inter, sans-serif';
              ctx.fillText('Metadata stream (24 Kbps) - No raw 4K uplink', 18, 40);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isPlaying,
    samplingFps,
    scenario,
    showLabels,
    showConfidence,
    showTrackId,
    filterClass,
    activeInputSource,
    isCameraActive,
    lowBandwidthMode,
  ]);

  // Handle Snapshot evidence
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSnapshotTaken(dataUrl);

    // Save as evidence
    setTimeout(() => setSnapshotTaken(null), 3000);
  };

  // Generate Alert from live stream
  const handleGenerateAlert = () => {
    if (!currentFrameResult) return;
    const count = currentFrameResult.counts;

    appState.createAlert({
      centreId: activeCentre.id,
      centreName: activeCentre.name,
      category: 'ATTENDANCE_MISMATCH',
      severity: 'CRITICAL',
      title: `Live Video Attendance Variance Flagged (${count.person} of ${activeCentre.approvedTraineeCapacity} Capacity)`,
      description: `Real-time AI Vision detected ${count.person} trainees versus ${activeCentre.approvedTraineeCapacity} approved capacity in ${activeCentre.name}. Discrepancy: ${activeCentre.approvedTraineeCapacity - count.person}.`,
      aiConfidence: 0.94,
      evidence: {
        snapshotUrl: snapshotTaken || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
        timestamp: new Date().toISOString(),
        cameraId: 'cam_001_lab',
        cameraName: 'CCTV Live Lab Feed',
        detectedCount: count.person,
        expectedCount: activeCentre.approvedTraineeCapacity,
        confidence: 0.942,
        modelVersion: 'kavach-yolov8m-compliance-v1.4',
        detectionMetadata: {
          people: count.person,
          computers: count.computer,
          machines: count.machine,
          workbenches: count.workbench,
          chairs: count.chair,
          damaged: count.damaged_equipment,
        },
      },
    });

    setAlertSuccessMsg('Compliance alert generated & logged with snapshot evidence!');
    setTimeout(() => setAlertSuccessMsg(null), 4000);
  };

  const handleSimulateUpload = (filename: string) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadedFileName(filename);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return p + 30;
      });
    }, 200);
  };

  const counts = currentFrameResult?.counts || {
    person: 32,
    computer: 18,
    workbench: 5,
    machine: 2,
    chair: 35,
    damaged_equipment: 1,
  };

  const attendanceDiscrepancy = activeCentre.approvedTraineeCapacity - counts.person;
  const attendanceDiscrepancyPct = ((attendanceDiscrepancy / activeCentre.approvedTraineeCapacity) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Centre Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            <span>AI Computer Vision Pipeline</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Live Video Monitoring & Automated Asset Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inference using Ultralytics YOLOv8m (Backbone: PyTorch 2.4, FP16 TensorRT)
          </p>
        </div>

        {/* Centre Dropdown & Scenario selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-600">Audited Centre:</span>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
            >
              {appState.centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-600">Audit Scenario:</span>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as any)}
              className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3 py-1.5 font-semibold text-xs"
            >
              <option value="CLASSROOM_DISCREPANCY">Classroom: 32/40 Trainees (-20% Discrepancy)</option>
              <option value="WORKSHOP_DEFECT">Workshop: 1 Damaged Machine Flagged</option>
              <option value="COMPLIANT_LAB">Fully Compliant Session (100% Match)</option>
            </select>
          </div>
        </div>
      </div>

      {/* THREE INPUT SOURCE CARDS (Section 7) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OPTION 1: Upload Video */}
        <div
          onClick={() => setActiveInputSource('UPLOAD')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeInputSource === 'UPLOAD'
              ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">OPTION 1 — Upload Video</h4>
                <span className="text-[10px] text-slate-500">MP4, AVI, MOV, WebM</span>
              </div>
            </div>
            {activeInputSource === 'UPLOAD' && (
              <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mb-3">
            Upload recorded CCTV footage for batch processing or select sample file:
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSimulateUpload('cctv_batch_session_1080p.mp4');
              }}
              className="text-[10px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-2.5 py-1 rounded"
            >
              Sample 1 (Classroom)
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSimulateUpload('workshop_bay3_overhaul.mp4');
              }}
              className="text-[10px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-2.5 py-1 rounded"
            >
              Sample 2 (Workshop)
            </button>
          </div>

          {isUploading && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Uploading {uploadedFileName}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* OPTION 2: Connect CCTV */}
        <div
          onClick={() => setActiveInputSource('CCTV')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeInputSource === 'CCTV'
              ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">OPTION 2 — Connect CCTV</h4>
                <span className="text-[10px] text-slate-500">RTSP Stream / ONVIF IP Cam</span>
              </div>
            </div>
            {activeInputSource === 'CCTV' && (
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Connected
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 space-y-1 mb-2">
            <div className="flex items-center justify-between">
              <span>Stream Protocol:</span>
              <span className="font-mono text-slate-700 font-semibold">RTSP over TCP</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Resolution:</span>
              <span className="text-slate-700 font-semibold">1080p @ 15fps</span>
            </div>
          </div>

          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            className="w-full text-[10px] font-mono bg-white border border-slate-300 rounded px-2 py-1 text-slate-700"
            placeholder="rtsp://camera-ip:554/live"
          />
        </div>

        {/* OPTION 3: Capture Video */}
        <div
          onClick={() => setActiveInputSource('CAMERA')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeInputSource === 'CAMERA'
              ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">OPTION 3 — Capture Video</h4>
                <span className="text-[10px] text-slate-500">Browser MediaDevices API</span>
              </div>
            </div>
            {activeInputSource === 'CAMERA' && (
              <span className="text-[10px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mb-2">
            Use laptop/inspection tablet camera to audit on-site classroom in real time:
          </p>

          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCameraActive(true);
                }}
                className="text-[10px] bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1 rounded transition-colors"
              >
                Start Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCameraActive(false);
                }}
                className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1 rounded transition-colors"
              >
                Stop Camera
              </button>
            )}
            <span className="text-[10px] text-slate-400 self-center">
              {isCameraActive ? 'Webcam Active' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN VIDEO PLAYER + LIVE AI DETECTIONS SPLIT SCREEN (Section 36) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Canvas Video Player & Bounding Boxes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            {/* Live Feed Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between text-xs text-white">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-bold tracking-wider">LIVE AUDIT FEED</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {activeCentre.code} • CAM-01
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-300">
                <span className="font-mono">1920x1080 @ {samplingFps} FPS</span>
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                  CONF: &gt;0.85
                </span>
              </div>
            </div>

            {/* Hidden video element for webcam */}
            <video ref={userVideoRef} className="hidden" playsInline muted autoPlay />

            {/* Main Canvas rendering synthetic room & real bounding boxes */}
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full aspect-video block bg-slate-900 object-cover"
            />

            {/* Bottom In-Player Controls */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                  title={isPlaying ? 'Pause Feed' : 'Resume Feed'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCaptureSnapshot}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
                  title="Capture timestamped high-resolution evidence snapshot"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Snapshot Evidence</span>
                </button>
                <button
                  onClick={handleGenerateAlert}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                  title="Trigger official compliance alert with current detections"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag Violation & Alert</span>
                </button>
              </div>

              {/* Edge Low-Bandwidth Mode Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400">Sampling:</span>
                  <select
                    value={samplingFps}
                    onChange={(e) => setSamplingFps(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-white"
                  >
                    <option value={1}>1 FPS (Ultra Edge)</option>
                    <option value={5}>5 FPS (Adaptive Standard)</option>
                    <option value={10}>10 FPS (High Density)</option>
                  </select>
                </div>

                <button
                  onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    lowBandwidthMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Toggle Edge Low-Bandwidth telemetry transmission mode"
                >
                  <Wifi className="w-3 h-3" />
                  <span>Low-Bandwidth Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Snapshot or Alert Success feedback alert */}
          {snapshotTaken && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Evidence snapshot captured & stored in transient audit buffer!</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-600">CONFIDENCE: 94.2%</span>
            </div>
          )}

          {alertSuccessMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{alertSuccessMsg}</span>
              </div>
              <span className="font-bold text-[10px] text-rose-700 uppercase">Alert Recorded</span>
            </div>
          )}

          {/* Filter Chips & Bounding Box display toggles */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Filter Detections:</span>
              <button
                onClick={() => setFilterClass(null)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterClass === null ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All Classes
              </button>
              {(['person', 'computer', 'workbench', 'machine', 'damaged_equipment'] as DetectedClass[]).map(
                (cls) => (
                  <button
                    key={cls}
                    onClick={() => setFilterClass(cls)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors capitalize ${
                      filterClass === cls
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cls.replace('_', ' ')}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-600">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConfidence}
                  onChange={(e) => setShowConfidence(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Confidence %</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrackId}
                  onChange={(e) => setShowTrackId(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Track IDs</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Live AI Detections & Discrepancy Breakdown */}
        <div className="space-y-4">
          {/* Real-time Headcount & Attendance Discrepancy Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Real-time Headcount & Presence
                </h3>
                <span className="text-[11px] text-slate-500">Aggregate Occupancy Tracking</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
                Live YOLOv8m
              </span>
            </div>

            {/* Attendance Comparison Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Approved Trainee Capacity:</span>
                <span className="text-xs font-bold text-slate-900">
                  {activeCentre.approvedTraineeCapacity} Trainees
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">AI Estimated Headcount:</span>
                <span className="text-base font-bold text-indigo-700">
                  {counts.person} Trainees
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Discrepancy:</span>
                <span
                  className={`font-bold ${
                    attendanceDiscrepancy > 4
                      ? 'text-rose-600'
                      : attendanceDiscrepancy > 0
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {attendanceDiscrepancy > 0 ? `-${attendanceDiscrepancy} (${attendanceDiscrepancyPct}%)` : '0% Compliant'}
                </span>
              </div>
            </div>

            {/* Privacy Disclaimer Banner */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Privacy-Preserving Aggregate Presence</span>
              </div>
              <p className="text-[10px] leading-relaxed text-emerald-700">
                Person identity is not determined by this system. Bounding boxes represent physical presence counts
                without facial recognition or biometric extraction.
              </p>
            </div>
          </div>

          {/* Infrastructure Inventory Presence Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Approved Asset Verification
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Scanned vs Approved</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Computers */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Computers / Workstations</span>
                  <span className="text-[10px] text-slate-500">
                    Sanctioned: {activeCentre.approvedInventory.computers}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    {counts.computer} / {activeCentre.approvedInventory.computers}
                  </span>
                  <span
                    className={`block text-[10px] font-bold ${
                      counts.computer < activeCentre.approvedInventory.computers ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {counts.computer < activeCentre.approvedInventory.computers
                      ? `Missing: ${activeCentre.approvedInventory.computers - counts.computer}`
                      : 'Compliant'}
                  </span>
                </div>
              </div>

              {/* Vocational Machines */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Vocational Machinery</span>
                  <span className="text-[10px] text-slate-500">
                    Sanctioned: {activeCentre.approvedInventory.machines}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    {counts.machine} / {activeCentre.approvedInventory.machines}
                  </span>
                  <span
                    className={`block text-[10px] font-bold ${
                      counts.machine < activeCentre.approvedInventory.machines ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {counts.machine < activeCentre.approvedInventory.machines
                      ? `Missing: ${activeCentre.approvedInventory.machines - counts.machine}`
                      : 'Compliant'}
                  </span>
                </div>
              </div>

              {/* Workbenches */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Workbenches</span>
                  <span className="text-[10px] text-slate-500">
                    Sanctioned: {activeCentre.approvedInventory.workbenches}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    {counts.workbench} / {activeCentre.approvedInventory.workbenches}
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-600">Compliant</span>
                </div>
              </div>

              {/* Damaged Equipment Flag */}
              {counts.damaged_equipment > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-900">
                  <div>
                    <span className="font-bold block text-rose-800">Potential Damaged Gear</span>
                    <span className="text-[10px] text-rose-600">Apparent Inoperability Flagged</span>
                  </div>
                  <span className="text-[11px] font-bold bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                    {counts.damaged_equipment} Unit Flagged
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
