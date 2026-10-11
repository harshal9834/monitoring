import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
  Building2,
  ShieldAlert,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

interface AIAnalysisCentresListViewProps {
  onSelectCentre: (centreId: string) => void;
}

export const AIAnalysisCentresListView: React.FC<AIAnalysisCentresListViewProps> = ({ onSelectCentre }) => {
  const [centres, setCentres] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchCentres = async () => {
    try {
      setLoading(true);
      const data = await api.getCentres({
        search: searchQuery || undefined,
        status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
        category_id: categoryFilter !== 'ALL' ? categoryFilter : undefined
      });
      setCentres(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load centres for AI Analysis:', err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Analysed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            Processing
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Analysis
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            No Submission
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Government Monitoring Portal • AI Video Analytics Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-600" />
            AI Video & Vision Analytics by Training Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select a verified Training Centre to inspect neural network detections, attendance biometric comparisons, and classroom infrastructure verification.
          </p>
        </div>

        <button
          onClick={fetchCentres}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Centre Code, Name, District..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Centre Statuses</option>
            <option value="ACTIVE">Active Centres</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PROBATION">Probation</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Fetching Training Centres & AI Analysis telemetry from MySQL...</p>
        </div>
      ) : centres.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Training Centres Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            There are currently no training centres matching your filter criteria in the database.
          </p>
          {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Table Layout (Desktop) & Cards (Mobile) */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Centre ID</th>
                  <th className="py-3.5 px-4">Centre Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Latest Submission</th>
                  <th className="py-3.5 px-4">AI Status</th>
                  <th className="py-3.5 px-4 text-center">Issues</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centres.map((c) => {
                  const issueCount = c.issuesCount ?? c.alertsCount ?? 0;
                  const submissionDate = c.latestSubmissionDate || 'No submission yet';
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Centre ID */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {c.code || c.id}
                      </td>

                      {/* Centre Name */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Capacity: {c.approvedTraineeCapacity || 40} Trainees
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {c.categoryName || 'Vocational Training'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-slate-600">
                        <div>{c.district || 'District'}</div>
                        <div className="text-[11px] text-slate-400">{c.state || 'State'}</div>
                      </td>

                      {/* Latest Submission Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{submissionDate}</span>
                        </div>
                      </td>

                      {/* AI Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(c.aiStatus)}
                      </td>

                      {/* Issues Count */}
                      <td className="py-4 px-4 text-center">
                        {issueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            {issueCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">0</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => onSelectCentre(c.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all"
                        >
                          <span>View Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (responsive) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {centres.map((c) => {
              const issueCount = c.issuesCount ?? c.alertsCount ?? 0;
              const submissionDate = c.latestSubmissionDate || 'No submission yet';
              return (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-mono font-bold text-indigo-700">
                        {c.code || c.id}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{c.name}</h4>
                    </div>
                    {getStatusBadge(c.aiStatus)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Category</span>
                      <span className="font-medium text-slate-800">{c.categoryName || 'Vocational'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Location</span>
                      <span className="font-medium text-slate-800">{c.district}, {c.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Latest Submission</span>
                      <span className="font-medium text-slate-800">{submissionDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Issues Flagged</span>
                      <span className={`font-bold ${issueCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCentre(c.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <span>View Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
