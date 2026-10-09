import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, UserX, FileCheck, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Privacy & Data Protection Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Privacy-Preserving Vision Framework
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Conforming with Digital Personal Data Protection (DPDP) Act & National Skill Monitoring Standards
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Key Rule 1: No Biometric / Face Recognition */}
          <div className="flex items-start space-x-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <EyeOff className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Zero Biometric Facial Recognition</h4>
              <p className="text-xs text-emerald-800 mt-1">
                KAVACH-AI explicitly does <strong>NOT</strong> perform facial recognition, facial landmark
                extraction, emotion detection, or biometric identification. Trainees are detected solely as
                aggregate geometric person bounding boxes (<code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px]">class: person</code>).
              </p>
            </div>
          </div>

          {/* Rule 2: Aggregate Presence Counting */}
          <div className="flex items-start space-x-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <UserX className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Aggregate Occupancy Estimation</h4>
              <p className="text-xs text-slate-600 mt-1">
                The computer vision pipeline tracks physical headcount per active training bay. No persistent
                individual student profiles, race, gender, or demographic inferences are generated or logged.
              </p>
            </div>
          </div>

          {/* Rule 3: Edge Processing & Low-Bandwidth Mode */}
          <div className="flex items-start space-x-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Lock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Edge Processing & Evidence Anonymization</h4>
              <p className="text-xs text-slate-600 mt-1">
                Video is processed directly at the edge or transient memory buffer. Raw 24/7 video streams are
                never permanently stored in cloud repositories; only timestamped metadata counts and low-resolution
                evidence keyframes captured during verified compliance discrepancies are retained for audit.
              </p>
            </div>
          </div>

          {/* Rule 4: Audit Accountability */}
          <div className="flex items-start space-x-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <FileCheck className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Human-In-The-Loop AI Safety Principle</h4>
              <p className="text-xs text-slate-600 mt-1">
                In strict adherence to AI safety guidelines, AI detections are categorized as
                <strong> "Estimated Presence"</strong> and <strong>"Potential Discrepancy"</strong>. No punitive
                action or financial withholding occurs automatically without manual review and verification by an
                authorized Government Monitoring Officer.
              </p>
            </div>
          </div>

          <div className="bg-slate-100 p-3 rounded-lg text-[11px] text-slate-600">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified Compliance Status:</span>
            </div>
            <span>
              Certified compliant under Ministry Guidelines for CCTV Monitoring of PMKVY & PMKK Skill Training Hubs (Circular MSDE/2026/SEC-04).
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
