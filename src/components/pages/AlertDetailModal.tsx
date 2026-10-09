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
} from 'lucide-react';
import { ComplianceAlert, ActionPriority } from '../../types';
import { appState } from '../../services/storage';

interface AlertDetailModalProps {
  alert: ComplianceAlert | null;
  onClose: () => void;
  onActionCreated?: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onActionCreated,
}) => {
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [actionPriority, setActionPriority] = useState<ActionPriority>('HIGH');
  const [dueDate, setDueDate] = useState('2026-10-15 17:00:00');
  const [actionSuccess, setActionSuccess] = useState(false);

  if (!alert) return null;

  const handleConfirm = () => {
    appState.updateAlertStatus(alert.id, 'CONFIRMED', 'Confirmed by Monitoring Officer after visual review');
    onClose();
  };

  const handleFalsePositive = () => {
    appState.updateAlertStatus(alert.id, 'FALSE_POSITIVE', 'Officer confirmed lighting artifact or false detection');
    onClose();
  };

  const handleOpenActionForm = () => {
    setActionTitle(`Remediation Notice: ${alert.title}`);
    setActionDescription(
      `Compliance Notice issued for ${alert.centreName}. Discrepancy observed in CCTV scan at ${alert.detectedTime}: ${alert.description}. Provide written justification and proof within 72 hours.`
    );
    setShowActionForm(true);
  };

  const handleCreateActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    appState.createAction({
      alertId: alert.id,
      centreId: alert.centreId,
      title: actionTitle,
      description: actionDescription,
      issueCategory: alert.category,
      priority: actionPriority,
      dueDate,
    });
    setActionSuccess(true);
    setTimeout(() => {
      onClose();
      if (onActionCreated) onActionCreated();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold ${
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
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
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
                <span className="text-[10px] text-slate-400">• {alert.detectedTime}</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">{alert.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Evidence & Metadata Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Snapshot Image Evidence (Section 19) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Computer Vision Snapshot Evidence
              </span>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-xs group">
                <img
                  src={alert.evidence.snapshotUrl}
                  alt="AI Detection Snapshot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  {alert.evidence.cameraName}
                </div>
                <div className="absolute bottom-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  AI CONFIDENCE: {(alert.aiConfidence * 100).toFixed(1)}%
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Frame captured automatically upon discrepancy threshold breach.
              </p>
            </div>

            {/* Right: Technical Observation Details */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Observed vs Sanctioned Values
              </span>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Audited Centre:</span>
                  <span className="font-bold text-slate-900">{alert.centreName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Violation Category:</span>
                  <span className="font-semibold text-slate-800">
                    {alert.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Expected Value:</span>
                  <span className="font-bold text-slate-900">{alert.evidence.expectedCount} Units</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">AI Detected Presence:</span>
                  <span className="font-bold text-rose-600">{alert.evidence.detectedCount} Units</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Detection Model:</span>
                  <span className="font-mono text-[11px] text-slate-600">{alert.evidence.modelVersion}</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold block">AI Inference Description:</span>
                <p className="text-[11px] leading-relaxed text-amber-800">{alert.description}</p>
              </div>
            </div>
          </div>

          {/* Corrective Action Form Section */}
          {showActionForm ? (
            <form onSubmit={handleCreateActionSubmit} className="bg-slate-50 border border-indigo-200 rounded-xl p-5 space-y-4">
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
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

        {/* Modal Footer (Section 37 Action Triggers) */}
        {!showActionForm && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleConfirm}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirm Issue</span>
              </button>

              <button
                onClick={handleFalsePositive}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Mark False Positive</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenActionForm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Create Corrective Action Notice</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
