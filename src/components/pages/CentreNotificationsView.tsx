import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Building2,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';

export const CentreNotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadNotifs = (isInitial = false) => {
      if (isInitial) setLoading(true);
      api.getCentreNotifications()
        .then((data) => {
          if (!isMounted) return;
          setNotifications(Array.isArray(data) ? data : []);
          if (isInitial) setLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load notifications:', err);
          if (isMounted && isInitial) setLoading(false);
        });
    };

    loadNotifs(true);

    const interval = setInterval(() => {
      loadNotifs(false);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Communications Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Official Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Regulatory notices, submission receipts, and verification acknowledgments from the Government Monitoring Portal.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No New Notifications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are all caught up! Official regulatory notifications or submission updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-4 hover:border-indigo-200 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.severity === 'CRITICAL' || n.category === 'ALERT'
                    ? 'bg-rose-100 text-rose-600'
                    : n.severity === 'WARNING'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {n.severity === 'CRITICAL' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{n.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-600">
                    {n.category || 'NOTICE'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
