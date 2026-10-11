import React, { useState } from 'react';
import {
  Shield,
  Eye,
  CheckCircle2,
  Building2,
  Lock,
  ArrowRight,
  UserCheck,
  Server,
  Sparkles,
} from 'lucide-react';

interface PortalSelectionProps {
  onSelectPortal: (portal: 'government' | 'centre' | 'admin') => void;
}

export const PortalSelectionView: React.FC<PortalSelectionProps> = ({
  onSelectPortal,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-900">
      {/* Top National Portal Emblem Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2.5 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
            <span className="font-bold tracking-wider text-amber-400 text-[10px] sm:text-xs">
              MINISTRY OF SKILL DEVELOPMENT & ENTREPRENEURSHIP
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 text-[10px] sm:text-xs">National Directorate of Training Compliance (SkillGuard AI)</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-300 self-end sm:self-auto">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Govt Server Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center w-full">
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-3.5 py-1 text-xs font-semibold text-indigo-700">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI-Powered Training Centre Compliance & Monitoring Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            SkillGuard AI
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Select your secure portal to access authorized monitoring, attendance verification, and infrastructure compliance tools.
          </p>
        </div>

        {/* Section 8: Three Large Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Government Monitoring Portal */}
          <div className="bg-white rounded-3xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all p-8 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Statutory Oversight
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Government Monitoring Portal
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Monitor accredited centres, review AI alerts, inspect aggregate presence analytics, schedule field audits, and issue corrective notices.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSelectPortal('government')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>Government Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  Accredited Monitoring Officers & State Directors
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Training Centre Portal */}
          <div className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all p-8 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                  Centre Operations
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Training Centre Portal
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit daily batch attendance, review approved inventory, inspect CCTV camera status, respond to notices, and upload evidence.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSelectPortal('centre')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>Centre Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  Vocational Training Centre Heads & Operations Staff
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Administration Portal */}
          <div className="bg-white rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-xl transition-all p-8 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block mb-1">
                  Root Administration
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Administration Portal
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage user credentials, onboard centres, configure IP cameras, manage AI models, inspect dataset metrics, and review immutable audit logs.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSelectPortal('admin')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>Admin Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  National Vigilance Commissioners & System Admins
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">SkillGuard AI v1.4</span>
            <span>• Government Enterprise Edition</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Aggregate Vision Analytics</span>
            <span>•</span>
            <span>Zero Biometric Face Recognition</span>
            <span>•</span>
            <span>DPDP Act Conforming</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
