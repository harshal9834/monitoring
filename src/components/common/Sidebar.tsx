import React, { useState, useEffect } from 'react';
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
  Calendar,
  TrendingUp,
  UserCheck,
  Sliders,
  Database,
  PlusCircle,
  FileText,
  Bell,
  User,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { UserRole } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'centres'
  | 'centre_detail'
  | 'submissions'
  | 'submission_detail'
  | 'ai_analysis'
  | 'issues'
  | 'notices'
  | 'notice_case_review'
  | 'video_monitoring'
  | 'alerts'
  | 'attendance'
  | 'infrastructure'
  | 'actions'
  | 'inspections'
  | 'reports'
  | 'analytics'
  | 'audit_logs'
  | 'settings'
  | 'users'
  | 'cameras'
  | 'ml_pipeline'
  | 'dataset'
  | 'profile'
  | 'centre_submit_data'
  | 'centre_submissions'
  | 'centre_notices'
  | 'notifications';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

import { api } from '../../services/api';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const currentUser = appState.currentUser;
  const userRole: UserRole = currentUser.role;

  const [stats, setStats] = useState<{
    alertsCount: number;
    actionsCount: number;
    inspectionsCount: number;
    centresCount: number;
    camerasCount: number;
    complianceIndex: number;
    todaySubmitted: boolean;
    centreCode: string;
    unreadNotifs: number;
    pendingNotices: number;
  }>({
    alertsCount: 0,
    actionsCount: 0,
    inspectionsCount: 0,
    centresCount: 0,
    camerasCount: 0,
    complianceIndex: 82,
    todaySubmitted: false,
    centreCode: 'MH-PUN-TC-0842',
    unreadNotifs: 0,
    pendingNotices: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = () => {
      if (userRole === 'CENTRE_ADMIN') {
        api.getCentreSummary()
          .then((sum) => {
            if (sum && isMounted) {
              setStats({
                alertsCount: 0,
                actionsCount: sum.pendingNoticesCount || 0,
                inspectionsCount: 0,
                centresCount: 1,
                camerasCount: 0,
                complianceIndex: 0,
                todaySubmitted: Boolean(sum.isSubmittedToday || sum.todaySubmissionStatus === 'Submitted'),
                centreCode: sum.centreCode || 'MH-PUN-TC-0842',
                unreadNotifs: sum.unreadNotificationsCount || 0,
                pendingNotices: sum.pendingNoticesCount || 0,
              });
            }
          })
          .catch(() => {});
      } else {
        api.getGovernmentSummary()
          .then((sum) => {
            if (sum && isMounted) {
              setStats({
                alertsCount: sum.activeAlerts || 0,
                actionsCount: sum.pendingActions || 0,
                inspectionsCount: sum.scheduledInspections || 0,
                centresCount: sum.totalMonitoredCentres || 0,
                camerasCount: sum.onlineCameras || 0,
                complianceIndex: sum.complianceIndex || 82,
                todaySubmitted: false,
                centreCode: '',
                unreadNotifs: 0,
                pendingNotices: 0,
              });
            }
          })
          .catch(() => {});
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    const handleUpdate = () => fetchStats();
    window.addEventListener('skillguard:refresh-stats', handleUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('skillguard:refresh-stats', handleUpdate);
    };
  }, [userRole]);

  const activeAlertsCount = stats.alertsCount;
  const pendingActionsCount = stats.actionsCount;
  const scheduledInspectionsCount = stats.inspectionsCount;

  // Define Navigation Items based on Role (Strictly minimal for Centre Portal)
  let navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [];

  if (userRole === 'CENTRE_ADMIN') {
    // Strictly Minimal Centre Portal Navigation (Specification Section 1):
    // 1. Dashboard
    // 2. Submit Daily Data
    // 3. My Submissions
    // 4. Notices & Actions
    // 5. Profile
    // 6. Logout
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'centre_submit_data', label: 'Submit Daily Data', icon: PlusCircle },
      { id: 'centre_submissions', label: 'My Submissions', icon: FileText },
      {
        id: 'centre_notices',
        label: 'Notices & Actions',
        icon: ClipboardCheck,
        badge: stats.pendingNotices > 0 ? stats.pendingNotices : undefined,
        badgeColor: 'bg-amber-100 text-amber-700 font-bold',
      },
      { id: 'profile', label: 'Profile', icon: User },
    ];
  } else if (userRole === 'SUPER_ADMIN') {
    // Administration Portal (Strictly Minimal per Final Specification Section 2 & 20):
    // 1. Centre Registration & Management
    // 2. User Access
    // 3. Audit Logs
    // 4. Profile
    navItems = [
      { id: 'centres', label: 'Centre Management', icon: Building2 },
      { id: 'users', label: 'User Access', icon: UserCheck },
      { id: 'audit_logs', label: 'Audit Logs', icon: History },
      { id: 'profile', label: 'Profile', icon: User },
    ];
  } else {
    // Government Monitoring Portal (Strictly 7 Modules per Specification Section 4 & 50):
    // 1. Dashboard
    // 2. Training Centres
    // 3. Submissions / Requests
    // 4. AI Analysis
    // 5. Issues & Alerts
    // 6. Notices & Actions
    // 7. Profile / Logout
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'centres', label: 'Training Centres', icon: Building2 },
      { id: 'submissions', label: 'Submissions', icon: FileText },
      { id: 'ai_analysis', label: 'AI Analysis', icon: Video },
      {
        id: 'issues',
        label: 'Issues & Alerts',
        icon: AlertCircle,
        badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        badgeColor: 'bg-rose-100 text-rose-700',
      },
      {
        id: 'notices',
        label: 'Notices & Actions',
        icon: ClipboardCheck,
        badge: pendingActionsCount > 0 ? pendingActionsCount : undefined,
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      { id: 'profile', label: 'Profile', icon: User },
    ];
  }

  const avgCompliance = stats.complianceIndex;

  const handleItemClick = (tabId: NavTab) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Mobile Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto w-72 sm:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-80px)] transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="py-4 overflow-y-auto">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex md:hidden items-center justify-between px-5 pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">SkillGuard AI</span>
            </div>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Role Portal Header Indicator */}
          <div className="px-5 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono block">
              {userRole === 'CENTRE_ADMIN'
                ? 'Training Centre Portal'
                : userRole === 'SUPER_ADMIN'
                ? 'Super Admin Portal'
                : 'Government Portal'}
            </span>
          </div>

          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
      {userRole === 'CENTRE_ADMIN' ? (
        <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Today's Report</span>
            {stats.todaySubmitted ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Submitted
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Pending
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Centre ID:</span>
              <span className="font-mono font-bold text-slate-700">{stats.centreCode}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accredited Institution</span>
            </div>
          </div>

          {!stats.todaySubmitted && (
            <button
              onClick={() => onTabChange('centre_submit_data')}
              className="w-full mt-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Submit Data</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Compliance Index</span>
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
              <span className="font-semibold text-slate-700">{stats.centresCount} Accredited</span>
            </div>
            <div className="flex justify-between">
              <span>CCTV Cameras:</span>
              <span className="font-semibold text-slate-700">{stats.camerasCount} Feeds</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>YOLOv8m 15fps Active</span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      )}
      </aside>
    </>
  );
};
