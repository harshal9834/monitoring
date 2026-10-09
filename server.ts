import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store for server REST API
const db = {
  centres: [
    {
      id: 'tc_001',
      name: 'Apex National Skill Academy',
      code: 'MH-PUN-TC-0842',
      address: 'Plot 44, Electronic Zone, Hinjawadi Phase 2, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      centreType: 'PMKVY Vocational Center of Excellence',
      contactPerson: 'Vikram Desai',
      contactNumber: '+91 98230 45678',
      email: 'admin@apexskill.org',
      status: 'FLAGGED',
      approvedTraineeCapacity: 40,
      approvedInventory: { computers: 20, workbenches: 5, machines: 3, chairs: 40, cctvCameras: 3 },
      complianceScore: 78,
      attendanceComplianceRate: 80,
      infrastructureComplianceRate: 85,
      actionComplianceRate: 70
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
      status: 'ACTIVE',
      approvedTraineeCapacity: 30,
      approvedInventory: { computers: 15, workbenches: 4, machines: 2, chairs: 30, cctvCameras: 2 },
      complianceScore: 94,
      attendanceComplianceRate: 96,
      infrastructureComplianceRate: 95,
      actionComplianceRate: 90
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
      status: 'UNDER_REVIEW',
      approvedTraineeCapacity: 50,
      approvedInventory: { computers: 25, workbenches: 8, machines: 6, chairs: 50, cctvCameras: 4 },
      complianceScore: 68,
      attendanceComplianceRate: 72,
      infrastructureComplianceRate: 70,
      actionComplianceRate: 60
    }
  ],
  videoJobs: {} as Record<string, any>,
  alerts: [] as any[],
  actions: [] as any[],
  auditLogs: [] as any[]
};

// --- REST API ENDPOINTS ---

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  res.json({
    status: 'success',
    token: 'jwt_mock_token_kavach_2026',
    user: {
      id: 'usr_gov_admin',
      name: 'Dr. Alok Verma',
      email: email || 'alok.verma@msde.gov.in',
      role: 'gov_admin',
      designation: 'Joint Director (Compliance & Audit)',
      department: 'Ministry of Skill Development & Entrepreneurship'
    }
  });
});

app.get('/api/centres', (req: Request, res: Response) => {
  res.json({ success: true, data: db.centres });
});

app.get('/api/centres/:id', (req: Request, res: Response) => {
  const centre = db.centres.find(c => c.id === req.params.id);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  res.json({ success: true, data: centre });
});

app.post('/api/centres', (req: Request, res: Response) => {
  const newCentre = { ...req.body, id: `tc_${Date.now()}` };
  db.centres.push(newCentre);
  res.status(201).json({ success: true, data: newCentre });
});

app.get('/api/centres/:id/inventory', (req: Request, res: Response) => {
  const centre = db.centres.find(c => c.id === req.params.id);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  res.json({
    success: true,
    data: {
      approved: centre.approvedInventory,
      lastObserved: { computers: 18, workbenches: 5, machines: 2, chairs: 35, damaged_equipment: 1 },
      status: 'DEFICIT_FLAGGED'
    }
  });
});

app.post('/api/video/upload', (req: Request, res: Response) => {
  const jobId = `job_${Date.now()}`;
  db.videoJobs[jobId] = {
    id: jobId,
    sourceType: 'UPLOAD',
    fileName: req.body.fileName || 'cctv_batch_session_1080p.mp4',
    status: 'QUEUED',
    progress: 0,
    createdAt: new Date().toISOString()
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
    progress: 15,
    createdAt: new Date().toISOString()
  };
  res.json({
    success: true,
    jobId,
    status: 'PROCESSING',
    message: 'AI Video Analysis pipeline launched.'
  });
});

app.get('/api/video/jobs/:id', (req: Request, res: Response) => {
  const job = db.videoJobs[req.params.id] || {
    id: req.params.id,
    status: 'COMPLETED',
    progress: 100,
    detectedAttendanceAverage: 32,
    reportedAttendance: 40,
    detectedInventory: { computers: 18, machines: 2, workbenches: 5, chairs: 35, damaged_equipment: 1 },
    alertsGeneratedCount: 2
  };
  res.json({ success: true, data: job });
});

app.get('/api/ml/dataset-report', (req: Request, res: Response) => {
  const reportPath = path.join(__dirname, 'ml/scripts/inspect_dataset.py');
  res.json({
    dataset_name: 'Govt-SkillCentre-Compliance-v1.4',
    format: 'YOLO Normalised (class_id center_x center_y width height)',
    classes: ['person', 'computer', 'workbench', 'machine', 'chair', 'damaged_equipment'],
    splits: {
      train: { images: 2840, labels: 2840, instances: 14210 },
      val: { images: 620, labels: 620, instances: 3120 },
      test: { images: 410, labels: 410, instances: 2040 }
    },
    class_counts: {
      person: 7840,
      chair: 5210,
      computer: 3180,
      workbench: 1420,
      machine: 980,
      damaged_equipment: 740
    },
    metrics: {
      precision: 0.924,
      recall: 0.898,
      f1_score: 0.911,
      mAP50: 0.942,
      mAP50_95: 0.817
    }
  });
});

// Start server with Vite middleware mounted in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`KAVACH-AI Platform Server running on port ${PORT}`);
  });
}

startServer();
