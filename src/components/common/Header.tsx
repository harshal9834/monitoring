import React, { useState } from 'react';
import {
  Shield,
  Bell,
  UserCheck,
  ChevronDown,
  Sparkles,
  Wifi,
  Eye,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { User } from '../../types';

interface HeaderProps {
  onStartTour: () => void;
  onOpenPrivacy: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onStartTour, onOpenPrivacy }) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const currentUser = appState.currentUser;
  const criticalAlerts = appState.alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');
  const activeAlerts = appState.alerts.filter((a) => a.status === 'NEW' || a.status === 'ACTION_CREATED');

  const handleRoleSwitch = (user: User) => {
    appState.switchUser(user.id);
    setUserDropdownOpen(false);
  };

  const handleResetData = () => {
    if (confirm('Reset platform data back to initial demonstration state?')) {
      appState.resetToDefaults();
      window.location.reload();
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
          <span className="text-slate-300">National Directorate of Skill Compliance (KAVACH-AI Portal)</span>
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
              {appState.settings.lowBandwidthModeEnabled ? 'Edge Low-Bandwidth Mode' : 'Direct CCTV Stream Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-700 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">KAVACH-AI</h1>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded border border-indigo-200">
                  v1.4 Production
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Vision Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI Video Analytics for Government Training Centre Compliance & Monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Guided Tour Walkthrough Button */}
          <button
            onClick={onStartTour}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-all active:scale-95"
            title="Launch interactive 8-step compliance audit story walkthrough"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Start Guided Audit Demo</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={handleResetData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset demo data to initial state"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-xs text-slate-900">
                    Active System Notifications ({activeAlerts.length})
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">
                    {criticalAlerts.length} Critical
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 mt-1">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="py-2.5 text-xs">
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-slate-800 line-clamp-1">{alert.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{alert.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{alert.detectedTime}</span>
                    </div>
                  ))}
                  {activeAlerts.length === 0 && (
                    <p className="text-center py-4 text-xs text-slate-400">All alerts resolved.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-medium capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Demonstration Role Switcher
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Switch user perspective to test end-to-end compliance approval workflow:
                  </p>
                </div>

                <div className="py-1 space-y-1">
                  {appState.users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleRoleSwitch(u)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-800 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span>{u.name}</span>
                            {isSelected && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal">{u.designation}</p>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                          {u.role.replace('gov_', 'gov ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
