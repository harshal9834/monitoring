import React from 'react';
import {
  Building2,
  Video,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Eye,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab, centreId?: string) => void;
  onOpenAlertDetail?: (alertId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const centres = appState.centres;
  const alerts = appState.alerts;
  const actions = appState.actions;
  const attendance = appState.attendanceRecords;
  const currentUser = appState.currentUser;

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');
  const activeAlerts = alerts.filter((a) => a.status === 'NEW' || a.status === 'ACTION_CREATED');
  const pendingActions = actions.filter((a) => a.status !== 'RESOLVED');
  const overdueActions = actions.filter((a) => a.isOverdue || a.status === 'ESCALATED');

  const avgCompliance = Math.round(
    centres.reduce((acc, c) => acc + c.complianceScore, 0) / (centres.length || 1)
  );

  const centresRequiringInspection = centres.filter(
    (c) => c.status === 'FLAGGED' || c.status === 'UNDER_REVIEW' || c.complianceScore < 80
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>National Skill Monitoring Directorate (Central Command)</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time AI Video Analytics and Statutory Compliance Monitoring across accredited vocational training centres.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigate('video_monitoring')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <Video className="w-4 h-4" />
            <span>Launch Live AI Video Monitor</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
            <span>Export Briefing</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards (Section 26) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Centres"
          value={centres.length}
          subtitle="3 Active CCTV / Edge Feeds"
          icon={Building2}
          badge={{ text: '100% Online', variant: 'positive' }}
          onClick={() => onNavigate('centres')}
        />
        <StatCard
          title="National Compliance Index"
          value={`${avgCompliance}%`}
          subtitle="Weighted: Attendance + Infra + Actions"
          icon={ShieldCheck}
          badge={{
            text: avgCompliance >= 80 ? 'Compliant' : 'Review Required',
            variant: avgCompliance >= 80 ? 'positive' : 'warning',
          }}
          onClick={() => onNavigate('settings')}
        />
        <StatCard
          title="Active AI Alerts"
          value={activeAlerts.length}
          subtitle={`${criticalAlerts.length} High / Critical severity`}
          icon={AlertTriangle}
          badge={{
            text: criticalAlerts.length > 0 ? `${criticalAlerts.length} Critical` : 'Stable',
            variant: criticalAlerts.length > 0 ? 'critical' : 'positive',
          }}
          onClick={() => onNavigate('alerts')}
        />
        <StatCard
          title="Pending Actions"
          value={pendingActions.length}
          subtitle={`${overdueActions.length} Escalated or Overdue`}
          icon={ClipboardList}
          badge={{
            text: overdueActions.length > 0 ? `${overdueActions.length} Overdue` : 'On Track',
            variant: overdueActions.length > 0 ? 'critical' : 'neutral',
          }}
          onClick={() => onNavigate('actions')}
        />
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Visual Charts & Discrepancy Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Centre Compliance Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Accredited Training Centres Compliance Status
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time statutory compliance scores calculated from AI vision analytics
                </p>
              </div>
              <button
                onClick={() => onNavigate('centres')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {centres.map((centre) => {
                const isCompliant = centre.complianceScore >= 85;
                const isFlagged = centre.complianceScore >= 70 && centre.complianceScore < 85;
                return (
                  <div
                    key={centre.id}
                    onClick={() => onNavigate('centre_detail', centre.id)}
                    className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{centre.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                          {centre.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCompliant
                              ? 'bg-emerald-100 text-emerald-800'
                              : isFlagged
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {centre.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>{centre.district}, {centre.state}</span>
                        <span>•</span>
                        <span>Approved Capacity: {centre.approvedTraineeCapacity} Trainees</span>
                        <span>•</span>
                        <span>{centre.cameraIds.length} IP Cameras</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <div className="flex items-baseline justify-end space-x-1">
                          <span className="text-lg font-bold text-slate-900">{centre.complianceScore}%</span>
                          <span className="text-[10px] text-slate-400">Score</span>
                        </div>
                        <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isCompliant ? 'bg-emerald-500' : isFlagged ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${centre.complianceScore}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Comparison Visual Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Daily Attendance Audits (Reported vs AI Estimated)
                </h3>
                <p className="text-xs text-slate-500">
                  Aggregate presence estimation compared with centre-submitted portal logs
                </p>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                    <th className="py-2.5 px-3">Batch & Course</th>
                    <th className="py-2.5 px-3">Reported Count</th>
                    <th className="py-2.5 px-3">AI Estimated Presence</th>
                    <th className="py-2.5 px-3">Variance</th>
                    <th className="py-2.5 px-3">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((rec) => {
                    const isCrit = rec.status === 'DISCREPANCY_CRITICAL';
                    const isWarn = rec.status === 'DISCREPANCY_WARNING';
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{rec.batchCode}</span>
                          <span className="text-[11px] text-slate-500">{rec.courseName}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {rec.reportedTrainees} Trainees
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-indigo-700">
                            {rec.aiEstimatedCount !== undefined ? `${rec.aiEstimatedCount} Trainees` : 'Scanning...'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-semibold ${
                              isCrit ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {rec.discrepancyCount ? `-${rec.discrepancyCount} (${rec.discrepancyPercentage}%)` : '0% (Exact)'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCrit
                                ? 'bg-rose-100 text-rose-800'
                                : isWarn
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Critical Alerts & Follow-up Queue */}
        <div className="space-y-6">
          {/* Active AI Alerts Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  High & Critical AI Alerts ({criticalAlerts.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate('alerts')}
                  className="p-3.5 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">{alert.detectedTime}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-snug">{alert.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{alert.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-600">{alert.centreName}</span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      <span>Inspect Evidence</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Actions & Statutory Deadlines */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Action Lifecycle Queue
                </h3>
              </div>
              <button
                onClick={() => onNavigate('actions')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {actions.slice(0, 3).map((act) => {
                const isOverdue = act.isOverdue || act.status === 'ESCALATED';
                return (
                  <div
                    key={act.id}
                    onClick={() => onNavigate('actions')}
                    className="p-3.5 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {act.issueCategory.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : act.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {act.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{act.title}</h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Assigned to: {act.assignedToRole}</span>
                      <span className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                        <Clock className="w-3 h-3" />
                        Due: {act.dueDate.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice to Admin */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Automated Escalation Rule (Statutory)
            </span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Unresolved compliance notices exceeding 3 business days automatically escalate to the District Monitoring Officer. Notices exceeding 7 days trigger on-site physical inspection.
            </p>
            <div className="pt-2 flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-700">Audit Trail Enabled</span>
              <span className="text-emerald-600 font-bold">100% Immutable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
