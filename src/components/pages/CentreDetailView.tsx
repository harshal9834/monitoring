import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  Box,
  Video,
  AlertTriangle,
  ClipboardList,
  History,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { NavTab } from '../common/Sidebar';

interface CentreDetailViewProps {
  centreId: string;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const CentreDetailView: React.FC<CentreDetailViewProps> = ({
  centreId,
  onBack,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'attendance' | 'infrastructure' | 'cameras' | 'alerts' | 'actions' | 'audit'
  >('overview');

  const centre = appState.centres.find((c) => c.id === centreId) || appState.centres[0];
  const centreAttendance = appState.attendanceRecords.filter((a) => a.centreId === centre.id);
  const centreAlerts = appState.alerts.filter((a) => a.centreId === centre.id);
  const centreActions = appState.actions.filter((a) => a.centreId === centre.id);
  const centreCameras = appState.cameras.filter((c) => c.centreId === centre.id);
  const centreAudit = appState.auditLogs.filter((l) => l.entityId === centre.id || l.entityId.startsWith('act_') || l.entityId.startsWith('alt_'));

  const isCompliant = centre.complianceScore >= 85;

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <button
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Centres Registry</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{centre.name}</h2>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {centre.code}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  isCompliant
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {centre.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{centre.centreType}</p>
          </div>

          <div className="flex items-center space-x-4 shrink-0 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Compliance Index</span>
              <span className="text-xl font-bold text-slate-900">{centre.complianceScore}%</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold overflow-x-auto pt-2">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'attendance', label: `Attendance (${centreAttendance.length})`, icon: Users },
            { id: 'infrastructure', label: 'Approved Infrastructure', icon: Box },
            { id: 'cameras', label: `CCTV Feeds (${centreCameras.length})`, icon: Video },
            { id: 'alerts', label: `AI Alerts (${centreAlerts.length})`, icon: AlertTriangle },
            { id: 'actions', label: `Actions (${centreActions.length})`, icon: ClipboardList },
            { id: 'audit', label: 'Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`pb-3 flex items-center space-x-1.5 whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panes */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Accreditation Details
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{centre.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{centre.contactNumber} ({centre.contactPerson})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{centre.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Next Statutory Inspection: <strong>{centre.nextInspectionDate}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Compliance Metric Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Attendance Compliance</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {centre.attendanceComplianceRate}%
                </span>
                <span className="text-[10px] text-slate-400">Weight: 40%</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Infrastructure Compliance</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {centre.infrastructureComplianceRate}%
                </span>
                <span className="text-[10px] text-slate-400">Weight: 35%</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Action Closure Compliance</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {centre.actionComplianceRate}%
                </span>
                <span className="text-[10px] text-slate-400">Weight: 25%</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
              <span>Need to audit current batch video live?</span>
              <button
                onClick={() => onNavigate('video_monitoring')}
                className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-xs"
              >
                Launch AI Video Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Submitted Batches & Headcount Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Batch & Course</th>
                  <th className="py-2.5 px-3">Reported Claim</th>
                  <th className="py-2.5 px-3">AI Estimated Presence</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centreAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono text-slate-600">{rec.date}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{rec.batchCode}</span>
                      <span className="text-[11px] text-slate-500">{rec.courseName}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{rec.reportedTrainees} Trainees</td>
                    <td className="py-3 px-3 font-bold text-indigo-700">
                      {rec.aiEstimatedCount ? `${rec.aiEstimatedCount} Trainees` : 'Pending'}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600">
                      {rec.discrepancyCount ? `-${rec.discrepancyCount} (${rec.discrepancyPercentage}%)` : '0%'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'infrastructure' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Approved Mandatory Inventory Matrix</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Computers / PCs</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {centre.approvedInventory.computers} Units
              </span>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Observed: 18 (Missing 2)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Vocational Machinery</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {centre.approvedInventory.machines} Units
              </span>
              <span className="text-[11px] text-rose-600 font-semibold mt-1 block">Observed: 2 (Missing 1)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Workbenches</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {centre.approvedInventory.workbenches} Units
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Compliant (5/5)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Chairs</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {centre.approvedInventory.chairs} Units
              </span>
              <span className="text-[11px] text-slate-600 font-semibold mt-1 block">Observed: 35 Units</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'cameras' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Configured CCTV / RTSP Camera Streams</h3>
          <div className="space-y-3">
            {centreCameras.map((cam) => (
              <div
                key={cam.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{cam.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {cam.status}
                    </span>
                  </div>
                  <p className="text-slate-500">{cam.location} • {cam.resolution} @ {cam.fps} FPS</p>
                  <p className="font-mono text-[10px] text-slate-400">RTSP Protected Stream (Credentials Masked)</p>
                </div>
                <button
                  onClick={() => onNavigate('video_monitoring')}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  View Feed
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'alerts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">AI Alerts History</h3>
          <div className="space-y-2.5">
            {centreAlerts.map((alt) => (
              <div key={alt.id} className="p-3.5 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{alt.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                      {alt.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{alt.description}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{alt.detectedTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'actions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Compliance Notices & Remediation Actions</h3>
          <div className="space-y-2.5">
            {centreActions.map((act) => (
              <div key={act.id} className="p-3.5 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {act.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{act.description}</p>
                </div>
                <button
                  onClick={() => onNavigate('actions')}
                  className="text-indigo-600 font-semibold"
                >
                  Manage Notice →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Immutable Audit History for this Centre</h3>
          <div className="space-y-2">
            {centreAudit.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <p className="text-[11px] text-slate-500">{log.newState || log.entityId}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
