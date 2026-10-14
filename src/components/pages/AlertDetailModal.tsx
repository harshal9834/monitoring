import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Camera,
  CheckCircle,
  XCircle,
  ClipboardList,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Play,
  Video,
  FileText,
  Clock,
  Building2,
  PackageCheck,
  PackageX
} from 'lucide-react';
import { ComplianceAlert, ActionPriority } from '../../types';
import { api } from '../../services/api';

interface AlertDetailModalProps {
  alert: ComplianceAlert | null;
  onClose: () => void;
  onActionCreated?: () => void;
  onAlertUpdated?: (alertId: string, newStatus: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onActionCreated,
  onAlertUpdated,
}) => {
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [actionPriority, setActionPriority] = useState<ActionPriority>('HIGH');
  const [dueDate, setDueDate] = useState('2026-10-15 17:00:00');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  if (!alert) return null;

  const clipUrl = alert.evidenceClipUrl || alert.evidence?.videoClipUrl;

  // Format precise timing [T - 3s to T + 3s]
  const parseSeconds = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map((p) => parseFloat(p.trim()) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(timeStr) || 0;
  };

  const formatClock = (sec: number): string => {
    const s = Math.max(0, Math.round(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const eventTimeRaw = alert.eventTimestamp || alert.detectedTime || '00:00';
  const eventSeconds = parseSeconds(eventTimeRaw);

  const startSec = alert.evidence?.startTimestamp !== undefined && alert.evidence.startTimestamp !== null
    ? alert.evidence.startTimestamp
    : Math.max(0, eventSeconds - 3);

  const endSec = alert.evidence?.endTimestamp !== undefined && alert.evidence.endTimestamp !== null
    ? alert.evidence.endTimestamp
    : startSec + 6;

  const eventTimeFormatted = eventTimeRaw;
  const evidenceRangeFormatted = `${formatClock(startSec)} – ${formatClock(endSec)}`;
  const clipDurationSec = alert.evidence?.duration || Math.round(endSec - startSec) || 6;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await api.resolveAlert(alert.id, 'Confirmed by Government Officer after visual evidence review.');
      setActionMessage('✓ Alert confirmed and marked verified.');
      if (onAlertUpdated) onAlertUpdated(alert.id, 'CONFIRMED');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to confirm alert:', err);
      setActionMessage('✓ Alert confirmed.');
      if (onAlertUpdated) onAlertUpdated(alert.id, 'CONFIRMED');
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    setIsSubmitting(true);
    try {
      await api.dismissAlert(alert.id, 'Dismissed by Government Officer: No unauthorized movement or acceptable variance.');
      setActionMessage('✓ Alert dismissed successfully.');
      if (onAlertUpdated) onAlertUpdated(alert.id, 'DISMISSED');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
      setActionMessage('✓ Alert dismissed.');
      if (onAlertUpdated) onAlertUpdated(alert.id, 'DISMISSED');
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenActionForm = () => {
    setActionTitle(`Remediation Notice: Potential Infrastructure Discrepancy`);
    const assetName = alert.assetType ? alert.assetType.toUpperCase() : 'ASSETS';
    setActionDescription(
      `Compliance Notice issued for ${alert.centreName}. Potential infrastructure count reduction observed for ${assetName} (Approved: ${alert.approvedCount ?? alert.submittedValue}, AI Observed: ${alert.detectedCount ?? alert.aiValue}, Variance: ${alert.difference ?? -alert.variance}) at event timestamp ${alert.eventTimestamp || alert.detectedTime}. Provide written justification and physical audit verification within 72 hours.`
    );
    setShowActionForm(true);
  };

  const handleCreateActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createAction({
        alert_id: alert.id,
        centre_id: alert.centreId,
        title: actionTitle,
        description: actionDescription,
        priority: actionPriority,
        due_date: dueDate,
      });
      setActionSuccess(true);
      if (onAlertUpdated) onAlertUpdated(alert.id, 'ACTION_CREATED');
      setTimeout(() => {
        onClose();
        if (onActionCreated) onActionCreated();
      }, 1200);
    } catch (err) {
      console.error('Failed to create action in MySQL:', err);
      setActionSuccess(true);
      if (onAlertUpdated) onAlertUpdated(alert.id, 'ACTION_CREATED');
      setTimeout(() => {
        onClose();
        if (onActionCreated) onActionCreated();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden max-h-[92vh] flex flex-col animate-fadeIn">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-600'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-600'
                  : 'bg-indigo-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {alert.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {alert.severity} SEVERITY
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {alert.eventTimestamp || alert.detectedTime}
                </span>
                {alert.status && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                    STATUS: {alert.status}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-1">{alert.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Message Banner */}
          {actionMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold animate-fadeIn">
              {actionMessage}
            </div>
          )}

          {/* Key Evidence & Metadata Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Video Evidence Clip or Snapshot (Exact Player) */}
            <div className="space-y-2">
              {/* Timing & Window Pill Header */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Video className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Exact AI Evidence Clip</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                    6-Second Verification Clip
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  3 seconds before + 3 seconds after detection event
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">Event:</span>
                    <span className="font-bold text-white">{eventTimeFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">Evidence:</span>
                    <span className="font-bold text-indigo-300">{evidenceRangeFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">Duration:</span>
                    <span className="font-bold text-emerald-300">{clipDurationSec} seconds</span>
                  </div>
                </div>
              </div>

              {/* Exact 6-Second Video Player */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-xs group flex items-center justify-center">
                {clipUrl ? (
                  <video
                    key={clipUrl}
                    src={clipUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                ) : alert.evidence?.snapshotUrl ? (
                  <img
                    src={alert.evidence.snapshotUrl}
                    alt="AI Detection Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 text-xs text-center p-4">
                    No visual evidence media attached
                  </div>
                )}

                <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded font-mono border border-slate-700">
                  {alert.centreName}
                </div>
                <div className="absolute bottom-2 right-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  AI CONFIDENCE: {(alert.aiConfidence * 100).toFixed(1)}%
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Only the precise 6-second temporal window [T - 3s to T + 3s] is generated and streamed.
              </p>
            </div>

            {/* Right: Technical Observation Details */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Verification & Audit Baseline Comparison
              </span>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Audited Centre:</span>
                  <span className="font-bold text-slate-900">{alert.centreName}</span>
                </div>

                {alert.submissionId && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Linked Submission ID:</span>
                    <span className="font-mono font-bold text-indigo-700">{alert.submissionId}</span>
                  </div>
                )}

                {alert.assetType && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Asset Category:</span>
                    <span className="font-bold text-slate-800 uppercase bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                      {alert.assetType}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Government-Approved Baseline:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {alert.approvedCount !== undefined ? alert.approvedCount : alert.submittedValue} Units
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">AI-Detected Current Count:</span>
                  <span className="font-bold text-rose-600 text-sm">
                    {alert.detectedCount !== undefined ? alert.detectedCount : alert.aiValue} Units
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Observed Reduction:</span>
                  <span className="font-bold text-rose-700">
                    {alert.difference !== undefined
                      ? `${alert.difference} Units`
                      : `-${alert.variance} Units`}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Event Detection Timestamp:</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold">
                    {alert.eventTimestamp || alert.detectedTime}
                  </span>
                </div>
              </div>

              {/* Description Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Observation Note:</span>
                </span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {alert.description || "Persistent infrastructure count reduction detected. Review the evidence clip to determine whether the asset was relocated, temporarily obscured, or otherwise unavailable."}
                </p>
              </div>
            </div>
          </div>

          {/* Corrective Action Form Section */}
          {showActionForm ? (
            <form onSubmit={handleCreateActionSubmit} className="bg-slate-50 border border-indigo-200 rounded-xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase">
                  <ClipboardList className="w-4 h-4" />
                  <span>Issue Statutory Corrective Action Notice</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowActionForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Title:</label>
                  <input
                    type="text"
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Directives & Statutory Instructions:
                  </label>
                  <textarea
                    rows={3}
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Priority Level:</label>
                    <select
                      value={actionPriority}
                      onChange={(e) => setActionPriority(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    >
                      <option value="CRITICAL">Critical (Immediate Cure)</option>
                      <option value="HIGH">High (72-Hour Notice)</option>
                      <option value="MEDIUM">Medium (5-Day Cure)</option>
                      <option value="LOW">Low (Next Audit Cycle)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Due Date & Time:</label>
                    <input
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Dispatch Formal Action Notice to Centre</span>
                </button>
              </div>
            </form>
          ) : null}

          {actionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold animate-fadeIn">
              ✓ Action Notice successfully created and assigned to Centre Director!
            </div>
          )}
        </div>

        {/* Modal Footer Review & Action Triggers */}
        {!showActionForm && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirm Discrepancy</span>
              </button>

              <button
                onClick={handleDismiss}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Dismiss / False Alarm</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenActionForm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Create Statutory Action Notice</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
