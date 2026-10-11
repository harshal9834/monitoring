import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  Building2,
  FileText,
  User,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface NoticesViewProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const NoticesView: React.FC<NoticesViewProps> = ({ onNavigate }) => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [centres, setCentres] = useState<any[]>([]);

  // Create Notice Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('tc_001');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<string>('HIGH');
  const [daysAllowed, setDaysAllowed] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cancel Notice Modal
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchNotices = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [acts, cts] = await Promise.all([
        api.getActions().catch(() => []),
        api.getCentres().catch(() => [])
      ]);
      setActions(Array.isArray(acts) ? acts : []);
      setCentres(Array.isArray(cts) ? cts : []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(true);
    const interval = setInterval(() => {
      fetchNotices(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await api.issueGovernmentNotice({
        centre_id: selectedCentreId,
        title,
        description,
        priority,
        days_allowed: Number(daysAllowed),
      });
      setSuccessMsg(`Statutory Notice ${res.noticeNumber} successfully registered in MySQL Sih245 and dispatched to Training Centre.`);
      setTitle('');
      setDescription('');
      await fetchNotices();
      window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to issue statutory notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Statutory Compliance Enforcement</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Actions & Notices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Issue official compliance notices, track centre remediation responses, and verify corrective action evidence.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Notice</span>
        </button>
      </div>

      {/* Notices Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading notices from MySQL database...</p>
        </div>
      ) : actions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Open Compliance Notices</h3>
          <p className="text-xs text-slate-500">All statutory corrective action items have been satisfactorily resolved.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Notice No & Centre</th>
                  <th className="py-3 px-4">Subject & Requirements</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Centre Response</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actions.map((act) => {
                  const isCrit = act.priority === 'CRITICAL';
                  const isHigh = act.priority === 'HIGH';
                  const hasResponse = Boolean(act.centreResponse);
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-indigo-700 font-bold block">{act.actionNumber}</span>
                        <span className="font-bold text-slate-900 block">{act.centreName}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <span className="font-bold text-slate-800 block">{act.title}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{act.description}</p>
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
                          {act.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {act.dueDate?.split(' ')[0] || 'In 3 Days'}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasResponse ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Response Submitted</span>
                            </span>
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {act.centreResponse.explanation}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Awaiting Response
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            act.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {act.status ? act.status.replace('_', ' ') : 'OPEN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onNavigate('notice_case_review', act.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1"
                          >
                            <span>Review Audit</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCancelTarget(act)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                            title="Cancel / Revoke Notice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancel</span>
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
            {actions.map((act) => {
              const isCrit = act.priority === 'CRITICAL';
              const isHigh = act.priority === 'HIGH';
              const hasResponse = Boolean(act.centreResponse);
              return (
                <div key={act.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-700 font-bold block">{act.actionNumber}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{act.centreName}</span>
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
                      {act.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{act.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Due Date</span>
                      <span className="font-mono text-slate-700">{act.dueDate?.split(' ')[0] || 'In 3 Days'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                      <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded ${
                        act.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {act.status ? act.status.replace('_', ' ') : 'OPEN'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Centre Response</span>
                      {hasResponse ? (
                        <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Response Submitted</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium text-[11px]">Awaiting Response</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onNavigate('notice_case_review', act.id)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Review Audit</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCancelTarget(act)}
                      className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 transition-colors"
                      title="Cancel Notice"
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

      {/* CREATE STATUTORY NOTICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <ClipboardCheck className="w-4 h-4" />
                <span>Issue Statutory Compliance Notice</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNoticeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Training Centre:</label>
                <select
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-medium"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Subject / Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-Compliance Notice: Attendance Roster Discrepancy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Details & Legal Directives:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify the observed discrepancy, regulatory rule violated, and required corrective documentation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-normal text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Days Allowed for Response:</label>
                  <select
                    value={daysAllowed}
                    onChange={(e) => setDaysAllowed(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value={2}>2 Business Days</option>
                    <option value={3}>3 Business Days</option>
                    <option value={5}>5 Business Days</option>
                    <option value={7}>7 Business Days</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notice Priority:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Issuing...' : 'Issue Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM CANCEL / REVOKE NOTICE MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Cancel & Revoke Notice</h3>
              </div>
              <button
                onClick={() => { setCancelTarget(null); setCancelReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling this notice will revoke its statutory enforcement status and archive the action item. A statutory cancellation event will be recorded on the case timeline.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Notice Number:</span>
                <span className="font-mono font-bold text-slate-800">{cancelTarget.actionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Centre:</span>
                <span className="font-semibold text-slate-800">{cancelTarget.centreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Title:</span>
                <span className="font-semibold text-slate-800">{cancelTarget.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority:</span>
                <span className="font-bold text-amber-700">{cancelTarget.priority}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Revocation Reason (Mandatory Audit Entry):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Notice issued prematurely, resolved via bilateral verification, typographical error..."
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setCancelTarget(null); setCancelReason(''); }}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  try {
                    setIsCancelling(true);
                    await api.cancelNotice(
                      cancelTarget.id,
                      cancelReason || 'Cancelled by Government Directorate'
                    );
                    setActions((prev) => prev.filter((a) => a.id !== cancelTarget.id));
                    setCancelTarget(null);
                    setCancelReason('');
                    window.dispatchEvent(new CustomEvent('skillguard:refresh-stats'));
                  } catch (err: any) {
                    alert(err.message || 'Failed to cancel notice');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isCancelling ? 'Cancelling...' : 'Revoke Notice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
