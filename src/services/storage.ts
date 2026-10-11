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
  InspectionRecord,
  NotificationItem,
} from '../types';
const DEFAULT_SETTINGS: SystemSettings = {
  attendanceWarningThresholdPercent: 10,
  attendanceCriticalThresholdPercent: 20,
  complianceWeightAttendance: 40,
  complianceWeightInfrastructure: 40,
  complianceWeightActions: 20,
  frameSamplingRateFps: 5,
  lowBandwidthModeEnabled: false,
  bandwidthMode: 'MEDIUM',
  privacyStrictAnonymization: true,
  escalationReminderDays: 2,
  escalationOverdueDays: 3,
  escalationHigherAuthorityDays: 5,
};

const DEFAULT_ML_MODEL_INFO: MLModelInfo = {
  modelId: 'mdl_yolo8_compliance',
  modelName: 'SkillGuard-YOLOv8m-Compliance',
  version: '1.4.0',
  architecture: 'Ultralytics YOLOv8m',
  framework: 'PyTorch 2.4 / Ultralytics',
  status: 'ACTIVE',
  trainingDate: '2026-10-09T00:00:00Z',
  datasetVersion: 'classroom-people-number.v1i.yolov8',
  epochs: 50,
  batchSize: 16,
  imageSize: 640,
  metrics: {
    precision: 0.924,
    recall: 0.898,
    f1_score: 0.911,
    mAP50: 0.942,
    mAP50_95: 0.817,
    latency_ms: 14.2,
  },
  perClass: {
    person: {
      precision: 0.924,
      recall: 0.898,
      f1_score: 0.911,
      mAP50: 0.942,
      mAP50_95: 0.817,
      support: 109768,
    },
  },
};

const DEFAULT_USER: User = {
  id: '',
  name: 'Monitoring Officer',
  email: '',
  role: 'MONITORING_OFFICER',
  designation: 'Officer',
  department: 'Operations',
  mobile: '',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
};

type Listener = () => void;

class AppStateManager {
  private listeners: Set<Listener> = new Set();
  public currentUser: User = DEFAULT_USER;
  public centres: TrainingCentre[] = [];
  public users: User[] = [];
  public cameras: CameraStream[] = [];
  public attendanceRecords: AttendanceRecord[] = [];
  public alerts: ComplianceAlert[] = [];
  public actions: ComplianceAction[] = [];
  public auditLogs: AuditLogEntry[] = [];
  public inspections: InspectionRecord[] = [];
  public notifications: NotificationItem[] = [];
  public settings: SystemSettings = DEFAULT_SETTINGS;
  public mlModelInfo: MLModelInfo = DEFAULT_ML_MODEL_INFO;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedCentres = localStorage.getItem('skillguard_centres');
      const storedUsers = localStorage.getItem('skillguard_users');
      const storedAlerts = localStorage.getItem('skillguard_alerts');
      const storedActions = localStorage.getItem('skillguard_actions');
      const storedAttendance = localStorage.getItem('skillguard_attendance');
      const storedAudit = localStorage.getItem('skillguard_audit');
      const storedSettings = localStorage.getItem('skillguard_settings');
      const storedCurrentUser = localStorage.getItem('skillguard_current_user');
      const storedInspections = localStorage.getItem('skillguard_inspections');
      const storedNotifications = localStorage.getItem('skillguard_notifications');

      this.centres = storedCentres ? JSON.parse(storedCentres) : [];
      this.users = storedUsers ? JSON.parse(storedUsers) : [];
      this.cameras = [];
      this.attendanceRecords = storedAttendance ? JSON.parse(storedAttendance) : [];
      this.alerts = storedAlerts ? JSON.parse(storedAlerts) : [];
      this.actions = storedActions ? JSON.parse(storedActions) : [];
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [];
      this.inspections = storedInspections ? JSON.parse(storedInspections) : [];
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      this.settings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
      this.currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : DEFAULT_USER;
    } catch {
      this.resetToDefaults();
    }
  }

  public saveState() {
    try {
      localStorage.setItem('skillguard_centres', JSON.stringify(this.centres));
      localStorage.setItem('skillguard_users', JSON.stringify(this.users));
      localStorage.setItem('skillguard_alerts', JSON.stringify(this.alerts));
      localStorage.setItem('skillguard_actions', JSON.stringify(this.actions));
      localStorage.setItem('skillguard_attendance', JSON.stringify(this.attendanceRecords));
      localStorage.setItem('skillguard_audit', JSON.stringify(this.auditLogs));
      localStorage.setItem('skillguard_inspections', JSON.stringify(this.inspections));
      localStorage.setItem('skillguard_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('skillguard_settings', JSON.stringify(this.settings));
      localStorage.setItem('skillguard_current_user', JSON.stringify(this.currentUser));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notify();
  }

  public resetToDefaults() {
    this.centres = [];
    this.users = [];
    this.cameras = [];
    this.attendanceRecords = [];
    this.alerts = [];
    this.actions = [];
    this.auditLogs = [];
    this.inspections = [];
    this.notifications = [];
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.currentUser = DEFAULT_USER;
    this.saveState();
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- User Authentication & Session ---
  public setCurrentUser(user: User) {
    this.currentUser = user;
    localStorage.setItem('skillguard_current_user', JSON.stringify(user));
    this.saveState();
  }

  public setNotifications(notifications: NotificationItem[]) {
    this.notifications = notifications;
    this.saveState();
  }

  public logout() {
    localStorage.removeItem('skillguard_token');
    localStorage.removeItem('skillguard_refresh_token');
    localStorage.removeItem('skillguard_current_user');
    this.saveState();
  }

  public registerUser(userData: Partial<User>): User {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: userData.name || 'New Registered User',
      email: userData.email || '',
      role: userData.role || 'CENTRE_ADMIN',
      designation: userData.designation || (userData.role === 'GOVERNMENT_ADMIN' || userData.role === 'MONITORING_OFFICER' ? 'Monitoring Officer' : 'Centre Representative'),
      department: userData.department || 'Training Operations',
      mobile: userData.mobile || '',
      employeeId: userData.employeeId,
      centreCode: userData.centreCode,
      centreName: userData.centreName,
      district: userData.district || 'Pune',
      status: userData.role === 'GOVERNMENT_ADMIN' || userData.role === 'MONITORING_OFFICER' ? 'PENDING_APPROVAL' : 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.logAudit({
      action: `Self-registration completed (${newUser.role})`,
      entityType: 'SECURITY',
      entityId: newUser.id,
      newState: `Status: ${newUser.status}`,
    });
    this.saveState();
    return newUser;
  }

  public approveUser(userId: string) {
    const u = this.users.find((user) => user.id === userId);
    if (u) {
      const prev = u.status;
      u.status = 'ACTIVE';
      this.logAudit({
        action: `Approved government officer credentials for ${u.name}`,
        entityType: 'SECURITY',
        entityId: u.id,
        previousState: prev,
        newState: 'ACTIVE',
      });
      this.saveState();
    }
  }

  public toggleUserStatus(userId: string) {
    const u = this.users.find((user) => user.id === userId);
    if (u) {
      u.status = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      this.logAudit({
        action: `Changed user account status for ${u.name}`,
        entityType: 'SECURITY',
        entityId: u.id,
        newState: u.status,
      });
      this.saveState();
    }
  }

  // --- Dynamic Compliance Engine ---
  public recalculateCompliance(centreId: string) {
    const centre = this.centres.find((c) => c.id === centreId);
    if (!centre) return;

    // 1. Attendance compliance
    const centreAttendance = this.attendanceRecords.filter((a) => a.centreId === centreId);
    let attendanceScore = 85;
    if (centreAttendance.length > 0) {
      const verified = centreAttendance.filter((a) => a.status === 'VERIFIED').length;
      attendanceScore = Math.round((verified / centreAttendance.length) * 100);
    }

    // 2. Infrastructure compliance
    const openInfraAlerts = this.alerts.filter(
      (a) => a.centreId === centreId && a.category === 'INFRASTRUCTURE_SHORTAGE' && a.status !== 'RESOLVED'
    );
    const infraScore = Math.max(40, 100 - openInfraAlerts.length * 15);

    // 3. Action compliance
    const centreActions = this.actions.filter((a) => a.centreId === centreId);
    let actionScore = 90;
    if (centreActions.length > 0) {
      const resolved = centreActions.filter((a) => a.status === 'RESOLVED').length;
      const overdue = centreActions.filter((a) => a.isOverdue || a.status === 'ESCALATED').length;
      actionScore = Math.max(30, Math.round((resolved / centreActions.length) * 100) - overdue * 20);
    }

    // Weighted Overall Compliance
    const wAtt = this.settings.complianceWeightAttendance / 100;
    const wInf = this.settings.complianceWeightInfrastructure / 100;
    const wAct = this.settings.complianceWeightActions / 100;

    const overall = Math.round(attendanceScore * wAtt + infraScore * wInf + actionScore * wAct);

    centre.attendanceComplianceRate = attendanceScore;
    centre.infrastructureComplianceRate = infraScore;
    centre.actionComplianceRate = actionScore;
    centre.complianceScore = overall;

    if (overall >= 85) {
      centre.status = 'COMPLIANT';
    } else if (overall >= 70) {
      centre.status = 'ATTENTION_REQUIRED';
    } else {
      centre.status = 'CRITICAL';
    }
  }

  // --- Attendance Management ---
  public submitAttendance(record: Omit<AttendanceRecord, 'id' | 'status' | 'discrepancyCount' | 'discrepancyPercentage'>) {
    const discrepancy = record.aiEstimatedCount !== undefined
      ? record.reportedTrainees - record.aiEstimatedCount
      : 0;

    const discrepancyPct = record.reportedTrainees > 0
      ? (discrepancy / record.reportedTrainees) * 100
      : 0;

    let status: AttendanceRecord['status'] = 'VERIFIED';
    if (discrepancyPct >= this.settings.attendanceCriticalThresholdPercent) {
      status = 'DISCREPANCY_CRITICAL';
    } else if (discrepancyPct >= this.settings.attendanceWarningThresholdPercent) {
      status = 'DISCREPANCY_WARNING';
    } else if (discrepancy > 0) {
      status = 'REQUIRES_CLARIFICATION';
    }

    const newRecord: AttendanceRecord = {
      ...record,
      id: `att_${Date.now()}`,
      discrepancyCount: discrepancy,
      discrepancyPercentage: Number(discrepancyPct.toFixed(1)),
      status,
    };

    this.attendanceRecords.unshift(newRecord);

    const centre = this.centres.find((c) => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Unknown Centre';

    // If critical discrepancy, auto-generate AI alert
    if (status === 'DISCREPANCY_CRITICAL' || status === 'DISCREPANCY_WARNING') {
      this.createAlert({
        centreId: record.centreId,
        centreName,
        category: 'ATTENDANCE_MISMATCH',
        severity: status === 'DISCREPANCY_CRITICAL' ? 'CRITICAL' : 'HIGH',
        detectedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        title: `Attendance Mismatch Flagged: ${discrepancy} Absent Trainees (${discrepancyPct.toFixed(1)}%)`,
        description: `Batch ${record.batchCode} reported ${record.reportedTrainees} attendees. AI Vision estimated aggregate headcount of ${record.aiEstimatedCount} trainees.`,
        aiConfidence: 0.94,
        observedValue: record.aiEstimatedCount,
        expectedValue: record.reportedTrainees,
        evidence: {
          snapshotUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
          timestamp: new Date().toISOString(),
          cameraId: 'cam_001_lab',
          cameraName: 'Classroom / Lab Overhead Camera',
          detectedCount: record.aiEstimatedCount || 0,
          expectedCount: record.reportedTrainees,
          confidence: 0.942,
          modelVersion: this.mlModelInfo.modelId,
          detectionMetadata: {
            people: record.aiEstimatedCount || 0,
            computers: 18,
            machines: 2,
            workbenches: 5,
            chairs: 35,
            damaged: 1,
          },
        },
      });
    }

    this.logAudit({
      action: `Submitted batch attendance roster (${record.batchCode})`,
      centreName,
      entityType: 'ATTENDANCE',
      entityId: newRecord.id,
      newState: `Reported: ${record.reportedTrainees}, AI Estimated: ${record.aiEstimatedCount || 'Pending'}, Status: ${status}`,
    });

    this.recalculateCompliance(record.centreId);
    this.saveState();
    return newRecord;
  }

  // --- Alert Management ---
  public createAlert(alertData: Omit<ComplianceAlert, 'id' | 'status'>): ComplianceAlert {
    const newAlert: ComplianceAlert = {
      ...alertData,
      id: `ALT-${new Date().getFullYear()}-${String(this.alerts.length + 1).padStart(3, '0')}`,
      status: 'NEW',
    };

    this.alerts.unshift(newAlert);

    // Push notification
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      category: newAlert.severity === 'CRITICAL' ? 'CRITICAL_ALERT' : 'SYSTEM',
      title: `${newAlert.severity} Alert: ${newAlert.title}`,
      message: `${newAlert.centreName}: ${newAlert.description}`,
      timestamp: 'Just now',
      read: false,
      linkTab: 'alerts',
      targetId: newAlert.id,
    });

    this.logAudit({
      action: `Generated compliance alert (${newAlert.severity})`,
      centreName: newAlert.centreName,
      entityType: 'ALERT',
      entityId: newAlert.id,
      newState: `Category: ${newAlert.category}, Confidence: ${(newAlert.aiConfidence * 100).toFixed(0)}%`,
    });

    this.recalculateCompliance(newAlert.centreId);
    this.saveState();
    return newAlert;
  }

  public updateAlertStatus(alertId: string, status: ComplianceAlert['status'], remarks?: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return;

    const prev = alert.status;
    alert.status = status;
    if (remarks) alert.officerRemarks = remarks;

    this.logAudit({
      action: status === 'CONFIRMED' ? 'Officer confirmed issue' : status === 'FALSE_POSITIVE' ? 'Officer flagged false positive' : `Alert status changed to ${status}`,
      centreName: alert.centreName,
      entityType: 'ALERT',
      entityId: alert.id,
      previousState: prev,
      newState: status,
    });

    this.recalculateCompliance(alert.centreId);
    this.saveState();
  }

  // --- Action Management ---
  public createAction(actionData: {
    alertId?: string;
    centreId: string;
    title: string;
    issue: string;
    description: string;
    issueCategory?: ComplianceAlert['category'];
    priority: ActionPriority;
    dueDate: string;
    instructions?: string;
    assignedPerson?: string;
  }): ComplianceAction {
    const centre = this.centres.find((c) => c.id === actionData.centreId);
    const centreName = centre ? centre.name : 'Unknown Centre';

    const newActionId = `ACT-${new Date().getFullYear()}-${String(this.actions.length + 1).padStart(3, '0')}`;

    const newAction: ComplianceAction = {
      id: newActionId,
      alertId: actionData.alertId,
      centreId: actionData.centreId,
      centreName,
      issue: actionData.issue,
      title: actionData.title,
      description: actionData.description,
      issueCategory: actionData.issueCategory || 'ATTENDANCE_MISMATCH',
      priority: actionData.priority,
      status: 'ASSIGNED',
      assignedOfficerName: this.currentUser.name,
      assignedPerson: actionData.assignedPerson || centre?.contactPerson || 'Centre Director',
      assignedToRole: 'Centre Admin',
      instructions: actionData.instructions || 'Restore approved setup and upload evidence within deadline.',
      createdAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      dueDate: actionData.dueDate,
      isOverdue: false,
      escalationLevel: 0,
      timeline: [
        {
          status: 'AI detected issue',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          actor: 'SkillGuard AI Vision Pipeline',
          note: `Autonomous anomaly detection flagged ${actionData.issue}`,
        },
        {
          status: 'Officer reviewed',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          actor: `${this.currentUser.name} (${this.currentUser.role.replace('_', ' ')})`,
          note: 'Visual evidence evaluated and verified',
        },
        {
          status: 'Action assigned',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          actor: `${this.currentUser.name} (${this.currentUser.role.replace('_', ' ')})`,
          note: `Dispatched formal corrective notice to ${centreName}`,
        },
      ],
      comments: [
        {
          id: `comm_${Date.now()}`,
          authorName: this.currentUser.name,
          authorRole: this.currentUser.role,
          text: `Action created: ${actionData.description}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    this.actions.unshift(newAction);

    // If originated from an alert, update that alert
    if (actionData.alertId) {
      const alert = this.alerts.find((a) => a.id === actionData.alertId);
      if (alert) {
        alert.status = 'ACTION_CREATED';
        alert.actionId = newActionId;
      }
    }

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      category: 'ACTION_ASSIGNED',
      title: `Action Assigned: ${newAction.id}`,
      message: `${centreName}: ${newAction.title}`,
      timestamp: 'Just now',
      read: false,
      linkTab: 'actions',
      targetId: newAction.id,
    });

    this.logAudit({
      action: 'Created corrective action',
      centreName,
      entityType: 'ACTION',
      entityId: newAction.id,
      newState: `Assigned to ${newAction.assignedPerson} with Priority ${newAction.priority}`,
    });

    this.recalculateCompliance(actionData.centreId);
    this.saveState();
    return newAction;
  }

  public submitCentreResponse(actionId: string, response: {
    explanation: string;
    proofDocumentName?: string;
    proofPhotoUrl?: string;
    proofVideoUrl?: string;
  }) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    action.status = 'SUBMITTED';
    action.centreResponse = {
      ...response,
      submittedAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      submittedBy: this.currentUser.name,
    };

    action.timeline.push({
      status: 'Centre responded',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actor: `${this.currentUser.name} (Centre Admin)`,
      note: 'Detailed justification and corrective response submitted',
    });

    if (response.proofDocumentName || response.proofPhotoUrl) {
      action.timeline.push({
        status: 'Evidence submitted',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actor: `${this.currentUser.name} (Centre Admin)`,
        note: `Attached ${response.proofDocumentName || 'photo proof'} for officer inspection`,
      });
    }

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      category: 'CENTRE_RESPONSE',
      title: `Centre Responded: ${action.id}`,
      message: `${action.centreName} submitted response & evidence for review.`,
      timestamp: 'Just now',
      read: false,
      linkTab: 'actions',
      targetId: action.id,
    });

    this.logAudit({
      action: 'Submitted centre response & uploaded evidence',
      centreName: action.centreName,
      entityType: 'ACTION',
      entityId: action.id,
      previousState: 'ASSIGNED',
      newState: 'SUBMITTED',
    });

    this.saveState();
  }

  public verifyAction(actionId: string, outcome: 'APPROVED' | 'REJECTED' | 'MORE_INFO_REQUESTED' | 'REINSPECTION_REQUESTED', remarks: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    const prev = action.status;

    if (outcome === 'APPROVED') {
      action.status = 'RESOLVED';
      action.resolvedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      action.timeline.push({
        status: 'Resolved',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actor: `${this.currentUser.name} (${this.currentUser.role.replace('_', ' ')})`,
        note: `Officer verified evidence and approved resolution: "${remarks}"`,
      });

      // Also mark linked alert resolved
      if (action.alertId) {
        const alert = this.alerts.find((a) => a.id === action.alertId);
        if (alert) alert.status = 'RESOLVED';
      }
    } else if (outcome === 'REJECTED') {
      action.status = 'REOPENED';
      action.timeline.push({
        status: 'Reopened',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actor: `${this.currentUser.name} (${this.currentUser.role.replace('_', ' ')})`,
        note: `Verification rejected: "${remarks}". Action reopened for fresh remediation.`,
      });
    } else if (outcome === 'REINSPECTION_REQUESTED') {
      action.status = 'IN_PROGRESS';
      action.timeline.push({
        status: 'Re-inspection',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actor: `${this.currentUser.name} (${this.currentUser.role.replace('_', ' ')})`,
        note: `Physical on-site re-inspection requested: "${remarks}"`,
      });
      // Auto-schedule inspection
      this.createInspection({
        centreId: action.centreId,
        centreName: action.centreName,
        inspectionType: 'Infrastructure Verification',
        reason: `Re-inspection mandated by officer for action ${action.id}: ${remarks}`,
        assignedOfficer: this.currentUser.name,
        date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        notes: `Verify equipment physical presence corresponding to ${action.title}`,
      });
    } else {
      action.status = 'IN_PROGRESS';
      action.timeline.push({
        status: 'More Info Requested',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actor: `${this.currentUser.name} (${this.currentUser.role.replace('_', ' ')})`,
        note: `Additional documentation required: "${remarks}"`,
      });
    }

    action.verification = {
      verifiedBy: this.currentUser.name,
      verifiedAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      outcome,
      mandatoryRemarks: remarks,
    };

    this.logAudit({
      action: outcome === 'APPROVED' ? 'Approved action resolution' : `Verified action outcome: ${outcome}`,
      centreName: action.centreName,
      entityType: 'ACTION',
      entityId: action.id,
      previousState: prev,
      newState: action.status,
    });

    this.recalculateCompliance(action.centreId);
    this.saveState();
  }

  public escalateAction(actionId: string, reason?: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    action.status = 'ESCALATED';
    action.isOverdue = true;
    action.escalationLevel = 3;

    action.timeline.push({
      status: 'Escalated',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actor: 'SkillGuard Escalation Engine',
      note: reason || 'Turnaround deadline exceeded. Escalated to State Vigilance Directorate & Joint Director.',
    });

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      category: 'ACTION_OVERDUE',
      title: `Action Escalated: ${action.id}`,
      message: `${action.centreName}: High priority escalation triggered to higher authority.`,
      timestamp: 'Just now',
      read: false,
      linkTab: 'actions',
      targetId: action.id,
    });

    this.logAudit({
      action: 'Escalated corrective action to higher authority',
      centreName: action.centreName,
      entityType: 'ACTION',
      entityId: action.id,
      previousState: 'OVERDUE',
      newState: 'ESCALATED',
    });

    this.recalculateCompliance(action.centreId);
    this.saveState();
  }

  public markActionOverdue(actionId: string) {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) return;

    action.isOverdue = true;
    action.timeline.push({
      status: 'Overdue',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actor: 'SkillGuard Deadline Watcher',
      note: 'Turnaround deadline expired without resolution.',
    });

    this.logAudit({
      action: 'Marked action overdue',
      centreName: action.centreName,
      entityType: 'ACTION',
      entityId: action.id,
      newState: 'OVERDUE',
    });

    this.saveState();
  }

  // --- Inspection Management ---
  public createInspection(insp: Omit<InspectionRecord, 'id' | 'status'>): InspectionRecord {
    const newInsp: InspectionRecord = {
      ...insp,
      id: `insp_${Date.now()}`,
      status: 'SCHEDULED',
    };

    this.inspections.unshift(newInsp);

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      category: 'INSPECTION',
      title: `Inspection Scheduled: ${newInsp.inspectionType}`,
      message: `${newInsp.centreName} - Assigned to ${newInsp.assignedOfficer}`,
      timestamp: 'Just now',
      read: false,
      linkTab: 'inspections',
      targetId: newInsp.id,
    });

    this.logAudit({
      action: `Scheduled on-site inspection (${newInsp.inspectionType})`,
      centreName: newInsp.centreName,
      entityType: 'INSPECTION',
      entityId: newInsp.id,
      newState: `Date: ${newInsp.date}, Officer: ${newInsp.assignedOfficer}`,
    });

    this.saveState();
    return newInsp;
  }

  public completeInspection(inspId: string, outcome: 'PASS' | 'FAIL' | 'CONDITIONAL' | 'REINSPECTION_REQUIRED', findings: string) {
    const insp = this.inspections.find((i) => i.id === inspId);
    if (!insp) return;

    insp.status = 'COMPLETED';
    insp.outcome = outcome;
    insp.findings = findings;

    this.logAudit({
      action: `Completed inspection determination (${outcome})`,
      centreName: insp.centreName,
      entityType: 'INSPECTION',
      entityId: insp.id,
      newState: `Outcome: ${outcome}`,
    });

    this.saveState();
  }

  // --- Audit Trail Logging ---
  public logAudit(entry: {
    action: string;
    entityType: AuditLogEntry['entityType'];
    entityId: string;
    centreName?: string;
    previousState?: string;
    newState?: string;
  }) {
    const log: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userRole: this.currentUser.role,
      action: entry.action,
      centreName: entry.centreName,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      entityType: entry.entityType,
      entityId: entry.entityId,
      previousState: entry.previousState,
      newState: entry.newState,
      ipAddress: '10.14.28.102',
    };

    this.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  // --- System Settings Management ---
  public updateSettings(newSettings: Partial<SystemSettings>) {
    const prev = JSON.stringify(this.settings);
    this.settings = { ...this.settings, ...newSettings };

    this.logAudit({
      action: 'Updated system compliance weights & detection rules',
      entityType: 'SYSTEM',
      entityId: 'system_settings',
      previousState: prev,
      newState: JSON.stringify(this.settings),
    });

    // Recalculate all centres with new weights
    this.centres.forEach((c) => this.recalculateCompliance(c.id));
    this.saveState();
  }

  // --- Centre Management ---
  public createCentre(centreData: Omit<TrainingCentre, 'id' | 'complianceScore' | 'attendanceComplianceRate' | 'infrastructureComplianceRate' | 'actionComplianceRate' | 'status' | 'lastMonitoringDate' | 'cameraStatus'>): TrainingCentre {
    const newCentre: TrainingCentre = {
      ...centreData,
      id: `tc_${Date.now()}`,
      status: 'COMPLIANT',
      complianceScore: 92,
      attendanceComplianceRate: 95,
      infrastructureComplianceRate: 90,
      actionComplianceRate: 90,
      lastMonitoringDate: 'Just added',
      cameraStatus: 'ONLINE',
    };

    this.centres.push(newCentre);

    this.logAudit({
      action: `Created training centre profile: ${newCentre.name}`,
      centreName: newCentre.name,
      entityType: 'CENTRE',
      entityId: newCentre.id,
      newState: `Capacity: ${newCentre.approvedTraineeCapacity}, Code: ${newCentre.code}`,
    });

    this.saveState();
    return newCentre;
  }

  public addCentre(centreData: Omit<TrainingCentre, 'id' | 'complianceScore' | 'attendanceComplianceRate' | 'infrastructureComplianceRate' | 'actionComplianceRate' | 'status' | 'lastMonitoringDate' | 'cameraStatus'>): TrainingCentre {
    return this.createCentre(centreData);
  }

  public updateCentreInventory(centreId: string, inventory: Partial<TrainingCentre['approvedInventory']>) {
    const centre = this.centres.find((c) => c.id === centreId);
    if (!centre) return;

    const prev = JSON.stringify(centre.approvedInventory);
    centre.approvedInventory = { ...centre.approvedInventory, ...inventory };

    this.logAudit({
      action: `Updated sanctioned inventory for ${centre.name}`,
      centreName: centre.name,
      entityType: 'INVENTORY',
      entityId: centre.id,
      previousState: prev,
      newState: JSON.stringify(centre.approvedInventory),
    });

    this.recalculateCompliance(centreId);
    this.saveState();
  }

  // --- Camera Management ---
  public updateCameraConfig(camId: string, config: Partial<CameraStream>) {
    const cam = this.cameras.find((c) => c.id === camId);
    if (!cam) return;

    Object.assign(cam, config);
    this.logAudit({
      action: `Modified camera configuration (${cam.name})`,
      entityType: 'SYSTEM',
      entityId: cam.id,
      newState: `Status: ${cam.status}, Bandwidth: ${cam.bandwidthMode}`,
    });
    this.saveState();
  }
}

export const appState = new AppStateManager();
