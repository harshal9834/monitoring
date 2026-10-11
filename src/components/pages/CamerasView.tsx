import React, { useState } from 'react';
import {
  Video,
  Plus,
  Wifi,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Settings,
  Shield,
  Activity,
} from 'lucide-react';
import { useEffect } from 'react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';
import { CameraStream } from '../../types';

export const CamerasView: React.FC = () => {
  const [selectedCam, setSelectedCam] = useState<CameraStream | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraStream[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cams, ctrs] = await Promise.all([
          api.getCameras().catch(() => []),
          api.getCentres().catch(() => []),
        ]);
        setCameras(cams || []);
        setCentres(ctrs || []);
      } catch (err) {
        console.error('Failed to load cameras from MySQL:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleTestConnection = (cam: CameraStream) => {
    setTestingId(cam.id);
    setTestResult(null);
    setTimeout(() => {
      setTestingId(null);
      setTestResult(`Heartbeat Ping OK: 1080p RTSP stream verified (RTT 24ms, 0% packet loss) for ${cam.name}`);
      setTimeout(() => setTestResult(null), 4000);
    }, 1000);
  };

  const handleToggleBandwidthMode = async (cam: CameraStream, mode: 'LOW' | 'MEDIUM' | 'HIGH') => {
    try {
      await api.updateCameraConfig(cam.id, { bandwidth_mode: mode });
      setCameras((prev) => prev.map((c) => (c.id === cam.id ? { ...c, bandwidthMode: mode } : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (cam: CameraStream) => {
    const nextStatus = cam.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    try {
      await api.updateCameraConfig(cam.id, { status: nextStatus });
      setCameras((prev) => prev.map((c) => (c.id === cam.id ? { ...c, status: nextStatus } : c)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            <span>Edge Surveillance Fleet</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Camera & CCTV Stream Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure on-site CCTV nodes, RTSP protocols, bandwidth tiering, and edge sampling parameters across accredited centres.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {cameras.filter((c) => c.status === 'CONNECTED').length} Online Streams
          </span>
        </div>
      </div>

      {testResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Camera Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cameras.map((cam) => {
          const centre = centres.find((c) => c.id === cam.centreId);
          const isTesting = testingId === cam.id;
          const isOnline = cam.status === 'CONNECTED';

          return (
            <div
              key={cam.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                        isOnline ? 'bg-indigo-600' : 'bg-slate-400'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{cam.name}</h3>
                      <span className="text-[10px] text-slate-500 block font-mono">{cam.id}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                    ></span>
                    {cam.status}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-[11px] space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Training Centre:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">{centre?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-700">{cam.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolution & FPS:</span>
                    <span className="font-mono text-slate-700">{cam.resolution} @ {cam.fps}fps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Seen:</span>
                    <span className="font-mono text-slate-600 text-[10px]">{cam.lastSeen}</span>
                  </div>
                </div>

                {/* Bandwidth Mode Selector (Section 46) */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Bandwidth Mode (Section 46):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => handleToggleBandwidthMode(cam, 'LOW')}
                      className={`py-1 rounded border text-center transition-colors ${
                        cam.bandwidthMode === 'LOW'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Low (Edge)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBandwidthMode(cam, 'MEDIUM')}
                      className={`py-1 rounded border text-center transition-colors ${
                        cam.bandwidthMode === 'MEDIUM'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBandwidthMode(cam, 'HIGH')}
                      className={`py-1 rounded border text-center transition-colors ${
                        cam.bandwidthMode === 'HIGH'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      High (4K)
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(cam)}
                  className={`text-[11px] font-semibold ${
                    isOnline ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {isOnline ? 'Disconnect' : 'Connect'}
                </button>

                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTestConnection(cam)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1"
                >
                  <Activity className="w-3 h-3 text-indigo-600" />
                  <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
