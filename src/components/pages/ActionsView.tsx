import React, { useState } from 'react';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UploadCloud,
  FileText,
  User,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Send,
  Calendar,
  AlertOctagon,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { ComplianceAction, ActionStatus, ActionPriority } from '../../types';

export const ActionsView: React.FC = () => {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Centre response form state
  const [centreExplanation, setCentreExplanation] = useState<string>('');
  const [proofDocName, setProofDocName] = useState<string>('OEM_Service_Invoice_Oct2026.pdf');

  // Officer verification form state
  const [verificationRemarks, setVerificationRemarks] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);

  // New comment state
  const [newCommentText, setNewCommentText] = useState<string>('');

  const actions = appState.actions;
  const currentUser = appState.currentUser;

  const filteredActions = actions.filter((act) => {
    if (filterStatus !== 'ALL' && act.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && act.priority !== filterPriority) return false;
    return true;
  });

  const activeAction = actions.find((a) => a.id === selectedActionId) || filteredActions[0] || null;

  // Handlers
  const handleCentreSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction || !centreExplanation) return;
    appState.submitCentreResponse(activeAction.id, {
      explanation: centreExplanation,
      proofDocumentName: proofDocName,
      proofPhotoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    });
    setCentreExplanation('');
  };

  const handleOfficerApprove = () => {
    if (!activeAction) return;
    appState.verifyAction(
      activeAction.id,
      'APPROVED',
      verificationRemarks || 'Satisfactory explanation & authentic OEM service challan verified.'
    );
    setVerificationRemarks('');
  };

  const handleOfficerReject = () => {
    if (!activeAction) return;
    if (!rejectionReason) {
      alert('Mandatory rejection reason is required to reject a submission.');
      return;
    }
    appState.verifyAction(activeAction.id, 'REJECTED', rejectionReason);
    setRejectionReason('');
    setShowRejectInput(false);
  };

  const handleOfficerReinspection = () => {
    if (!activeAction) return;
    appState.verifyAction(
      activeAction.id,
      'REINSPECTION_ORDERED',
      'On-site physical audit scheduled for independent mechanical validation.'
    );
  };

  const handleEscalate = () => {
    if (!activeAction) return;
    appState.escalateAction(
      activeAction.id,
      'Action exceeded allowable turnaround window. Escalated to District Vigilance Officer.'
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction || !newCommentText) return;
    activeAction.comments.push({
      id: `cmt_${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text: newCommentText,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    appState.saveState();
    setNewCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Statutory Accountability & Enforcement</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Action Lifecycle & Follow-up System
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full compliance loop: AI Detection → Notice Assignment → Centre Response → Officer Verification → Resolution
          </p>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTION_ASSIGNED">Action Assigned</option>
              <option value="SUBMITTED_FOR_VERIFICATION">Submitted for Verification</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REOPENED">Reopened</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Actions List, Right Action Detail & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Actions Ledger */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
            <span>Active Actions ({filteredActions.length})</span>
            <span>Due Date</span>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredActions.map((act) => {
              const isSelected = activeAction?.id === act.id;
              const isOverdue = act.isOverdue || act.status === 'ESCALATED';

              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedActionId(act.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{act.id}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        act.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.status === 'SUBMITTED_FOR_VERIFICATION'
                          ? 'bg-sky-100 text-sky-800'
                          : isOverdue
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {act.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{act.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{act.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                      {act.centreName}
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      <Clock className="w-3 h-3" />
                      {act.dueDate.split(' ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredActions.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No compliance actions found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Action Deep-Dive & Dual-Perspective Workflow */}
        <div className="lg:col-span-7">
          {activeAction ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-6 p-6">
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {activeAction.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeAction.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeAction.status === 'SUBMITTED_FOR_VERIFICATION'
                          ? 'bg-sky-100 text-sky-800'
                          : activeAction.isOverdue
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeAction.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                      {activeAction.priority} PRIORITY
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {activeAction.status !== 'RESOLVED' && (
                      <button
                        onClick={handleEscalate}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 flex items-center gap-1 transition-colors"
                        title="Escalate issue to District Monitoring Director"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Escalate Issue</span>
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {activeAction.title}
                </h2>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>Centre: <strong className="text-slate-800">{activeAction.centreName}</strong></span>
                  <span>•</span>
                  <span>Assigned Officer: <strong className="text-slate-800">{activeAction.assignedOfficerName}</strong></span>
                  <span>•</span>
                  <span>Due Date: <strong className="text-slate-800">{activeAction.dueDate}</strong></span>
                </div>
              </div>

              {/* Statutory Notice Description */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Government Directive & Discrepancy Notice:
                </span>
                <p className="leading-relaxed">{activeAction.description}</p>
              </div>

              {/* Section 22: Training Centre Response Submission Block */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-sky-600" />
                    <span>Training Centre Formal Response & Proof</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Section 22 Compliance</span>
                </div>

                {activeAction.centreResponse ? (
                  <div className="bg-sky-50/50 border border-sky-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-sky-900 font-medium">
                      <span>Submitted By: {activeAction.centreResponse.submittedBy}</span>
                      <span>{activeAction.centreResponse.submittedAt}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-normal">
                      "{activeAction.centreResponse.explanation}"
                    </p>
                    {activeAction.centreResponse.proofDocumentName && (
                      <div className="flex items-center space-x-2 pt-1">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700 underline cursor-pointer">
                          {activeAction.centreResponse.proofDocumentName}
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono">
                          Verified PDF
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCentreSubmitResponse} className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Training Centre Director can submit clarification and upload supporting repair/attendance proof:
                    </p>
                    <textarea
                      rows={3}
                      placeholder="Enter detailed clarification, OEM service details, or trainee attendance justification..."
                      value={centreExplanation}
                      onChange={(e) => setCentreExplanation(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500">Attachment:</span>
                        <input
                          type="text"
                          value={proofDocName}
                          onChange={(e) => setProofDocName(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Submit Response for Officer Verification</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Section 23: Government Officer Verification & Decision Block */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Government Officer Verification Review</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Section 23 Compliance</span>
                </div>

                {activeAction.verification ? (
                  <div
                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                      activeAction.verification.outcome === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>DECISION: {activeAction.verification.outcome}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {activeAction.verification.verifiedAt}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Officer Remarks: "{activeAction.verification.mandatoryRemarks}"
                    </p>
                    <span className="text-[10px] block font-medium">
                      Verified By: {activeAction.verification.verifiedBy}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Authorized Monitoring Officer evaluates submitted proof and issues formal determination:
                    </p>

                    <input
                      type="text"
                      placeholder="Optional approval notes or audit remarks..."
                      value={verificationRemarks}
                      onChange={(e) => setVerificationRemarks(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                    />

                    {showRejectInput && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                        <label className="block text-xs font-bold text-rose-800">
                          Mandatory Rejection Justification (Statutory Requirement):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Submitted invoice lacks OEM serial number stamp. Reopened for audit."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full bg-white border border-rose-300 rounded p-1.5 text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleOfficerReject}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded"
                        >
                          Confirm Rejection & Reopen Action
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleOfficerApprove}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Mark Resolved</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRejectInput(!showRejectInput)}
                          className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Resolution</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleOfficerReinspection}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Order Re-inspection
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Timeline of Action Lifecycle (Section 21) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Action Audit Trail & Event Timeline:
                </span>
                <div className="space-y-2">
                  {activeAction.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 pb-2 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{step.status.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{step.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{step.note}</p>
                        <span className="text-[10px] text-indigo-600 font-medium">Actor: {step.actor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion Thread */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Official Communications & Notes ({activeAction.comments.length})</span>
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeAction.comments.map((cmt) => (
                    <div key={cmt.id} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{cmt.authorName}</span>
                        <span className="text-[10px] text-slate-400">{cmt.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{cmt.text}</p>
                      {cmt.attachmentName && (
                        <div className="flex items-center space-x-1 text-[11px] text-indigo-600 pt-0.5">
                          <FileText className="w-3 h-3" />
                          <span>{cmt.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add official follow-up remark..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select an action notice from the ledger to inspect lifecycle details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
