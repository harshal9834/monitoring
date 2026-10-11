import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  FileCheck,
  Building2,
  User,
  Filter,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';
import { InspectionRecord } from '../../types';

export const InspectionsView: React.FC = () => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [selectedCentreId, setSelectedCentreId] = useState('tc_001');
  const [inspType, setInspType] = useState<InspectionRecord['inspectionType']>('AI Triggered');
  const [reason, setReason] = useState('Repeated attendance deficit flagged over last 3 practical cycles');
  const [officerName, setOfficerName] = useState(appState.currentUser.name);
  const [inspDate, setInspDate] = useState('2026-10-18');
  const [notes, setNotes] = useState('Audit student physical biometric registers and verify IT Lab workstation serial numbers.');

  // Outcome resolution modal state
  const [outcome, setOutcome] = useState<'PASS' | 'FAIL' | 'CONDITIONAL' | 'REINSPECTION_REQUIRED'>('PASS');
  const [findings, setFindings] = useState('');
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const [inspections, setInspections] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = appState.currentUser;
  const isCentreRole = currentUser.role === 'CENTRE_ADMIN';
  const assignedCentreId = currentUser.assignedCentres?.[0] || 'tc_001';

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const [inspData, centreData] = await Promise.all([
        isCentreRole ? api.getCentreInspections().catch(() => []) : api.getInspections().catch(() => []),
        api.getCentres().catch(() => []),
      ]);
      setInspections(Array.isArray(inspData) ? inspData : []);
      if (Array.isArray(centreData)) {
        setCentres(isCentreRole ? centreData.filter((c: any) => c.id === assignedCentreId) : centreData);
      } else {
        setCentres([]);
      }
    } catch (err) {
      console.error('Failed to load inspections from MySQL:', err);
      setInspections([]);
      setCentres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [isCentreRole]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.scheduleInspection({
        centre_id: selectedCentreId,
        inspection_type: inspType,
        reason,
        assigned_officer: officerName,
        scheduled_date: inspDate,
        notes,
      });
      await fetchInspections();
      setShowScheduleModal(false);
    } catch (err: any) {
      console.error('Failed to schedule inspection in MySQL:', err);
      alert(err.message || 'Failed to schedule inspection');
    }
  };

  const handleRecordOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspection) return;
    try {
      await api.completeInspection(selectedInspection.id, { outcome, findings });
      await fetchInspections();
      setShowOutcomeModal(false);
      setSelectedInspection(null);
    } catch (err: any) {
      console.error('Failed to complete inspection in MySQL:', err);
      alert(err.message || 'Failed to complete inspection');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Statutory Field Oversight</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            On-Site Inspections & Physical Audit Schedules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Routine and AI-triggered surprise field visits to verify training quality, roster authenticity, and machinery operability.
          </p>
        </div>

        {!isCentreRole && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Inspection</span>
          </button>
        )}
      </div>

      {/* Inspections Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Scheduled & Completed Inspections ({inspections.length})</span>
          <span className="text-[11px] text-slate-500">Government Officer Roster</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">Centre & District</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">Status & Outcome</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-[11px]">
                    {insp.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{insp.centreName}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{insp.reason}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        insp.inspectionType === 'AI Triggered'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {insp.inspectionType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {insp.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    {insp.assignedOfficer}
                  </td>
                  <td className="py-3.5 px-4">
                    {insp.status === 'COMPLETED' ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          insp.outcome === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : insp.outcome === 'FAIL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {insp.outcome || 'COMPLETED'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                        SCHEDULED
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {insp.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          setSelectedInspection(insp);
                          setShowOutcomeModal(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                      >
                        Record Outcome
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Recorded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal (Section 32) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Schedule Physical Centre Inspection</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Training Centre</label>
                <select
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Inspection Type</label>
                <select
                  value={inspType}
                  onChange={(e) => setInspType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-semibold"
                >
                  <option value="Routine">Routine</option>
                  <option value="AI Triggered">AI Triggered</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Repeated Violation">Repeated Violation</option>
                  <option value="Infrastructure Verification">Infrastructure Verification</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mandate / Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Officer</label>
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Inspection Date</label>
                  <input
                    type="date"
                    required
                    value={inspDate}
                    onChange={(e) => setInspDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Instructions & Audit Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Schedule Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Outcome Modal */}
      {showOutcomeModal && selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Inspection Outcome</h3>
              <button onClick={() => setShowOutcomeModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordOutcomeSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-600 font-medium">
                Centre: <strong>{selectedInspection.centreName}</strong> ({selectedInspection.id})
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Outcome Determination</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-bold"
                >
                  <option value="PASS">Pass — Fully Verified</option>
                  <option value="FAIL">Fail — Major Violations</option>
                  <option value="CONDITIONAL">Conditional — Minor Discrepancies</option>
                  <option value="REINSPECTION_REQUIRED">Re-inspection Required</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Inspector Findings & Summary</label>
                <textarea
                  rows={3}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Summarize verification of trainees, machinery operability, and lab roster..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Determination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
