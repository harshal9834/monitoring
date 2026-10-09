import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Shield,
  Wifi,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { appState } from '../../services/storage';

export const SettingsView: React.FC = () => {
  const currentSettings = appState.settings;

  const [wAttendance, setWAttendance] = useState(currentSettings.complianceWeightAttendance);
  const [wInfra, setWInfra] = useState(currentSettings.complianceWeightInfrastructure);
  const [wAction, setWAction] = useState(currentSettings.complianceWeightActions);

  const [thWarning, setThWarning] = useState(currentSettings.attendanceWarningThresholdPercent);
  const [thCritical, setThCritical] = useState(currentSettings.attendanceCriticalThresholdPercent);

  const [lowBandwidth, setLowBandwidth] = useState(currentSettings.lowBandwidthModeEnabled);
  const [samplingFps, setSamplingFps] = useState(currentSettings.frameSamplingRateFps);
  const [escalationDays, setEscalationDays] = useState(currentSettings.autoEscalationDaysOverdue);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalWeights = Number(wAttendance) + Number(wInfra) + Number(wAction);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeights !== 100) {
      alert(`Weights must sum to 100%. Current total: ${totalWeights}%`);
      return;
    }

    appState.updateSettings({
      complianceWeightAttendance: Number(wAttendance),
      complianceWeightInfrastructure: Number(wInfra),
      complianceWeightActions: Number(wAction),
      attendanceWarningThresholdPercent: Number(thWarning),
      attendanceCriticalThresholdPercent: Number(thCritical),
      lowBandwidthModeEnabled: lowBandwidth,
      frameSamplingRateFps: Number(samplingFps),
      autoEscalationDaysOverdue: Number(escalationDays),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all demo data and system settings back to default values?')) {
      appState.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Platform Configuration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Compliance Engine & Monitoring Rules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure scoring weights, anomaly alert thresholds, edge video sampling, and auto-escalation schedules
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 self-start md:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Reset Factory Data</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 17: Compliance Scoring Formula Weights */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Statutory Compliance Score Weights (Section 17)
              </h3>
              <p className="text-xs text-slate-500">
                Formula: Overall Score = (Attendance × wA + Infrastructure × wI + Action Resolution × wR) / 100
              </p>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                totalWeights === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              Sum: {totalWeights}% {totalWeights === 100 ? '✓' : '(Must equal 100%)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Attendance Compliance Weight:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wAttendance}
                  onChange={(e) => setWAttendance(Number(e.target.value))}
                  className="w-24 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                />
                <span className="font-semibold text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 40%</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Infrastructure Compliance Weight:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wInfra}
                  onChange={(e) => setWInfra(Number(e.target.value))}
                  className="w-24 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                />
                <span className="font-semibold text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 35%</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Action Closure Compliance Weight:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wAction}
                  onChange={(e) => setWAction(Number(e.target.value))}
                  className="w-24 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                />
                <span className="font-semibold text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 25%</span>
            </div>
          </div>
        </div>

        {/* Section 13: Attendance Discrepancy Thresholds */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Attendance Discrepancy Tolerances (Section 13)
            </h3>
            <p className="text-xs text-slate-500">
              Thresholds for triggering automated audit warnings and critical compliance notices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Warning Threshold (5-10% typical):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={thWarning}
                  onChange={(e) => setThWarning(Number(e.target.value))}
                  className="w-28 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                />
                <span className="font-semibold text-slate-500">% Discrepancy</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Differences above this trigger an Amber Warning badge.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Critical Alert Threshold (10%+ typical):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={thCritical}
                  onChange={(e) => setThCritical(Number(e.target.value))}
                  className="w-28 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-rose-600"
                />
                <span className="font-semibold text-slate-500">% Discrepancy</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Differences above this automatically generate an urgent AI alert notice.
              </span>
            </div>
          </div>
        </div>

        {/* Section 24 & 32: Edge Video & Escalation Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Edge Optimization & Statutory Escalation (Section 24 & 32)
            </h3>
            <p className="text-xs text-slate-500">
              Low-bandwidth telemetry streaming and time-based escalation ladders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Default Frame Sampling Rate:
              </label>
              <select
                value={samplingFps}
                onChange={(e) => setSamplingFps(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              >
                <option value={1}>1 FPS (Ultra Low Bandwidth)</option>
                <option value={5}>5 FPS (Recommended Standard)</option>
                <option value={10}>10 FPS (High Precision)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Days Before Notice Overdue:
              </label>
              <input
                type="number"
                value={escalationDays}
                onChange={(e) => setEscalationDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: 3 business days cure period.
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={lowBandwidth}
                  onChange={(e) => setLowBandwidth(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span>Enable Edge Low-Bandwidth Mode</span>
              </label>
              <span className="text-[10px] text-slate-400 mt-1">
                Only transmits metadata & alerts instead of raw video feed.
              </span>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold animate-fadeIn">
            ✓ System settings updated successfully and centre compliance scores recalculated!
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Apply Monitoring Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
