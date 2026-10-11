import React, { useState } from 'react';
import {
  Shield,
  Eye,
  CheckCircle2,
  Video,
  FileText,
  Lock,
  ArrowRight,
  UserCheck,
  Building2,
  AlertTriangle,
  ChevronRight,
  Database,
  Cpu,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PublicLandingProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateExplore: () => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onNavigateLogin,
  onNavigateRegister,
  onNavigateExplore,
}) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'workflow' | 'features' | 'privacy' | 'about'>('platform');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Top Government Emblem Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3 max-w-7xl mx-auto w-full">
          <span className="font-semibold tracking-wider text-amber-400">
            MINISTRY OF SKILL DEVELOPMENT & ENTREPRENEURSHIP
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">National Directorate of Vocational Compliance & Accreditation</span>
          <div className="ml-auto flex items-center space-x-4 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Govt Cloud Active
            </span>
            <span>Inter-Ministerial Audit Node</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">SkillGuard AI</span>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  Govt Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                AI-Powered Training Centre Compliance & Monitoring Platform
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('platform')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'platform' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Platform
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'workflow' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'features' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'privacy' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Privacy & Security
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'about' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              About
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
            >
              Login
            </button>
            <button
              onClick={onNavigateRegister}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <span>Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Subtitle, CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>National Skill Quality & Integrity Framework</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Smarter Monitoring. <br />
              <span className="text-indigo-600">Stronger Skill Development.</span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              "AI-powered video analytics for transparent, continuous and privacy-preserving monitoring of government training centres."
            </p>

            {/* Core Values Tagline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-medium text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Government Compliance</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI Automated Audits</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Transparency & Trace</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Accountability Ledger</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Face Biometrics</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Training Quality Guarantee</span>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={onNavigateExplore}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
              >
                <span>Explore Platform</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateRegister}
                className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-all"
              >
                Request Access
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual - Professional Enterprise Dashboard Preview */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden ring-1 ring-slate-900/5">
              {/* Fake Window Header */}
              <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 pl-2">
                    skillguard.gov.in/live-monitoring/tc_001
                  </span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                  YOLOv8m 15 FPS
                </span>
              </div>

              {/* Preview Content */}
              <div className="p-5 space-y-4 bg-slate-50/60">
                {/* 5 KPI Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Compliance Score</span>
                    <span className="text-xl font-black text-slate-900">78%</span>
                    <span className="text-[10px] font-semibold text-amber-600 block mt-0.5">Review Required</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Attendance Status</span>
                    <span className="text-xl font-black text-rose-600">32 / 40</span>
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">20% Discrepancy</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Infrastructure</span>
                    <span className="text-xl font-black text-slate-900">18 / 20</span>
                    <span className="text-[10px] font-semibold text-amber-600 block mt-0.5">2 Units Missing</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">AI Alerts</span>
                    <span className="text-xl font-black text-rose-600">3 Open</span>
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">1 Critical</span>
                  </div>
                </div>

                {/* Simulated CCTV Stream Overlay */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex flex-col justify-between p-4 text-white shadow-inner">
                  {/* Background Mock Video Image */}
                  <img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
                    alt="Classroom Monitoring"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60"></div>

                  {/* Top Feed Bar */}
                  <div className="relative z-10 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-mono text-[11px] font-bold tracking-wider">ABC SKILL CENTRE — IT LAB 1</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded text-amber-300">
                      Edge Anonymized
                    </span>
                  </div>

                  {/* Simulated Bounding Boxes */}
                  <div className="relative z-10 my-auto grid grid-cols-3 gap-3 pointer-events-none">
                    <div className="border border-sky-400 bg-sky-500/10 p-2 rounded text-[10px] font-mono text-sky-200">
                      <span className="font-bold">person (track#12)</span>: 96%
                    </div>
                    <div className="border border-blue-400 bg-blue-500/10 p-2 rounded text-[10px] font-mono text-blue-200">
                      <span className="font-bold">computer #18</span>: 94%
                    </div>
                    <div className="border border-amber-400 bg-amber-500/10 p-2 rounded text-[10px] font-mono text-amber-200">
                      <span className="font-bold">workbench #05</span>: 91%
                    </div>
                  </div>

                  {/* Bottom Feed Overlay */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] pt-2 border-t border-slate-700/60">
                    <span className="text-slate-300">
                      AI Count: <strong className="text-white">32 Trainees</strong> (Reported: 40)
                    </span>
                    <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                      DEFICIT FLAGGED
                    </span>
                  </div>
                </div>

                {/* Action Tracking Bar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      ACT
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">ACT-2026-001: Trainee Deficit Clarification</span>
                      <span className="text-[10px] text-slate-500">Assigned by Rajesh Sharma • Due in 5 Days</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    IN PROGRESS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: FEATURES SECTION */}
      <section className="py-16 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Capabilities</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Features Built for Government Oversight
            </h2>
            <p className="text-xs text-slate-500">
              Statutory verification mechanisms tailored for national vocational training and PMKVY standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Attendance Monitoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Estimate physical presence from camera feeds and compare against submitted attendance. Flag discrepancy rates with statutory thresholds.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Infrastructure Compliance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detect approved equipment and identify potential shortages across computers, industrial machinery, workbenches, and ergonomic seating.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically flag suspicious discrepancies, equipment relocation, or offline CCTV feeds with cryptographic audit timestamps and snapshot evidence.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Action Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track corrective actions from creation to resolution through an immutable state machine: Assigned, Submitted, Verified, Reopened, or Escalated.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Privacy First</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use aggregate presence detection without facial identification. Zero student biometric identifiers, facial landmarks, or names are ever processed.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Low Bandwidth</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Support edge-based processing and lightweight evidence transmission. Operates smoothly on remote rural training centres with 2G/3G connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: HOW IT WORKS (5 Steps) */}
      <section className="py-16 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Workflow</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How SkillGuard AI Operates
            </h2>
            <p className="text-xs text-slate-500">
              A transparent 5-step operational pipeline connecting field cameras to statutory resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="text-2xl font-black text-indigo-600/40">01</div>
              <h3 className="text-sm font-bold text-slate-900">Connect Camera / Upload Video</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Connect on-site CCTV RTSP stream, upload inspection video footage (MP4, AVI, MOV), or capture live camera via browser.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="text-2xl font-black text-indigo-600/40">02</div>
              <h3 className="text-sm font-bold text-slate-900">AI Analyses Footage</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The trained YOLOv8m compliance model processes keyframes to detect trainees, computers, machines, workbenches, and seating.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="text-2xl font-black text-indigo-600/40">03</div>
              <h3 className="text-sm font-bold text-slate-900">Compliance Engine Detects Discrepancy</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The engine compares AI observations against approved rosters and inventory, calculating weighted compliance indices and alerts.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="text-2xl font-black text-indigo-600/40">04</div>
              <h3 className="text-sm font-bold text-slate-900">Officer Reviews & Assigns Action</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Government monitoring officer inspects video evidence, confirms validity, and issues a formal remediation action with turnaround deadline.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="text-2xl font-black text-indigo-600/40">05</div>
              <h3 className="text-sm font-bold text-slate-900">Centre Responds & Officer Verifies</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Training centre submits justification and photographic evidence. Officer verifies and marks issue Resolved or triggers escalation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 62 & 63: Privacy & Security Details */}
      <section className="py-16 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Statutory Commitment</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy by Design & Government Grade Security
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>Statutory Privacy Assurance</span>
              </div>
              <p className="text-xs text-emerald-950 font-semibold">
                "SkillGuard AI estimates aggregate physical presence and does not perform facial identification."
              </p>
              <ul className="text-xs text-emerald-900 space-y-1.5 list-disc pl-4">
                <li>Zero facial recognition keypoints or biometric models are stored.</li>
                <li>Temporary track IDs persist solely during the active inference session.</li>
                <li>Evidence snapshots are encrypted at rest with AES-256 GCM.</li>
                <li>Automated data retention and purging policy adhering to government guidelines.</li>
              </ul>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>Security & Role Governance</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                <li>Bcrypt password hashing with JWT stateless access and refresh tokens.</li>
                <li>Strict backend role enforcement: SUPER_ADMIN, GOVERNMENT_ADMIN, MONITORING_OFFICER, CENTRE_ADMIN.</li>
                <li>Account lockout safeguards against brute force attacks.</li>
                <li>Immutable audit trail tracking all actions, responses, and score modifications.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>SkillGuard AI</span>
            </div>
            <p className="text-[11px] text-slate-400">
              National Training Centre Compliance & Monitoring Platform • Ministry of Skill Development
            </p>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <button onClick={onNavigateExplore} className="hover:text-white transition-colors">
              Live Demo
            </button>
            <button onClick={onNavigateLogin} className="hover:text-white transition-colors">
              Portal Sign In
            </button>
            <button onClick={onNavigateRegister} className="hover:text-white transition-colors">
              Officer Onboarding
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
