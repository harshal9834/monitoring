import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { GuidedTourModal } from './components/common/GuidedTourModal';
import { PrivacyModal } from './components/common/PrivacyModal';
import { AuthModal } from './components/common/AuthModal';
import { PortalSelectionView } from './components/pages/PortalSelectionView';
import { DedicatedPortalLogin } from './components/pages/DedicatedPortalLogin';
import { CentreSignupView } from './components/pages/CentreSignupView';
import { GovernmentRequestAccessView } from './components/pages/GovernmentRequestAccessView';
import { PublicLanding } from './components/pages/PublicLanding';
import { DashboardView } from './components/pages/DashboardView';
import { CentreDashboardView } from './components/pages/CentreDashboardView';
import { SuperAdminDashboardView } from './components/pages/SuperAdminDashboardView';
import { CentresView } from './components/pages/CentresView';
import { CentreDetailView } from './components/pages/CentreDetailView';
import { VideoMonitoringView } from './components/pages/VideoMonitoringView';
import { AlertsView } from './components/pages/AlertsView';
import { AttendanceView } from './components/pages/AttendanceView';
import { InfrastructureView } from './components/pages/InfrastructureView';
import { ActionsView } from './components/pages/ActionsView';
import { InspectionsView } from './components/pages/InspectionsView';
import { AnalyticsView } from './components/pages/AnalyticsView';
import { MLPipelineView } from './components/pages/MLPipelineView';
import { ReportsView } from './components/pages/ReportsView';
import { AuditLogView } from './components/pages/AuditLogView';
import { SettingsView } from './components/pages/SettingsView';
import { UserManagementView } from './components/pages/UserManagementView';
import { CamerasView } from './components/pages/CamerasView';
import { CentreDailySubmissionView } from './components/pages/CentreDailySubmissionView';
import { CentreSubmissionsHistoryView } from './components/pages/CentreSubmissionsHistoryView';
import { CentreNoticesActionsView } from './components/pages/CentreNoticesActionsView';
import { CentreProfileView } from './components/pages/CentreProfileView';
import { SubmissionsView } from './components/pages/SubmissionsView';
import { SubmissionDetailView } from './components/pages/SubmissionDetailView';
import { NoticeCaseReviewView } from './components/pages/NoticeCaseReviewView';
import { AIAnalysisView } from './components/pages/AIAnalysisView';
import { AIAnalysisCentresListView } from './components/pages/AIAnalysisCentresListView';
import { IssuesView } from './components/pages/IssuesView';
import { NoticesView } from './components/pages/NoticesView';
import { GovernmentNotificationsView } from './components/pages/GovernmentNotificationsView';
import { GovernmentProfileView } from './components/pages/GovernmentProfileView';
import { appState } from './services/storage';

type AppRoute =
  | 'portal_selection'
  | 'gov_login'
  | 'centre_login'
  | 'admin_login'
  | 'centre_signup'
  | 'gov_request_access'
  | 'authenticated'
  | 'public_landing';

export const App: React.FC = () => {
  // Routing state fulfilling Section 8, 9, 10, 11, 12, 13
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const path = window.location.pathname;
    if (path === '/portal-login') return 'portal_selection';
    if (path === '/government/login') return 'gov_login';
    if (path === '/centre/login') return 'centre_login';
    if (path === '/admin/login') return 'admin_login';
    if (path === '/centre/signup') return 'centre_signup';
    if (path === '/government/request-access') return 'gov_request_access';

    const token = localStorage.getItem('skillguard_token');
    return token ? 'authenticated' : 'portal_selection';
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const user = appState.currentUser;
    if (user.role === 'SUPER_ADMIN') return 'centres';
    return 'dashboard';
  });
  const [selectedCentreId, setSelectedCentreId] = useState<string>('tc_001');
  const [aiAnalysisCentreId, setAiAnalysisCentreId] = useState<string | null>(null);

  // Modals
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | null>(null);

  // Mobile menu drawer state (must be at top level with all other hooks)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [, setTick] = useState<number>(0);

  // Subscribe to reactive state updates
  useEffect(() => {
    const unsubscribe = appState.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for seamless navigation and auth events without full browser reloads
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentRoute('portal_selection');
    };
    const handleCustomNav = (e: any) => {
      if (e.detail) {
        setCurrentRoute(e.detail);
      }
    };
    window.addEventListener('skillguard:unauthorized', handleUnauthorized);
    window.addEventListener('skillguard:navigate', handleCustomNav);
    return () => {
      window.removeEventListener('skillguard:unauthorized', handleUnauthorized);
      window.removeEventListener('skillguard:navigate', handleCustomNav);
    };
  }, []);

  const currentUser = appState.currentUser;
  const userRole = currentUser.role;

  const getAllowedTabsForRole = (role: string): NavTab[] => {
    if (role === 'CENTRE_ADMIN') {
      return [
        'dashboard',
        'centre_submit_data',
        'centre_submissions',
        'centre_notices',
        'profile',
      ];
    }
    if (role === 'SUPER_ADMIN') {
      return [
        'centres',
        'centre_detail',
        'users',
        'audit_logs',
        'profile',
      ];
    }
    // Government Monitoring Officers / Admins (Strictly 7 modules + case review / detail)
    return [
      'dashboard',
      'centres',
      'centre_detail',
      'submissions',
      'submission_detail',
      'ai_analysis',
      'issues',
      'notices',
      'notice_case_review',
      'notifications',
      'profile',
    ];
  };

  // Ensure activeTab is always aligned with role
  useEffect(() => {
    const allowed = getAllowedTabsForRole(currentUser.role);
    if (!allowed.includes(activeTab)) {
      setActiveTab(currentUser.role === 'SUPER_ADMIN' ? 'centres' : 'dashboard');
    }
  }, [currentUser.role]);

  const handleNavigate = (tab: NavTab, centreId?: string) => {
    const allowed = getAllowedTabsForRole(currentUser.role);
    if (!allowed.includes(tab)) {
      console.warn(`Unauthorized tab access attempted: ${tab} by ${currentUser.role}`);
      setActiveTab(currentUser.role === 'SUPER_ADMIN' ? 'centres' : 'dashboard');
      return;
    }
    if (tab === 'ai_analysis') {
      setAiAnalysisCentreId(centreId || null);
    }
    if (centreId) {
      setSelectedCentreId(centreId);
    }
    setActiveTab(tab);
    setCurrentRoute('authenticated');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    appState.logout();
    setCurrentRoute('portal_selection');
  };

  // ROUTE 1: Section 8 Portal Selection Entry Page
  if (currentRoute === 'portal_selection') {
    return (
      <PortalSelectionView
        onSelectPortal={(portal) => {
          if (portal === 'government') setCurrentRoute('gov_login');
          else if (portal === 'centre') setCurrentRoute('centre_login');
          else setCurrentRoute('admin_login');
        }}
      />
    );
  }

  // ROUTE 2: Section 9 Government Login (/government/login)
  if (currentRoute === 'gov_login') {
    return (
      <DedicatedPortalLogin
        portalType="government"
        onBack={() => setCurrentRoute('portal_selection')}
        onSuccess={() => {
          setCurrentRoute('authenticated');
          setActiveTab('dashboard');
        }}
        onRequestGovAccess={() => setCurrentRoute('gov_request_access')}
      />
    );
  }

  // ROUTE 3: Section 10 Centre Login (/centre/login)
  if (currentRoute === 'centre_login') {
    return (
      <DedicatedPortalLogin
        portalType="centre"
        onBack={() => setCurrentRoute('portal_selection')}
        onSuccess={() => {
          setCurrentRoute('authenticated');
          setActiveTab('dashboard');
        }}
        onRegisterCentre={() => setCurrentRoute('centre_signup')}
      />
    );
  }

  // ROUTE 4: Section 11 Admin Login (/admin/login)
  if (currentRoute === 'admin_login') {
    return (
      <DedicatedPortalLogin
        portalType="admin"
        onBack={() => setCurrentRoute('portal_selection')}
        onSuccess={() => {
          setCurrentRoute('authenticated');
          setActiveTab('centres');
        }}
      />
    );
  }

  // ROUTE 5: Section 12 Centre Registration (/centre/signup)
  if (currentRoute === 'centre_signup') {
    return (
      <CentreSignupView
        onBack={() => setCurrentRoute('centre_login')}
        onSuccess={() => setCurrentRoute('centre_login')}
      />
    );
  }

  // ROUTE 6: Section 13 Government Request Access (/government/request-access)
  if (currentRoute === 'gov_request_access') {
    return (
      <GovernmentRequestAccessView
        onBack={() => setCurrentRoute('gov_login')}
        onSuccess={() => setCurrentRoute('gov_login')}
      />
    );
  }

  // ROUTE 7: Public Website Landing Page
  if (currentRoute === 'public_landing') {
    return (
      <>
        <PublicLanding
          onNavigateLogin={() => setCurrentRoute('portal_selection')}
          onNavigateRegister={() => setCurrentRoute('centre_signup')}
          onNavigateExplore={() => {
            setCurrentRoute('authenticated');
            setActiveTab('dashboard');
          }}
        />

        {authModalMode && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
            onSuccess={() => {
              setAuthModalMode(null);
              setCurrentRoute('authenticated');
              setActiveTab('dashboard');
            }}
          />
        )}
      </>
    );
  }

  // ROUTE 8: Authenticated Applications (Government, Centre, Super Admin)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Enterprise Government Header */}
      <Header
        activeTab={activeTab}
        onStartTour={() => setIsTourOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAuth={() => setCurrentRoute('portal_selection')}
        onLogout={handleLogout}
        onNavigateTab={(tab, targetId) => handleNavigate(tab as NavTab, targetId)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar (Role-Adaptive per Section 12 & 52) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            handleNavigate(tab);
            setIsMobileMenuOpen(false);
          }}
          onLogout={handleLogout}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {/* DASHBOARD TAB (Adaptive per Role) */}
          {activeTab === 'dashboard' && (
            <>
              {userRole === 'CENTRE_ADMIN' ? (
                <CentreDashboardView onNavigate={(tab) => handleNavigate(tab)} />
              ) : userRole === 'SUPER_ADMIN' ? (
                <SuperAdminDashboardView />
              ) : (
                <DashboardView onNavigate={(tab, centreId) => handleNavigate(tab, centreId)} />
              )}
            </>
          )}

          {/* SIMPLIFIED TRAINING CENTRE PORTAL VIEWS */}
          {userRole === 'CENTRE_ADMIN' && activeTab === 'centre_submit_data' && (
            <CentreDailySubmissionView onNavigate={(tab) => handleNavigate(tab)} />
          )}

          {userRole === 'CENTRE_ADMIN' && activeTab === 'centre_submissions' && (
            <CentreSubmissionsHistoryView onNavigate={(tab) => handleNavigate(tab)} />
          )}

          {userRole === 'CENTRE_ADMIN' && activeTab === 'centre_notices' && (
            <CentreNoticesActionsView />
          )}

          {userRole === 'CENTRE_ADMIN' && activeTab === 'profile' && (
            <CentreProfileView />
          )}

          {/* CENTRES VIEW (GOVERNMENT & SUPER ADMIN) */}
          {activeTab === 'centres' && userRole !== 'CENTRE_ADMIN' && (
            <CentresView
              onSelectCentre={(id) => handleNavigate('centre_detail', id)}
              onNavigate={(tab) => handleNavigate(tab)}
            />
          )}

          {/* CENTRE DETAIL VIEW */}
          {activeTab === 'centre_detail' && userRole !== 'CENTRE_ADMIN' && (
            <CentreDetailView
              centreId={selectedCentreId}
              onBack={() => handleNavigate('centres')}
              onNavigate={(tab) => handleNavigate(tab)}
            />
          )}

          {/* SUBMISSIONS / REQUESTS MODULE (GOVERNMENT SPECIFIC) */}
          {activeTab === 'submissions' && userRole !== 'CENTRE_ADMIN' && (
            <SubmissionsView
              onNavigate={(tab, targetId) => handleNavigate(tab, targetId)}
              onOpenSubmissionDetail={(id) => {
                setSelectedCentreId(id);
                setActiveTab('submission_detail');
              }}
            />
          )}

          {/* SUBMISSION DETAIL PAGE (GOVERNMENT SPECIFIC) */}
          {activeTab === 'submission_detail' && userRole !== 'CENTRE_ADMIN' && (
            <SubmissionDetailView
              submissionId={selectedCentreId}
              onBack={() => setActiveTab('submissions')}
              onNavigate={(tab, targetId) => handleNavigate(tab, targetId)}
            />
          )}

          {/* NOTICE CASE REVIEW VIEW (AUDIT REVIEW FLOW) */}
          {activeTab === 'notice_case_review' && userRole !== 'CENTRE_ADMIN' && (
            <NoticeCaseReviewView
              noticeId={selectedCentreId}
              onBack={() => setActiveTab('notices')}
              onNavigate={(tab, targetId) => handleNavigate(tab, targetId)}
            />
          )}

          {/* AI ANALYSIS VIEW (GOVERNMENT SPECIFIC) */}
          {activeTab === 'ai_analysis' && (
            aiAnalysisCentreId ? (
              <AIAnalysisView
                centerId={aiAnalysisCentreId}
                targetId={aiAnalysisCentreId}
                onBack={() => setAiAnalysisCentreId(null)}
                onNavigate={(tab) => handleNavigate(tab)}
              />
            ) : (
              <AIAnalysisCentresListView
                onSelectCentre={(centreId) => setAiAnalysisCentreId(centreId)}
              />
            )
          )}

          {/* ALERTS & ISSUES (GOVERNMENT SPECIFIC) */}
          {activeTab === 'issues' && (
            <IssuesView onNavigate={(tab, targetId) => handleNavigate(tab, targetId)} />
          )}

          {/* ACTIONS & NOTICES (GOVERNMENT SPECIFIC) */}
          {activeTab === 'notices' && (
            <NoticesView onNavigate={(tab, targetId) => handleNavigate(tab, targetId)} />
          )}

          {/* NOTIFICATIONS (GOVERNMENT SPECIFIC) */}
          {activeTab === 'notifications' && userRole !== 'CENTRE_ADMIN' && (
            <GovernmentNotificationsView onNavigate={(tab, targetId) => handleNavigate(tab, targetId)} />
          )}

          {/* PROFILE (GOVERNMENT SPECIFIC) */}
          {activeTab === 'profile' && userRole !== 'CENTRE_ADMIN' && (
            <GovernmentProfileView onLogout={handleLogout} />
          )}

          {/* IMMUTABLE AUDIT LOGS (ADMIN ONLY) */}
          {activeTab === 'audit_logs' && userRole === 'SUPER_ADMIN' && <AuditLogView />}

          {/* USER ACCESS & CREDENTIAL MANAGEMENT (ADMIN ONLY) */}
          {activeTab === 'users' && userRole === 'SUPER_ADMIN' && <UserManagementView />}
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
