// KAVACH-AI Platform Type Definitions

export type UserRole = 'gov_admin' | 'gov_officer' | 'centre_admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  assignedCentres?: string[]; // IDs
  avatar?: string;
}

export type CentreStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'FLAGGED' | 'SUSPENDED';

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
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  lastPing: string;
  isSimulated: boolean;
}

export interface AttendanceRecord {
  id: string;
  centreId: string;
  date: string;
  batchCode: string;
  courseName: string;
  reportedTrainees: number;
  sessionStartTime: string;
  sessionEndTime: string;
  instructorName: string;
  aiEstimatedCount?: number;
  discrepancyCount?: number;
  discrepancyPercentage?: number;
  status: 'VERIFIED' | 'DISCREPANCY_WARNING' | 'DISCREPANCY_CRITICAL' | 'PENDING_AI_SCAN';
}

export type DetectedClass = 'person' | 'computer' | 'workbench' | 'machine' | 'chair' | 'damaged_equipment';

export interface DetectionBox {
  id: string;
  class: DetectedClass;
  confidence: number;
  trackId?: number;
  bbox: [number, number, number, number]; // [x, y, width, height] normalized (0 to 1)
  condition?: 'OPERATIONAL' | 'POTENTIAL_DAMAGE' | 'OBSTRUCTED' | 'UNUSABLE';
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
  | 'EQUIPMENT_DAMAGE'
  | 'CAMERA_OFFLINE'
  | 'OVERDUE_ACTION'
  | 'UNAUTHORIZED_ABSENCE';

export interface AlertEvidence {
  snapshotUrl: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  detectedCount: number;
  expectedCount: number;
  confidence: number;
  modelVersion: string;
  detectionMetadata: {
    people: number;
    computers: number;
    machines: number;
    workbenches: number;
    chairs: number;
    damaged: number;
  };
}

export interface ComplianceAlert {
  id: string;
  centreId: string;
  centreName: string;
  category: AlertCategory;
  severity: AlertSeverity;
  detectedTime: string;
  title: string;
  description: string;
  aiConfidence: number;
  status: 'NEW' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'ACTION_CREATED' | 'RESOLVED';
  evidence: AlertEvidence;
  actionId?: string;
  officerRemarks?: string;
}

export type ActionStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ACTION_ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'VERIFIED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REOPENED'
  | 'ESCALATED'
  | 'REINSPECTION_REQUIRED';

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
  title: string;
  description: string;
  issueCategory: AlertCategory;
  priority: ActionPriority;
  status: ActionStatus;
  assignedOfficerName: string;
  assignedToRole: string; // 'Centre Admin'
  createdAt: string;
  dueDate: string;
  resolvedAt?: string;
  isOverdue: boolean;
  escalationLevel: number; // 0 = none, 1 = reminder, 2 = district, 3 = state director
  centreResponse?: {
    explanation: string;
    submittedAt: string;
    submittedBy: string;
    proofDocumentName?: string;
    proofDocumentUrl?: string;
    proofPhotoUrl?: string;
  };
  verification?: {
    verifiedBy: string;
    verifiedAt: string;
    outcome: 'APPROVED' | 'REJECTED' | 'REINSPECTION_ORDERED';
    mandatoryRemarks: string;
  };
  timeline: {
    status: ActionStatus;
    timestamp: string;
    actor: string;
    note: string;
  }[];
  comments: ActionComment[];
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  timestamp: string;
  entityType: 'CENTRE' | 'ALERT' | 'ACTION' | 'ATTENDANCE' | 'INVENTORY' | 'SYSTEM' | 'ML_MODEL';
  entityId: string;
  previousState?: string;
  newState?: string;
  ipAddress?: string;
}

export interface SystemSettings {
  attendanceWarningThresholdPercent: number; // e.g. 5%
  attendanceCriticalThresholdPercent: number; // e.g. 10%
  complianceWeightAttendance: number; // e.g. 40
  complianceWeightInfrastructure: number; // e.g. 35
  complianceWeightActions: number; // e.g. 25
  frameSamplingRateFps: number; // 5
  lowBandwidthModeEnabled: boolean;
  privacyStrictAnonymization: boolean;
  autoEscalationDaysOverdue: number; // 3
}

export interface MLModelInfo {
  modelId: string;
  architecture: string;
  framework: string;
  status: string;
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
    mAP50: number;
    mAP50_95: number;
    support: number;
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
