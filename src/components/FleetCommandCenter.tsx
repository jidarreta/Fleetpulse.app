import React, { useState } from 'react';
import { VehicleRiskAssessment, WorkOrder, UserRole } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { ShapVisualizer } from './ShapVisualizer';
import { TelemetryViewer } from './TelemetryViewer';
import {
  ShieldAlert,
  DollarSign,
  TrendingDown,
  Wrench,
  Search,
  Filter,
  ArrowRight,
  Flame,
  Zap,
  Cog,
  CheckCircle,
  Clock,
  CarFront,
  ArrowUpRight,
  Layers,
  Lock,
  UserCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Maximize2,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface FleetCommandCenterProps {
  vehicles: VehicleRiskAssessment[];
  workOrders: WorkOrder[];
  selectedVehicleId: string;
  userRole?: UserRole;
  onSelectVehicle: (id: string) => void;
  onDispatchWorkOrder: (vehicleId: string) => void;
  onSwitchToMechanic: () => void;
}

export const FleetCommandCenter: React.FC<FleetCommandCenterProps> = ({
  vehicles,
  workOrders,
  selectedVehicleId,
  userRole = 'FLEET_MANAGER',
  onSelectVehicle,
  onDispatchWorkOrder,
  onSwitchToMechanic,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sorting state for Live Risk Grid
  const [sortBy, setSortBy] = useState<'failureProbability' | 'estimatedDaysToFailure' | 'vehicleId'>('failureProbability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) || vehicles[0];

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubsystem =
      selectedSubsystem === 'ALL' || v.primarySubsystem === selectedSubsystem;

    return matchesSearch && matchesSubsystem;
  });

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'failureProbability') {
      cmp = a.failureProbability - b.failureProbability;
    } else if (sortBy === 'estimatedDaysToFailure') {
      cmp = a.estimatedDaysToFailure - b.estimatedDaysToFailure;
    } else {
      cmp = a.vehicleId.localeCompare(b.vehicleId);
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (column: 'failureProbability' | 'estimatedDaysToFailure' | 'vehicleId') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Financial & SLA metrics calculation
  const criticalCount = vehicles.filter((v) => v.failureProbability >= 0.8 || v.riskLevel === 'CRITICAL').length;
  const highCount = vehicles.filter((v) => v.riskLevel === 'HIGH' && v.failureProbability < 0.8).length;
  const averageLeadTimeToFailure = (
    vehicles.reduce((sum, v) => sum + v.estimatedDaysToFailure, 0) / (vehicles.length || 1)
  ).toFixed(1);

  // Unplanned breakdown costs: ~$3,500 towing/repairs + $500/hr SLA delay (avg 6 hours = $3,000) = ~$6,500 per critical incident
  const estimatedCostAvoidance = (criticalCount * 6500 + highCount * 2800).toLocaleString();

  const getSubsystemBadgeColor = (subsystem: string) => {
    switch (subsystem) {
      case 'Cooling System':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Electrical':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Transmission':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'Engine':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/20';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div id="fleet-command-center" className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Active Fleet */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Active Fleet
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <CarFront className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{vehicles.length}</span>
            <span className="text-xs text-cyan-400 font-medium font-mono">100% CAN Telemetry Online</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Connected heavy-duty class 8 assets reporting at 10 Hz
          </p>
        </div>

        {/* KPI 2: Vehicles at Critical Risk (≥80%) */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vehicles at Critical Risk (≥80%)
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">{criticalCount}</span>
            <span className="text-xs text-rose-300 font-medium">({highCount} high risk)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Imminent roadside breakdown risk (&lt;72 hrs lead time)
          </p>
        </div>

        {/* KPI 3: Average Fleet Lead Time to Failure */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Average Fleet Lead Time to Failure
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{averageLeadTimeToFailure}</span>
            <span className="text-xs text-amber-400 font-medium">Days Lead Time</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Predictive maintenance lead time prior to catastrophic stall
          </p>
        </div>

        {/* KPI 4: Scheduled Maintenance Savings ($) */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scheduled Maintenance Savings ($)
            </span>
            {userRole === 'MECHANIC' ? (
              <div className="p-2 rounded-lg bg-slate-800 text-slate-500 border border-slate-700" title="Financial metrics restricted to Fleet Manager">
                <Lock className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <DollarSign className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            {userRole === 'MECHANIC' ? (
              <>
                <span className="text-2xl font-bold text-slate-400 font-mono">Restricted</span>
                <span className="text-xs text-amber-400/80 font-medium">Ops Only</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">${estimatedCostAvoidance}</span>
                <span className="text-xs text-slate-400">est. net savings</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {userRole === 'MECHANIC'
              ? 'Contractual SLA & roadside towing cost metrics restricted to Operations.'
              : 'Calculated vs. $6,500 towing & late load SLA penalties'}
          </p>
        </div>
      </div>

      {/* Row 1: Interactive Geo-Spatial Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Real-Time Fleet Geo-Spatial Health Map
            </h2>
            <p className="text-xs text-slate-400">
              Live location tracking with color-coded ML failure risk states across freight corridors
            </p>
          </div>
          <button
            onClick={() => setShowSwapModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <CarFront className="w-3.5 h-3.5" />
            <span>Simulate Proactive Route Swap</span>
          </button>
        </div>

        <InteractiveMap
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={(id) => {
            onSelectVehicle(id);
          }}
        />
      </div>

      {/* Row 2: Live Risk Grid & Subsystem Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Risk Grid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Live Risk Grid
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {sortedVehicles.length} of {vehicles.length} Units
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sortable table ranking assets by failure probability and estimated lead time
              </p>
            </div>

            {/* Search and Subsystem filter */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vehicle, VIN, driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
                />
              </div>

              <select
                value={selectedSubsystem}
                onChange={(e) => setSelectedSubsystem(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Subsystems</option>
                <option value="Cooling System">Cooling System</option>
                <option value="Electrical">Electrical</option>
                <option value="Transmission">Transmission</option>
                <option value="Engine">Engine</option>
              </select>
            </div>
          </div>

          {/* Table Data Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 font-semibold select-none">
                  <th
                    onClick={() => toggleSort('vehicleId')}
                    className="pb-2.5 pl-2 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Asset ID</span>
                      {sortBy === 'vehicleId' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th className="pb-2.5">VIN</th>
                  <th className="pb-2.5">Vehicle Model</th>
                  <th className="pb-2.5">Primary Subsystem Risk</th>
                  <th
                    onClick={() => toggleSort('failureProbability')}
                    className="pb-2.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Failure Probability</span>
                      {sortBy === 'failureProbability' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('estimatedDaysToFailure')}
                    className="pb-2.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Days to Failure</span>
                      {sortBy === 'estimatedDaysToFailure' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th className="pb-2.5 pr-2 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedVehicles.map((v) => {
                  const isSelected = v.vehicleId === selectedVehicleId;

                  return (
                    <tr
                      key={v.vehicleId}
                      id={`vehicle-row-${v.vehicleId}`}
                      onClick={() => onSelectVehicle(v.vehicleId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-800/80 ring-1 ring-cyan-500/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* 1. Asset ID */}
                      <td className="py-3 pl-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-white text-xs">
                            {v.vehicleId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getRiskBadge(
                              v.riskLevel
                            )}`}
                          >
                            {v.riskLevel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Driver: {v.driverName}
                        </div>
                      </td>

                      {/* 2. VIN */}
                      <td className="py-3 font-mono text-[11px] text-slate-400">
                        {v.vin}
                      </td>

                      {/* 3. Vehicle Model */}
                      <td className="py-3">
                        <span className="text-xs font-medium text-slate-200 block">
                          {v.makeModel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {v.odometerMiles?.toLocaleString()} mi
                        </span>
                      </td>

                      {/* 4. Primary Subsystem Risk */}
                      <td className="py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getSubsystemBadgeColor(
                            v.primarySubsystem
                          )}`}
                        >
                          {v.primarySubsystem}
                        </span>
                      </td>

                      {/* 5. Failure Probability (0-100%) */}
                      <td className="py-3 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white w-10">
                            {(v.failureProbability * 100).toFixed(0)}%
                          </span>
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                v.failureProbability >= 0.8
                                  ? 'bg-rose-500'
                                  : v.failureProbability >= 0.6
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${v.failureProbability * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 6. Days to Failure */}
                      <td className="py-3 font-mono">
                        <span
                          className={`font-bold text-xs ${
                            v.estimatedDaysToFailure <= 3
                              ? 'text-rose-400'
                              : v.estimatedDaysToFailure <= 7
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {v.estimatedDaysToFailure} {v.estimatedDaysToFailure === 1 ? 'day' : 'days'}
                        </span>
                      </td>

                      {/* 7. Quick Action button */}
                      <td className="py-3 pr-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          disabled={userRole === 'MECHANIC' || v.failureProbability < 0.8 || !!v.activeWorkOrderId}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVehicle(v.vehicleId);
                            setIsDrawerOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium transition-colors border border-slate-700 cursor-pointer"
                          title="Open Diagnostic Drawer (Explainable AI View)"
                        >
                          Diagnostic
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVehicle(v.vehicleId);
                            onDispatchWorkOrder(v.vehicleId);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-white text-[11px] font-medium transition-colors ${
                            userRole === 'MECHANIC' || v.failureProbability < 0.8 || v.activeWorkOrderId
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-900/50 cursor-pointer'
                          }`}
                          title={v.failureProbability < 0.8 ? 'Actionable recommendations require at least 80% confidence' : 'Send recommendation for mechanic verification'}
                        >
                          {v.activeWorkOrderId ? 'In Review' : v.failureProbability < 0.8 ? 'Below 80%' : 'Recommend Repair'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Subsystem Risk Heatmaps & Focus Detail (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Vehicle Focus Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-white font-mono">
                    {selectedVehicle.vehicleId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRiskBadge(
                      selectedVehicle.riskLevel
                    )}`}
                  >
                    {selectedVehicle.riskLevel} ALERT
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{selectedVehicle.makeModel} ({selectedVehicle.year})</p>
                <p className="text-[11px] text-slate-400 font-mono">VIN: {selectedVehicle.vin}</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {(selectedVehicle.failureProbability * 100).toFixed(0)}%
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                  Breakdown Risk
                </span>
              </div>
            </div>

            {/* Subsystem Heatmap Bars */}
            <div className="mt-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Subsystem Loop Risk Breakdown
              </span>

              {/* Thermal / Cooling */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Thermal / Cooling Loop</span>
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    {selectedVehicle.subsystems.cooling}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${selectedVehicle.subsystems.cooling}%` }}
                  />
                </div>
              </div>

              {/* Battery / Electrical */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Battery & Electrical Bus</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {selectedVehicle.subsystems.electrical}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${selectedVehicle.subsystems.electrical}%` }}
                  />
                </div>
              </div>

              {/* Transmission */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <Cog className="w-3.5 h-3.5 text-purple-400" />
                    <span>Transmission & Clutch Actuator</span>
                  </span>
                  <span className="font-mono font-bold text-purple-400">
                    {selectedVehicle.subsystems.transmission}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${selectedVehicle.subsystems.transmission}%` }}
                  />
                </div>
              </div>

              {/* Engine */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-slate-300">
                    <CarFront className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Engine & Injection Block</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {selectedVehicle.subsystems.engine}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${selectedVehicle.subsystems.engine}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open Diagnostic Drawer</span>
              </button>

              {userRole === 'MECHANIC' ? (
                <button
                  disabled
                  title="Dispatch authorization restricted to Fleet Managers and Administrators"
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800/80 text-slate-500 text-xs font-semibold border border-slate-700/60 cursor-not-allowed flex items-center justify-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dispatch (Ops Only)</span>
                </button>
              ) : (
                <button
                  disabled={selectedVehicle.failureProbability < 0.8 || !!selectedVehicle.activeWorkOrderId}
                  onClick={() => onDispatchWorkOrder(selectedVehicle.vehicleId)}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{selectedVehicle.failureProbability < 0.8 ? 'Below 80% Confidence' : selectedVehicle.activeWorkOrderId ? 'Under Mechanic Review' : 'Recommend Repair'}</span>
                </button>
              )}

              <button
                onClick={onSwitchToMechanic}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1 cursor-pointer"
              >
                <span>Mechanic Copilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live Telemetry & SHAP Diagnostic Workbench for Selected Vehicle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShapVisualizer
          explanations={selectedVehicle.shapExplanations}
          failureProbability={selectedVehicle.failureProbability}
          primarySubsystem={selectedVehicle.primarySubsystem}
        />
        <TelemetryViewer
          telemetry={selectedVehicle.recentTelemetry}
          vehicleId={selectedVehicle.vehicleId}
        />
      </div>

      {/* Vehicle Diagnostic Drawer (Explainable AI View Slide-Over) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-3xl h-full flex flex-col shadow-2xl overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-extrabold text-white font-mono">
                    {selectedVehicle.vehicleId}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${getRiskBadge(
                      selectedVehicle.riskLevel
                    )}`}
                  >
                    {selectedVehicle.riskLevel} ALERT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {(selectedVehicle.failureProbability * 100).toFixed(0)}% Failure Risk
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mt-1">
                  {selectedVehicle.makeModel} — Driver: {selectedVehicle.driverName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">VIN: {selectedVehicle.vin} | Odometer: {selectedVehicle.odometerMiles?.toLocaleString()} mi</p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Click Dispatch inside drawer */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  Automated Shop Work Order Bridge
                </span>
                <p className="text-xs text-slate-500">
                  Target: {selectedVehicle.primarySubsystem} | Est. Lead Time: {selectedVehicle.estimatedDaysToFailure} days
                </p>
              </div>
              <button
                disabled={selectedVehicle.failureProbability < 0.8 || !!selectedVehicle.activeWorkOrderId}
                onClick={() => {
                  onDispatchWorkOrder(selectedVehicle.vehicleId);
                  setIsDrawerOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>{selectedVehicle.failureProbability < 0.8 ? 'Below 80% Confidence' : selectedVehicle.activeWorkOrderId ? 'Under Mechanic Review' : 'Recommend Repair'}</span>
              </button>
            </div>

            {/* Recharts High-Frame Telemetry Corridor */}
            <TelemetryViewer
              telemetry={selectedVehicle.recentTelemetry}
              vehicleId={selectedVehicle.vehicleId}
            />

            {/* SHAP Feature Contribution Bar Chart */}
            <ShapVisualizer
              explanations={selectedVehicle.shapExplanations}
              failureProbability={selectedVehicle.failureProbability}
              primarySubsystem={selectedVehicle.primarySubsystem}
            />
          </div>
        </div>
      )}

      {/* Preventative Vehicle Swap Simulation Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <CarFront className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Simulate Proactive Route Vehicle Swap</h3>
              </div>
              <button
                onClick={() => setShowSwapModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When a vehicle on an active high-value route hits critical failure risk, the dispatch engine
              locates the closest healthy standby asset to prevent roadside cargo stranding.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">At-Risk Vehicle:</span>
                <span className="text-rose-400 font-mono font-bold">
                  {selectedVehicle.vehicleId} ({selectedVehicle.makeModel})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Load & Route:</span>
                <span className="text-slate-200">{selectedVehicle.currentRoute}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Optimal Standby Replacement:</span>
                <span className="text-emerald-400 font-mono font-bold">FP-512 (Ford F-750)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Depot Intercept Point:</span>
                <span className="text-slate-200">Gary, IN Logistics Hub (Bay 3)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Delivery SLA Impact:</span>
                <span className="text-cyan-400 font-bold">+28 mins (vs. +6.5h breakdown)</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSwapModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDispatchWorkOrder(selectedVehicle.vehicleId);
                  setShowSwapModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
              >
                Execute Swap & Create Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
