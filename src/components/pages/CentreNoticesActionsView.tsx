import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Search,
  ChevronRight,
  X,
  Send,
  Building2,
  Calendar,
  User,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Paperclip,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

export const CentreNoticesActionsView: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

  // Response Form States
  const [explanation, setExplanation] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotices = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await api.getCentreNotices();
      setNotices(Array.isArray(data) ? data : []);
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

  const openNoticeDetails = (notice: any) => {
    setSelectedNotice(notice);
    setExplanation(notice.response?.explanation || '');
    setProofFile(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice) return;
    if (!explanation.trim()) {
      setErrorMessage('Please provide a detailed formal explanation before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      console.log('[NOTICE RESPONSE] Submitting response for notice:', selectedNotice.id, 'with file:', proofFile?.name || 'none');
      if (proofFile) {
        const formData = new FormData();
        formData.append('explanation', explanation.trim());
        formData.append('proof_file', proofFile);
        console.log('[NOTICE RESPONSE] Calling uploadNoticeResponseMultipart via API client');
        await api.uploadNoticeResponseMultipart(selectedNotice.id, formData);
      } else {
        console.log('[NOTICE RESPONSE] Calling submitNoticeResponse via API client');
        await api.submitNoticeResponse(selectedNotice.id, {
          explanation: explanation.trim(),
          proof_document_name: selectedNotice.response?.proofDocumentName || 'Explanation_Note.pdf',
        });
      }

      setSuccessMessage('Response submitted successfully. Government Monitoring Officer will review the evidence.');
      // Refresh notices
      const updated = await api.getCentreNotices();
      setNotices(Array.isArray(updated) ? updated : []);
      // Update selected notice with latest
      const refreshedNotice = updated.find((n: any) => n.id === selectedNotice.id);
      if (refreshedNotice) {
        setSelectedNotice(refreshedNotice);
      }
    } catch (err: any) {
      console.error('[NOTICE RESPONSE] Error submitting notice response:', err);
      const isFileError = Boolean(proofFile);
      const msg = err.message || (isFileError ? 'Failed to upload supporting proof document.' : 'Failed to submit notice response.');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Notices
  const filteredNotices = notices.filter((n) => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.noticeNumber?.toLowerCase().includes(q) ||
      n.title?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filter === 'ALL') return true;
    if (filter === 'ACTION_REQUIRED') return n.status === 'ACTION_REQUIRED' || n.status === 'MORE_PROOF_REQUIRED' || n.status === 'MORE_INFO_REQUESTED';
    if (filter === 'PENDING_VERIFICATION') return n.status === 'PENDING_VERIFICATION' || n.status === 'SUBMITTED_FOR_VERIFICATION';
    if (filter === 'OVERDUE') return n.status === 'OVERDUE' || n.isOverdue;
    if (filter === 'RESOLVED') return n.status === 'RESOLVED';
    return true;
  });

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue || status === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Overdue</span>
        </span>
      );
    }
    if (status === 'ACTION_REQUIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Action Required</span>
        </span>
      );
    }
    if (status === 'PENDING_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Pending Verification</span>
        </span>
      );
    }
    if (status === 'MORE_PROOF_REQUIRED' || status === 'MORE_INFO_REQUESTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>More Proof Required</span>
        </span>
      );
    }
    if (status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resolved</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
        <span>{status?.replace(/_/g, ' ')}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || 'HIGH').toUpperCase();
    if (p === 'CRITICAL') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white font-mono">CRITICAL</span>;
    }
    if (p === 'HIGH') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white font-mono">HIGH</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500 text-white font-mono">NORMAL</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Training Centre Compliance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notices & Actions
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Statutory compliance notices and potential discrepancy inquiries issued by the Government Monitoring Directorate. Review AI observations, provide factual clarifications, and submit supporting documentation.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Notices</span>
            <span className="text-lg font-black text-slate-900">{notices.length}</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Action Req.</span>
            <span className="text-lg font-black text-amber-900">
              {notices.filter((n) => n.status === 'ACTION_REQUIRED' || n.status === 'OVERDUE').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All Notices' },
            { key: 'ACTION_REQUIRED', label: 'Action Required' },
            { key: 'PENDING_VERIFICATION', label: 'Pending Response' },
            { key: 'OVERDUE', label: 'Overdue' },
            { key: 'RESOLVED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* 3. Notices List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading compliance notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Notices Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filter === 'ALL'
              ? 'There are currently no statutory notices or action items issued for your training centre.'
              : `No notices matching filter '${filter}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Notice Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    {notice.noticeNumber}
                  </span>
                  {getStatusBadge(notice.status, notice.isOverdue)}
                  {getPriorityBadge(notice.priority)}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {notice.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {notice.description}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued: {notice.issuedDate}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-rose-700">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>Response Due: {notice.dueDate}</span>
                  </span>
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Officer: {notice.assignedOfficerName}</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center md:flex-col justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => openNoticeDetails(notice)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Notice Detail & Response Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    {selectedNotice.noticeNumber}
                  </span>
                  {getStatusBadge(selectedNotice.status, selectedNotice.isOverdue)}
                  {getPriorityBadge(selectedNotice.priority)}
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
                  {selectedNotice.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Notice Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issuing Officer</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.assignedOfficerName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issued Date</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.issuedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remediation Deadline</span>
                  <span className="font-bold text-rose-700">{selectedNotice.dueDate}</span>
                </div>
              </div>

              {/* Instructions / Mandate */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Government Notice Instructions & Inquiry
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.description}
                </div>
              </div>

              {/* AI Discrepancy Summary Disclosure (If linked to AI detection) */}
              {selectedNotice.aiSummary && (
                <div className="space-y-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-4 md:p-5">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Algorithmic Observation Summary (Automated AI Scan)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    The automated video monitoring pipeline highlighted potential variances between roster submissions and video occupancy. The training centre is invited to submit factual clarifications regarding these observations.
                  </p>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-amber-200 text-[10px] font-bold text-amber-900 uppercase">
                          <th className="py-1.5 px-2">Category</th>
                          <th className="py-1.5 px-2">Reported</th>
                          <th className="py-1.5 px-2">AI Observed</th>
                          <th className="py-1.5 px-2">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 text-slate-800">
                        {selectedNotice.aiSummary.detectedItems?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 font-semibold capitalize">{item.class} Headcount</td>
                            <td className="py-2 px-2">{item.reported}</td>
                            <td className="py-2 px-2">{item.detected}</td>
                            <td className="py-2 px-2 font-bold text-amber-800">-{item.variance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline of Notice */}
              {selectedNotice.timeline && selectedNotice.timeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Notice History & Audit Trail
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
                    {selectedNotice.timeline.map((event: any, i: number) => (
                      <div key={i} className="text-xs space-y-0.5 relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[21px] top-1"></div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-[11px]">{event.eventType.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-400">• {event.createdAt}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Verification Remarks (If Government closed or verified) */}
              {selectedNotice.verification && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Government Verification: {selectedNotice.verification.outcome}</span>
                  </span>
                  <p className="text-emerald-700 text-[11px] leading-relaxed">
                    {selectedNotice.verification.mandatoryRemarks}
                  </p>
                  <span className="text-[10px] text-emerald-600 block pt-1">
                    Verified by {selectedNotice.verification.verifiedBy} ({selectedNotice.verification.verifiedAt})
                  </span>
                </div>
              )}

              {/* 5. Centre Response Submission Section */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Submit Formal Centre Response</span>
                  </h4>
                  {selectedNotice.response && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Response Recorded ({selectedNotice.response.submittedAt})
                    </span>
                  )}
                </div>

                {successMessage && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {selectedNotice.status === 'RESOLVED' ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 italic">
                    This statutory notice has been fully resolved and marked closed by Government Monitoring Officers. No further responses are required.
                  </div>
                ) : (
                  <form onSubmit={handleResponseSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Remediation Explanation & Statement <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Detail the circumstances, corrective steps, physical attendance registers, or equipment service records to clarify the inquiry..."
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        required
                      />
                    </div>

                    {/* Proof File Attachment */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Supporting Proof Document (Optional: Signed Register, Invoice, Photo)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 flex items-center gap-2 transition-colors">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          <span>Choose Document</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setProofFile(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        {proofFile ? (
                          <span className="text-xs text-indigo-700 font-mono font-medium truncate max-w-xs">
                            {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
                          </span>
                        ) : selectedNotice.response?.proofDocumentName ? (
                          <span className="text-xs text-slate-500 font-mono">
                            Current file: {selectedNotice.response.proofDocumentName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No document attached</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedNotice(null)}
                        className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Submitting Response...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Official Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
