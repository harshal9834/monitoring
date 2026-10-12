// SkillGuard AI API Client
// Communicates with FastAPI backend connected to MySQL 8.0+

const DEFAULT_PROD_API = 'https://monitoring-8yp9.onrender.com/api';

export const API_BASE = (import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api`
  : (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
      ? DEFAULT_PROD_API
      : (import.meta.env.PROD ? DEFAULT_PROD_API : '/api')));

export function getAuthToken(): string | null {
  return localStorage.getItem('skillguard_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('skillguard_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('skillguard_token');
}

export function formatVideoUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
    if (!url.includes('/video/upload/vc_h264/') && !url.includes('/video/upload/f_auto,vc_h264/')) {
      return url.replace('/video/upload/', '/video/upload/vc_h264/');
    }
  }
  return url;
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'ALL') {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      localStorage.removeItem('skillguard_current_user');
      // Dispatch custom event for seamless React routing instead of hard browser page reload
      window.dispatchEvent(new CustomEvent('skillguard:unauthorized'));
    }
    const errorData = await response.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string; portal_type: string }) =>
    request<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: any) =>
    request<{ success: boolean; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request<any>('/auth/me'),

  // Government Portal
  getGovernmentSummary: () => request<any>('/government/dashboard/summary'),
  getGovernmentCategories: () => request<any[]>('/government/categories'),
  getCentres: (params?: { search?: string; category_id?: string; district?: string; status_filter?: string }) => {
    return request<any[]>(`/government/centres${buildQuery(params)}`);
  },
  createCentre: (data: any) =>
    request<any>('/government/centres', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAlerts: (params?: { severity?: string }) => {
    return request<any[]>(`/government/alerts${buildQuery(params)}`);
  },
  createAlert: (data: any) =>
    request<any>('/government/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getActions: (params?: { status_filter?: string }) => {
    return request<any[]>(`/government/actions${buildQuery(params)}`);
  },
  createAction: (data: any) =>
    request<any>('/government/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInspections: () => request<any[]>('/government/inspections'),
  scheduleInspection: (data: any) =>
    request<any>('/government/inspections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  completeInspection: (inspectionId: string, data: { outcome: string; findings: string }) =>
    request<any>(`/government/inspections/${inspectionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAttendance: () => request<any[]>('/government/attendance'),
  getMLMetrics: () => request<any>('/government/ml/metrics'),

  getCentreDetail: (centreId: string) => request<any>(`/government/centres/${centreId}`),
  getGovernmentInfrastructure: () => request<any[]>('/government/infrastructure'),
  getGovernmentAnalytics: () => request<any>('/government/analytics'),
  getGovernmentReports: () => request<any[]>('/government/reports'),

  getSubmissions: () => request<any[]>('/government/submissions'),
  getSubmissionDetail: (submissionId: string) => request<any>(`/government/submissions/${submissionId}`),
  getSubmissionMedia: (submissionId: string) => request<any[]>(`/submissions/${submissionId}/media`),
  triggerSubmissionAIAnalysis: (submissionId: string) =>
    request<any>(`/government/submissions/${submissionId}/analyze`, {
      method: 'POST',
    }),
  removeGovernmentSubmission: (submissionId: string, reason?: string) =>
    request<any>(`/government/submissions/${submissionId}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Removed / Archived by Government Monitoring Officer' }),
    }),
  dismissAlert: (alertId: string, reason?: string) =>
    request<any>(`/government/alerts/${alertId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Dismissed by Government Officer' }),
    }),
  resolveAlert: (alertId: string, reason?: string) =>
    request<any>(`/government/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Resolved by Government Officer' }),
    }),
  cancelNotice: (noticeId: string, reason?: string) =>
    request<any>(`/government/notices/${noticeId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Cancelled by Government Directorate' }),
    }),

  // Dedicated Government AI Analysis & Notice Case Review Endpoints
  getGovernmentAIAnalysis: (targetId: string) => request<any>(`/government/ai-analysis/${targetId}`),
  getGovernmentCentreAIAnalysis: (centerId: string) => request<any>(`/government/centres/${centerId}/ai-analysis`),
  reviewGovernmentAIAnalysis: (targetId: string, data: { action: string; remarks?: string; recommended_action?: string }) =>
    request<any>(`/government/ai-analysis/${targetId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  issueGovernmentNotice: (data: { centre_id: string; title: string; description: string; priority?: string; days_allowed?: number; alert_id?: string }) =>
    request<any>('/government/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getNoticeCaseReview: (noticeId: string) => request<any>(`/government/notices/${noticeId}/case-review`),
  verifyNoticeCase: (noticeId: string, outcome: string, remarks: string) =>
    request<any>(`/government/notices/${noticeId}/verify?outcome=${encodeURIComponent(outcome)}&remarks=${encodeURIComponent(remarks)}`, {
      method: 'POST',
    }),
  analyzeNoticeEvidence: (noticeId: string) =>
    request<any>(`/government/notices/${noticeId}/analyze-evidence`, {
      method: 'POST',
    }),
  getGovernmentNotifications: () => request<any[]>('/government/notifications'),


  // Training Centre Portal & Submissions
  getCentreSummary: () => request<any>('/centre/dashboard/summary'),
  getCentreAttendance: () => request<any[]>('/centre/attendance'),
  getCentreSubmissions: () => request<any[]>('/centre/submissions'),
  getMySubmissions: async (): Promise<any[]> => {
    try {
      const res = await request<any>('/submissions/my');
      if (res && Array.isArray(res.submissions)) return res.submissions;
      if (Array.isArray(res)) return res;
    } catch (e) {
      console.warn('Fallback to /centre/submissions:', e);
    }
    const fallback = await request<any[]>('/centre/submissions');
    return Array.isArray(fallback) ? fallback : [];
  },
  createSubmission: async (formData: FormData) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create submission' }));
      throw new Error(err.detail || 'Failed to create submission');
    }
    return res.json();
  },
  removeCentreSubmission: (submissionId: string, reason?: string) =>
    request<any>(`/centre/submissions/${submissionId}/remove`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Removed by Training Centre' }),
    }),
  submitAttendance: (data: any) =>
    request<any>('/centre/attendance/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitCentreDailyData: (data: any) =>
    request<any>('/centre/daily-submission', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCentreProfile: () => request<any>('/centre/profile'),
  getCentreNotifications: () => request<any[]>('/centre/notifications'),
  getCentreNotices: () => request<any[]>('/centre/notices'),
  getCentreNoticeDetail: (noticeId: string) => request<any>(`/centre/notices/${noticeId}`),
  getCentreActions: () => request<any[]>('/centre/notices'),
  getCentreAlerts: () => request<any[]>('/centre/alerts'),
  getCentreInfrastructure: () => request<any>('/centre/infrastructure'),
  getCentreInspections: () => request<any[]>('/centre/inspections'),
  getCentreReports: () => request<any[]>('/centre/reports'),
  submitActionResponse: (actionId: string, data: any) =>
    request<any>(`/centre/notices/${actionId}/response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitNoticeResponse: (noticeId: string, data: { explanation: string; proof_document_name?: string; proof_photo_url?: string }) =>
    request<any>(`/centre/notices/${noticeId}/response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadNoticeResponseMultipart: async (noticeId: string, formData: FormData) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/centre/notices/${noticeId}/upload-response`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload response' }));
      throw new Error(err.detail || 'Failed to upload response');
    }
    return res.json();
  },

  // Admin & Management
  // Admin Portal — Centre Registration, Management & User Access
  getAdminSummary: () => request<any>('/admin/dashboard/summary'),
  getAdminCentres: (params?: { search?: string; status_filter?: string; category_id?: string; district?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status_filter) q.append('status_filter', params.status_filter);
    if (params?.category_id) q.append('category_id', params.category_id);
    if (params?.district) q.append('district', params.district);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>(`/admin/centres${qs}`);
  },
  getAdminCentreDetail: (centreId: string) => request<any>(`/admin/centres/${centreId}`),
  registerCentre: (data: any) =>
    request<any>('/admin/centres', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCentre: (centreId: string, data: any) =>
    request<any>(`/admin/centres/${centreId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  activateCentre: (centreId: string) =>
    request<any>(`/admin/centres/${centreId}/activate`, {
      method: 'POST',
    }),
  deactivateCentre: (centreId: string) =>
    request<any>(`/admin/centres/${centreId}/deactivate`, {
      method: 'POST',
    }),
  suspendCentre: (centreId: string) =>
    request<any>(`/admin/centres/${centreId}/suspend`, {
      method: 'POST',
    }),

  // User Access Management
  getUsers: (params?: { search?: string; centre_id?: string; role?: string; status_filter?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.centre_id) q.append('centre_id', params.centre_id);
    if (params?.role) q.append('role', params.role);
    if (params?.status_filter) q.append('status_filter', params.status_filter);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>(`/admin/users${qs}`);
  },
  createCentreUserAccess: (data: { centre_id: string; name: string; email: string; username?: string; password: string; phone?: string }) =>
    request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createAdminUser: (data: any) =>
    request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleUserStatus: (userId: string) =>
    request<any>(`/admin/users/${userId}/toggle-status`, {
      method: 'POST',
    }),
  resetUserPassword: (userId: string, new_password: string) =>
    request<any>(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    }),
  changeUserAssignedCentre: (userId: string, centre_id: string) =>
    request<any>(`/admin/users/${userId}/change-centre`, {
      method: 'POST',
      body: JSON.stringify({ centre_id }),
    }),

  // Audit Logs
  getAuditLogs: (params?: { search?: string; action?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.action) q.append('action', params.action);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>(`/admin/audit-logs${qs}`);
  },

  // System & Camera Helpers (Legacy/Subsystem compatibility)
  getCameras: () => request<any[]>('/admin/cameras').catch(() => []),
  updateCameraConfig: (cameraId: string, data: any) =>
    request<any>(`/admin/cameras/${cameraId}/config`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => ({ success: true })),
  getSettings: () => request<any>('/admin/settings').catch(() => ({})),
  updateSettings: (data: any) =>
    request<any>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => ({ success: true })),
  verifyAction: (actionId: string, data: { outcome: string; mandatory_remarks: string }) =>
    request<any>(`/admin/actions/${actionId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => ({ success: true })),

  // Video & AI Analytics
  getVideoConfig: () => request<any>('/video/config'),
  getVideos: (centreId?: string) => {
    const query = centreId ? `?centre_id=${encodeURIComponent(centreId)}` : '';
    return request<any[]>(`/video/list${query}`);
  },
  getVideoDetail: (videoId: string) => request<any>(`/video/${videoId}`),
  inferLiveFrame: (videoId: string, imageBase64: string) =>
    request<any>(`/video/${videoId}/infer-frame`, {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    }),
  captureSnapshotEvidence: (videoId: string, imageData: string, timestamp: number) =>
    request<any>(`/video/${videoId}/snapshot`, {
      method: 'POST',
      body: JSON.stringify({ imageData, timestamp }),
    }),
  flagViolation: (videoId: string, data: any) =>
    request<any>(`/video/${videoId}/flag-violation`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadVideo: async (formData: FormData) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/video/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Health
  getHealth: () => request<any>('/health'),
};

