import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bell,
  ChevronDown,
  Wifi,
  Eye,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  LogOut,
  Building2,
  Lock,
  Globe,
  User as UserIcon,
  Settings as SettingsIcon,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { api } from '../../services/api';
import { User, NotificationItem } from '../../types';

interface HeaderProps {
  onStartTour: () => void;
  onOpenPrivacy: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: any, targetId?: string) => void;
  activeTab: string;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onStartTour,
  onOpenPrivacy,
  onOpenAuth,
  onLogout,
  onNavigateTab,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = appState.currentUser;
  const notifications = appState.notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleResetData = () => {
    if (confirm('Reset platform data back to initial demonstration state?')) {
      appState.resetToDefaults();
    }
  };

  const [searchCentres, setSearchCentres] = useState<any[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<any[]>([]);
  const [searchActions, setSearchActions] = useState<any[]>([]);
  const [headerCentreInfo, setHeaderCentreInfo] = useState<{ name: string; code: string; status: string } | null>(null);

  useEffect(() => {
    if (currentUser.role === 'CENTRE_ADMIN') {
      api.getCentreSummary()
        .then((data: any) => {
          if (data && (data.centreName || data.centreCode)) {
            setHeaderCentreInfo({
              name: data.centreName || 'Training Centre',
              code: data.centreCode || 'TC-ALLOCATED',
              status: data.status || 'ACTIVE'
            });
          }
        })
        .catch(() => {});
    }
  }, [currentUser.role]);

  useEffect(() => {
    let isMounted = true;
    const syncNotifs = () => {
      const fetcher = currentUser.role === 'CENTRE_ADMIN'
        ? api.getCentreNotifications()
        : api.getGovernmentNotifications();

      fetcher
        .then((items: any) => {
          if (!isMounted || !Array.isArray(items)) return;
          const mapped: NotificationItem[] = items.map((it: any) => ({
            id: it.id || String(Math.random()),
            category: (it.category || (it.entityType === 'SUBMISSION' ? 'SYSTEM' : 'ACTION_ASSIGNED')) as any,
            title: it.title || 'Official Notification',
            message: it.message || '',
            timestamp: it.createdAt || it.timestamp || new Date().toISOString(),
            read: Boolean(it.isRead ?? it.read ?? false),
            linkTab: it.entityType === 'SUBMISSION' ? 'submissions' : 'notices',
            targetId: it.entityId || it.targetId,
          }));
          appState.setNotifications(mapped);
        })
        .catch(() => {});
    };

    syncNotifs();
    const interval = setInterval(syncNotifs, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser.role]);

  useEffect(() => {
    // Only query government-restricted alerts and actions if authenticated user holds government or super admin roles
    const isGov = currentUser.role === 'GOVERNMENT_ADMIN' || currentUser.role === 'MONITORING_OFFICER' || currentUser.role === 'SUPER_ADMIN';
    if (!isGov) return;

    api.getCentres().then((data: any) => { if (Array.isArray(data)) setSearchCentres(data); }).catch(() => {});
    api.getAlerts().then((data: any) => { if (Array.isArray(data)) setSearchAlerts(data); }).catch(() => {});
    api.getActions().then((data: any) => { if (Array.isArray(data)) setSearchActions(data); }).catch(() => {});
  }, [currentUser.role]);

  // Section 54: Global Search across Centres, Alerts, Actions
  const searchResults = searchQuery.trim()
    ? {
        centres: searchCentres.filter(
          (c) =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.district?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        alerts: searchAlerts.filter(
          (a) =>
            a.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.centreName?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        actions: searchActions.filter(
          (act) =>
            act.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            act.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            act.centreName?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }
    : null;

  const handleNotificationClick = (n: NotificationItem) => {
    n.read = true;
    appState.saveState();
    setNotificationOpen(false);
    if (currentUser.role === 'CENTRE_ADMIN') {
      onNavigateTab('centre_notices', n.targetId);
    } else {
      onNavigateTab(n.linkTab, n.targetId);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top National Portal Emblem Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-semibold tracking-wider text-amber-400">
            MINISTRY OF SKILL DEVELOPMENT & ENTREPRENEURSHIP
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium">National Skill Compliance Directorate (SkillGuard AI Portal)</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenPrivacy}
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy-Preserving (Zero Face Recognition)</span>
          </button>
          <span className="text-slate-500">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Wifi className={`w-3.5 h-3.5 ${appState.settings.lowBandwidthModeEnabled ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>
              {appState.settings.lowBandwidthModeEnabled ? 'Edge Low-Bandwidth Mode' : 'Standard CCTV Stream Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Hamburger (mobile/tablet) + Brand Identity */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              aria-label="Toggle navigation drawer"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100 shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">SkillGuard AI</h1>
                <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                  currentUser.role === 'CENTRE_ADMIN'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : currentUser.role === 'SUPER_ADMIN'
                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                }`}>
                  {currentUser.role === 'CENTRE_ADMIN'
                    ? 'CENTRE'
                    : currentUser.role === 'SUPER_ADMIN'
                    ? 'ADMIN'
                    : 'GOVERNMENT'}
                </span>
                {currentUser.role === 'CENTRE_ADMIN' && headerCentreInfo && (
                  <div className="hidden lg:flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
                      {headerCentreInfo.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      ID: {headerCentreInfo.code}
                    </span>
                  </div>
                )}
                {currentUser.role !== 'CENTRE_ADMIN' && (
                  <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                {currentUser.role === 'CENTRE_ADMIN'
                  ? 'Accredited Skill Provider Compliance & Roster Verification'
                  : currentUser.role === 'SUPER_ADMIN'
                  ? 'Root System Administration, Telemetry & Security Vigilance'
                  : 'AI-Powered Training Centre Compliance & Monitoring Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Section 54) */}
        <div className="relative hidden md:block max-w-xs w-full mx-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search centres, alerts, actions, officers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 space-y-3 z-50 max-h-96 overflow-y-auto text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-700">Search Results</span>
                <button onClick={() => setSearchOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-600">
                  Close
                </button>
              </div>

              {/* Centres */}
              {searchResults.centres.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Training Centres
                  </span>
                  {searchResults.centres.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onNavigateTab('centre_detail', c.id);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left p-1.5 hover:bg-slate-50 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Alerts */}
              {searchResults.alerts.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    AI Alerts
                  </span>
                  {searchResults.alerts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        onNavigateTab('alerts');
                        setSearchOpen(false);
                      }}
                      className="w-full text-left p-1.5 hover:bg-slate-50 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">{a.title}</span>
                      <span className="text-[10px] text-rose-600 font-bold">{a.id}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              {searchResults.actions.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Corrective Actions
                  </span>
                  {searchResults.actions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => {
                        onNavigateTab('actions');
                        setSearchOpen(false);
                      }}
                      className="w-full text-left p-1.5 hover:bg-slate-50 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">{act.title}</span>
                      <span className="text-[10px] text-amber-600 font-bold">{act.id}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.centres.length === 0 &&
                searchResults.alerts.length === 0 &&
                searchResults.actions.length === 0 && (
                  <p className="text-slate-400 text-center py-2 text-xs">No matching results found.</p>
                )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Guided Tour Walkthrough Button */}
          <button
            onClick={onStartTour}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors flex items-center space-x-1.5"
            title="Interactive 8-step evaluator tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Demo Walkthrough</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset platform demo scenario data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notification Centre Bell (Section 53) */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              )}
            </button>

            {notificationOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Notifications ({unreadCount} New)
                  </span>
                  <span className="text-[10px] text-slate-400">Click item to open record</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors text-xs space-y-1 ${
                        !n.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-[11px]">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs">No notifications.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Badge & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-[11px]">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <span className="font-bold text-slate-800 block text-xs leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold font-mono block">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-64 max-w-xs bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                <div className="px-4 pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Logged-in Account
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                    {currentUser.role === 'CENTRE_ADMIN' && (
                      <span className="text-[10px] font-semibold text-slate-500">
                        {currentUser.department || 'Apex Skill Center'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigateTab(currentUser.role === 'CENTRE_ADMIN' ? 'profile' : 'settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Profile</span>
                  </button>

                  {currentUser.role !== 'CENTRE_ADMIN' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigateTab('settings');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors font-medium"
                    >
                      <SettingsIcon className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 px-2">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors font-bold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
