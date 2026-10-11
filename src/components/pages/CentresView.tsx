import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit2,
  Lock,
  Power,
  RotateCcw,
  Users,
  Shield,
  Loader2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  User,
  Activity,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

interface CentresViewProps {
  onSelectCentre: (centreId: string) => void;
  onNavigate: (tab: any, targetId?: string) => void;
}

export const CentresView: React.FC<CentresViewProps> = ({ onSelectCentre, onNavigate }) => {
  const currentUser = appState.currentUser;
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [centres, setCentres] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [registeredSuccessData, setRegisteredSuccessData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Centre Registration
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: 'cat_ai_robotics',
    address: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    contact_number: '',
    official_email: '',
    contact_person: '',
    approved_capacity: 40,
    approved_infrastructure: '',
    admin_name: '',
    admin_email: '',
    admin_username: '',
    temporary_password: ''
  });

  // Edit State
  const [editData, setEditData] = useState({
    name: '',
    category_id: '',
    address: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    contact_number: '',
    official_email: '',
    approved_capacity: 40,
    status: 'ACTIVE'
  });

  const fetchCentres = async () => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const data = await api.getAdminCentres({
          search: searchQuery || undefined,
          status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
          category_id: categoryFilter !== 'ALL' ? categoryFilter : undefined
        });
        setCentres(Array.isArray(data) ? data : []);
      } else {
        const data = await api.getCentres({
          search: searchQuery || undefined,
          status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
          category_id: categoryFilter !== 'ALL' ? categoryFilter : undefined
        });
        setCentres(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load centres:', err);
      setCentres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getGovernmentCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCentres();
  }, [statusFilter, categoryFilter, searchQuery]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.registerCentre(formData);
      setShowRegisterModal(false);
      setRegisteredSuccessData({
        centreName: res.centre?.name || formData.name,
        centreId: res.centre?.centre_code || res.centre?.centreId || 'TC-ALLOCATED',
        loginEmail: res.adminUser?.email || formData.admin_email || formData.official_email,
        status: res.centre?.status || 'ACTIVE'
      });
      // Reset form
      setFormData({
        name: '',
        code: '',
        category_id: 'cat_ai_robotics',
        address: '',
        state: '',
        district: '',
        city: '',
        pincode: '',
        contact_number: '',
        official_email: '',
        contact_person: '',
        approved_capacity: 40,
        approved_infrastructure: '',
        admin_name: '',
        admin_email: '',
        admin_username: '',
        temporary_password: ''
      });
      await fetchCentres();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre) return;
    setIsSubmitting(true);
    try {
      await api.updateCentre(selectedCentre.id, editData);
      setShowEditModal(false);
      await fetchCentres();
    } catch (err: any) {
      alert(err.message || 'Failed to update centre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (centre: any) => {
    try {
      if (centre.status === 'ACTIVE') {
        if (!confirm(`Are you sure you want to deactivate ${centre.centreId || centre.code}? All centre logins and submissions will be disabled.`)) return;
        await api.deactivateCentre(centre.id);
      } else {
        await api.activateCentre(centre.id);
      }
      await fetchCentres();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const openEditModal = (centre: any) => {
    setSelectedCentre(centre);
    setEditData({
      name: centre.centreName || centre.name,
      category_id: centre.categoryId || 'cat_ai_robotics',
      address: centre.address || '',
      state: centre.state || 'Maharashtra',
      district: centre.district || 'Pune',
      city: centre.city || centre.district || 'Pune',
      pincode: centre.pincode || '',
      contact_number: centre.contactNumber || '',
      official_email: centre.officialEmail || centre.email || '',
      approved_capacity: centre.approvedCapacity || centre.approvedTraineeCapacity || 40,
      status: centre.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  // View Mode: 'list' | 'details'
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetailModal = async (centre: any) => {
    setDetailLoading(true);
    setViewMode('details');
    try {
      const detail = await api.getAdminCentreDetail(centre.id || centre.centreId || centre.centre_code || centre.code);
      setSelectedCentre(detail);
    } catch (e) {
      console.error('Failed to load centre detail:', e);
      setSelectedCentre(centre);
    } finally {
      setDetailLoading(false);
    }
  };

  if (viewMode === 'details' && selectedCentre) {
    const centre = selectedCentre;
    const loc = centre.location || {};
    const contact = centre.contact || {};
    const cap = centre.capacity || {};
    const portal = centre.portalAccess || {};
    const act = centre.activitySummary || {};
    const recentSubs = centre.recentSubmissions || [];
    const recentNots = centre.recentNotices || [];

    const centreCode = centre.centreId || centre.centre_code || centre.code || centre.id;
    const centreName = centre.centreName || centre.name || 'Training Centre';
    const accreditationCode = centre.accreditationCode || 'Not provided';
    const category = centre.category || centre.categoryName || 'Not provided';
    const status = centre.status || 'ACTIVE';
    const registeredDate = centre.registeredDate || centre.created_at || 'Not provided';

    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedCentre(null);
              }}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition flex items-center space-x-1.5 text-xs font-bold shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Training Centres</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                  {centreCode}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : status === 'SUSPENDED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {centreName}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => openEditModal(centre)}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Centre</span>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Manage Users</span>
            </button>
            <button
              onClick={() => handleToggleActive(centre)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs text-white ${
                status === 'ACTIVE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{status === 'ACTIVE' ? 'Deactivate Centre' : 'Activate Centre'}</span>
            </button>
          </div>
        </div>

        {detailLoading && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center space-x-2 text-indigo-700 text-xs font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Refreshing live centre metrics and audit history...</span>
          </div>
        )}

        {/* Section 6: Centre Activity Summary Cards (Top Highlight) */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Centre Activity Summary</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Submissions</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{act.totalSubmissions ?? 0}</span>
              <span className="text-[10px] text-slate-400">Attendance records</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Media Uploads</span>
              <span className="text-lg font-black text-indigo-600 mt-0.5 block">{act.totalMediaSubmissions ?? 0}</span>
              <span className="text-[10px] text-slate-400">Images & Videos</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">AI Analyses</span>
              <span className="text-lg font-black text-cyan-600 mt-0.5 block">{act.aiAnalysesPerformed ?? 0}</span>
              <span className="text-[10px] text-slate-400">YOLOv8 verifications</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Open Alerts</span>
              <span className={`text-lg font-black mt-0.5 block ${(act.openAlertsCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {act.openAlertsCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400">Unresolved discrepancies</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Notices</span>
              <span className={`text-lg font-black mt-0.5 block ${(act.activeNoticesCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {act.activeNoticesCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400">Pending compliance</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resolved Notices</span>
              <span className="text-lg font-black text-emerald-600 mt-0.5 block">{act.resolvedNoticesCount ?? 0}</span>
              <span className="text-[10px] text-slate-400">Closed proceedings</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Actions</span>
              <span className="text-lg font-black text-purple-600 mt-0.5 block">{act.pendingActionsCount ?? 0}</span>
              <span className="text-[10px] text-slate-400">Government oversight</span>
            </div>
          </div>
        </div>

        {/* Section 1, 2, 3, 4: Core Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Basic Centre Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-indigo-700 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4" />
              <h3 className="font-bold text-slate-900 text-sm">1. Basic Centre Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Centre ID</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                  {centreCode}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] mt-0.5 ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'SUSPENDED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {status}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Centre Name</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{centreName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Accreditation Code</span>
                <span className="font-mono font-medium text-slate-800 block mt-0.5">{accreditationCode}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Category</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{category}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration Date</span>
                <span className="font-medium text-slate-700 block mt-0.5">{registeredDate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Database Record ID</span>
                <span className="font-mono text-slate-500 text-[11px] block mt-0.5">{centre.id || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-indigo-700 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">2. Location & Jurisdiction</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Street Address</span>
                <span className="font-medium text-slate-800 block mt-0.5">{loc.address || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">City / Town</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{loc.city || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">District</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{loc.district || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">State</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{loc.state || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Postal Pincode</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5">{loc.pincode || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Contact Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-indigo-700 pb-2 border-b border-slate-100">
              <Mail className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">3. Contact Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Official Centre Email</span>
                <span className="font-medium text-slate-800 block mt-0.5 break-all">{contact.email || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Centre Contact Phone</span>
                <span className="font-mono font-medium text-slate-800 block mt-0.5">{contact.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Centre Director / Head</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{contact.directorName || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Official Contact Details</span>
                <span className="font-medium text-slate-700 block mt-0.5">{contact.officialDetails || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Capacity & Infrastructure */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-indigo-700 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">4. Capacity & Infrastructure</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Approved Trainee Capacity</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-lg font-black text-indigo-700">{cap.approvedTraineeCapacity ?? 40}</span>
                  <span className="text-slate-500 text-[11px]">trainees / batch</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Reported Capacity</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-lg font-black text-slate-700">{cap.reportedCapacity ?? cap.approvedTraineeCapacity ?? 40}</span>
                  <span className="text-slate-500 text-[11px]">trainees</span>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Approved Infrastructure & Equipment</span>
                {Array.isArray(cap.infrastructure) && cap.infrastructure.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {cap.infrastructure.map((item: any, idx: number) => {
                      const label = typeof item === 'object' && item !== null
                        ? `${item.assetType || 'Equipment'}: ${item.approvedQuantity ?? ''}`
                        : String(item);
                      return (
                        <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium capitalize">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Portal Access */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Users className="w-4 h-4" />
              <h3 className="font-bold text-slate-900 text-sm">5. Portal Access & Authorized Centre Accounts</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Account Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                portal.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {portal.accountStatus || 'ACTIVE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-2 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Primary Login Email</span>
              <span className="font-medium text-slate-800 block mt-0.5">{portal.loginEmail || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Assigned Users</span>
              <span className="font-bold text-slate-900 block mt-0.5">{Array.isArray(portal.users) ? portal.users.length : 0} user(s)</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Login Access Policy</span>
              <span className="font-semibold text-emerald-700 block mt-0.5">Two-Factor & Center Isolation Enabled</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-bold text-xs block mb-2">Assigned Personnel</span>
            {Array.isArray(portal.users) && portal.users.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Username</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portal.users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-900">{u.name || 'Not provided'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{u.username || 'Not provided'}</td>
                        <td className="py-2 px-3 text-slate-600">{u.email || 'Not provided'}</td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{u.lastLogin || 'Never'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 italic text-xs">
                No individual user logins assigned. Create one in User Access Management.
              </div>
            )}
          </div>
        </div>

        {/* Section 7: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Submissions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-700">
                <FileText className="w-4 h-4" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Submissions (Attendance & Media)</h3>
              </div>
              <button
                onClick={() => onNavigate('submissions')}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center space-x-1"
              >
                <span>View all</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {recentSubs.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Reported</th>
                      <th className="py-2 px-3">Media</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">AI Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentSubs.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">{s.date}</td>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          {s.reportedPresent} / {s.totalRegistered}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-1">
                            {s.hasImage && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">IMG</span>}
                            {s.hasVideo && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">VID</span>}
                            {!s.hasImage && !s.hasVideo && <span className="text-slate-400 text-[10px] italic">None</span>}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.aiStatus === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.aiStatus === 'FLAGGED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.aiStatus || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-400 italic text-xs">
                No submissions recorded yet for this training centre.
              </div>
            )}
          </div>

          {/* Recent Notices */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-700">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Notices & Regulatory Actions</h3>
              </div>
              <button
                onClick={() => onNavigate('notices')}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center space-x-1"
              >
                <span>View all</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {recentNots.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Notice #</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Priority</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentNots.map((n: any) => (
                      <tr key={n.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700">{n.actionNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{n.title}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            n.priority === 'HIGH' || n.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {n.priority}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            n.status === 'RESOLVED' || n.status === 'SATISFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{n.dueDate || 'Not specified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-400 italic text-xs">
                No regulatory notices or inquiry proceedings issued for this centre.
              </div>
            )}
          </div>
        </div>

        {/* Section 8: Admin Actions Footer */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm">Administrative Oversight Controls</h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Direct master modifications for {centreName} ({centreCode}). All actions are cryptographically logged in the audit ledger.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => openEditModal(centre)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Users</span>
            </button>
            <button
              onClick={() => handleToggleActive(centre)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
                status === 'ACTIVE'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
            </button>
          </div>
        </div>

        {/* Re-render edit modal if opened from details */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Edit Training Centre</h3>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Centre Name</label>
                  <input
                    type="text"
                    required
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Category</label>
                    <select
                      value={editData.category_id}
                      onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    >
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Approved Capacity</label>
                    <input
                      type="number"
                      required
                      value={editData.approved_capacity}
                      onChange={(e) => setEditData({ ...editData, approved_capacity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Official Email</label>
                    <input
                      type="email"
                      value={editData.official_email}
                      onChange={(e) => setEditData({ ...editData, official_email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={editData.contact_number}
                      onChange={(e) => setEditData({ ...editData, contact_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Address</label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">City</label>
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">District</label>
                    <input
                      type="text"
                      value={editData.district}
                      onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">State</label>
                    <input
                      type="text"
                      value={editData.state}
                      onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>{isSuperAdmin ? 'Central Accreditation & Master Registry' : 'Government Monitoring Oversight'}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isSuperAdmin ? 'Training Centre Master Management' : 'Registered Training Centres'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Register new training centres, allocate unique Centre IDs, configure capacities, and control portal authorization.'
              : 'Official registry of accredited vocational centres undergoing AI-powered attendance and infrastructure audit.'}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register New Centre</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Centre ID, Name, District, City, or State..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registered Centres Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm font-medium text-slate-600">Querying MySQL Database Records...</p>
        </div>
      ) : centres.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300" />
          <div>
            <p className="text-sm font-bold text-slate-800">No registered training centres found.</p>
            <p className="text-xs text-slate-500 mt-1">Centres must be accredited and registered in MySQL.</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Register Centre
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Centre ID</th>
                  <th className="py-3 px-4">Centre Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Assigned Users</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centres.map((c) => {
                  const centreId = c.centreId || c.centre_code || c.code || c.id;
                  const centreName = c.centreName || c.name;
                  const categoryName = c.categoryName || c.category || 'AI & Robotics';
                  const status = c.status || 'ACTIVE';
                  const isActive = status === 'ACTIVE';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {centreId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{centreName}</div>
                        <div className="text-[10px] text-slate-400">{c.address}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c.state || 'Maharashtra'}</td>
                      <td className="py-3 px-4 text-slate-700">{c.district || 'Pune'}</td>
                      <td className="py-3 px-4 text-slate-700">{c.city || c.district || 'Pune'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {c.registeredDate || c.created_at || '2026-01-15'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {Array.isArray(c.assignedUsers) && c.assignedUsers.length > 0 ? (
                          <div className="space-y-0.5">
                            {c.assignedUsers.map((u: string, idx: number) => (
                              <div key={idx} className="font-medium text-slate-800 text-[11px]">{u}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No admin assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openDetailModal(c)}
                            title="View Centre Details"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => openEditModal(c)}
                                title="Edit Centre Information"
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleToggleActive(c)}
                                title={isActive ? 'Deactivate Centre Access' : 'Activate Centre Access'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isActive
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onNavigate('users')}
                                title="Manage User Access"
                                className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {centres.map((c) => {
              const centreId = c.centreId || c.centre_code || c.code || c.id;
              const centreName = c.centreName || c.name;
              const categoryName = c.categoryName || c.category || 'AI & Robotics';
              const status = c.status || 'ACTIVE';
              const isActive = status === 'ACTIVE';

              return (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-700 font-bold block">{centreId}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{centreName}</h4>
                      {c.address && <p className="text-[11px] text-slate-500 mt-0.5">{c.address}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                      <span className="font-medium text-slate-700">{categoryName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                      <span className="font-medium text-slate-700">{c.city || c.district}, {c.state || 'Maharashtra'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Date</span>
                      <span className="font-mono text-slate-700">{c.registeredDate || c.created_at || '2026-01-15'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Admin</span>
                      <span className="font-medium text-slate-700 truncate block">
                        {Array.isArray(c.assignedUsers) && c.assignedUsers.length > 0
                          ? c.assignedUsers.join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => openDetailModal(c)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 transition-colors"
                          title="Edit Centre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`p-2 rounded-xl border transition-colors ${
                            isActive
                              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: CENTRE REGISTRATION FORM (Specification Section 3) */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Register New Training Centre</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Centre Information */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-indigo-700">
                  1. Centre Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Centre Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Skill Development Institute"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Centre Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Full Facility Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Plot 42, Electronic City Phase 1, Sector 9"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">District *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 411001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contact Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98220 12345"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. operations@apexskill.org"
                      value={formData.official_email}
                      onChange={(e) => setFormData({ ...formData, official_email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Centre Configuration */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-indigo-700">
                  2. Centre Configuration & Capacity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Approved Trainee Capacity *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={500}
                      value={formData.approved_capacity}
                      onChange={(e) => setFormData({ ...formData, approved_capacity: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Centre ID Allocation</label>
                    <div className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-500 flex items-center justify-between">
                      <span>{"{STATE}-{CITY}-TC-{SEQUENCE}"}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Auto</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Generated automatically by backend during registration (e.g. MH-PUN-TC-0001)
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Approved Infrastructure Details</label>
                    <input
                      type="text"
                      placeholder="e.g. 40 High-performance PCs, 2 CNC lathe trainers, Biometric Terminal"
                      value={formData.approved_infrastructure}
                      onChange={(e) => setFormData({ ...formData, approved_infrastructure: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Login Information */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-indigo-700">
                  3. Centre Admin Login Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Centre Admin Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Desai"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Admin Email (Login)</label>
                    <input
                      type="email"
                      placeholder="e.g. admin@apexskill.org"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. centre.admin"
                      value={formData.admin_username}
                      onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Temporary Password</label>
                    <input
                      type="text"
                      value={formData.temporary_password}
                      onChange={(e) => setFormData({ ...formData, temporary_password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Centre & Issue Centre ID</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 17: CENTRE REGISTRATION SUCCESS SCREEN */}
      {registeredSuccessData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Centre Registered Successfully
              </h2>
              <p className="text-xs text-slate-500">
                The training centre is now active in MySQL with an allocated Centre ID.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left divide-y divide-slate-200 text-xs space-y-2.5">
              <div className="pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Centre Name:</span>
                <span className="font-bold text-slate-900 text-sm">{registeredSuccessData.centreName}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Centre ID:</span>
                  <span className="font-mono font-bold text-indigo-700 text-base">{registeredSuccessData.centreId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(registeredSuccessData.centreId);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[11px] text-slate-700 flex items-center gap-1 shadow-2xs"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedId ? 'Copied' : 'Copy Centre ID'}</span>
                </button>
              </div>
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Login Email:</span>
                <span className="font-semibold text-slate-800">{registeredSuccessData.loginEmail}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  {registeredSuccessData.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRegisteredSuccessData(null);
                  window.dispatchEvent(new CustomEvent('skillguard:navigate', { detail: 'centre_login' }));
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Go to Centre Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRegisteredSuccessData(null)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                Close & Return to Management
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CENTRE MODAL */}
      {showEditModal && selectedCentre && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Edit Centre: {selectedCentre.centre_code || selectedCentre.code}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Centre Name</label>
                <input
                  type="text"
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={editData.state}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={editData.district}
                    onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editData.official_email}
                    onChange={(e) => setEditData({ ...editData, official_email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved Capacity</label>
                  <input
                    type="number"
                    required
                    value={editData.approved_capacity}
                    onChange={(e) => setEditData({ ...editData, approved_capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW CENTRE DETAIL MODAL */}
      {showDetailModal && selectedCentre && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedCentre.centre_code || selectedCentre.code || selectedCentre.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCentre.centreName || selectedCentre.name}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Status</span>
                  <span className="font-bold text-slate-800">{selectedCentre.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Category</span>
                  <span className="font-bold text-slate-800">{selectedCentre.category || selectedCentre.categoryName || 'AI & Robotics'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Location</span>
                  <span className="font-bold text-slate-800">{selectedCentre.city || selectedCentre.district}, {selectedCentre.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Approved Capacity</span>
                  <span className="font-bold text-slate-800">{selectedCentre.approvedCapacity || selectedCentre.approvedTraineeCapacity || 40} Trainees</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Associated Centre Admins:</span>
                {Array.isArray(selectedCentre.users) && selectedCentre.users.length > 0 ? (
                  <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-white">
                    {selectedCentre.users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email} ({u.username})</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400 italic">No users associated yet</div>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  onNavigate('submissions');
                }}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>View Centre Submissions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
