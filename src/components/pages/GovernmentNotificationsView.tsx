import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Building2,
  Loader2,
  Video,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../common/Sidebar';

interface GovernmentNotificationsViewProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const GovernmentNotificationsView: React.FC<GovernmentNotificationsViewProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadNotifs = (isInitial = false) => {
      if (isInitial) setLoading(true);
      api.getGovernmentNotifications()
        .then((data) => {
          if (!isMounted) return;
          setNotifications(Array.isArray(data) ? data : []);
          if (isInitial) setLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load government notifications:', err);
          if (isMounted && isInitial) setLoading(false);
        });
    };

    loadNotifs(true);

    // Controlled 30-second background polling without page refresh
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
            <span>Central Monitoring Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Official Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity log of new centre video submissions, AI automated discrepancy triggers, and centre responses.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading notifications from MySQL...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500">You are completely up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isSub = n.type === 'NEW_SUBMISSION';
            const isAI = n.type === 'AI_INFERENCE_COMPLETE';
            return (
              <div
                key={n.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all flex items-start gap-4"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isAI ? 'bg-rose-50 text-rose-600' : isSub ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {isAI ? <AlertTriangle className="w-5 h-5" /> : isSub ? <Video className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400">{n.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {isAI || isSub ? (
                      <button
                        onClick={() => onNavigate('ai_analysis', n.entityId)}
                        className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Open AI Video Analysis</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('notices')}
                        className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>View Notice Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
