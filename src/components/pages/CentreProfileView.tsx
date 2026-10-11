import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';

export const CentreProfileView: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getCentreProfile()
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load profile:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading centre profile...</p>
      </div>
    );
  }

  const p = profile || {
    centreName: 'Apex Vocational Training Institute',
    centreCode: 'MH-PUN-TC-0842',
    centreType: 'PMKVY Center of Excellence',
    address: 'Plot 42, Hinjawadi Phase 2, Pune, Maharashtra 411057',
    district: 'Pune',
    state: 'Maharashtra',
    contactPerson: 'Vikram Joshi',
    contactNumber: '+91 98230 44512',
    email: 'admin@apexskill.org',
    approvedCapacity: 40,
    accreditationStatus: 'ACCREDITED',
    status: 'ACTIVE',
    batchesCount: 1,
    submissionsCount: 1,
    user: {
      name: 'Vikram Joshi',
      email: 'admin@apexskill.org',
      role: 'CENTRE_ADMIN',
      designation: 'Centre Director',
      department: 'Training Operations'
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Accredited Institution Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{p.centreName}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official registration and accreditation details registered with the National Skill Development Corporation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{p.accreditationStatus}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Statutory & Facility Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Centre Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Centre Information</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Centre ID / Code</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{p.centreCode}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Accreditation Category</span>
                <span className="font-semibold text-slate-800">{p.centreType}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">District</span>
                <span className="font-semibold text-slate-800">{p.district}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">State</span>
                <span className="font-semibold text-slate-800">{p.state}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Address</span>
                <span className="font-semibold text-slate-800 flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{p.address}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Authorized Contact Person</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Designated Officer</span>
                <span className="font-bold text-slate-900 text-sm">{p.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Official Phone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.contactNumber}</span>
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Official Email</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.email}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Capacity & Current Admin */}
        <div className="space-y-6">
          {/* Capacity Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Operational Metrics</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-600 font-medium">Approved Trainee Capacity:</span>
                <span className="font-bold text-slate-900 text-sm">{p.approvedCapacity}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-600 font-medium">Registered Batches:</span>
                <span className="font-bold text-slate-900">{p.batchesCount}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-600 font-medium">Total Daily Submissions:</span>
                <span className="font-bold text-slate-900">{p.submissionsCount}</span>
              </div>
            </div>
          </div>

          {/* Current Logged-in User Account Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Active Account Session</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Logged In As</span>
                <span className="font-bold text-slate-900 text-sm">{p.user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span>
                <span className="text-slate-600 font-mono">{p.user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Designation</span>
                <span className="text-slate-700 font-medium">{p.user?.designation}</span>
              </div>
              <div className="pt-2">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {p.user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
