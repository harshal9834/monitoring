import React, { useState } from 'react';
import {
  Box,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Search,
  Building2,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import { appState } from '../../services/storage';

export const InfrastructureView: React.FC = () => {
  const [selectedCentreId, setSelectedCentreId] = useState('tc_001');

  const centres = appState.centres;
  const activeCentre = centres.find((c) => c.id === selectedCentreId) || centres[0];

  // Scanned asset states for the selected centre
  const inventoryStatus = [
    {
      item: 'Computers / IT Workstations',
      approved: activeCentre.approvedInventory.computers,
      observed: 18,
      missing: Math.max(0, activeCentre.approvedInventory.computers - 18),
      status: 'DEFICIT',
      apparentOperability: '18 Operational, 0 Damaged',
      notes: 'Sanctioned 20 terminals for NSQF IT Level 5. Two desktop monitors unobserved in Bay 1.',
    },
    {
      item: 'Vocational Industrial Machinery (CNC / Lathe)',
      approved: activeCentre.approvedInventory.machines,
      observed: 2,
      missing: Math.max(0, activeCentre.approvedInventory.machines - 2),
      status: 'CRITICAL_DEFICIT',
      apparentOperability: '2 Operational, 1 Potentially Damaged / Removed',
      notes: 'One heavy lathe unit removed from designated floor bay. Notice issued (Act-002).',
    },
    {
      item: 'Heavy Technical Workbenches',
      approved: activeCentre.approvedInventory.workbenches,
      observed: 5,
      missing: 0,
      status: 'COMPLIANT',
      apparentOperability: '5 Operational, 0 Damaged',
      notes: 'All 5 approved electrostatic discharge workbenches present with proper clearance.',
    },
    {
      item: 'Classroom Ergonomic Chairs',
      approved: activeCentre.approvedInventory.chairs,
      observed: 35,
      missing: 5,
      status: 'MINOR_DEFICIT',
      apparentOperability: '35 Operational, 0 Damaged',
      notes: '35 chairs present during batch scanning.',
    },
    {
      item: 'Emergency Power UPS & Fire Safety Guard',
      approved: 2,
      observed: 2,
      missing: 0,
      status: 'COMPLIANT',
      apparentOperability: 'Requires Physical Verification',
      notes: 'Visual presence validated. Electrical safety interlocks require annual inspector certification.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Box className="w-4 h-4" />
            <span>Physical Asset Verification</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Approved Infrastructure & Apparent Operability Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated verification of government-sanctioned training equipment against live computer vision scans
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-600">Select Centre:</span>
          <select
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 16: Apparent Operability Principle Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
        <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block uppercase tracking-wider text-[11px]">
            AI Safety & Apparent Operability Standard (Section 16):
          </span>
          <p className="text-[11px] leading-relaxed text-amber-800">
            This platform does not claim that AI vision proves internal mechanical or electrical functionality.
            Instead, the computer vision engine classifies visually observable states: <strong>Present</strong>,
            <strong> Not Detected</strong>, <strong>Potentially Damaged</strong>, and <strong>Requires Verification</strong>.
            Final technical operability certifications require hands-on physical inspection.
          </p>
        </div>
      </div>

      {/* Infrastructure Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Approved vs AI Scanned Inventory: {activeCentre.name}
            </h3>
            <span className="text-xs text-slate-500">
              Sanctioned under {activeCentre.centreType}
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Infra Compliance: {activeCentre.infrastructureComplianceRate}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Equipment / Asset Class</th>
                <th className="py-3 px-4">Sanctioned Quota</th>
                <th className="py-3 px-4">AI Observed Count</th>
                <th className="py-3 px-4">Shortage / Variance</th>
                <th className="py-3 px-4">Apparent Operability State</th>
                <th className="py-3 px-4">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryStatus.map((row, idx) => {
                const isCompliant = row.status === 'COMPLIANT';
                const isCrit = row.status === 'CRITICAL_DEFICIT';

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{row.item}</span>
                      <span className="text-[11px] text-slate-500">{row.notes}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.approved} Units</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{row.observed} Units</td>
                    <td className="py-3.5 px-4">
                      {row.missing > 0 ? (
                        <span className="font-bold text-rose-600">Missing: {row.missing} Units</span>
                      ) : (
                        <span className="font-semibold text-emerald-600">Zero Deficit</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {row.apparentOperability}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCompliant
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCrit
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isCompliant ? 'COMPLIANT' : 'SHORTAGE FLAGGED'}
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
  );
};
