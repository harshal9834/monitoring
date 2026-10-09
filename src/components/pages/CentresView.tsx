import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Video,
  ChevronRight,
  ShieldCheck,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { TrainingCentre, CentreStatus } from '../../types';
import { NavTab } from '../common/Sidebar';

interface CentresViewProps {
  onSelectCentre: (centreId: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const CentresView: React.FC<CentresViewProps> = ({ onSelectCentre, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Centre Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [centreType, setCentreType] = useState('PMKVY Center of Excellence');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [computers, setComputers] = useState(20);
  const [workbenches, setWorkbenches] = useState(5);
  const [machines, setMachines] = useState(3);
  const [chairs, setChairs] = useState(40);

  const centres = appState.centres;

  const filteredCentres = centres.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateCentreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    appState.addCentre({
      name,
      code,
      address: `${district}, ${state}`,
      district,
      state,
      centreType,
      contactPerson,
      contactNumber,
      email,
      status: 'ACTIVE',
      approvedTraineeCapacity: Number(capacity),
      approvedInventory: {
        computers: Number(computers),
        workbenches: Number(workbenches),
        machines: Number(machines),
        chairs: Number(chairs),
        cctvCameras: 2,
      },
      cameraIds: [`cam_${Date.now()}_main`],
      lastInspectionDate: new Date().toISOString().split('T')[0],
      nextInspectionDate: '2026-11-30',
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Accredited Skill Providers Registry</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Training Centre Master Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain authorized trainee capacity, sanctioned machinery inventory, and RTSP stream profiles
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Centre</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by centre name, code (e.g. MH-PUN), or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Compliance Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs"
          >
            <option value="ALL">All Centres</option>
            <option value="ACTIVE">Active (Compliant)</option>
            <option value="FLAGGED">Flagged (Variance)</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
        </div>
      </div>

      {/* Centre Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCentres.map((centre) => {
          const isCompliant = centre.complianceScore >= 85;
          const isFlagged = centre.complianceScore >= 70 && centre.complianceScore < 85;

          return (
            <div
              key={centre.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {centre.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isCompliant
                        ? 'bg-emerald-100 text-emerald-800'
                        : isFlagged
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {centre.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{centre.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{centre.address}</p>
                </div>

                {/* Score bar */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Compliance Index:</span>
                    <span className="font-bold text-slate-900">{centre.complianceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCompliant ? 'bg-emerald-500' : isFlagged ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${centre.complianceScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>Attendance: {centre.attendanceComplianceRate}%</span>
                    <span>Infra: {centre.infrastructureComplianceRate}%</span>
                    <span>Actions: {centre.actionComplianceRate}%</span>
                  </div>
                </div>

                {/* Approved Inventory Matrix */}
                <div className="text-xs space-y-1 text-slate-600">
                  <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider block">
                    Approved Mandatory Sanctions:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    <div>
                      Capacity: <strong>{centre.approvedTraineeCapacity} Trainees</strong>
                    </div>
                    <div>
                      Computers: <strong>{centre.approvedInventory.computers} Units</strong>
                    </div>
                    <div>
                      Workbenches: <strong>{centre.approvedInventory.workbenches} Units</strong>
                    </div>
                    <div>
                      Machines: <strong>{centre.approvedInventory.machines} Units</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigate('video_monitoring')}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>View Live</span>
                </button>

                <button
                  onClick={() => onSelectCentre(centre.id)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Centre Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register New Centre Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Accredit & Register Training Centre
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCentreSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Centre Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharishi Skill Academy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Accreditation Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-NDL-TC-0991"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nagpur"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">
                  Sanctioned Infrastructure & Capacity:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Trainee Capacity:</label>
                    <input
                      type="number"
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Computers:</label>
                    <input
                      type="number"
                      required
                      value={computers}
                      onChange={(e) => setComputers(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Workbenches:</label>
                    <input
                      type="number"
                      required
                      value={workbenches}
                      onChange={(e) => setWorkbenches(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Machinery Units:</label>
                    <input
                      type="number"
                      required
                      value={machines}
                      onChange={(e) => setMachines(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save & Register Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
