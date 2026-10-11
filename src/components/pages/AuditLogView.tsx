import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Filter, User, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { appState } from '../../services/storage';

export const AuditLogView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = appState.currentUser;
  const isCentreRole = currentUser.role === 'CENTRE_ADMIN';
  const assignedCentreId = currentUser.assignedCentres?.[0] || 'tc_001';

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs();
        if (Array.isArray(data)) {
          setLogs(isCentreRole
            ? data.filter((l: any) => l.entityId === assignedCentreId || l.entityId?.startsWith('act_') || l.entityId?.startsWith('att_'))
            : data
          );
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error('Failed to load audit logs from MySQL:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isCentreRole]);

  const filteredLogs = logs.filter((l) => {
    if (entityFilter !== 'ALL' && l.entityType !== entityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        (l.newState && l.newState.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Statutory Compliance Oversight</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Immutable Audit Trail & Forensics Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped record of all AI alert triggers, notice dispatches, evidence uploads, and officer determinations
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-600">Total Audit Records:</span>
          <span className="font-mono bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">
            {logs.length}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name, action tag, or entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Entity Type:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
          >
            <option value="ALL">All Entities</option>
            <option value="ALERT">Alerts</option>
            <option value="ACTION">Actions</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="CENTRE">Centres</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">State Transition / Details</th>
                <th className="py-3 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{log.userName}</span>
                    <span className="text-[10px] uppercase font-mono text-indigo-700 font-semibold">
                      {log.userRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700 block">{log.entityType}</span>
                    <span className="font-mono text-[10px] text-slate-400">{log.entityId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-700 max-w-md">
                      {log.previousState && (
                        <div className="text-[10px] text-slate-400 line-through">
                          Prev: {log.previousState}
                        </div>
                      )}
                      <div className="font-medium text-xs text-slate-800">
                        {log.newState || 'Executed'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    {log.ipAddress || '10.14.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
