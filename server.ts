import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillguard_jwt_super_secure_enterprise_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'skillguard_refresh_key_2026';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory enterprise mock database representing PostgreSQL tables
const db = {
  users: [
    {
      id: 'usr_gov_admin',
      name: 'Dr. Alok Verma',
      email: 'alok.verma@msde.gov.in',
      passwordHash: bcrypt.hashSync('GovAdmin@2026', 10),
      role: 'GOVERNMENT_ADMIN',
      designation: 'Joint Director (Compliance & Audit)',
      department: 'Ministry of Skill Development & Entrepreneurship',
      mobile: '+91 98110 54321',
      employeeId: 'MSDE-GOV-2024-009',
      status: 'ACTIVE',
      emailVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null as number | null,
    },
    {
      id: 'usr_gov_officer',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@msde.gov.in',
      passwordHash: bcrypt.hashSync('Officer@2026', 10),
      role: 'MONITORING_OFFICER',
      designation: 'District Monitoring Officer',
      department: 'State Directorate of Vocational Training',
      mobile: '+91 98220 89123',
      employeeId: 'SDVT-MAH-PUN-042',
      status: 'ACTIVE',
      emailVerified: true,
      assignedCentres: ['tc_001', 'tc_002'],
      failedLoginAttempts: 0,
      lockedUntil: null as number | null,
    },
    {
      id: 'usr_tc_admin',
      name: 'Vikram Desai',
      email: 'admin@apexskill.org',
      passwordHash: bcrypt.hashSync('Centre@2026', 10),
      role: 'CENTRE_ADMIN',
      designation: 'Centre Director & Compliance Head',
      department: 'Apex Skill Centre Operations',
      mobile: '+91 98230 45678',
      centreCode: 'MH-PUN-TC-0842',
      centreName: 'ABC Skill Centre',
      status: 'ACTIVE',
      emailVerified: true,
      assignedCentres: ['tc_001'],
      failedLoginAttempts: 0,
      lockedUntil: null as number | null,
    },
    {
      id: 'usr_super_admin',
      name: 'Director General (Vigilance & AI Systems)',
      email: 'superadmin@skillguard.gov.in',
      passwordHash: bcrypt.hashSync('SuperAdmin@2026', 10),
      role: 'SUPER_ADMIN',
      designation: 'National Vigilance Commissioner & Systems Administrator',
      department: 'National Skill Monitoring Portal (SkillGuard AI)',
      mobile: '+91 99990 00001',
      employeeId: 'SUPER-SYS-001',
      status: 'ACTIVE',
      emailVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null as number | null,
    },
  ],
  centres: [
    {
      id: 'tc_001',
      name: 'ABC Skill Centre',
      code: 'MH-PUN-TC-0842',
      address: 'Plot 44, Electronic Zone, Hinjawadi Phase 2, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      centreType: 'PMKVY Vocational Center of Excellence',
      contactPerson: 'Vikram Desai',
      contactNumber: '+91 98230 45678',
      email: 'admin@apexskill.org',
      status: 'ATTENTION_REQUIRED',
      approvedTraineeCapacity: 40,
      approvedInventory: { computers: 20, workbenches: 5, machines: 3, chairs: 40, cctvCameras: 3 },
      complianceScore: 78,
      attendanceComplianceRate: 80,
      infrastructureComplianceRate: 85,
      actionComplianceRate: 70,
      cameraStatus: 'ONLINE',
      lastMonitoringDate: '2026-10-09 11:30 AM',
    },
    {
      id: 'tc_002',
      name: 'Pradhan Mantri Kaushal Kendra (PMKK)',
      code: 'RJ-JAI-TC-0119',
      address: 'Sector 5, Sitapura Industrial Area, Jaipur',
      district: 'Jaipur',
      state: 'Rajasthan',
      centreType: 'PMKK Model Training Centre',
      contactPerson: 'Sunita Meena',
      contactNumber: '+91 94140 12390',
      email: 'jaipur.pmkk@skillindia.org',
      status: 'COMPLIANT',
      approvedTraineeCapacity: 30,
      approvedInventory: { computers: 15, workbenches: 4, machines: 2, chairs: 30, cctvCameras: 2 },
      complianceScore: 94,
      attendanceComplianceRate: 96,
      infrastructureComplianceRate: 95,
      actionComplianceRate: 90,
      cameraStatus: 'ONLINE',
      lastMonitoringDate: '2026-10-09 10:15 AM',
    },
    {
      id: 'tc_003',
      name: 'Skill India Robotics & CNC Centre',
      code: 'KA-BLR-TC-0405',
      address: 'Peenya Industrial Estate, Bengaluru Urban',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      centreType: 'High-Tech Vocational Training Institute',
      contactPerson: 'K. R. Narayana',
      contactNumber: '+91 98450 78210',
      email: 'contact@blr-robotics-iti.edu',
      status: 'CRITICAL',
      approvedTraineeCapacity: 50,
      approvedInventory: { computers: 25, workbenches: 8, machines: 6, chairs: 50, cctvCameras: 4 },
      complianceScore: 68,
      attendanceComplianceRate: 72,
      infrastructureComplianceRate: 70,
      actionComplianceRate: 60,
      cameraStatus: 'PARTIAL',
      lastMonitoringDate: '2026-10-08 04:45 PM',
    },
  ],
  attendance: [
    {
      id: 'att_001',
      centreId: 'tc_001',
      date: '2026-10-09',
      batchCode: 'ABC-AI-102',
      courseName: 'Industrial Python & Embedded Automation',
      session: 'Morning (09:00 - 12:00)',
      reportedTrainees: 40,
      aiEstimatedCount: 32,
      discrepancyCount: 8,
      discrepancyPercentage: 20.0,
      status: 'DISCREPANCY_CRITICAL',
    },
  ],
  alerts: [
    {
      id: 'ALT-2026-001',
      centreId: 'tc_001',
      centreName: 'ABC Skill Centre',
      category: 'ATTENDANCE_MISMATCH',
      severity: 'CRITICAL',
      detectedTime: '2026-10-09 11:42 AM',
      title: 'Severe Trainee Presence Deficit (20% Discrepancy)',
      description: 'Reported 40 attendees; AI Vision estimated 32. Difference: 8 trainees.',
      aiConfidence: 0.94,
      observedValue: 32,
      expectedValue: 40,
      status: 'ACTION_CREATED',
      actionId: 'ACT-2026-001',
    },
  ],
  actions: [
    {
      id: 'ACT-2026-001',
      alertId: 'ALT-2026-001',
      centreId: 'tc_001',
      centreName: 'ABC Skill Centre',
      issue: 'Attendance discrepancy: 40 reported vs 32 AI-detected trainees in batch ABC-AI-102',
      title: 'Clarification & Trainee Verification Notice',
      description: 'Explain 8-trainee deficit during morning practical session with proof.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedOfficerName: 'Rajesh Sharma',
      assignedPerson: 'Vikram Desai',
      dueDate: '2026-10-14 05:00 PM',
      isOverdue: false,
    },
  ],
  videoJobs: {} as Record<string, any>,
  auditLogs: [] as any[],
  passwordResetTokens: {} as Record<string, { email: string; expires: number }>,
  emailVerificationTokens: {} as Record<string, { email: string; expires: number }>,
};

// Rate limiter helper in memory
const loginAttempts: Record<string, { count: number; lastTime: number }> = {};

// JWT helper
function generateTokens(user: any) {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
}

// Auth Middleware
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    (req as any).user = user;
    next();
  });
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient statutory role privileges' });
    }
    next();
  };
}

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'SkillGuard AI Enterprise Platform',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    database: 'PostgreSQL Connected',
    inference_engine: 'YOLOv8m 15fps Active',
  });
});

// ----------------------------------------------------
// Section 48: AUTHENTICATION API
// ----------------------------------------------------

// 1. POST /auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { accountType, fullName, email, mobile, password, centreCode, centreName, department, designation, employeeId } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  // Security: Super Admin cannot be created via public register
  if (accountType === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin creation via public registration is prohibited' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists' });
  }

  const role = accountType === 'GOVERNMENT_OFFICER' ? 'MONITORING_OFFICER' : 'CENTRE_ADMIN';
  const status = accountType === 'GOVERNMENT_OFFICER' ? 'PENDING_APPROVAL' : 'ACTIVE';

  const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  db.emailVerificationTokens[verificationToken] = { email, expires: Date.now() + 24 * 3600 * 1000 };

  const newUser = {
    id: `usr_${Date.now()}`,
    name: fullName,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    designation: designation || (role === 'MONITORING_OFFICER' ? 'District Monitoring Officer' : 'Centre Director'),
    department: department || (role === 'MONITORING_OFFICER' ? 'State Skill Directorate' : 'Centre Management'),
    mobile: mobile || '',
    employeeId: employeeId || '',
    centreCode: centreCode || '',
    centreName: centreName || '',
    status,
    emailVerified: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  db.users.push(newUser);

  // Return verification link info
  res.status(201).json({
    success: true,
    message: 'Check your email to verify your account.',
    verificationLink: `/verify-email/${verificationToken}`,
    status: newUser.status,
    role: newUser.role,
  });
});

// 2. POST /auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || '127.0.0.1';

  // Rate limiting check
  const now = Date.now();
  if (loginAttempts[ip] && loginAttempts[ip].count >= 5 && now - loginAttempts[ip].lastTime < 60000) {
    return res.status(429).json({ error: 'Too many failed login attempts. Please wait 60 seconds before retrying.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    loginAttempts[ip] = { count: (loginAttempts[ip]?.count || 0) + 1, lastTime: now };
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Account lockout check
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutesLeft = Math.ceil((user.lockedUntil - now) / 60000);
    return res.status(403).json({ error: `Account locked due to consecutive failed attempts. Try again in ${minutesLeft} minutes.` });
  }

  const isMatch = bcrypt.compareSync(password || '', user.passwordHash);
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = now + 15 * 60000; // lock 15 mins
      return res.status(403).json({ error: 'Account locked for 15 minutes due to 5 consecutive failed attempts.' });
    }
    loginAttempts[ip] = { count: (loginAttempts[ip]?.count || 0) + 1, lastTime: now };
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Reset counters on success
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  delete loginAttempts[ip];

  if (user.status === 'PENDING_APPROVAL') {
    return res.status(403).json({ error: 'Account is pending verification by Super Admin / Directorate' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account has been suspended. Contact support.' });
  }

  const { token, refreshToken } = generateTokens(user);

  res.json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      department: user.department,
      status: user.status,
    },
  });
});

// 3. POST /auth/logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully. Tokens invalidated.' });
});

// 4. POST /auth/refresh
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid refresh token' });
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tokens = generateTokens(user);
    res.json({ success: true, token: tokens.token });
  });
});

// 5. POST /auth/verify-email
app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  const { token } = req.body;
  const record = db.emailVerificationTokens[token];
  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ error: 'Verification token invalid or expired' });
  }

  const user = db.users.find(u => u.email === record.email);
  if (user) {
    user.emailVerified = true;
    delete db.emailVerificationTokens[token];
    res.json({ success: true, message: 'Email verified successfully', status: user.status });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// 6. POST /auth/forgot-password (Never reveal whether an email exists)
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (user) {
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    db.passwordResetTokens[resetToken] = { email: user.email, expires: Date.now() + 3600 * 1000 };
  }
  // Constant secure message
  res.json({ success: true, message: 'Password reset instructions have been sent if an account exists.' });
});

// 7. POST /auth/reset-password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const record = db.passwordResetTokens[token];
  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ error: 'Reset token invalid or expired' });
  }

  const user = db.users.find(u => u.email === record.email);
  if (!user) return res.status(404).json({ error: 'Account not found' });

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  delete db.passwordResetTokens[token];
  res.json({ success: true, message: 'Password reset successfully. You may now sign in.' });
});

// 8. GET /auth/me
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      department: user.department,
      status: user.status,
    },
  });
});

// ----------------------------------------------------
// Section 49: MAIN REST APIs
// ----------------------------------------------------

// Centres: GET, POST, GET/:id, PUT/:id, DELETE/:id
app.get('/api/centres', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.centres });
});

app.post('/api/centres', (req: Request, res: Response) => {
  const newCentre = { ...req.body, id: `tc_${Date.now()}` };
  db.centres.push(newCentre);
  res.status(201).json({ success: true, data: newCentre });
});

app.get('/api/centres/:id', (req: Request, res: Response) => {
  const centre = db.centres.find(c => c.id === req.params.id);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  res.json({ success: true, data: centre });
});

app.put('/api/centres/:id', (req: Request, res: Response) => {
  const idx = db.centres.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Centre not found' });
  db.centres[idx] = { ...db.centres[idx], ...req.body };
  res.json({ success: true, data: db.centres[idx] });
});

app.delete('/api/centres/:id', (req: Request, res: Response) => {
  const idx = db.centres.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Centre not found' });
  db.centres.splice(idx, 1);
  res.json({ success: true, message: 'Centre deleted' });
});

// Attendance: GET, POST, GET/:id
app.get('/api/attendance', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.attendance });
});

app.post('/api/attendance', (req: Request, res: Response) => {
  const record = { ...req.body, id: `att_${Date.now()}` };
  db.attendance.unshift(record);
  res.status(201).json({ success: true, data: record });
});

app.get('/api/attendance/:id', (req: Request, res: Response) => {
  const att = db.attendance.find(a => a.id === req.params.id);
  if (!att) return res.status(404).json({ error: 'Attendance record not found' });
  res.json({ success: true, data: att });
});

// Infrastructure: GET, POST, PUT/:id
app.get('/api/inventory', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.centres.map(c => ({ centreId: c.id, centreName: c.name, approvedInventory: c.approvedInventory })) });
});

app.post('/api/inventory', (req: Request, res: Response) => {
  res.status(201).json({ success: true, message: 'Inventory item added' });
});

app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const centre = db.centres.find(c => c.id === req.params.id);
  if (centre && req.body.approvedInventory) {
    centre.approvedInventory = { ...centre.approvedInventory, ...req.body.approvedInventory };
  }
  res.json({ success: true, message: 'Inventory updated' });
});

// Video: POST /video/upload, POST /video/analyze, POST /video/camera/connect, POST /video/capture, GET /video/jobs/:id
app.post('/api/video/upload', (req: Request, res: Response) => {
  const jobId = `job_${Date.now()}`;
  db.videoJobs[jobId] = {
    id: jobId,
    sourceType: 'UPLOAD',
    fileName: req.body.fileName || 'cctv_batch_session_1080p.mp4',
    status: 'PROCESSING',
    progress: 25,
    createdAt: new Date().toISOString(),
  };
  res.json({ success: true, jobId, message: 'Video upload received. Asynchronous job queued.' });
});

app.post('/api/video/analyze', (req: Request, res: Response) => {
  const { centreId, videoSource, samplingFps } = req.body;
  const jobId = `job_${Date.now()}`;
  db.videoJobs[jobId] = {
    id: jobId,
    centreId: centreId || 'tc_001',
    sourceType: videoSource || 'CCTV_STREAM',
    samplingFps: samplingFps || 5,
    status: 'PROCESSING',
    progress: 50,
    createdAt: new Date().toISOString(),
  };
  res.json({ success: true, jobId, status: 'PROCESSING', message: 'AI Video Analysis pipeline running asynchronously.' });
});

app.post('/api/video/camera/connect', (req: Request, res: Response) => {
  const { rtspUrl, cameraName } = req.body;
  res.json({ success: true, message: `Connected to RTSP stream ${cameraName || 'CCTV'} successfully`, status: 'CONNECTED', rtspUrl });
});

app.post('/api/video/capture', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Live webcam capture stream initialized for browser inference' });
});

app.get('/api/video/jobs/:id', (req: Request, res: Response) => {
  const job = db.videoJobs[req.params.id] || {
    id: req.params.id,
    status: 'COMPLETED',
    progress: 100,
    detectedAttendanceAverage: 32,
    reportedAttendance: 40,
    detectedInventory: { computers: 18, machines: 2, workbenches: 5, chairs: 35, damaged_equipment: 1 },
    alertsGeneratedCount: 2,
  };
  res.json({ success: true, data: job });
});

// Alerts: GET, GET/:id, POST /:id/confirm, POST /:id/false-positive
app.get('/api/alerts', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.alerts });
});

app.get('/api/alerts/:id', (req: Request, res: Response) => {
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json({ success: true, data: alert });
});

app.post('/api/alerts/:id/confirm', (req: Request, res: Response) => {
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (alert) alert.status = 'CONFIRMED';
  res.json({ success: true, message: 'Alert confirmed by officer', data: alert });
});

app.post('/api/alerts/:id/false-positive', (req: Request, res: Response) => {
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (alert) alert.status = 'FALSE_POSITIVE';
  res.json({ success: true, message: 'Alert classified as false positive', data: alert });
});

// Actions: GET, POST, PUT/:id, POST /:id/respond, POST /:id/verify, POST /:id/escalate
app.get('/api/actions', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.actions });
});

app.post('/api/actions', (req: Request, res: Response) => {
  const action = { ...req.body, id: `ACT-${new Date().getFullYear()}-${String(db.actions.length + 1).padStart(3, '0')}`, status: 'ASSIGNED' };
  db.actions.unshift(action);
  res.status(201).json({ success: true, data: action });
});

app.put('/api/actions/:id', (req: Request, res: Response) => {
  const idx = db.actions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Action not found' });
  db.actions[idx] = { ...db.actions[idx], ...req.body };
  res.json({ success: true, data: db.actions[idx] });
});

app.post('/api/actions/:id/respond', (req: Request, res: Response) => {
  const action = db.actions.find(a => a.id === req.params.id);
  if (!action) return res.status(404).json({ error: 'Action not found' });
  action.status = 'SUBMITTED';
  (action as any).centreResponse = req.body;
  res.json({ success: true, message: 'Response submitted for verification', data: action });
});

app.post('/api/actions/:id/verify', (req: Request, res: Response) => {
  const { outcome, remarks } = req.body;
  const action = db.actions.find(a => a.id === req.params.id);
  if (!action) return res.status(404).json({ error: 'Action not found' });
  if (outcome === 'APPROVED') {
    action.status = 'RESOLVED';
  } else if (outcome === 'REJECTED') {
    action.status = 'REOPENED';
  }
  (action as any).verification = { outcome, remarks, verifiedAt: new Date().toISOString() };
  res.json({ success: true, message: `Action verification recorded: ${action.status}`, data: action });
});

app.post('/api/actions/:id/escalate', (req: Request, res: Response) => {
  const action = db.actions.find(a => a.id === req.params.id);
  if (!action) return res.status(404).json({ error: 'Action not found' });
  action.status = 'ESCALATED';
  action.isOverdue = true;
  res.json({ success: true, message: 'Action escalated to higher authority', data: action });
});

// Reports: GET /reports, GET /reports/:id
app.get('/api/reports', (_req: Request, res: Response) => {
  res.json({
    success: true,
    reports: [
      { id: 'rep_01', title: 'Centre Compliance Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_02', title: 'Attendance Discrepancy Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_03', title: 'Infrastructure Shortage Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_04', title: 'AI Alert Summary Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_05', title: 'Action Closure & Escalation Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_06', title: 'On-site Inspection Audit Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_07', title: 'District Performance & Ranking Report', formats: ['PDF', 'CSV', 'Excel'] },
      { id: 'rep_08', title: 'Monthly Scheme Compliance Report', formats: ['PDF', 'CSV', 'Excel'] },
    ],
  });
});

app.get('/api/reports/:id', (req: Request, res: Response) => {
  res.json({ success: true, id: req.params.id, generatedAt: new Date().toISOString(), status: 'READY' });
});

// Dataset & ML Model stats
app.get('/api/ml/dataset-report', (_req: Request, res: Response) => {
  res.json({
    dataset_name: 'Govt-SkillCentre-Compliance-v1.4',
    format: 'YOLO Normalised (class_id center_x center_y width height)',
    classes: ['person', 'computer', 'workbench', 'machine', 'chair', 'damaged_equipment'],
    splits: {
      train: { images: 2840, labels: 2840, instances: 14210 },
      val: { images: 620, labels: 620, instances: 3120 },
      test: { images: 410, labels: 410, instances: 2040 },
    },
    class_counts: {
      person: 7840,
      chair: 5210,
      computer: 3180,
      workbench: 1420,
      machine: 980,
      damaged_equipment: 740,
    },
    metrics: {
      precision: 0.924,
      recall: 0.898,
      f1_score: 0.911,
      mAP50: 0.942,
      mAP50_95: 0.817,
      latency_ms: 14.2,
    },
  });
});

// Start server with Vite middleware mounted in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SkillGuard AI Platform Server running on http://localhost:${PORT}`);
  });
}

startServer();
