import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  Lock,
  CheckCircle2,
  LogOut,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

interface GovernmentProfileViewProps {
  onLogout?: () => void;
}

export const GovernmentProfileView: React.FC<GovernmentProfileViewProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api.getProfile()
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

  const currentUser = appState.currentUser;
  const user = profile || currentUser;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-xs">
            {user.name ? user.name.charAt(0) : 'G'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
            <p className="text-xs text-slate-500 font-medium">
              {user.designation || 'Senior Monitoring Officer'} • {user.department || 'National Skill Monitoring Directorate'}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Authorized Government Official
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Official Credentials Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Official Officer Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{user.email}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{user.phone || '+91 11 2345 6789'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Jurisdiction / District</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{user.district || 'National Central Command (All Districts)'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Role Privilege</span>
            <span className="font-semibold text-indigo-700 text-sm mt-0.5 block">{user.role}</span>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
          <span className="font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Statutory Verification Authority</span>
          </span>
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            Authorized to review AI detection logs, verify compliance discrepancies, issue formal corrective notices to training providers, and schedule physical on-site inspections.
          </p>
        </div>
      </div>
    </div>
  );
};
