import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Eye,
  FileCheck,
} from 'lucide-react';
import { appState } from '../../services/storage';

export const AttendanceView: React.FC = () => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCentreId, setSelectedCentreId] = useState('tc_001');
  const [date, setDate] = useState('2026-10-09');
  const [batchCode, setBatchCode] = useState('AI-102');
  const [courseName, setCourseName] = useState('Industrial Python & Embedded Automation');
  const [reportedCount, setReportedCount] = useState(40);
  const [sessionStartTime, setSessionStartTime] = useState('10:00 AM');
  const [sessionEndTime, setSessionEndTime] = useState('01:00 PM');
  const [instructorName, setInstructorName] = useState('Dr. Neha Patwardhan');

  // AI Scan estimation input for demo simulation
  const [aiEstimatedCount, setAiEstimatedCount] = useState(33);

  const attendanceRecords = appState.attendanceRecords;
  const centres = appState.centres;
  const settings = appState.settings;

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    appState.submitAttendance({
      centreId: selectedCentreId,
      date,
      batchCode,
      courseName,
      reportedTrainees: Number(reportedCount),
      sessionStartTime,
      sessionEndTime,
      instructorName,
      aiEstimatedCount: Number(aiEstimatedCount),
    });
    setShowSubmitModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Aggregate Occupancy Audits</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendance Records & AI Verification Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated comparison between Centre-claimed trainee rosters and AI vision aggregate physical presence
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Centre Batch Attendance</span>
        </button>
      </div>

      {/* Statutory Privacy & Threshold Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Zero Biometric Privacy Guarantee</span>
          </div>
          <p className="text-[11px] text-emerald-700">
            Attendance verification relies solely on aggregate geometric person detection and tracking. Facial recognition and biometric student profiling are strictly prohibited.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <span className="font-bold text-slate-800 block">Configured Audit Thresholds</span>
          <div className="flex justify-between text-[11px] text-slate-600 pt-1">
            <span>Normal: &le; {settings.attendanceWarningThresholdPercent}% Variance</span>
            <span className="text-emerald-600 font-bold">Passed</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Warning: {settings.attendanceWarningThresholdPercent}% - {settings.attendanceCriticalThresholdPercent}%</span>
            <span className="text-amber-600 font-bold">Review</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Critical Discrepancy: &gt; {settings.attendanceCriticalThresholdPercent}%</span>
            <span className="text-rose-600 font-bold">Auto Alert</span>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1 text-indigo-900">
          <span className="font-bold block">Average Attendance Compliance</span>
          <span className="text-2xl font-bold mt-1 block">82.4%</span>
          <p className="text-[11px] text-indigo-700">
            Across 4 batches monitored in active training period.
          </p>
        </div>
      </div>

      {/* Attendance Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Official Attendance Audit Ledger
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Showing {attendanceRecords.length} recorded sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Centre & Code</th>
                <th className="py-3 px-4">Batch & Course</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Reported Trainees</th>
                <th className="py-3 px-4">AI Vision Headcount</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.map((rec) => {
                const centre = centres.find((c) => c.id === rec.centreId);
                const isCrit = rec.status === 'DISCREPANCY_CRITICAL';
                const isWarn = rec.status === 'DISCREPANCY_WARNING';

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{rec.date}</div>
                      <div className="text-[10px] text-slate-400">
                        {rec.sessionStartTime} - {rec.sessionEndTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{centre?.name || 'Centre'}</span>
                      <span className="text-[10px] font-mono text-slate-500">{centre?.code}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-700 block">{rec.batchCode}</span>
                      <span className="text-[11px] text-slate-600">{rec.courseName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{rec.instructorName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {rec.reportedTrainees} Trainees
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      {rec.aiEstimatedCount !== undefined ? `${rec.aiEstimatedCount} Trainees` : 'Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          isCrit ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {rec.discrepancyCount ? `-${rec.discrepancyCount} (${rec.discrepancyPercentage}%)` : '0% Match'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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

      {/* Submit Batch Record Modal (Section 14) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Submit Centre Batch Attendance Record
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAttendance} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Training Centre:</label>
                <select
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batch Code:</label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Session Date:</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course Name:</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Reported Trainee Count:
                  </label>
                  <input
                    type="number"
                    required
                    value={reportedCount}
                    onChange={(e) => setReportedCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    AI Estimated Headcount:
                  </label>
                  <input
                    type="number"
                    required
                    value={aiEstimatedCount}
                    onChange={(e) => setAiEstimatedCount(Number(e.target.value))}
                    className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-2 font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time:</label>
                  <input
                    type="text"
                    value={sessionStartTime}
                    onChange={(e) => setSessionStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time:</label>
                  <input
                    type="text"
                    value={sessionEndTime}
                    onChange={(e) => setSessionEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Instructor In-Charge:</label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-xs"
                >
                  Submit & Run AI Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
