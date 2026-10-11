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
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface IssuesViewProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const IssuesView: React.FC<IssuesViewProps> = ({ onNavigate }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [dismissTarget, setDismissTarget] = useState<any | null>(null);
  const [dismissReason, setDismissReason] = useState<string>('');
  const [isDismissing, setIsDismissing] = useState<boolean>(false);

  const fetchIssues = (isInitial = false) => {
    if (isInitial) setLoading(true);
    api.getAlerts({ severity: severityFilter !== 'ALL' ? severityFilter : undefined })
      .then((data) => {
        setIssues(Array.isArray(data) ? data : []);
        if (isInitial) setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load issues:', err);
        if (isInitial) setLoading(false);
      });
  };

  useEffect(() => {
    fetchIssues(true);
    const interval = setInterval(() => fetchIssues(false), 10000);
    return () => clearInterval(interval);
  }, [severityFilter]);

  const filteredIssues = issues.filter((iss) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        iss.title?.toLowerCase().includes(q) ||
        iss.centreName?.toLowerCase().includes(q) ||
        iss.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>AI Automated Issue Detection Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alerts & Issues</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time compliance anomalies and variances flagged by the Ultralytics YOLOv8m vision pipeline across vocational centres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span>{issues.filter(i => i.severity === 'CRITICAL').length} Critical</span>
          </div>
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
            placeholder="Search issues by centre, title, or description..."
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

      {/* Issues Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading issues from MySQL...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Active Issues Flagged</h3>
          <p className="text-xs text-slate-500">All accredited centres are operating within statutory tolerances.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Issue ID & Centre</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type & Description</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((iss) => {
                  const isCrit = iss.severity === 'CRITICAL';
                  const isHigh = iss.severity === 'HIGH';
                  return (
                    <tr key={iss.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-slate-400 block">{iss.id}</span>
                        <span className="font-bold text-slate-900 block">{iss.centreName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100">
                          {iss.category ? iss.category.replace('_', ' ') : 'COMPLIANCE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <span className="font-bold text-slate-800 block">{iss.title}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{iss.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {iss.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {iss.status || 'NEW'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onNavigate('ai_analysis', iss.centreId)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review AI</span>
                          </button>
                          <button
                            onClick={() => setDismissTarget(iss)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Dismiss / Remove Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {filteredIssues.map((iss) => {
              const isCrit = iss.severity === 'CRITICAL';
              const isHigh = iss.severity === 'HIGH';
              return (
                <div key={iss.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">{iss.id}</span>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{iss.title}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{iss.centreName}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isCrit
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {iss.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{iss.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                      <span className="font-medium text-slate-700">{iss.category ? iss.category.replace('_', ' ') : 'COMPLIANCE'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                      <span className="font-bold text-slate-800">{iss.status || 'NEW'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onNavigate('ai_analysis', iss.centreId)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review AI</span>
                    </button>
                    <button
                      onClick={() => setDismissTarget(iss)}
                      className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 transition-colors"
                      title="Dismiss Issue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONFIRM DISMISS / REMOVE MODAL */}
      {dismissTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Dismiss / Archive Issue?</h3>
              </div>
              <button
                onClick={() => { setDismissTarget(null); setDismissReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dismissing this anomaly will mark it as soft-archived in the National Monitoring Directorate repository, preserving complete forensic audit history.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Alert ID:</span>
                <span className="font-mono font-bold text-slate-800">{dismissTarget.id}</span>
              </div>
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
    </div>
  );
};
