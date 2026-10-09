// KAVACH-AI Real-Time Computer Vision & Video Analytics Engine

import { DetectedClass, DetectionBox, FrameDetectionResult } from '../types';

export interface VideoAnalyticsConfig {
  fps: number;
  confidenceThreshold: number;
  lowBandwidthMode: boolean;
  centreId: string;
}

// Bounding box colors matching professional enterprise guidelines
export const CLASS_COLORS: Record<DetectedClass, { stroke: string; fill: string; text: string }> = {
  person: { stroke: '#0284c7', fill: 'rgba(2, 132, 199, 0.15)', text: '#0369a1' },
  computer: { stroke: '#2563eb', fill: 'rgba(37, 99, 235, 0.15)', text: '#1d4ed8' },
  workbench: { stroke: '#d97706', fill: 'rgba(217, 119, 6, 0.15)', text: '#b45309' },
  machine: { stroke: '#7c3aed', fill: 'rgba(124, 58, 237, 0.15)', text: '#6d28d9' },
  chair: { stroke: '#475569', fill: 'rgba(71, 85, 105, 0.15)', text: '#334155' },
  damaged_equipment: { stroke: '#e11d48', fill: 'rgba(225, 29, 72, 0.2)', text: '#be123c' },
};

// Generates synthetic detection frames for demonstration video streams
export function generateSyntheticFrameDetections(
  timestampSec: number,
  scenario: 'CLASSROOM_DISCREPANCY' | 'WORKSHOP_DEFECT' | 'COMPLIANT_LAB' = 'CLASSROOM_DISCREPANCY'
): FrameDetectionResult {
  const detections: DetectionBox[] = [];

  // Slight jitter over time to emulate object tracking in video
  const jitterX = Math.sin(timestampSec * 1.5) * 0.015;
  const jitterY = Math.cos(timestampSec * 1.2) * 0.012;

  if (scenario === 'CLASSROOM_DISCREPANCY') {
    // 32 Trainees present (Centre claimed 40)
    for (let i = 0; i < 32; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const x = 0.08 + col * 0.11 + jitterX * ((i % 2 === 0 ? 1 : -1));
      const y = 0.38 + row * 0.14 + jitterY;
      detections.push({
        id: `det_p_${i}`,
        class: 'person',
        confidence: Number((0.89 + ((i * 13) % 10) * 0.009).toFixed(3)),
        trackId: i + 1,
        bbox: [x, y, 0.085, 0.13],
        timestamp: new Date().toISOString(),
      });
    }

    // 18 Computers (2 missing against 20 approved)
    for (let i = 0; i < 18; i++) {
      const row = Math.floor(i / 6);
      const col = i % 6;
      detections.push({
        id: `det_pc_${i}`,
        class: 'computer',
        confidence: Number((0.91 + ((i * 7) % 8) * 0.01).toFixed(3)),
        bbox: [0.1 + col * 0.14, 0.32 + row * 0.15, 0.09, 0.08],
        condition: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
      });
    }

    // 5 Workbenches (Compliant)
    for (let i = 0; i < 5; i++) {
      detections.push({
        id: `det_wb_${i}`,
        class: 'workbench',
        confidence: 0.93,
        bbox: [0.06 + i * 0.18, 0.45, 0.16, 0.38],
        condition: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
      });
    }

    // 2 Machines (1 missing against 3 approved)
    detections.push({
      id: 'det_m_0',
      class: 'machine',
      confidence: 0.94,
      bbox: [0.03, 0.15, 0.16, 0.28],
      condition: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
    });
    detections.push({
      id: 'det_m_1',
      class: 'machine',
      confidence: 0.91,
      bbox: [0.80, 0.16, 0.17, 0.29],
      condition: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
    });

    // 35 Chairs (5 missing against 40 approved)
    for (let i = 0; i < 35; i++) {
      const row = Math.floor(i / 7);
      const col = i % 7;
      detections.push({
        id: `det_ch_${i}`,
        class: 'chair',
        confidence: 0.88,
        bbox: [0.08 + col * 0.12, 0.48 + row * 0.1, 0.07, 0.09],
        timestamp: new Date().toISOString(),
      });
    }

    // 1 Damaged/Disassembled Equipment
    detections.push({
      id: 'det_dmg_0',
      class: 'damaged_equipment',
      confidence: 0.87,
      bbox: [0.82, 0.72, 0.14, 0.18],
      condition: 'POTENTIAL_DAMAGE',
      timestamp: new Date().toISOString(),
    });
  } else if (scenario === 'WORKSHOP_DEFECT') {
    // 14 Trainees in workshop
    for (let i = 0; i < 14; i++) {
      detections.push({
        id: `det_p_${i}`,
        class: 'person',
        confidence: 0.93,
        trackId: 100 + i,
        bbox: [0.12 + (i % 5) * 0.16 + jitterX, 0.4 + Math.floor(i / 5) * 0.18 + jitterY, 0.1, 0.18],
        timestamp: new Date().toISOString(),
      });
    }
    // 2 Machines, 1 damaged
    detections.push({
      id: 'det_m_0',
      class: 'machine',
      confidence: 0.95,
      bbox: [0.1, 0.2, 0.22, 0.35],
      condition: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
    });
    detections.push({
      id: 'det_m_dmg',
      class: 'damaged_equipment',
      confidence: 0.89,
      bbox: [0.65, 0.22, 0.24, 0.36],
      condition: 'POTENTIAL_DAMAGE',
      timestamp: new Date().toISOString(),
    });
    // 4 Workbenches
    for (let i = 0; i < 4; i++) {
      detections.push({
        id: `det_wb_${i}`,
        class: 'workbench',
        confidence: 0.92,
        bbox: [0.08 + i * 0.22, 0.6, 0.18, 0.3],
        condition: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    // COMPLIANT_LAB
    for (let i = 0; i < 30; i++) {
      detections.push({
        id: `det_p_${i}`,
        class: 'person',
        confidence: 0.95,
        trackId: i + 1,
        bbox: [0.08 + (i % 6) * 0.15 + jitterX, 0.4 + Math.floor(i / 6) * 0.16 + jitterY, 0.09, 0.14],
        timestamp: new Date().toISOString(),
      });
    }
    for (let i = 0; i < 15; i++) {
      detections.push({
        id: `det_pc_${i}`,
        class: 'computer',
        confidence: 0.94,
        bbox: [0.1 + (i % 5) * 0.18, 0.35 + Math.floor(i / 5) * 0.16, 0.1, 0.09],
        condition: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
      });
    }
    for (let i = 0; i < 4; i++) {
      detections.push({
        id: `det_wb_${i}`,
        class: 'workbench',
        confidence: 0.93,
        bbox: [0.08 + i * 0.22, 0.5, 0.19, 0.32],
        condition: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
      });
    }
  }

  const counts = {
    person: detections.filter((d) => d.class === 'person').length,
    computer: detections.filter((d) => d.class === 'computer').length,
    workbench: detections.filter((d) => d.class === 'workbench').length,
    machine: detections.filter((d) => d.class === 'machine').length,
    chair: detections.filter((d) => d.class === 'chair').length,
    damaged_equipment: detections.filter((d) => d.class === 'damaged_equipment').length,
  };

  return {
    frameNumber: Math.floor(timestampSec * 15),
    timestamp: new Date().toISOString(),
    detections,
    counts,
  };
}

// Draw detected bounding boxes on an HTML5 canvas overlay
export function renderDetectionsOnCanvas(
  canvas: HTMLCanvasElement,
  detections: DetectionBox[],
  options: {
    showLabels?: boolean;
    showConf?: boolean;
    showTrackId?: boolean;
    filterClass?: string | null;
  } = {}
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  detections.forEach((det) => {
    if (options.filterClass && det.class !== options.filterClass) return;

    const [nx, ny, nw, nh] = det.bbox;
    const x = nx * width;
    const y = ny * height;
    const w = nw * width;
    const h = nh * height;

    const styling = CLASS_COLORS[det.class] || { stroke: '#0284c7', fill: 'rgba(2,132,199,0.1)', text: '#0284c7' };

    // Fill semi-transparent box
    ctx.fillStyle = styling.fill;
    ctx.fillRect(x, y, w, h);

    // Stroke border
    ctx.strokeStyle = styling.stroke;
    ctx.lineWidth = det.class === 'damaged_equipment' ? 3 : 2;
    if (det.class === 'damaged_equipment') {
      ctx.setLineDash([4, 2]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Corner targeting brackets for enterprise CV look
    const cornerSize = Math.min(8, w / 4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Top Left
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    // Top Right
    ctx.moveTo(x + w - cornerSize, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerSize);
    // Bottom Left
    ctx.moveTo(x, y + h - cornerSize);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerSize, y + h);
    // Bottom Right
    ctx.moveTo(x + w - cornerSize, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerSize);
    ctx.stroke();

    // Draw label badge
    if (options.showLabels !== false) {
      let labelText = det.class.toUpperCase().replace('_', ' ');
      if (options.showTrackId !== false && det.trackId !== undefined) {
        labelText += ` #${det.trackId}`;
      }
      if (options.showConf !== false) {
        labelText += ` ${(det.confidence * 100).toFixed(0)}%`;
      }
      if (det.condition && det.condition !== 'OPERATIONAL') {
        labelText += ` [${det.condition.replace('_', ' ')}]`;
      }

      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const padding = 4;
      const badgeWidth = textMetrics.width + padding * 2;
      const badgeHeight = 16;
      const badgeY = Math.max(0, y - badgeHeight);

      ctx.fillStyle = styling.stroke;
      ctx.fillRect(x, badgeY, badgeWidth, badgeHeight);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x + padding, badgeY + 12);
    }
  });
}

// Background classroom/workshop procedural generator onto canvas for realistic video simulation
export function renderSimulatedClassroomBackground(
  canvas: HTMLCanvasElement,
  scenario: 'CLASSROOM_DISCREPANCY' | 'WORKSHOP_DEFECT' | 'COMPLIANT_LAB' = 'CLASSROOM_DISCREPANCY'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Background wall
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#f1f5f9');
  gradient.addColorStop(0.5, '#e2e8f0');
  gradient.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Classroom ceiling lights grid
  ctx.fillStyle = '#ffffff';
  for (let i = 1; i <= 4; i++) {
    ctx.fillRect(w * (i * 0.22 - 0.05), h * 0.03, w * 0.1, h * 0.03);
  }

  // Blackboard / Whiteboard / Smart Screen in center
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(w * 0.28, h * 0.1, w * 0.44, h * 0.18);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.28, h * 0.1, w * 0.44, h * 0.18);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(
    scenario === 'WORKSHOP_DEFECT'
      ? 'VOCATIONAL MACHINE WORKSHOP - BAY 03'
      : 'NATIONAL SKILL QUALIFICATION FRAMEWORK (NSQF LEVEL 5)',
    w * 0.31,
    h * 0.17
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText('CCTV STREAM FEED: SECURE GOVERNMENT LIVE AUDIT', w * 0.31, h * 0.22);

  // Workshop floor floorboard lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * (0.6 + i * 0.04));
    ctx.lineTo(w, h * (0.6 + i * 0.04));
    ctx.stroke();
  }
}
