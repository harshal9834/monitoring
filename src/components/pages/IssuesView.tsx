import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Filter,
  Eye,
  Send,
  Loader2,
  Clock,
  ArrowRight,
  Trash2,
  Check,
  X,
  Play,
  Video,
  Building2,
  Layers,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../common/Sidebar';
import { AlertDetailModal } from './AlertDetailModal';
import { ComplianceAlert } from '../../types';

interface IssuesViewProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const IssuesView: React.FC<IssuesViewProps> = ({ onNavigate }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<ComplianceAlert | null>(null);
  const [dismissTarget, setDismissTarget] = useState<any | null>(null);
  const [dismissReason, setDismissReason] = useState<string>('');
  const [isDismissing, setIsDismissing] = useState<boolean>(false);

  const fetchIssues = (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    api.getAlerts({ severity: severityFilter !== 'ALL' ? severityFilter : undefined })
      .then((data) => {
        const rawAlerts = Array.isArray(data) ? data : ((data as any)?.data || []);
        // Exclude soft-deleted or dismissed alerts
        const activeAlerts = rawAlerts.filter((a: any) => !a.is_deleted && a.status !== 'DISMISSED');
        setIssues(activeAlerts);
        if (isInitial) setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load issues from MySQL:', err);
        setError('Failed to load alerts from backend server. Please check database connection.');
        if (isInitial) setLoading(false);
      });
  };

  useEffect(() => {
    fetchIssues(true);
    const interval = setInterval(() => fetchIssues(false), 10000);
    const handleRefresh = () => fetchIssues(false);
    window.addEventListener('skillguard:refresh-stats', handleRefresh);
    window.addEventListener('skillguard:ai-analysis-completed', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('skillguard:refresh-stats', handleRefresh);
      window.removeEventListener('skillguard:ai-analysis-completed', handleRefresh);
    };
  }, [severityFilter]);

  const filteredIssues = issues.filter((iss) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        iss.title?.toLowerCase().includes(q) ||
        iss.centreName?.toLowerCase().includes(q) ||
        iss.centreId?.toLowerCase().includes(q) ||
        iss.center_id?.toLowerCase().includes(q) ||
        iss.description?.toLowerCase().includes(q) ||
        iss.assetType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = issues.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = issues.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>AI Automated Issue Detection Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alerts & Issues</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time compliance anomalies, infrastructure count reductions, and attendance variances flagged across accredited centres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span>{criticalCount} Critical</span>
          </div>
          {highCount > 0 && (
            <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-semibold text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>{highCount} High</span>
            </div>
          )}
          <button
            onClick={() => onNavigate('notices')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Manage Notices →
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search issues by centre, asset, title, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <span>{error}</span>
          <button
            onClick={() => fetchIssues(true)}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg font-semibold hover:bg-rose-100 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading active alerts and issues...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Active Issues Flagged</h3>
          <p className="text-xs text-slate-500">All accredited centres are operating within statutory tolerances.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((iss) => {
            const isCrit = (iss.severity || '').toUpperCase() === 'CRITICAL';
            const isHigh = (iss.severity || '').toUpperCase() === 'HIGH';
            const isInfra = iss.category === 'INFRASTRUCTURE_SHORTAGE' || Boolean(iss.assetType);
            const clipUrl = iss.evidenceClipUrl || iss.evidence?.videoClipUrl;

            // Formatted infrastructure attributes
            const centreName = iss.centreName || 'Accredited Training Centre';
            const centreId = iss.centreId || iss.center_id || 'TC-N/A';
            const assetType = iss.assetType ? iss.assetType.toUpperCase() : 'ASSETS / EQUIPMENT';
            const approved = iss.approvedCount !== undefined ? iss.approvedCount : (iss.submittedValue ?? 0);
            const detected = iss.detectedCount !== undefined ? iss.detectedCount : (iss.aiValue ?? 0);
            const diff = iss.difference !== undefined ? iss.difference : -(iss.variance ?? 0);
            const timestamp = iss.eventTimestamp || iss.detectedTime || '00:00:00';

            return (
              <div
                key={iss.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md ${
                  isInfra
                    ? 'border-rose-200 bg-linear-to-r from-rose-50/20 via-white to-white'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Heading and Identity */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                        {iss.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {iss.severity}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {iss.category ? iss.category.replace('_', ' ') : 'COMPLIANCE'}
                      </span>
                      {clipUrl && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Video className="w-3 h-3 text-indigo-600" />
                          <span>Evidence Clip Attached</span>
                        </span>
                      )}
                    </div>

                    {/* Infrastructure Special Formatted Alert Header */}
                    {isInfra ? (
                      <div>
                        <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-sm">
                          <span className="text-base">🚨</span>
                          <span>Potential Infrastructure Count Reduction</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Review Required: Government-approved baseline differs from AI observed presence.
                        </p>
                      </div>
                    ) : (
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {iss.title}
                      </h3>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mt-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Centre:</span>
                        <span className="font-bold text-slate-800 truncate block">{centreName}</span>
                        <span className="font-mono text-[10px] text-slate-500 block">ID: {centreId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Asset:</span>
                        <span className="font-bold text-indigo-700 truncate block">{assetType}</span>
                        <span className="text-[10px] text-slate-500 block">Status: {iss.status || 'NEW'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved vs Detected:</span>
                        <span className="font-semibold text-slate-700">Approved: <strong>{approved}</strong></span>
                        <span className="font-bold text-rose-600 block">Detected: <strong>{detected}</strong></span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Difference & Time:</span>
                        <span className="font-bold text-rose-700 block">Difference: {diff}</span>
                        <span className="font-mono text-[10px] text-slate-500 block">At: {timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Evidence Clip & Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between sm:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => setSelectedAlertForModal(iss as ComplianceAlert)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-w-[150px]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>View Evidence Clip</span>
                    </button>

                    <button
                      onClick={() => setSelectedAlertForModal(iss as ComplianceAlert)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 min-w-[150px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Review Alert</span>
                    </button>

                    <button
                      onClick={() => setDismissTarget(iss)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      title="Dismiss Issue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dismiss Confirmation Modal */}
      {dismissTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Dismiss / Archive Issue</h3>
              </div>
              <button
                onClick={() => { setDismissTarget(null); setDismissReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to dismiss this issue? It will be archived with an immutable audit log entry.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Centre:</span>
                <span className="font-semibold text-slate-800">{dismissTarget.centreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Title:</span>
                <span className="font-semibold text-slate-800">{dismissTarget.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Severity:</span>
                <span className="font-bold text-rose-600">{dismissTarget.severity}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Dismissal / Resolution Reason:
              </label>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Verified by field inspection, recognized false positive, manual audit cleared..."
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setDismissTarget(null); setDismissReason(''); }}
                disabled={isDismissing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDismissing}
                onClick={async () => {
                  try {
                    setIsDismissing(true);
                    await api.dismissAlert(
                      dismissTarget.id,
                      dismissReason || 'Dismissed by Government Officer'
                    );
                    setIssues((prev) => prev.filter((i) => i.id !== dismissTarget.id));
                    setDismissTarget(null);
                    setDismissReason('');
                    window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
                  } catch (err: any) {
                    alert(err.message || 'Failed to dismiss issue');
                  } finally {
                    setIsDismissing(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isDismissing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDismissing ? 'Dismissing...' : 'Confirm Dismiss'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Evidence Player & Notice Modal */}
      {selectedAlertForModal && (
        <AlertDetailModal
          alert={selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
          onActionCreated={() => {
            fetchIssues(false);
            window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
          }}
          onAlertUpdated={(alertId, newStatus) => {
            if (newStatus === 'DISMISSED') {
              setIssues((prev) => prev.filter((i) => i.id !== alertId));
            } else {
              setIssues((prev) => prev.map((i) => i.id === alertId ? { ...i, status: newStatus } : i));
            }
            window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
          }}
        />
      )}
    </div>
  );
};
