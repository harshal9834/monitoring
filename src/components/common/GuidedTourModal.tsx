import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  Video,
  AlertTriangle,
  ClipboardList,
  UploadCloud,
  CheckCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { NavTab } from './Sidebar';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Step 1: Inspect Centre Master Data & Approved Capacity',
      icon: Building2,
      tab: 'centres' as NavTab,
      role: 'usr_gov_admin',
      roleLabel: 'Dr. Alok Verma (Govt Admin)',
      summary: 'Review government sanctioned capacity and mandatory inventory.',
      details: [
        'Centre: ABC Skill Centre, Pune (MH-PUN-TC-0842)',
        'Approved Trainee Capacity: 40 Trainees per batch',
        'Approved Mandatory Inventory: Computer: 20, Workbench: 5, Machine: 3, Chair: 40',
        'Active CCTV Cameras: 3 IP Cameras connected over RTSP',
      ],
      actionPrompt: 'Navigate to Training Centres page to inspect master profile.',
    },
    {
      title: 'Step 2: Training Centre Submits Official Attendance',
      icon: Users,
      tab: 'attendance' as NavTab,
      role: 'usr_tc_admin',
      roleLabel: 'Vikram Desai (Centre Admin)',
      summary: 'Centre Director logs attendance claim in the government portal.',
      details: [
        'Date: Today | Course: AI-101 Data Analytics',
        'Official Claim: 40 Trainees present in session (100% capacity)',
        'Instructor: Prof. Sandeep Kulkarni',
        'Status: Marked PENDING AI SCAN for computer vision verification',
      ],
      actionPrompt: 'Check Attendance Records to see the centre-submitted declaration.',
    },
    {
      title: 'Step 3: Run AI Video Analytics on CCTV Stream',
      icon: Video,
      tab: 'video_monitoring' as NavTab,
      role: 'usr_gov_officer',
      roleLabel: 'Rajesh Sharma (Monitoring Officer)',
      summary: 'Ultralytics YOLOv8m processes camera feed and counts trainees and equipment.',
      details: [
        'Feed: Camera 01 (Computer Lab & Classroom Bay)',
        'AI Estimated Trainees: 32 (Variance: -8 persons)',
        'AI Detected Computers: 18 (Variance: -2 missing)',
        'AI Detected Machines: 2 (Variance: -1 missing vocational lathe)',
        'AI Detected Workbenches: 5 (Compliant)',
      ],
      actionPrompt: 'Go to AI Video Monitoring to inspect real-time bounding boxes and counts.',
    },
    {
      title: 'Step 4: Automated Discrepancy Alerts & Evidence Generation',
      icon: AlertTriangle,
      tab: 'alerts' as NavTab,
      role: 'usr_gov_officer',
      roleLabel: 'Rajesh Sharma (Monitoring Officer)',
      summary: 'System triggers High & Critical alerts with timestamped snapshot evidence.',
      details: [
        'Alert #1: Severe Attendance Discrepancy (20.0% Under-occupancy, Critical)',
        'Alert #2: Mandatory Machinery Shortage (2 of 3 Observed, High)',
        'Evidence Captured: Frame snapshot at 10:45:12 with model confidence 94.2%',
        'Privacy Guard: Aggregate counts only, zero biometric facial scans saved',
      ],
      actionPrompt: 'Open AI Alerts to inspect the visual snapshot evidence.',
    },
    {
      title: 'Step 5: Government Officer Issues Corrective Action Notice',
      icon: ClipboardList,
      tab: 'actions' as NavTab,
      role: 'usr_gov_officer',
      roleLabel: 'Rajesh Sharma (Monitoring Officer)',
      summary: 'Officer creates formal notice requiring justification and evidence from Centre.',
      details: [
        'Action: Attendance Discrepancy Explanation & Biometric Audit',
        'Assigned To: Vikram Desai (Apex Skill Academy)',
        'Priority: High | Compliance Due Date: 72-Hour Statutory Cure Period',
        'Officer Directive: "Provide signed attendance sheet and proof of missing machine."',
      ],
      actionPrompt: 'View Actions & Follow-up to review the active notice.',
    },
    {
      title: 'Step 6: Centre Admin Submits Explanation & Repair Proof',
      icon: UploadCloud,
      tab: 'actions' as NavTab,
      role: 'usr_tc_admin',
      roleLabel: 'Vikram Desai (Centre Admin)',
      summary: 'Centre Director uploads repair challan and explanation.',
      details: [
        'Centre Explanation: "Machine #3 (Lathe 400B) was sent to OEM Bharat Precision Tools for bi-annual spindle overhaul. Return date: 13th Oct."',
        'Attached Proof: Bharat_Precision_Service_Challan_Oct2026.pdf',
        'Photo Proof: Calibration bay photo attached',
        'Status Transition: Changed to SUBMITTED FOR VERIFICATION',
      ],
      actionPrompt: 'Inspect the Action to see the Centre response and attached repair document.',
    },
    {
      title: 'Step 7: Government Officer Verifies & Approves Resolution',
      icon: CheckCircle,
      tab: 'actions' as NavTab,
      role: 'usr_gov_officer',
      roleLabel: 'Rajesh Sharma (Monitoring Officer)',
      summary: 'Officer reviews proof challan, records mandatory remarks, and marks Resolved.',
      details: [
        'Verification Outcome: APPROVED',
        'Mandatory Remarks: "OEM maintenance challan verified with serial #BP-4401. Re-inspection scheduled upon return."',
        'Status: Marked RESOLVED in compliance repository',
        'Alternative branches: Officer could REJECT with mandatory reason (REOPENED) or ESCALATE to District Director.',
      ],
      actionPrompt: 'See the action lifecycle status updated to RESOLVED.',
    },
    {
      title: 'Step 8: Updated Compliance Score & Immutable Audit Trail',
      icon: FileText,
      tab: 'audit_logs' as NavTab,
      role: 'usr_gov_admin',
      roleLabel: 'Dr. Alok Verma (Govt Admin)',
      summary: 'System recalculates Centre Compliance Index and logs every event in the audit trail.',
      details: [
        'Dynamic Formula: 40% Attendance + 35% Infrastructure + 25% Action Resolution',
        'Audit Trail: Immutable timestamped log of AI Alert → Notice → Response → Verification',
        'Export Ready: Generate compliance PDF and CSV reports for National Skill Directorate',
      ],
      actionPrompt: 'Visit the Immutable Audit Trail to inspect the complete chain of accountability.',
    },
  ];

  const current = steps[currentStep];

  const handleApplyStep = () => {
    onNavigateTab(current.tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Compliance Walkthrough</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{current.title}</h2>
          <p className="text-slate-300 text-xs mt-1">{current.summary}</p>

          {/* Progress dots */}
          <div className="flex items-center space-x-1.5 mt-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-8 bg-amber-400'
                    : i < currentStep
                    ? 'w-3 bg-indigo-400'
                    : 'w-3 bg-slate-700'
                }`}
                title={`Jump to Step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Active Perspective Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Demonstration Perspective:</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {current.roleLabel}
            </span>
          </div>

          {/* Bullet points */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Key Verification Findings:
            </span>
            {current.details.map((detail, index) => (
              <div key={index} className="flex items-start space-x-2.5 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-indigo-700 font-medium bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
            👉 {current.actionPrompt}
          </p>
        </div>

        {/* Footer controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={currentStep === steps.length - 1}
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Skip Walkthrough
            </button>
            <button
              onClick={handleApplyStep}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <span>Switch to this View & Role</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
