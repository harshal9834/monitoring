import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  FileText,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ClipboardCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

interface CentreDashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const CentreDashboardView: React.FC<CentreDashboardViewProps> = ({ onNavigate }) => {
  const [centreData, setCentreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let consecutiveFailures = 0;
    let timerId: any = null;

    const loadData = (isInitial = false) => {
      if (isInitial) setLoading(true);
      api.getCentreSummary()
        .then((data) => {
          if (!isMounted) return;
          consecutiveFailures = 0;
          setCentreData(data);
          if (isInitial) setLoading(false);
          // Schedule next poll after 30 seconds upon success
          timerId = setTimeout(() => loadData(false), 30000);
        })
        .catch((err) => {
          console.warn('Failed to load centre summary:', err);
          if (!isMounted) return;
          if (isInitial) setLoading(false);
          consecutiveFailures += 1;
          // Stop hammering the server after repeated failures
          if (consecutiveFailures < 3) {
            timerId = setTimeout(() => loadData(false), 60000);
          }
        });
    };

    loadData(true);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading Training Centre Dashboard...</p>
      </div>
    );
  }

  const centreName = centreData?.centreName || 'Training Centre';
  const centreId = centreData?.centreCode || 'TC-ALLOCATED';
  const centreStatus = centreData?.status || 'ACTIVE';
  const isSubmittedToday = centreData?.isSubmittedToday ?? (centreData?.todaySubmissionStatus === 'Submitted');
  const todayStatus = isSubmittedToday ? 'Submitted' : 'Pending Submission';
  const lastSub = centreData?.lastSubmission;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Training Centre Name & Identification Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Training Centre Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {centreName}
            </h1>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
              <span>Centre ID:</span>
              <strong className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {centreId}
              </strong>
              <span>Status:</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                {centreStatus}
              </span>
              {centreData?.district && (
                <span className="text-slate-400">• {centreData.district}, {centreData.state}</span>
              )}
            </div>
          </div>

          {/* Today's Submission Status Badge */}
          <div className="flex flex-col md:items-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Today's Submission Status
            </span>
            {isSubmittedToday ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Submitted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending Submission</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. Primary Action Button */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600 max-w-md">
            {isSubmittedToday
              ? "Today's daily attendance and facility equipment record has been submitted to the Government Monitoring Portal."
              : "Please record today's trainee attendance and facility operational status for government compliance."}
          </p>

          <button
            onClick={() => onNavigate('centre_submit_data')}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-xs transition-all hover:shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Submit Today's Data</span>
          </button>
        </div>
      </div>

      {/* 3. Operational Summary Cards (Submissions, Notices & Overdue Actions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Submission Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Daily Data</span>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-extrabold ${isSubmittedToday ? 'text-emerald-700' : 'text-amber-600'}`}>
              {isSubmittedToday ? 'Completed' : 'Pending'}
            </span>
            {isSubmittedToday ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {isSubmittedToday ? "Today's roster recorded" : 'Submission due before end of day'}
          </p>
        </div>

        {/* Latest Submission Date Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latest Submission</span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-800">
              {lastSub ? lastSub.date : 'None'}
            </span>
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-500">
            {lastSub ? `${lastSub.totalPresent} Trainees (${lastSub.batchCode})` : 'No past record'}
          </p>
        </div>

        {/* Pending Notices Card */}
        <div
          onClick={() => onNavigate('centre_notices')}
          className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs space-y-2 cursor-pointer transition-all hover:shadow-xs group"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Notices</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
              {centreData?.pendingNoticesCount || 0}
            </span>
            <ClipboardCheck className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting centre response</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </p>
        </div>

        {/* Overdue Actions Card */}
        <div
          onClick={() => onNavigate('centre_notices')}
          className="bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-5 shadow-xs space-y-2 cursor-pointer transition-all hover:shadow-xs group"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Notices</span>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-black ${(centreData?.overdueActionsCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'} group-hover:text-rose-600 transition-colors`}>
              {centreData?.overdueActionsCount || 0}
            </span>
            <AlertCircle className={`w-5 h-5 ${(centreData?.overdueActionsCount || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Critical deadline passed</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
          </p>
        </div>
      </div>

      {/* 4. Action Shortcuts & Last Submission Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Last Submission Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Last Submission Details</span>
            </span>
            {lastSub && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {lastSub.id}
              </span>
            )}
          </div>

          {lastSub ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Submission Date:</span>
                <span className="font-semibold text-slate-800">{lastSub.date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Batch / Course:</span>
                <span className="font-semibold text-slate-800">{lastSub.batchCode} ({lastSub.courseName})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Trainees Recorded:</span>
                <span className="font-semibold text-slate-800">
                  {lastSub.totalPresent} Present ({lastSub.totalAbsent || 0} Absent)
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Video Attached:</span>
                <span className="font-semibold text-slate-800">
                  {lastSub.hasVideo ? 'Yes (Uploaded to AI Engine)' : 'No Video'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No past submissions recorded yet.</p>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('centre_submissions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>View All Submissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notices & Actions Shortcut Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
              <span>Government Notices & Inquiries</span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Compliance Notices:</span>
                <span className="font-bold text-slate-900">
                  {centreData?.pendingNoticesCount || 0} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Receive official statutory directives from District & State Monitoring Officers.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Resolution Status:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Online Desk Active</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Submit explanations and upload supporting evidence directly to the directorate.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('centre_notices')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
            >
              <span>View Notices & Actions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
