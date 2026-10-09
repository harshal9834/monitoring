import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Video,
  AlertCircle,
  Users,
  Box,
  ClipboardCheck,
  Cpu,
  FileBarChart,
  History,
  Settings,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { appState } from '../../services/storage';

export type NavTab =
  | 'dashboard'
  | 'centres'
  | 'centre_detail'
  | 'video_monitoring'
  | 'alerts'
  | 'attendance'
  | 'infrastructure'
  | 'actions'
  | 'ml_pipeline'
  | 'reports'
  | 'audit_logs'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const activeAlertsCount = appState.alerts.filter((a) => a.status === 'NEW' || a.status === 'ACTION_CREATED').length;
  const pendingActionsCount = appState.actions.filter((a) => a.status !== 'RESOLVED').length;

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Compliance Dashboard', icon: LayoutDashboard },
    { id: 'centres', label: 'Training Centres', icon: Building2 },
    { id: 'video_monitoring', label: 'AI Video Monitoring', icon: Video },
    {
      id: 'alerts',
      label: 'AI Alerts',
      icon: AlertCircle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    { id: 'attendance', label: 'Attendance Records', icon: Users },
    { id: 'infrastructure', label: 'Approved Infrastructure', icon: Box },
    {
      id: 'actions',
      label: 'Actions & Follow-up',
      icon: ClipboardCheck,
      badge: pendingActionsCount > 0 ? pendingActionsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    { id: 'ml_pipeline', label: 'ML Model & Dataset', icon: Cpu },
    { id: 'reports', label: 'Compliance Reports', icon: FileBarChart },
    { id: 'audit_logs', label: 'Immutable Audit Trail', icon: History },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const avgCompliance = Math.round(
    appState.centres.reduce((acc, c) => acc + c.complianceScore, 0) / (appState.centres.length || 1)
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-80px)]">
      <div className="py-4">
        <div className="px-5 mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Monitoring Modules
          </p>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-700 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monitoring Stats Widget */}
      <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">National Index</span>
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            {avgCompliance}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              avgCompliance >= 85 ? 'bg-emerald-500' : avgCompliance >= 70 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${avgCompliance}%` }}
          />
        </div>

        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Centres Connected:</span>
            <span className="font-semibold text-slate-700">{appState.centres.length} of {appState.centres.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Cameras:</span>
            <span className="font-semibold text-slate-700">{appState.cameras.length} Feeds</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AI YOLOv8m Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
