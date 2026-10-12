import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Users,
  Box,
  FileVideo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  X,
  Building2,
  PlusCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { api, getAuthToken, formatVideoUrl, API_BASE } from '../../services/api';

interface CentreSubmissionsHistoryViewProps {
  onNavigate: (tab: any) => void;
}

export const CentreSubmissionsHistoryView: React.FC<CentreSubmissionsHistoryViewProps> = ({ onNavigate }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchSubmissions = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await api.getMySubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load submissions:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(true);
    const interval = setInterval(() => {
      fetchSubmissions(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.id?.toLowerCase().includes(q) ||
      s.date?.toLowerCase().includes(q) ||
      s.batchCode?.toLowerCase().includes(q) ||
      s.courseName?.toLowerCase().includes(q) ||
      s.instructorName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Submission Records Archive</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Submissions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical log of daily attendance and infrastructure records transmitted to the Government Portal.
          </p>
        </div>

        <button
          onClick={() => onNavigate('centre_submit_data')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Submit Today's Data</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, date, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> of {submissions.length} submissions
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading submission records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No matching submissions found for the current query.'
                : 'No daily records have been submitted yet. Use "+ Submit Today\'s Data" to submit your first report.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => onNavigate('centre_submit_data')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Submit Daily Report Now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table View (lg+) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Submission ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Batch / Course</th>
                  <th className="py-3 px-4 text-center">Trainees Present</th>
                  <th className="py-3 px-4 text-center">Media Evidence</th>
                  <th className="py-3 px-4 text-center">AI Verification</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((sub) => {
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {sub.id}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {sub.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.batchCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{sub.courseName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-900">{sub.totalPresent}</span>
                        <span className="text-slate-400 text-[11px]"> / {sub.totalRegistered}</span>
                        {sub.totalAbsent > 0 && (
                          <span className="text-[10px] text-rose-600 font-medium block">
                            ({sub.totalAbsent} absent)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 justify-center flex-wrap">
                          {sub.hasVideo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200" title={sub.videoFileName || 'Video attached'}>
                              <FileVideo className="w-3 h-3" />
                              <span>Video</span>
                            </span>
                          )}
                          {sub.hasImage && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title={sub.imageFileName || 'Image attached'}>
                              <Box className="w-3 h-3" />
                              <span>Image</span>
                            </span>
                          )}
                          {!sub.hasVideo && !sub.hasImage && (
                            <span className="text-[11px] text-slate-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.aiStatus === 'MATCH' || sub.aiStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : sub.aiStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : sub.aiStatus === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sub.aiStatus === 'MATCH'
                            ? 'Verified'
                            : sub.aiStatus === 'PENDING'
                            ? 'Pending'
                            : sub.aiStatus === 'CRITICAL'
                            ? 'Discrepancy'
                            : sub.aiStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sub.status || 'Submitted'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Remove Submission"
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

          {/* Mobile & Tablet Card View (< lg) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {filtered.map((sub) => (
              <div key={sub.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-indigo-600 block">
                      {sub.id}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {sub.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.aiStatus === 'MATCH' || sub.aiStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : sub.aiStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-700'
                          : sub.aiStatus === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sub.aiStatus === 'MATCH'
                        ? 'Verified'
                        : sub.aiStatus === 'PENDING'
                        ? 'Pending'
                        : sub.aiStatus === 'CRITICAL'
                        ? 'Discrepancy'
                        : sub.aiStatus || 'Pending'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {sub.status || 'Submitted'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{sub.batchCode}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{sub.courseName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Attendance:</span>
                    <span className="font-bold text-slate-800">
                      {sub.totalPresent} / {sub.totalRegistered} Present
                      {sub.totalAbsent > 0 && (
                        <span className="text-rose-600 font-medium ml-1">({sub.totalAbsent} absent)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Media Attached:</span>
                    <div className="inline-flex items-center gap-1">
                      {sub.hasVideo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <FileVideo className="w-3 h-3" />
                          <span>Video</span>
                        </span>
                      )}
                      {sub.hasImage && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Box className="w-3 h-3" />
                          <span>Image</span>
                        </span>
                      )}
                      {!sub.hasVideo && !sub.hasImage && (
                        <span className="text-slate-400">None</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sub)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                    title="Remove Submission"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  Submission Details
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedSub.id}</h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Date</span>
                  <span className="font-semibold text-slate-800">{selectedSub.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Batch</span>
                  <span className="font-semibold text-slate-800">{selectedSub.batchCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Course</span>
                  <span className="font-semibold text-slate-800">{selectedSub.courseName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Trainer</span>
                  <span className="font-semibold text-slate-800">{selectedSub.instructorName}</span>
                </div>
              </div>

              {/* Attendance */}
              <div className="p-3.5 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Attendance Tally</span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Registered Roster Strength:</span>
                  <span className="font-bold text-slate-900">{selectedSub.totalRegistered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Trainees Present:</span>
                  <span className="font-bold text-emerald-700">{selectedSub.totalPresent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Trainees Absent:</span>
                  <span className="font-bold text-rose-600">{selectedSub.totalAbsent}</span>
                </div>
              </div>

              {/* Infrastructure */}
              {selectedSub.infrastructure && Object.keys(selectedSub.infrastructure).length > 0 && (
                <div className="p-3.5 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Reported Infrastructure Equipment
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(selectedSub.infrastructure).map(([key, val]) => (
                      <div key={key} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                        <span className="capitalize text-slate-600">{key}:</span>
                        <span className="font-bold text-slate-900">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Evidence Display */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Media Evidence (Cloudinary)
                </span>

                {selectedSub.hasVideo && (selectedSub.videoUrl || selectedSub.videoPath || selectedSub.secureUrl) && (
                  <div className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-900 text-white">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Video Playback: {selectedSub.videoFileName || 'Submitted Video'}
                    </span>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      <video
                        src={
                          formatVideoUrl(
                            (selectedSub.secureUrl || selectedSub.videoUrl || selectedSub.videoPath)?.startsWith('http')
                              ? (selectedSub.secureUrl || selectedSub.videoUrl || selectedSub.videoPath)
                              : `${API_BASE}/submissions/${selectedSub.id}/media/stream?type=video`
                          )
                        }
                        controls
                        playsInline
                        onError={(e) => {
                          const token = getAuthToken() || '';
                          const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                          const fallback = `${API_BASE}/submissions/${selectedSub.id}/media/stream?type=video${tokenParam}`;
                          if (!e.currentTarget.src.includes('/submissions/') || !e.currentTarget.src.includes('/media/stream')) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {selectedSub.hasImage && (selectedSub.imageUrl || selectedSub.imagePath || selectedSub.secureUrl) && (
                  <div className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Classroom Image: {selectedSub.imageFileName || 'Submitted Image'}
                    </span>
                    <div className="rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center p-1 max-h-[260px]">
                      <img
                        src={
                          (selectedSub.secureUrl || selectedSub.imageUrl || selectedSub.imagePath)?.startsWith('http')
                            ? (selectedSub.secureUrl || selectedSub.imageUrl || selectedSub.imagePath)
                            : `${API_BASE}/submissions/${selectedSub.id}/media/stream?type=image`
                        }
                        alt="Classroom Evidence"
                        onError={(e) => {
                          const fallback = `${API_BASE}/submissions/${selectedSub.id}/media/stream?type=image`;
                          if (!e.currentTarget.src.includes('/submissions/') || !e.currentTarget.src.includes('/media/stream')) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="max-h-[250px] max-w-full w-auto h-auto object-contain rounded"
                      />
                    </div>
                  </div>
                )}

                {!selectedSub.hasVideo && !selectedSub.hasImage && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                    No video or image evidence uploaded with this attendance report.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REMOVE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Remove Submission?</h3>
              </div>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this submission record? Associated uploaded video/image files and pending processing jobs will be cancelled. If compliance checks have run, an audit archive is maintained.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Submission ID:</span>
                <span className="font-mono font-bold text-slate-800">{deleteTarget.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-800">{deleteTarget.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch & Course:</span>
                <span className="font-semibold text-slate-800">{deleteTarget.batchCode} - {deleteTarget.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Media Attached:</span>
                <span className="font-semibold text-slate-800">
                  {deleteTarget.hasVideo && deleteTarget.hasImage
                    ? 'Video + Image'
                    : deleteTarget.hasVideo
                    ? 'Video only'
                    : deleteTarget.hasImage
                    ? 'Image only'
                    : 'None'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Reason for Removal (Optional / Audit):
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Test submission, uploaded incorrect batch roster, re-submitting..."
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteReason(''); }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await api.removeCentreSubmission(deleteTarget.id, deleteReason || 'Removed by Training Centre');
                    setSubmissions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
                    setDeleteTarget(null);
                    setDeleteReason('');
                  } catch (err: any) {
                    alert(err.message || 'Failed to remove submission');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
