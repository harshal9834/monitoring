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

import { api } from '../../services/api';

interface DashboardViewProps {
  onNavigate: (tab: NavTab, centreId?: string) => void;
  onOpenAlertDetail?: (alertId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [summaryData, setSummaryData] = React.useState<any>(null);
  const [centres, setCentres] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [actions, setActions] = React.useState<any[]>([]);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const currentUser = appState.currentUser;

  React.useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async (isInitial = false) => {
      try {
        if (isInitial) setIsLoading(true);
        const [sumRes, centresRes, alertsRes, actionsRes, attRes] = await Promise.all([
          api.getGovernmentSummary().catch(() => null),
          api.getCentres().catch(() => []),
          api.getAlerts().catch(() => []),
          api.getActions().catch(() => []),
          api.getAttendance().catch(() => []),
        ]);

        if (isMounted) {
          if (sumRes) setSummaryData(sumRes);
          setCentres(centresRes || []);
          setAlerts(alertsRes || []);
          setActions(actionsRes || []);
          setAttendance(attRes || []);
          if (isInitial) setIsLoading(false);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
        if (isMounted && isInitial) setIsLoading(false);
      }
    };

    fetchDashboardData(true);

    // Controlled 30-second silent background refresh for live metrics (no page reload)
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const criticalAlerts = alerts.filter(
    (a) => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && a.status !== 'RESOLVED'
  );

  const criticalAlertsCount = summaryData?.criticalAlerts ?? criticalAlerts.length;
  const activeAlertsCount =
    summaryData?.activeAlerts ??
    alerts.filter((a) => a.status === 'NEW' || a.status === 'ACTION_CREATED').length;
  const pendingActionsCount =
    summaryData?.pendingActions ?? actions.filter((a) => a.status !== 'RESOLVED').length;
  const overdueActionsCount =
    summaryData?.overdueActions ?? actions.filter((a) => a.isOverdue || a.status === 'ESCALATED').length;
  const totalMonitoredCentres = summaryData?.totalMonitoredCentres ?? centres.length;
  const onlineCameras = summaryData?.onlineCameras ?? 0;
  const avgCompliance =
    summaryData?.complianceIndex ??
    (centres.length > 0
      ? Math.round(
          centres.reduce((acc: any, c: any) => acc + (c.complianceScore || 80), 0) / centres.length
        )
      : 80);

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

      {/* Top 4 Required Government Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Centres"
          value={summaryData?.totalCentres ?? totalMonitoredCentres}
          subtitle="Accredited institutions monitored"
          icon={Building2}
          badge={{ text: 'Active', variant: 'positive' }}
          onClick={() => onNavigate('centres')}
        />
        <StatCard
          title="Pending AI Analysis"
          value={summaryData?.pendingAnalysis ?? 0}
          subtitle="Awaiting automated vision inference"
          icon={Video}
          badge={{
            text: (summaryData?.pendingAnalysis ?? 0) > 0 ? 'Pending' : 'Queue Clear',
            variant: (summaryData?.pendingAnalysis ?? 0) > 0 ? 'warning' : 'positive',
          }}
          onClick={() => onNavigate('ai_analysis')}
        />
        <StatCard
          title="Active Issues"
          value={summaryData?.activeIssues ?? activeAlertsCount}
          subtitle={`${criticalAlertsCount} High / Critical severity`}
          icon={AlertTriangle}
          badge={{
            text: criticalAlertsCount > 0 ? `${criticalAlertsCount} Critical` : 'Stable',
            variant: criticalAlertsCount > 0 ? 'critical' : 'positive',
          }}
          onClick={() => onNavigate('issues')}
        />
        <StatCard
          title="Pending Actions"
          value={summaryData?.pendingActions ?? pendingActionsCount}
          subtitle={`${summaryData?.overdueActions ?? 0} Escalated or Overdue`}
          icon={ClipboardList}
          badge={{
            text: (summaryData?.overdueActions ?? 0) > 0 ? 'Overdue' : 'Active',
            variant: (summaryData?.overdueActions ?? 0) > 0 ? 'critical' : 'neutral',
          }}
          onClick={() => onNavigate('notices')}
        />
      </div>

      {/* Recent Centre Submissions Table (Section 6) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Centre Submissions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational daily rosters and classroom footage submitted by accredited training centres
            </p>
          </div>
          <button
            onClick={() => onNavigate('submissions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Submissions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table (hidden on mobile/small tablet) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/80 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Centre</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4 text-center">Video</th>
                <th className="py-3 px-4 text-center">AI Status</th>
                <th className="py-3 px-4 text-center">Issue</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaryData?.recentSubmissions && summaryData.recentSubmissions.length > 0 ? (
                summaryData.recentSubmissions.map((sub: any) => {
                  const isCrit = sub.alertStatus === 'Critical Issue';
                  const isWarn = sub.alertStatus === 'Attention';
                  return (
                    <tr key={sub.submissionId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{sub.centreName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{sub.centreCode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100">
                          {sub.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {sub.date}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {sub.reportedAttendance} Trainees
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          <Video className="w-3 h-3 text-indigo-600" />
                          <span>Video Attached</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.aiStatus === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.aiStatus === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {sub.aiStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {sub.alertStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigate('submissions', sub.submissionId)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open Submission</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No recent submissions recorded in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Cards */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {summaryData?.recentSubmissions && summaryData.recentSubmissions.length > 0 ? (
            summaryData.recentSubmissions.map((sub: any) => {
              const isCrit = sub.alertStatus === 'Critical Issue';
              const isWarn = sub.alertStatus === 'Attention';
              return (
                <div key={sub.submissionId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">{sub.centreCode}</span>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{sub.centreName}</h4>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isCrit
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isWarn
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sub.alertStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                      <span className="font-medium text-slate-700">{sub.categoryName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
                      <span className="font-mono text-slate-700">{sub.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Attendance</span>
                      <span className="font-bold text-slate-900">{sub.reportedAttendance} Trainees</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Status</span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sub.aiStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.aiStatus}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('submissions', sub.submissionId)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Open Submission</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent submissions recorded in database.
            </div>
          )}
        </div>
      </div>

      {/* Quick Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-800 uppercase tracking-wider block">
            Statutory Compliance Pipeline: Centre Data → AI Video Analysis → Government Review → Issue Detection → Notice/Action → Follow-up
          </span>
          <p className="text-[11px] leading-relaxed text-slate-500 mt-0.5">
            Real-time biometric-safe tracking across bounding boxes. Unresolved notices automatically flag centres for administrative inspection.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigate('issues')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 font-semibold text-slate-700 rounded-xl transition-colors"
          >
            Review Issues
          </button>
          <button
            onClick={() => onNavigate('notices')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-xl shadow-2xs transition-colors"
          >
            Actions & Notices
          </button>
        </div>
      </div>
    </div>
  );
};
