import {
  TrainingCentre,
  User,
  UserRole,
  ComplianceAlert,
  ComplianceAction,
  ActionStatus,
  ActionPriority,
  AttendanceRecord,
  CameraStream,
  AuditLogEntry,
  SystemSettings,
  MLModelInfo,
} from '../types';
import {
  INITIAL_CENTRES,
  INITIAL_USERS,
  INITIAL_CAMERAS,
  INITIAL_ATTENDANCE,
  INITIAL_ALERTS,
  INITIAL_ACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_ML_MODEL_INFO,
} from './mockData';

type Listener = () => void;

class AppStateManager {
  private listeners: Set<Listener> = new Set();
  public currentUser: User = INITIAL_USERS[0]; // Default: Dr. Alok Verma (gov_admin)
  public centres: TrainingCentre[] = [];
  public users: User[] = [];
  public cameras: CameraStream[] = [];
  public attendanceRecords: AttendanceRecord[] = [];
  public alerts: ComplianceAlert[] = [];
  public actions: ComplianceAction[] = [];
  public auditLogs: AuditLogEntry[] = [];
  public settings: SystemSettings = INITIAL_SETTINGS;
  public mlModelInfo: MLModelInfo = INITIAL_ML_MODEL_INFO;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedCentres = localStorage.getItem('kavach_centres');
      const storedUsers = localStorage.getItem('kavach_users');
      const storedAlerts = localStorage.getItem('kavach_alerts');
      const storedActions = localStorage.getItem('kavach_actions');
      const storedAttendance = localStorage.getItem('kavach_attendance');
      const storedAudit = localStorage.getItem('kavach_audit');
      const storedSettings = localStorage.getItem('kavach_settings');
      const storedCurrentUser = localStorage.getItem('kavach_current_user');

      this.centres = storedCentres ? JSON.parse(storedCentres) : INITIAL_CENTRES;
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
      this.cameras = INITIAL_CAMERAS;
      this.attendanceRecords = storedAttendance ? JSON.parse(storedAttendance) : INITIAL_ATTENDANCE;
      this.alerts = storedAlerts ? JSON.parse(storedAlerts) : INITIAL_ALERTS;
      this.actions = storedActions ? JSON.parse(storedActions) : INITIAL_ACTIONS;
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : INITIAL_AUDIT_LOGS;
      this.settings = storedSettings ? JSON.parse(storedSettings) : INITIAL_SETTINGS;
      this.currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : INITIAL_USERS[0];
    } catch {
      this.resetToDefaults();
    }
  }

  public saveState() {
    try {
      localStorage.setItem('kavach_centres', JSON.stringify(this.centres));
      localStorage.setItem('kavach_users', JSON.stringify(this.users));
      localStorage.setItem('kavach_alerts', JSON.stringify(this.alerts));
      localStorage.setItem('kavach_actions', JSON.stringify(this.actions));
      localStorage.setItem('kavach_attendance', JSON.stringify(this.attendanceRecords));
      localStorage.setItem('kavach_audit', JSON.stringify(this.auditLogs));
      localStorage.setItem('kavach_settings', JSON.stringify(this.settings));
      localStorage.setItem('kavach_current_user', JSON.stringify(this.currentUser));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notify();
  }

  public resetToDefaults() {
    this.centres = JSON.parse(JSON.stringify(INITIAL_CENTRES));
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.cameras = JSON.parse(JSON.stringify(INITIAL_CAMERAS));
    this.attendanceRecords = JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));
    this.alerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    this.actions = JSON.parse(JSON.stringify(INITIAL_ACTIONS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
    this.currentUser = this.users[0];
    this.saveState();
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public switchUser(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.addAuditLog('USER_SWITCH', 'SYSTEM', user.id, `Active session switched to ${user.name} (${user.role})`);
      this.saveState();
    }
  }

  public addAuditLog(
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    newState?: string,
    previousState?: string
  ) {
    const newEntry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userRole: this.currentUser.role,
      action,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      entityType,
      entityId,
      previousState,
      newState,
      ipAddress: '10.14.3.92',
    };
    this.auditLogs.unshift(newEntry);
  }

  // Centre Management
  public addCentre(centre: Omit<TrainingCentre, 'id' | 'complianceScore' | 'attendanceComplianceRate' | 'infrastructureComplianceRate' | 'actionComplianceRate'>) {
    const newCentre: TrainingCentre = {
      ...centre,
      id: `tc_${Date.now()}`,
      complianceScore: 85,
      attendanceComplianceRate: 85,
      infrastructureComplianceRate: 90,
      actionComplianceRate: 80,
    };
    this.centres.push(newCentre);
    this.addAuditLog('CENTRE_CREATED', 'CENTRE', newCentre.id, `Created centre ${newCentre.name} (${newCentre.code})`);
    this.recalculateCentreCompliance(newCentre.id);
    this.saveState();
    return newCentre;
  }

  public updateCentre(id: string, updates: Partial<TrainingCentre>) {
    const index = this.centres.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.centres[index] = { ...this.centres[index], ...updates };
      this.addAuditLog('CENTRE_UPDATED', 'CENTRE', id, `Updated details for ${this.centres[index].name}`);
      this.recalculateCentreCompliance(id);
      this.saveState();
    }
  }

  // Attendance submission
  public submitAttendance(record: Omit<AttendanceRecord, 'id' | 'discrepancyCount' | 'discrepancyPercentage' | 'status'>) {
    const discrepancy = record.aiEstimatedCount !== undefined
      ? Math.abs(record.reportedTrainees - record.aiEstimatedCount)
      : 0;
    const discrepancyPct = record.aiEstimatedCount !== undefined && record.reportedTrainees > 0
      ? Number(((discrepancy / record.reportedTrainees) * 100).toFixed(1))
      : 0;

    let status: AttendanceRecord['status'] = 'VERIFIED';
    if (record.aiEstimatedCount === undefined) {
      status = 'PENDING_AI_SCAN';
    } else if (discrepancyPct > this.settings.attendanceCriticalThresholdPercent) {
      status = 'DISCREPANCY_CRITICAL';
    } else if (discrepancyPct > this.settings.attendanceWarningThresholdPercent) {
      status = 'DISCREPANCY_WARNING';
    }

    const newRecord: AttendanceRecord = {
      ...record,
      id: `att_${Date.now()}`,
      discrepancyCount: discrepancy,
      discrepancyPercentage: discrepancyPct,
      status,
    };

    this.attendanceRecords.unshift(newRecord);
    this.addAuditLog('ATTENDANCE_SUBMITTED', 'ATTENDANCE', newRecord.id, `Reported: ${record.reportedTrainees}, AI: ${record.aiEstimatedCount || 'Pending'}`);

    // If critical discrepancy, auto-generate alert
    if (status === 'DISCREPANCY_CRITICAL' || status === 'DISCREPANCY_WARNING') {
      const centre = this.centres.find((c) => c.id === record.centreId);
      this.createAlert({
        centreId: record.centreId,
        centreName: centre ? centre.name : 'Training Centre',
        category: 'ATTENDANCE_MISMATCH',
        severity: status === 'DISCREPANCY_CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: `Attendance Discrepancy (${discrepancyPct}% Variance in Batch ${record.batchCode})`,
        description: `Centre reported ${record.reportedTrainees} trainees present, but AI vision estimated ${record.aiEstimatedCount}. Discrepancy count: ${discrepancy}.`,
        aiConfidence: 0.93,
        evidence: {
          snapshotUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
          timestamp: new Date().toISOString(),
          cameraId: 'cam_001_lab',
          cameraName: 'CCTV Feed (Batch Hall)',
          detectedCount: record.aiEstimatedCount || 0,
          expectedCount: record.reportedTrainees,
          confidence: 0.934,
          modelVersion: this.mlModelInfo.modelId,
          detectionMetadata: {
            people: record.aiEstimatedCount || 0,
            computers: 18,
            machines: 2,
            workbenches: 5,
            chairs: 35,
            damaged: 0,
          },
        },
      });
    }

    this.recalculateCentreCompliance(record.centreId);
    this.saveState();
    return newRecord;
  }

  // Alerts
  public createAlert(alertData: Omit<ComplianceAlert, 'id' | 'detectedTime' | 'status'>) {
    const newAlert: ComplianceAlert = {
      ...alertData,
      id: `alt_${Date.now()}`,
      detectedTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'NEW',
    };
    this.alerts.unshift(newAlert);
    this.addAuditLog('ALERT_GENERATED', 'ALERT', newAlert.id, `${newAlert.severity} - ${newAlert.title}`);
    this.recalculateCentreCompliance(alertData.centreId);
    this.saveState();
    return newAlert;
  }

  public updateAlertStatus(alertId: string, status: ComplianceAlert['status'], remarks?: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      const prev = alert.status;
      alert.status = status;
      if (remarks) alert.officerRemarks = remarks;
      this.addAuditLog('ALERT_STATUS_CHANGED', 'ALERT', alertId, status, prev);
      this.recalculateCentreCompliance(alert.centreId);
      this.saveState();
    }
  }

  // Actions
  public createAction(actionData: {
    alertId?: string;
    centreId: string;
    title: string;
    description: string;
    issueCategory: ComplianceAction['issueCategory'];
    priority: ActionPriority;
    dueDate: string;
  }) {
    const centre = this.centres.find((c) => c.id === actionData.centreId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newAction: ComplianceAction = {
      id: `act_${Date.now()}`,
      alertId: actionData.alertId,
      centreId: actionData.centreId,
      centreName: centre ? centre.name : 'Unknown Centre',
      title: actionData.title,
      description: actionData.description,
      issueCategory: actionData.issueCategory,
      priority: actionData.priority,
      status: 'ACTION_ASSIGNED',
      assignedOfficerName: this.currentUser.name,
      assignedToRole: 'Centre Admin',
      createdAt: nowStr,
      dueDate: actionData.dueDate,
      isOverdue: false,
      escalationLevel: 0,
      timeline: [
        {
          status: 'NEW',
          timestamp: nowStr,
          actor: 'System AI Engine',
          note: 'Issue flagged from monitoring alert',
        },
        {
          status: 'ACTION_ASSIGNED',
          timestamp: nowStr,
          actor: `${this.currentUser.name} (${this.currentUser.designation})`,
          note: `Action issued with compliance deadline ${actionData.dueDate}`,
        },
      ],
      comments: [
        {
          id: `cmt_${Date.now()}`,
          authorName: this.currentUser.name,
          authorRole: this.currentUser.role,
          text: `Formal notice issued: ${actionData.description}`,
          timestamp: nowStr,
        },
      ],
    };

    this.actions.unshift(newAction);

    // If linked to an alert, link and set alert status
    if (actionData.alertId) {
      const alert = this.alerts.find((a) => a.id === actionData.alertId);
      if (alert) {
        alert.status = 'ACTION_CREATED';
        alert.actionId = newAction.id;
      }
    }

    this.addAuditLog('ACTION_CREATED', 'ACTION', newAction.id, `Assigned to ${centre?.name || 'Centre'}`);
    this.recalculateCentreCompliance(actionData.centreId);
    this.saveState();
    return newAction;
  }

  // Centre Response to Action
  public submitCentreResponse(actionId: string, response: {
    explanation: string;
    proofDocumentName?: string;
    proofPhotoUrl?: string;
  }) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    action.status = 'SUBMITTED_FOR_VERIFICATION';
    action.centreResponse = {
      explanation: response.explanation,
      submittedAt: nowStr,
      submittedBy: `${this.currentUser.name} (${this.currentUser.role})`,
      proofDocumentName: response.proofDocumentName,
      proofPhotoUrl: response.proofPhotoUrl,
    };

    action.timeline.push({
      status: 'SUBMITTED_FOR_VERIFICATION',
      timestamp: nowStr,
      actor: `${this.currentUser.name} (Centre Admin)`,
      note: 'Corrective action evidence & explanation submitted for government verification.',
    });

    action.comments.push({
      id: `cmt_${Date.now()}`,
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      text: `Centre Explanation: ${response.explanation}`,
      timestamp: nowStr,
      attachmentName: response.proofDocumentName,
    });

    this.addAuditLog('ACTION_RESPONSE_SUBMITTED', 'ACTION', actionId, 'SUBMITTED_FOR_VERIFICATION', 'ACTION_ASSIGNED');
    this.recalculateCentreCompliance(action.centreId);
    this.saveState();
  }

  // Officer Verification
  public verifyAction(
    actionId: string,
    decision: 'APPROVED' | 'REJECTED' | 'REINSPECTION_ORDERED',
    mandatoryRemarks: string
  ) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let newStatus: ActionStatus = 'RESOLVED';

    if (decision === 'APPROVED') {
      newStatus = 'RESOLVED';
      action.resolvedAt = nowStr;
    } else if (decision === 'REJECTED') {
      newStatus = 'REOPENED';
    } else if (decision === 'REINSPECTION_ORDERED') {
      newStatus = 'REINSPECTION_REQUIRED';
    }

    action.status = newStatus;
    action.verification = {
      verifiedBy: `${this.currentUser.name} (${this.currentUser.designation})`,
      verifiedAt: nowStr,
      outcome: decision,
      mandatoryRemarks,
    };

    action.timeline.push({
      status: newStatus,
      timestamp: nowStr,
      actor: `${this.currentUser.name} (Government Officer)`,
      note: `Verification outcome: ${decision}. Remarks: ${mandatoryRemarks}`,
    });

    action.comments.push({
      id: `cmt_${Date.now()}`,
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      text: `Officer Verification [${decision}]: ${mandatoryRemarks}`,
      timestamp: nowStr,
    });

    // If resolved and has linked alert, resolve alert too
    if (newStatus === 'RESOLVED' && action.alertId) {
      const alert = this.alerts.find((a) => a.id === action.alertId);
      if (alert) alert.status = 'RESOLVED';
    }

    this.addAuditLog('ACTION_VERIFIED', 'ACTION', actionId, newStatus, 'SUBMITTED_FOR_VERIFICATION');
    this.recalculateCentreCompliance(action.centreId);
    this.saveState();
  }

  // Escalation
  public escalateAction(actionId: string, reason: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    action.status = 'ESCALATED';
    action.escalationLevel = (action.escalationLevel || 0) + 1;

    action.timeline.push({
      status: 'ESCALATED',
      timestamp: nowStr,
      actor: `${this.currentUser.name} / Auto Escalation`,
      note: `Escalated to Level ${action.escalationLevel}. Reason: ${reason}`,
    });

    action.comments.push({
      id: `cmt_${Date.now()}`,
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      text: `Escalation Notice: ${reason}`,
      timestamp: nowStr,
    });

    this.addAuditLog('ACTION_ESCALATED', 'ACTION', actionId, 'ESCALATED', action.status);
    this.recalculateCentreCompliance(action.centreId);
    this.saveState();
  }

  // Compliance Scoring Formula
  public recalculateCentreCompliance(centreId: string) {
    const centre = this.centres.find((c) => c.id === centreId);
    if (!centre) return;

    // 1. Attendance compliance (past records for this centre)
    const centreRecords = this.attendanceRecords.filter((r) => r.centreId === centreId);
    let attScore = 100;
    if (centreRecords.length > 0) {
      const totalPct = centreRecords.reduce((acc, r) => {
        const disc = r.discrepancyPercentage || 0;
        return acc + Math.max(0, 100 - disc * 2.5);
      }, 0);
      attScore = Math.round(totalPct / centreRecords.length);
    }

    // 2. Infrastructure compliance
    const activeInfraAlerts = this.alerts.filter(
      (a) => a.centreId === centreId && (a.category === 'INFRASTRUCTURE_SHORTAGE' || a.category === 'EQUIPMENT_DAMAGE') && a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE'
    );
    const infraScore = Math.max(40, 100 - activeInfraAlerts.length * 15);

    // 3. Action compliance
    const centreActions = this.actions.filter((a) => a.centreId === centreId);
    let actionScore = 100;
    if (centreActions.length > 0) {
      const resolvedCount = centreActions.filter((a) => a.status === 'RESOLVED').length;
      const overdueCount = centreActions.filter((a) => a.isOverdue || a.status === 'ESCALATED').length;
      actionScore = Math.max(30, Math.round((resolvedCount / centreActions.length) * 100 - overdueCount * 15));
    }

    // Weighted Overall
    const wAtt = this.settings.complianceWeightAttendance / 100;
    const wInf = this.settings.complianceWeightInfrastructure / 100;
    const wAct = this.settings.complianceWeightActions / 100;
    const overall = Math.round(attScore * wAtt + infraScore * wInf + actionScore * wAct);

    centre.attendanceComplianceRate = Math.min(100, Math.max(0, attScore));
    centre.infrastructureComplianceRate = Math.min(100, Math.max(0, infraScore));
    centre.actionComplianceRate = Math.min(100, Math.max(0, actionScore));
    centre.complianceScore = Math.min(100, Math.max(0, overall));

    // Update status based on score
    if (overall >= 85) centre.status = 'ACTIVE';
    else if (overall >= 70) centre.status = 'FLAGGED';
    else centre.status = 'UNDER_REVIEW';
  }

  public updateSettings(newSettings: Partial<SystemSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.addAuditLog('SETTINGS_UPDATED', 'SYSTEM', 'global_config', JSON.stringify(newSettings));
    // Recalculate for all centres
    this.centres.forEach((c) => this.recalculateCentreCompliance(c.id));
    this.saveState();
  }
}

export const appState = new AppStateManager();
