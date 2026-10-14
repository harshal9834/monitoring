import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  XCircle,
  ClipboardList,
  Eye,
  Camera,
  Search,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';
import { ComplianceAlert, AlertSeverity, AlertCategory } from '../../types';
import { AlertDetailModal } from './AlertDetailModal';

interface AlertsViewProps {
  onNavigateToActions?: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onNavigateToActions }) => {
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const currentUser = appState.currentUser;
  const isCentreRole = currentUser.role === 'CENTRE_ADMIN';

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const data = isCentreRole
          ? await api.getCentreAlerts()
          : await api.getAlerts({ severity: filterSeverity !== 'ALL' ? filterSeverity : undefined });
        if (isMounted) {
          setAlerts(Array.isArray(data) ? data : []);
          if (isInitial) setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load alerts from MySQL:', err);
        if (isMounted) {
          setAlerts([]);
          if (isInitial) setLoading(false);
        }
      }
    };
    fetchAlerts(true);
    const interval = setInterval(() => {
      fetchAlerts(false);
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [filterSeverity, isCentreRole]);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterCategory !== 'ALL' && a.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.centreName.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter((a) => a.severity === 'MEDIUM').length;


  return (
    <div className="space-y-6">
      {/* Top Header & Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>AI Automated Issue Detection</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Compliance Alerts & Evidence Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time anomalies detected via Ultralytics YOLOv8m vision inference
          </p>
        </div>

        {/* Severities Quick Counter Pills */}
        <div className="flex items-center space-x-2 text-xs shrink-0">
          <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span>{criticalCount} Critical</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>{highCount} High</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold flex items-center gap-1.5">
            <span>{mediumCount} Medium</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by centre name, alert title, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="ATTENDANCE_MISMATCH">Attendance Mismatch</option>
              <option value="INFRASTRUCTURE_SHORTAGE">Infrastructure Shortage</option>
              <option value="EQUIPMENT_DAMAGE">Equipment Damage</option>
              <option value="OVERDUE_ACTION">Overdue Action</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ACTION_CREATED">Action Created</option>
              <option value="FALSE_POSITIVE">False Positive</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Grid / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-2" />
          <p className="text-sm font-medium text-slate-600">Querying MySQL Alert Records...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No compliance alerts detected</p>
          <p className="text-xs text-slate-500">All centres and AI monitoring streams are operating within normal parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';

            return (
              <div
                key={alert.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left thumbnail & title */}
              <div className="flex items-start space-x-4">
                <div
                  onClick={() => setSelectedAlert(alert)}
                  className="w-24 h-16 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-200 cursor-pointer relative group"
                >
                  <img
                    src={alert.evidence.snapshotUrl}
                    alt={alert.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      {alert.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">• {alert.detectedTime}</span>
                  </div>

                  <h3
                    onClick={() => setSelectedAlert(alert)}
                    className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {alert.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-1">{alert.description}</p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">{alert.centreName}</span>
                    <span>•</span>
                    <span>
                      Observed: <strong className="text-rose-600">{alert.detectedCount ?? alert.evidence.detectedCount}</strong> / Expected: {alert.approvedCount ?? alert.evidence.expectedCount}
                    </span>
                    {alert.difference !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-rose-600">
                          Discrepancy: {alert.difference}
                        </span>
                      </>
                    )}
                    {alert.assetType && (
                      <>
                        <span>•</span>
                        <span className="bg-slate-100 font-medium px-1.5 py-0.5 rounded text-[10px]">
                          Asset: {alert.assetType}
                        </span>
                      </>
                    )}
                    {(alert.evidenceClipUrl || alert.evidence.videoClipUrl) && (
                      <>
                        <span>•</span>
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-indigo-200">
                          Evidence Clip Available
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>AI Confidence: {(alert.aiConfidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Evidence Clip</span>
                </button>

                {alert.status === 'NEW' && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await api.resolveAlert(alert.id, 'Confirmed by Officer');
                          setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: 'CONFIRMED' } : a));
                        } catch (e) {
                          setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: 'CONFIRMED' } : a));
                        }
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      title="Confirm Issue"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await api.dismissAlert(alert.id, 'Dismissed by Officer');
                          setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: 'DISMISSED' } : a));
                        } catch (e) {
                          setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: 'DISMISSED' } : a));
                        }
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      title="Mark False Positive / Dismiss"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                    </button>
                  </>
                )}

                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded ${
                    alert.status === 'RESOLVED' || alert.status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : alert.status === 'ACTION_CREATED'
                      ? 'bg-indigo-100 text-indigo-800'
                      : alert.status === 'DISMISSED' || alert.status === 'FALSE_POSITIVE'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {alert.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Evidence Inspection & Action Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onActionCreated={onNavigateToActions}
          onAlertUpdated={(alertId, newStatus) => {
            setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, status: newStatus as any } : a));
          }}
        />
      )}
    </div>
  );
};
