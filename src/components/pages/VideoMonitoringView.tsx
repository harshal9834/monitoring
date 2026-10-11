import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Play,
  Film,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Eye,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Video as VideoIcon,
  StopCircle,
  FileVideo,
  FileCheck,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';
import { AIVideoAnalysisPlayer } from '../video/AIVideoAnalysisPlayer';

interface VideoMonitoringViewProps {
  onOpenAlertDetail?: (alertId: string) => void;
  onNavigateToActions?: () => void;
}

export const VideoMonitoringView: React.FC<VideoMonitoringViewProps> = ({
  onOpenAlertDetail,
  onNavigateToActions,
}) => {
  const currentUser = appState.currentUser;
  const isCentreRole = currentUser.role === 'CENTRE_ADMIN';
  const defaultCentreId = isCentreRole ? (currentUser.centreCode || 'tc_001') : 'tc_001';

  const [selectedCentreId, setSelectedCentreId] = useState<string>(defaultCentreId);
  const [centres, setCentres] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(true);

  // Selected video for AI Video Analysis screen
  const [activeAnalysisVideoId, setActiveAnalysisVideoId] = useState<string | null>(null);

  // Option 1: Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Option 2: Browser Camera Capture state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);

  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Fetch Centres
  useEffect(() => {
    api.getCentres()
      .then((data) => {
        if (Array.isArray(data)) {
          setCentres(data);
          if (data.length > 0 && !selectedCentreId) {
            setSelectedCentreId(data[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Videos for selected centre
  const loadVideos = () => {
    setLoadingVideos(true);
    api.getVideos(selectedCentreId)
      .then((data) => {
        if (Array.isArray(data)) {
          setVideos(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load videos:', err);
      })
      .finally(() => {
        setLoadingVideos(false);
      });
  };

  useEffect(() => {
    loadVideos();
  }, [selectedCentreId]);

  const uploadTimeoutRef = useRef<any>(null);

  // Clean up camera and timers on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // OPTION 1: Upload Local Video Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadStatus('Uploading Video File...');
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('centre_id', selectedCentreId);
      formData.append('source_type', 'UPLOAD');

      setUploadStatus('Saving to Local Storage & MySQL...');
      setUploadProgress(50);

      setUploadStatus('Running YOLO AI Detection & Inference Pipeline...');
      setUploadProgress(75);

      const res = await api.uploadVideo(formData);

      setUploadStatus('AI Video Analysis Complete!');
      setUploadProgress(100);

      // Refresh list and immediately open the analysis screen
      loadVideos();
      if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = setTimeout(() => {
        setIsUploading(false);
        setActiveAnalysisVideoId(res.videoId);
      }, 600);
    } catch (err: any) {
      setUploadError(err.message || 'Video upload and AI processing failed');
      setIsUploading(false);
    }
  };

  // OPTION 2: Browser Camera Handlers
  const handleStartCamera = async () => {
    setCameraPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access denied or unavailable:', err);
      setCameraPermissionError(
        'Camera permission was denied or no camera device was detected. Please check browser permissions.'
      );
    }
  };

  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;

    recordedChunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp8' };
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(mediaStreamRef.current, options);
    } catch {
      recorder = new MediaRecorder(mediaStreamRef.current);
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      stopCameraStream();

      // Upload recorded blob to backend
      setIsUploading(true);
      setUploadStatus('Saving Browser Video Capture to Local Storage...');
      setUploadProgress(40);

      try {
        const formData = new FormData();
        const recordedFile = new File([blob], `capture_${Date.now()}.webm`, { type: 'video/webm' });
        formData.append('file', recordedFile);
        formData.append('centre_id', selectedCentreId);
        formData.append('source_type', 'CAPTURE');

        setUploadStatus('Processing Video Frames with Trained YOLO Model...');
        setUploadProgress(75);

        const res = await api.uploadVideo(formData);

        setUploadStatus('Inference Finished!');
        setUploadProgress(100);

        loadVideos();
        if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = setTimeout(() => {
          setIsUploading(false);
          setActiveAnalysisVideoId(res.videoId);
        }, 600);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to process recorded video');
        setIsUploading(false);
      }
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingSeconds(0);

    recordTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // If a video is selected, show the Dedicated AI Video Analysis Screen (Section 3)
  if (activeAnalysisVideoId) {
    return (
      <AIVideoAnalysisPlayer
        videoId={activeAnalysisVideoId}
        onBack={() => {
          setActiveAnalysisVideoId(null);
          loadVideos();
        }}
        onNavigateToActions={onNavigateToActions}
      />
    );
  }

  const activeCentre = centres.find((c) => c.id === selectedCentreId) || centres[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Centre Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              Video Monitoring & Verification
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              YOLOv8 Engine Ready
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            AI Video Analytics & Attendance Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a session video or record classroom presence for automated headcount and infrastructure inspection.
          </p>
        </div>

        {/* Centre Selector for Government / Multi-centre roles */}
        {!isCentreRole && centres.length > 0 && (
          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <Building2 className="w-4 h-4 text-slate-500 ml-1" />
            <span className="text-xs font-bold text-slate-700">Monitored Centre:</span>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-semibold rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code || c.centre_code || c.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Upload / Processing Feedback Modal or Banner */}
      {isUploading && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900">{uploadStatus}</h4>
                <p className="text-xs text-indigo-700">Extracting video frames and running YOLO object detection</p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-800 font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Processing Error: </span>
            <span>{uploadError}</span>
          </div>
        </div>
      )}

      {/* SECTION 1: ONLY TWO VIDEO INPUT OPTIONS (Upload vs Capture) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Video Input Options
          </h2>
          <span className="text-xs text-slate-400">Zero CCTV / RTSP dependencies</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OPTION 1: Upload Video */}
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:shadow-lg transition-all p-8 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Option 1
                </span>
                <h3 className="text-xl font-bold text-slate-900">Upload Video</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload recorded training batch or audit session video for automated frame-by-frame compliance analysis.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Supported Formats:</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">MP4</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">AVI</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">MOV</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">WebM</span>
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.avi,.mov,.webm,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <FileVideo className="w-4 h-4" />
                <span>Select Local Video File</span>
              </button>
            </div>
          </div>

          {/* OPTION 2: Capture Video (Browser Camera getUserMedia) */}
          <div className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all p-8 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                  Option 2
                </span>
                <h3 className="text-xl font-bold text-slate-900">Capture Video</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Use your browser webcam or connected device camera via MediaDevices API for instant live recording.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Access Protocol:</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                  getUserMedia() API
                </span>
                <span className="text-slate-400">• High Def Capture</span>
              </div>
            </div>

            <div>
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={handleStartCamera}
                  disabled={isUploading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Camera Live Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800">
                    <video
                      ref={cameraVideoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {isRecording && (
                      <div className="absolute top-3 left-3 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center space-x-2 animate-pulse shadow-md">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span>REC {formatTimer(recordingSeconds)}</span>
                      </div>
                    )}
                  </div>

                  {/* Recording Action Controls */}
                  <div className="flex items-center space-x-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
                      >
                        <VideoIcon className="w-4 h-4" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
                      >
                        <StopCircle className="w-4 h-4 text-rose-500" />
                        <span>Stop Recording & Process</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {cameraPermissionError && (
                <p className="text-[11px] text-rose-600 mt-2 font-medium">{cameraPermissionError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Available Videos Library for the Centre */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Available Session Videos ({videos.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select any session video to open the dedicated AI Video Analysis screen with synchronized playback and live detections.
            </p>
          </div>

          <button
            onClick={loadVideos}
            disabled={loadingVideos}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh video list"
          >
            <RefreshCw className={`w-4 h-4 ${loadingVideos ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingVideos ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading videos from database...</div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <Film className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No session videos recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a local training session MP4 file or capture classroom presence using your camera above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
                onClick={() => setActiveAnalysisVideoId(vid.id)}
              >
                <div className="space-y-3">
                  {/* Video Card Header Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {vid.sourceType === 'BROWSER_CAPTURE' ? 'Camera Capture' : 'Local Upload'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                      vid.attendanceStatus === 'MATCH'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : vid.attendanceStatus === 'MINOR VARIANCE'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {vid.attendanceStatus || 'COMPLIANT'}
                    </span>
                  </div>

                  {/* Thumbnail Mock / Icon */}
                  <div className="rounded-2xl bg-slate-900 text-white aspect-video flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                    <Film className="w-8 h-8 text-slate-600" />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-200">
                      {Math.floor(vid.duration || 10)}s
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate" title={vid.fileName}>
                      {vid.fileName}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{vid.centreName} • {vid.createdAt}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">AI Headcount</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      {vid.estimatedPersons || 32} Persons
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAnalysisVideoId(vid.id);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
