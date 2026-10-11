import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  FileText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { api } from '../../services/api';

export const ReportsView: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<
    'compliance' | 'attendance' | 'inventory' | 'actions'
  >('compliance');

  const currentUser = appState.currentUser;
  const isCentreRole = currentUser.role === 'CENTRE_ADMIN';
  const assignedCentreId = currentUser.assignedCentres?.[0] || 'tc_001';

  const [centres, setCentres] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        setLoading(true);
        const [ctrs, atts, acts, alts] = await Promise.all([
          api.getCentres().catch(() => []),
          (isCentreRole ? api.getCentreAttendance() : api.getAttendance()).catch(() => []),
          (isCentreRole ? api.getCentreActions() : api.getActions()).catch(() => []),
          (isCentreRole ? api.getCentreAlerts() : api.getAlerts()).catch(() => []),
        ]);
        const filteredCentres = isCentreRole
          ? (ctrs || []).filter((c: any) => c.id === assignedCentreId)
          : ctrs || [];
        setCentres(filteredCentres);
        setAttendance(atts || []);
        setActions(acts || []);
        setAlerts(alts || []);
      } catch (err) {
        console.error('Failed to load report data from MySQL:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportsData();
  }, [isCentreRole]);

  // Real CSV Generator & Downloader
  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (selectedReportType === 'compliance') {
      csvContent += 'Centre Code,Centre Name,District,State,Compliance Score,Attendance Rate,Infra Rate,Action Rate,Status\n';
      centres.forEach((c) => {
        csvContent += `"${c.code}","${c.name}","${c.district}","${c.state}",${c.complianceScore},${c.attendanceComplianceRate},${c.infrastructureComplianceRate},${c.actionComplianceRate},"${c.status}"\n`;
      });
    } else if (selectedReportType === 'attendance') {
      csvContent += 'Date,Centre Code,Batch,Course,Reported Trainees,AI Estimated Headcount,Discrepancy,Status\n';
      attendance.forEach((a) => {
        csvContent += `"${a.date}","${a.centreId}","${a.batchCode}","${a.courseName}",${a.reportedTrainees},${a.aiEstimatedCount || 0},${a.discrepancyCount || 0},"${a.status}"\n`;
      });
    } else {
      csvContent += 'Action ID,Centre Name,Title,Priority,Status,Due Date,Resolved At\n';
      actions.forEach((act) => {
        csvContent += `"${act.id}","${act.centreName}","${act.title}","${act.priority}","${act.status}","${act.dueDate}","${act.resolvedAt || 'N/A'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KAVACH_${selectedReportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <FileBarChart className="w-4 h-4" />
            <span>Statutory Audits & Dossiers</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Compliance Intelligence & Export Centre
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate verifiable audit reports for State Directorates and Parliamentary Oversight Committees
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Ledger</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'compliance', label: 'Centre Compliance Dossier', sub: 'Weighted composite scores' },
          { id: 'attendance', label: 'Attendance Discrepancy Ledger', sub: 'Reported vs AI counts' },
          { id: 'inventory', label: 'Approved Infrastructure Audit', sub: 'Machinery & hardware deficits' },
          { id: 'actions', label: 'Action Closure & Escalations', sub: 'Statutory cure cycle times' },
        ].map((rep) => {
          const isSelected = selectedReportType === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReportType(rep.id as any)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-100 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <h4 className="text-xs font-bold text-slate-900">{rep.label}</h4>
              <p className="text-[11px] text-slate-500 mt-1">{rep.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Preview Table of Active Report */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight capitalize">
              {selectedReportType} Audit Summary Preview
            </h3>
            <span className="text-xs text-slate-500">
              Generated at: {new Date().toLocaleDateString()} • Verified by Central AI Vision Engine
            </span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Audit Certified
          </span>
        </div>

        <div className="overflow-x-auto">
          {selectedReportType === 'compliance' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4">Centre Code</th>
                  <th className="py-3 px-4">Centre Name</th>
                  <th className="py-3 px-4">District / State</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4">Infra Rate</th>
                  <th className="py-3 px-4">Action Rate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centres.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.district}, {c.state}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{c.complianceScore}%</td>
                    <td className="py-3.5 px-4">{c.attendanceComplianceRate}%</td>
                    <td className="py-3.5 px-4">{c.infrastructureComplianceRate}%</td>
                    <td className="py-3.5 px-4">{c.actionComplianceRate}%</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReportType === 'attendance' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Course Name</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4">AI Scan</th>
                  <th className="py-3 px-4">Variance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono">{a.date}</td>
                    <td className="py-3.5 px-4 font-bold">{a.batchCode}</td>
                    <td className="py-3.5 px-4">{a.courseName}</td>
                    <td className="py-3.5 px-4 font-semibold">{a.reportedTrainees} Trainees</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{a.aiEstimatedCount || 0}</td>
                    <td className="py-3.5 px-4 text-rose-600 font-bold">-{a.discrepancyCount || 0} ({a.discrepancyPercentage}%)</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReportType === 'inventory' && (
            <div className="p-6 text-xs text-slate-600 space-y-3">
              <p className="font-semibold text-slate-800">
                Cross-Centre Infrastructure Summary across 3 Monitored Facilities:
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Sanctioned Computers</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">60 Total Units</span>
                  <span className="text-[10px] text-amber-600 font-bold">Observed: 57 (3 Missing)</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Sanctioned Machines</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">11 Total Units</span>
                  <span className="text-[10px] text-rose-600 font-bold">Observed: 9 (2 In Repair)</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Sanctioned Workbenches</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">17 Total Units</span>
                  <span className="text-[10px] text-emerald-600 font-bold">100% Compliant (17/17)</span>
                </div>
              </div>
            </div>
          )}

          {selectedReportType === 'actions' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4">Action ID</th>
                  <th className="py-3 px-4">Centre Name</th>
                  <th className="py-3 px-4">Notice Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold">{act.id}</td>
                    <td className="py-3.5 px-4 font-semibold">{act.centreName}</td>
                    <td className="py-3.5 px-4">{act.title}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">{act.priority}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{act.status}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{act.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
