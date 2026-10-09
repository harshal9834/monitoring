import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { GuidedTourModal } from './components/common/GuidedTourModal';
import { PrivacyModal } from './components/common/PrivacyModal';
import { DashboardView } from './components/pages/DashboardView';
import { CentresView } from './components/pages/CentresView';
import { CentreDetailView } from './components/pages/CentreDetailView';
import { VideoMonitoringView } from './components/pages/VideoMonitoringView';
import { AlertsView } from './components/pages/AlertsView';
import { AttendanceView } from './components/pages/AttendanceView';
import { InfrastructureView } from './components/pages/InfrastructureView';
import { ActionsView } from './components/pages/ActionsView';
import { MLPipelineView } from './components/pages/MLPipelineView';
import { ReportsView } from './components/pages/ReportsView';
import { AuditLogView } from './components/pages/AuditLogView';
import { SettingsView } from './components/pages/SettingsView';
import { appState } from './services/storage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedCentreId, setSelectedCentreId] = useState<string>('tc_001');
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Subscribe to reactive state updates from appState
  useEffect(() => {
    const unsubscribe = appState.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleNavigate = (tab: NavTab, centreId?: string) => {
    if (centreId) {
      setSelectedCentreId(centreId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Enterprise Government Header */}
      <Header
        activeTab={activeTab}
        onStartTour={() => setIsTourOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={(tab) => handleNavigate(tab)} />

        {/* Dynamic Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView onNavigate={(tab, centreId) => handleNavigate(tab, centreId)} />
          )}

          {activeTab === 'centres' && (
            <CentresView
              onSelectCentre={(id) => handleNavigate('centre_detail', id)}
              onNavigate={(tab) => handleNavigate(tab)}
            />
          )}

          {activeTab === 'centre_detail' && (
            <CentreDetailView
              centreId={selectedCentreId}
              onBack={() => handleNavigate('centres')}
              onNavigate={(tab) => handleNavigate(tab)}
            />
          )}

          {activeTab === 'video_monitoring' && (
            <VideoMonitoringView
              onNavigateToActions={() => handleNavigate('actions')}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView onNavigateToActions={() => handleNavigate('actions')} />
          )}

          {activeTab === 'attendance' && <AttendanceView />}

          {activeTab === 'infrastructure' && <InfrastructureView />}

          {activeTab === 'actions' && <ActionsView />}

          {activeTab === 'ml_pipeline' && <MLPipelineView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'audit_logs' && <AuditLogView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Interactive 8-Step Compliance Walkthrough Tour */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => handleNavigate(tab)}
      />

      {/* Statutory Privacy Architecture Modal */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};

export default App;
