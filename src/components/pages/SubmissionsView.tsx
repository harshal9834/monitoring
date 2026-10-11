import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
  ChevronRight,
  Filter,
  Loader2,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Trash2,
  Archive,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface SubmissionsViewProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
  onOpenSubmissionDetail: (submissionId: string) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  onNavigate,
  onOpenSubmissionDetail,
}) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [aiFilter, setAiFilter] = useState<string>('ALL');
  const [videoOnlyFilter, setVideoOnlyFilter] = useState<boolean>(false);
  const [issueFilter, setIssueFilter] = useState<string>('ALL');
  const [archiveTarget, setArchiveTarget] = useState<any | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');
  const [isArchiving, setIsArchiving] = useState<boolean>(false);

  const fetchSubmissions = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await api.getSubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(true);
    // Controlled 30-second silent background poll for new submissions without page reload
    const interval = setInterval(() => {
      fetchSubmissions(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSubmissions = submissions.filter((s) => {
    // Search query
    const q = search.toLowerCase();
    const matchSearch =
      s.submissionId?.toLowerCase().includes(q) ||
      s.centreName?.toLowerCase().includes(q) ||
      s.centreCode?.toLowerCase().includes(q) ||
      s.categoryName?.toLowerCase().includes(q);

    if (!matchSearch) return false;

    // AI Status
    if (aiFilter !== 'ALL' && s.aiStatus !== aiFilter) return false;

    // Video only
    if (videoOnlyFilter && !s.hasVideo) return false;

    // Issue filter
    if (issueFilter === 'ISSUES_ONLY' && s.issueStatus !== 'Issue Detected') return false;
    if (issueFilter === 'NO_ISSUES' && s.issueStatus === 'Issue Detected') return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>National Monitoring Directorate</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Centre Submissions & Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Operational daily rosters, attendance counts, and optional classroom video footage submitted by accredited training centres across India.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
            <span className="text-lg font-black text-slate-900">{submissions.length}</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">AI Pending</span>
            <span className="text-lg font-black text-amber-900">
              {submissions.filter((s) => s.aiStatus === 'PENDING').length}
            </span>
          </div>
          <div className="px-4 py-2 bg-rose-50 rounded-2xl border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Flagged</span>
            <span className="text-lg font-black text-rose-900">
              {submissions.filter((s) => s.issueStatus === 'Issue Detected').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by centre name, code, category, or submission ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Filter */}
          <select
            value={aiFilter}
            onChange={(e) => setAiFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white"
          >
            <option value="ALL">All AI Statuses</option>
            <option value="COMPLETED">AI Completed</option>
            <option value="PENDING">AI Pending</option>
            <option value="PROCESSING">AI Processing</option>
            <option value="NO_VIDEO">No Video</option>
          </select>

          {/* Issue Filter */}
          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white"
          >
            <option value="ALL">All Outcomes</option>
            <option value="ISSUES_ONLY">Issues Detected</option>
            <option value="NO_ISSUES">No Issues</option>
          </select>

          {/* Video Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <input
              type="checkbox"
              checked={videoOnlyFilter}
              onChange={(e) => setVideoOnlyFilter(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold text-slate-700">Video Only</span>
          </label>
        </div>
      </div>

      {/* 3. Submissions Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading submissions from MySQL database...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No training centre submissions matched the current filters.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/80 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Centre & ID</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4 text-center">Reported Trainees</th>
                  <th className="py-3.5 px-4 text-center">Video Evidence</th>
                  <th className="py-3.5 px-4 text-center">AI Status</th>
                  <th className="py-3.5 px-4 text-center">Issue Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const isIssue = sub.issueStatus === 'Issue Detected';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block leading-tight">{sub.centreName}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {sub.centreCode} • {sub.submissionId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
                          {sub.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {sub.date}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {sub.reportedTrainees} Present
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 justify-center flex-wrap">
                          {sub.hasVideo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200" title={sub.videoFileName || 'Video attached'}>
                              <Video className="w-3 h-3 text-indigo-600" />
                              <span>Video</span>
                            </span>
                          )}
                          {sub.hasImage && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title={sub.imageFileName || 'Image attached'}>
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Image</span>
                            </span>
                          )}
                          {!sub.hasVideo && !sub.hasImage && (
                            <span className="text-[10px] text-slate-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.aiStatus === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.aiStatus === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : sub.aiStatus === 'PENDING'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sub.aiStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isIssue
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isIssue ? <AlertCircle className="w-3 h-3 text-rose-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{sub.issueStatus}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onOpenSubmissionDetail(sub.submissionId)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setArchiveTarget(sub)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                            title="Remove / Archive Submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
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
            {filteredSubmissions.map((sub) => {
              const isIssue = sub.issueStatus === 'Issue Detected';
              return (
                <div key={sub.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">{sub.centreCode} • {sub.submissionId}</span>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{sub.centreName}</h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isIssue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sub.issueStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                      <span className="font-medium text-slate-700">{sub.categoryName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Submission Date</span>
                      <span className="font-mono text-slate-700">{sub.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported Trainees</span>
                      <span className="font-bold text-slate-900">{sub.reportedTrainees} Present</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Verification</span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sub.aiStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.aiStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onOpenSubmissionDetail(sub.submissionId)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Open Submission</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setArchiveTarget(sub)}
                      className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 transition-colors"
                      title="Remove / Archive"
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

      {/* CONFIRM ARCHIVE / REMOVE MODAL */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Remove & Archive Submission</h3>
              </div>
              <button
                onClick={() => { setArchiveTarget(null); setArchiveReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Remove this training centre submission from the active government roster. In compliance with statutory audit standards, this record is archived with a permanent audit trail in MySQL.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Submission ID:</span>
                <span className="font-mono font-bold text-slate-800">{archiveTarget.submissionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Centre:</span>
                <span className="font-semibold text-slate-800">{archiveTarget.centreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-800">{archiveTarget.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reported Trainees:</span>
                <span className="font-semibold text-slate-800">{archiveTarget.reportedTrainees} Present</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Official Removal Reason (Audit Trail):
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Duplicate daily roster submission, test entry, or invalid upload..."
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setArchiveTarget(null); setArchiveReason(''); }}
                disabled={isArchiving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={async () => {
                  try {
                    setIsArchiving(true);
                    await api.removeGovernmentSubmission(
                      archiveTarget.submissionId,
                      archiveReason || 'Removed / Archived by Government Monitoring Officer'
                    );
                    setSubmissions((prev) => prev.filter((s) => s.submissionId !== archiveTarget.submissionId));
                    setArchiveTarget(null);
                    setArchiveReason('');
                  } catch (err: any) {
                    alert(err.message || 'Failed to archive submission');
                  } finally {
                    setIsArchiving(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isArchiving ? 'Archiving...' : 'Archive & Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
