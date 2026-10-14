// SkillGuard AI Platform Type Definitions
// AI-Powered Training Centre Compliance & Monitoring Platform

export type UserRole = 'SUPER_ADMIN' | 'GOVERNMENT_ADMIN' | 'MONITORING_OFFICER' | 'CENTRE_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  mobile?: string;
  employeeId?: string;
  centreCode?: string;
  centreName?: string;
  district?: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  assignedCentres?: string[]; // IDs
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

export type CentreStatus = 'COMPLIANT' | 'ATTENTION_REQUIRED' | 'CRITICAL';

export interface ApprovedInventory {
  computers: number;
  workbenches: number;
  machines: number;
  chairs: number;
  cctvCameras: number;
}

export interface TrainingCentre {
  id: string;
  name: string;
  code: string;
  address: string;
  district: string;
  state: string;
  centreType: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  status: CentreStatus;
  approvedTraineeCapacity: number;
  approvedInventory: ApprovedInventory;
  cameraIds: string[];
  lastInspectionDate: string;
  nextInspectionDate: string;
  lastMonitoringDate: string;
  cameraStatus: 'ONLINE' | 'OFFLINE' | 'PARTIAL';
  complianceScore: number; // 0 - 100
  attendanceComplianceRate: number; // 0 - 100
  infrastructureComplianceRate: number; // 0 - 100
  actionComplianceRate: number; // 0 - 100
}

export interface CameraStream {
  id: string;
  centreId: string;
  name: string;
  location: string;
  rtspUrl: string; // Hidden in UI
  resolution: string;
  fps: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSeen: string;
  isSimulated: boolean;
  processingMode: 'EDGE_INFERENCE' | 'CLOUD_STREAM';
  bandwidthMode: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AttendanceRecord {
  id: string;
  centreId: string;
  date: string;
  batchCode: string;
  courseName: string;
  session: 'Morning (09:00 - 12:00)' | 'Afternoon (13:00 - 16:00)' | 'Evening (16:00 - 19:00)';
  reportedTrainees: number;
  sessionStartTime: string;
  sessionEndTime: string;
  instructorName: string;
  aiEstimatedCount?: number;
  discrepancyCount?: number;
  discrepancyPercentage?: number;
  status: 'VERIFIED' | 'DISCREPANCY_WARNING' | 'DISCREPANCY_CRITICAL' | 'REQUIRES_CLARIFICATION';
}

export type DetectedClass = 'person' | 'computer' | 'workbench' | 'machine' | 'chair' | 'damaged_equipment';

export interface DetectionBox {
  id: string;
  class: DetectedClass;
  confidence: number;
  trackId?: number;
  bbox: [number, number, number, number]; // [x, y, width, height] normalized (0 to 1)
  condition?: 'OPERATIONAL' | 'POTENTIAL_DAMAGE' | 'OBSTRUCTED' | 'POTENTIAL_ISSUE';
  timestamp: string;
}

export interface FrameDetectionResult {
  frameNumber: number;
  timestamp: string;
  detections: DetectionBox[];
  counts: {
    person: number;
    computer: number;
    workbench: number;
    machine: number;
    chair: number;
    damaged_equipment: number;
  };
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertCategory =
  | 'ATTENDANCE_MISMATCH'
  | 'INFRASTRUCTURE_SHORTAGE'
  | 'EQUIPMENT_ISSUE'
  | 'REPEATED_DISCREPANCY'
  | 'CAMERA_OFFLINE'
  | 'VIDEO_ANALYSIS_FAILED'
  | 'OVERDUE_ACTION';

export interface AlertEvidence {
  snapshotUrl: string;
  videoClipUrl?: string;
  videoClipPublicId?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  duration?: number;
  eventTimestamp?: string;
  timestamp: string;
  cameraId?: string;
  cameraName?: string;
  detectedCount: number;
  expectedCount: number;
  confidence: number;
  modelVersion: string;
  detectionMetadata?: {
    people?: number;
    computers?: number;
    machines?: number;
    workbenches?: number;
    chairs?: number;
    benches?: number;
    damaged?: number;
  };
}

export interface ComplianceAlert {
  id: string;
  centreId: string;
  centreName: string;
  submissionId?: string;
  assetType?: string;
  approvedCount?: number;
  detectedCount?: number;
  difference?: number;
  eventTimestamp?: string;
  aiAnalysisId?: string;
  evidenceClipUrl?: string;
  evidenceClipPublicId?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  detectedTime: string;
  title: string;
  description: string;
  aiConfidence: number;
  observedValue?: number | string;
  expectedValue?: number | string;
  status: 'NEW' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'ACTION_CREATED' | 'RESOLVED' | 'DISMISSED';
  evidence: AlertEvidence;
  actionId?: string;
  officerRemarks?: string;
}

export type ActionStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'VERIFICATION'
  | 'RESOLVED'
  | 'REOPENED'
  | 'ESCALATED'
  | 'CANCELLED';

export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ActionComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface ComplianceAction {
  id: string;
  alertId?: string;
  centreId: string;
  centreName: string;
  issue: string;
  title: string;
  description: string;
  issueCategory: AlertCategory;
  priority: ActionPriority;
  status: ActionStatus;
  assignedOfficerName: string;
  assignedPerson: string; // Centre Principal / Compliance Admin
  assignedToRole: string; // 'Centre Admin'
  instructions?: string;
  createdAt: string;
  dueDate: string;
  resolvedAt?: string;
  isOverdue: boolean;
  escalationLevel: number; // 0 = none, 1 = reminder, 2 = overdue, 3 = escalated
  centreResponse?: {
    explanation: string;
    submittedAt: string;
    submittedBy: string;
    proofDocumentName?: string;
    proofDocumentUrl?: string;
    proofPhotoUrl?: string;
    proofVideoUrl?: string;
  };
  verification?: {
    verifiedBy: string;
    verifiedAt: string;
    outcome: 'APPROVED' | 'REJECTED' | 'MORE_INFO_REQUESTED' | 'REINSPECTION_REQUESTED';
    mandatoryRemarks: string;
  };
  timeline: {
    status: ActionStatus | string;
    timestamp: string;
    actor: string;
    note: string;
  }[];
  comments: ActionComment[];
}

export interface InspectionRecord {
  id: string;
  centreId: string;
  centreName: string;
  inspectionType: 'Routine' | 'AI Triggered' | 'Complaint' | 'Repeated Violation' | 'Infrastructure Verification';
  reason: string;
  assignedOfficer: string;
  date: string;
  notes: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  outcome?: 'PASS' | 'FAIL' | 'CONDITIONAL' | 'REINSPECTION_REQUIRED';
  findings?: string;
  reportUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  timestamp: string;
  centreName?: string;
  entityType: 'CENTRE' | 'ALERT' | 'ACTION' | 'ATTENDANCE' | 'INVENTORY' | 'SYSTEM' | 'ML_MODEL' | 'SECURITY' | 'INSPECTION';
  entityId: string;
  previousState?: string;
  newState?: string;
  ipAddress?: string;
}

export interface SystemSettings {
  attendanceWarningThresholdPercent: number; // e.g. 10%
  attendanceCriticalThresholdPercent: number; // e.g. 20%
  complianceWeightAttendance: number; // e.g. 40%
  complianceWeightInfrastructure: number; // e.g. 40%
  complianceWeightActions: number; // e.g. 20%
  frameSamplingRateFps: number; // 5
  lowBandwidthModeEnabled: boolean;
  bandwidthMode: 'LOW' | 'MEDIUM' | 'HIGH';
  privacyStrictAnonymization: boolean;
  escalationReminderDays: number; // Day 2
  escalationOverdueDays: number; // Day 3
  escalationHigherAuthorityDays: number; // Day 5
  autoEscalationDaysOverdue?: number; // legacy alias
}

export interface MLModelInfo {
  modelId: string;
  modelName: string;
  version: string;
  architecture: string;
  framework: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'STAGING';
  trainingDate: string;
  datasetVersion: string;
  epochs: number;
  batchSize: number;
  imageSize: number;
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    mAP50: number;
    mAP50_95: number;
    latency_ms: number;
  };
  perClass: Record<string, {
    precision: number;
    recall: number;
    f1_score?: number;
    mAP50: number;
    mAP50_95: number;
    support: number;
    falsePositives?: number;
    falseNegatives?: number;
  }>;
}

export interface VideoProcessingJob {
  id: string;
  sourceType: 'UPLOAD' | 'CCTV_STREAM' | 'BROWSER_CAPTURE';
  centreId: string;
  fileName?: string;
  fileSize?: string;
  durationSeconds?: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  createdAt: string;
  completedAt?: string;
  detectedAttendanceAverage: number;
  reportedAttendance: number;
  detectedInventory: {
    computers: number;
    machines: number;
    workbenches: number;
    chairs: number;
    damaged_equipment: number;
  };
  alertsGeneratedCount: number;
}

export interface NotificationItem {
  id: string;
  category: 'CRITICAL_ALERT' | 'ACTION_ASSIGNED' | 'ACTION_DUE' | 'ACTION_OVERDUE' | 'CENTRE_RESPONSE' | 'INSPECTION' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab: string;
  targetId?: string;
}
