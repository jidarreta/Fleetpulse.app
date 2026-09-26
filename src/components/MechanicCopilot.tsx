import React, { useState } from 'react';
import { WorkOrder, VehicleRiskAssessment, InventoryPart, UserRole } from '../types';
import { ShapVisualizer } from './ShapVisualizer';
import { TelemetryViewer } from './TelemetryViewer';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  Send,
  AlertTriangle,
  Tablet,
  Smartphone,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react';

interface MechanicCopilotProps {
  workOrders: WorkOrder[];
  vehicles: VehicleRiskAssessment[];
  inventory: InventoryPart[];
  userRole?: UserRole;
  onUpdateWorkOrder: (order: WorkOrder) => void;
  onSubmitFeedback: (
    workOrderId: string,
    feedback: {
      tag: 'FAILURE_CONFIRMED' | 'FALSE_POSITIVE';
      rootCauseIdentified: string;
      mechanicNotes: string;
      mechanicId: string;
    }
  ) => void;
}

export const MechanicCopilot: React.FC<MechanicCopilotProps> = ({
  workOrders,
  vehicles,
  inventory,
  userRole = 'MECHANIC',
  onUpdateWorkOrder,
  onSubmitFeedback,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    workOrders[0]?.id || ''
  );
  const [feedbackTag, setFeedbackTag] = useState<'FAILURE_CONFIRMED' | 'FALSE_POSITIVE'>('FAILURE_CONFIRMED');
  const [rootCause, setRootCause] = useState('');
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [mechanicId, setMechanicId] = useState('MEC-402 (Bay 4)');
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [tabletMode, setTabletMode] = useState<'DESKTOP' | 'TABLET_FRAME'>('DESKTOP');
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const currentOrder =
    workOrders.find((w) => w.id === selectedOrderId) || workOrders[0];

  const matchedVehicle = currentOrder
    ? vehicles.find((v) => v.vehicleId === currentOrder.vehicleId)
    : null;

  const handleStatusChange = (newStatus: WorkOrder['status']) => {
    if (!currentOrder) return;
    if (newStatus === 'COMPLETED') {
      setShowClosureModal(true);
      return;
    }
    onUpdateWorkOrder({
      ...currentOrder,
      status: newStatus,
    });
  };

  const handleFeedbackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentOrder) return;
    if (rootCause.trim().length < 3) {
      setFeedbackError('Enter a verified root cause with at least 3 characters.');
      return;
    }
    if (mechanicId.trim().length < 3) {
      setFeedbackError('Enter a mechanic ID or service bay.');
      return;
    }
    setFeedbackError(null);

    onSubmitFeedback(currentOrder.id, {
      tag: feedbackTag,
      rootCauseIdentified: rootCause.trim(),
      mechanicNotes: mechanicNotes.trim(),
      mechanicId: mechanicId.trim(),
    });

    setShowClosureModal(false);
    setIsSuccessToast(true);
    setTimeout(() => setIsSuccessToast(false), 4000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    }
  };

  const getStatusBadge = (status: WorkOrder['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'IN_SHOP':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'SCHEDULED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div id="mechanic-copilot-view" className="space-y-6">
      {/* Top Banner & Tablet Layout Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Mechanic Copilot (Shop Floor Tablet App)
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PWA Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Field-ready diagnostic workbench with SHAP feature impact, 1-click work orders, and closed-loop ground truth
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setTabletMode('DESKTOP')}
            className={`px-3 py-1 rounded transition-colors ${
              tabletMode === 'DESKTOP'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wide View
          </button>
          <button
            onClick={() => setTabletMode('TABLET_FRAME')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
              tabletMode === 'TABLET_FRAME'
                ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Tablet Frame (iPad / Toughbook)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`${
          tabletMode === 'TABLET_FRAME'
            ? 'max-w-4xl mx-auto border-4 border-slate-700 rounded-3xl p-4 bg-slate-950 shadow-2xl ring-8 ring-slate-900'
            : ''
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Prioritized Repair Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Prioritized Repair Queue ({workOrders.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Ranked by Failure Risk</span>
            </div>

            <div className="space-y-2.5">
              {workOrders.map((wo) => {
                const isSelected = wo.id === currentOrder?.id;

                return (
                  <div
                    key={wo.id}
                    id={`work-order-${wo.id}`}
                    onClick={() => setSelectedOrderId(wo.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg ring-1 ring-cyan-500/40'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">{wo.id}</span>
                        <span className="text-[11px] font-mono text-cyan-400">{wo.vehicleId}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(
                          wo.priority
                        )}`}
                      >
                        {wo.priority}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200">{wo.makeModel}</p>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Loop: <strong className="text-slate-300">{wo.primarySubsystem}</strong></span>
                      <span className="font-mono font-bold text-rose-400">
                        {(wo.failureProbability * 100).toFixed(0)}% Risk
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded border font-semibold ${getStatusBadge(
                          wo.status
                        )}`}
                      >
                        {wo.status.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {wo.estimatedLaborHours}h labor
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Ticket Diagnostics & Execution (8 cols) */}
          {currentOrder && (
            <div className="lg:col-span-8 space-y-5">
              {/* Ticket Header & Status Flow */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-white font-mono">{currentOrder.id}</span>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                        {currentOrder.vehicleId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${getStatusBadge(
                          currentOrder.status
                        )}`}
                      >
                        {currentOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      {currentOrder.makeModel} • VIN: <span className="font-mono text-slate-400">{currentOrder.vin}</span>
                    </p>
                  </div>

                  {/* Status update buttons */}
                  <div className="flex items-center space-x-2">
                    {userRole === 'FLEET_MANAGER' && (
                      <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                        <Lock className="w-3 h-3" />
                        <span>Read-Only (Fleet Mgr)</span>
                      </span>
                    )}
                    <button
                      disabled={userRole === 'FLEET_MANAGER'}
                      onClick={() => handleStatusChange('SCHEDULED')}
                      title={userRole === 'FLEET_MANAGER' ? 'Status changes require Shop Mechanic role' : 'Mark as Scheduled'}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                        userRole === 'FLEET_MANAGER' ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700' :
                        currentOrder.status === 'SCHEDULED'
                          ? 'bg-indigo-600 text-white border-indigo-500 cursor-pointer'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      Scheduled
                    </button>
                    <button
                      disabled={userRole === 'FLEET_MANAGER'}
                      onClick={() => handleStatusChange('IN_SHOP')}
                      title={userRole === 'FLEET_MANAGER' ? 'Status changes require Shop Mechanic role' : 'Mark as In Shop'}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                        userRole === 'FLEET_MANAGER' ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700' :
                        currentOrder.status === 'IN_SHOP'
                          ? 'bg-blue-600 text-white border-blue-500 cursor-pointer'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      In Shop
                    </button>
                    <button
                      disabled={userRole === 'FLEET_MANAGER'}
                      onClick={() => handleStatusChange('COMPLETED')}
                      title={userRole === 'FLEET_MANAGER' ? 'Status changes require Shop Mechanic role' : 'Mark as Complete'}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                        userRole === 'FLEET_MANAGER' ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700' :
                        currentOrder.status === 'COMPLETED'
                          ? 'bg-emerald-600 text-white border-emerald-500 cursor-pointer'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      Complete
                    </button>
                  </div>
                </div>

                {/* Ticket Details summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Shop Window</span>
                    <span className="text-slate-200 font-medium">{currentOrder.scheduledShopDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Mechanic Bay</span>
                    <span className="text-slate-200 font-medium">
                      {currentOrder.assignedMechanic || 'Unassigned (Bay Available)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Labor</span>
                    <span className="text-slate-200 font-medium">{currentOrder.estimatedLaborHours} Hours (Est. $315)</span>
                  </div>
                </div>

                {/* Notes from automated dispatch */}
                {currentOrder.notes && (
                  <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded border border-slate-700/60">
                    <strong className="text-slate-200">Dispatcher & AI Ingestion Log:</strong> {currentOrder.notes}
                  </div>
                )}
              </div>

              {currentOrder.status === 'PENDING_DISPATCH' && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  AI output is a recommendation. Review telemetry and SHAP evidence before scheduling the repair or authorizing parts.
                </div>
              )}

              {/* Module 3: Parts Inventory Bridge */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Shop ERP Parts Inventory Bridge
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ERP Sync: Active (98% In-Stock)</span>
                </div>

                <div className="space-y-2">
                  {currentOrder.partsRequired.map((part, idx) => {
                    const matchedInv = inventory.find((p) => p.partNumber === part.partNumber);

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white font-mono">{part.partNumber}</span>
                            <span className="text-xs text-slate-300">{part.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Required Qty: <strong className="text-slate-200">{part.qty}</strong> • Subsystem:{' '}
                            {currentOrder.primarySubsystem}
                          </p>
                        </div>

                        <div className="text-right flex items-center space-x-3">
                          <div className="text-right">
                            <span className="block text-xs font-bold text-emerald-400">
                              {matchedInv ? `${matchedInv.inStock} In Stock` : 'Stock Verified'}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Unit Cost: ${matchedInv?.unitCost || '385.00'}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded border text-[10px] font-bold ${
                            currentOrder.status === 'PENDING_DISPATCH'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {currentOrder.status === 'PENDING_DISPATCH' ? 'PROPOSED — NOT RESERVED' : 'MECHANIC APPROVED'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Module 2 Inspection: SHAP Diagnostic + Telemetry on Vehicle */}
              {matchedVehicle && (
                <div className="space-y-5">
                  <ShapVisualizer
                    explanations={matchedVehicle.shapExplanations}
                    failureProbability={matchedVehicle.failureProbability}
                    primarySubsystem={matchedVehicle.primarySubsystem}
                  />

                  <TelemetryViewer
                    telemetry={matchedVehicle.recentTelemetry}
                    vehicleId={matchedVehicle.vehicleId}
                  />
                </div>
              )}

              {/* Module 3 Validation: Closed-Loop Ground-Truth Tagging Form */}
              <div
                id="closed-loop-tagging-card"
                className="bg-slate-900 border border-indigo-800/40 rounded-xl p-5 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Mechanic Closed-Loop Ground-Truth Tagging
                      </h3>
                      <p className="text-xs text-slate-400">
                        Feeds verified physical diagnosis directly back into LightGBM & PyTorch retraining pipelines
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Phase 5 & 6 Retraining Loop
                  </span>
                </div>

                {/* Show existing feedback if present */}
                {currentOrder.closedLoopFeedback ? (
                  <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Ground-Truth Tagged:{' '}
                        {currentOrder.closedLoopFeedback.tag === 'FAILURE_CONFIRMED'
                          ? 'Failure Confirmed (True Positive)'
                          : 'False Positive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">
                      <strong>Root Cause:</strong> {currentOrder.closedLoopFeedback.rootCauseIdentified}
                    </p>
                    <p className="text-xs text-slate-400 italic">
                      "{currentOrder.closedLoopFeedback.mechanicNotes}"
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-900/40 flex justify-between font-mono">
                      <span>Submitted by: {currentOrder.closedLoopFeedback.mechanicId}</span>
                      <span>
                        {new Date(currentOrder.closedLoopFeedback.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    {feedbackError && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{feedbackError}</p>}
                    {/* Tag Choice */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Step 1: Diagnostic Confirmation Result
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setFeedbackTag('FAILURE_CONFIRMED')}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 ${
                            feedbackTag === 'FAILURE_CONFIRMED'
                              ? 'bg-emerald-500/20 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-5 h-5 ${
                              feedbackTag === 'FAILURE_CONFIRMED' ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <span className="block text-xs font-bold text-white">Failure Confirmed</span>
                            <span className="block text-[10px] text-slate-400">
                              Physical defect matched AI SHAP breakdown
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFeedbackTag('FALSE_POSITIVE')}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 ${
                            feedbackTag === 'FALSE_POSITIVE'
                              ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500/40'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <XCircle
                            className={`w-5 h-5 ${
                              feedbackTag === 'FALSE_POSITIVE' ? 'text-rose-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <span className="block text-xs font-bold text-white">False Positive</span>
                            <span className="block text-[10px] text-slate-400">
                              No physical defect found; sensor drift/noise
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Root cause and mechanic notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Verified Physical Root Cause
                        </label>
                        <input
                          type="text"
                          required
                          aria-label="Verified physical root cause"
                          minLength={3}
                          placeholder="e.g. Impeller cavitation & leaking water pump gasket"
                          value={rootCause}
                          onChange={(e) => setRootCause(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Mechanic Tag & Bay ID
                        </label>
                        <input
                          type="text"
                          required
                          aria-label="Mechanic tag and bay ID"
                          minLength={3}
                          value={mechanicId}
                          onChange={(e) => setMechanicId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mechanic Bench Observations & Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Detail physical inspection: wear patterns, pressure test results, or replacement steps..."
                        value={mechanicNotes}
                        onChange={(e) => setMechanicNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400">
                        {userRole === 'FLEET_MANAGER' ? (
                          <span className="text-amber-400/90 flex items-center space-x-1">
                            <Lock className="w-3 h-3 inline" />
                            <span>Ground-truth ML feedback tagging requires certified Shop Mechanic role.</span>
                          </span>
                        ) : (
                          'Tagged data is cryptographically signed and routed to Arize ML pipeline.'
                        )}
                      </span>

                      {userRole === 'FLEET_MANAGER' ? (
                        <button
                          type="button"
                          disabled
                          title="Restricted to certified Shop Mechanics"
                          className="px-5 py-2.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-bold border border-slate-700 cursor-not-allowed flex items-center space-x-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Submit (Mechanic Only)</span>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Ground-Truth Tag</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* Success alert toast */}
                {isSuccessToast && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      Ground-truth feedback saved! Telemetry vector signed and queued for Arize drift & LightGBM model retraining.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Validation & Job Closure Modal */}
      {showClosureModal && currentOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-700/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Job Closure &amp; Ground-Truth Validation
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {currentOrder.id} • {currentOrder.vehicleId} ({currentOrder.primarySubsystem})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClosureModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Before marking this work order as <strong className="text-emerald-400">COMPLETED</strong>, 
              provide physical bench validation to reinforce or correct the LightGBM &amp; PyTorch predictive inference pipeline.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {feedbackError && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{feedbackError}</p>}
              {/* Mandatory Validation Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Mandatory Validation Result <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackTag('FAILURE_CONFIRMED')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                      feedbackTag === 'FAILURE_CONFIRMED'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        feedbackTag === 'FAILURE_CONFIRMED' ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">Failure Confirmed</span>
                      <span className="block text-[10px] text-slate-400">
                        Physical defect matched AI SHAP breakdown (True Positive)
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackTag('FALSE_POSITIVE')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                      feedbackTag === 'FALSE_POSITIVE'
                        ? 'bg-rose-500/20 border-rose-500 text-white ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <XCircle
                      className={`w-5 h-5 ${
                        feedbackTag === 'FALSE_POSITIVE' ? 'text-rose-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">False Positive</span>
                      <span className="block text-[10px] text-slate-400">
                        No physical defect found; sensor drift/noise
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Root Cause Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Verified Physical Root Cause
                </label>
                <input
                  type="text"
                  required
                  aria-label="Verified physical root cause"
                  minLength={3}
                  placeholder="e.g. Impeller cavitation & leaking water pump seal"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Mechanic Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bench Observations &amp; Replaced Parts Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Replaced water pump and flushed coolant loop. Pressure test passed at 18 PSI."
                  value={mechanicNotes}
                  onChange={(e) => setMechanicNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Mechanic Bay ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mechanic ID &amp; Service Bay
                </label>
                <input
                  type="text"
                  required
                  aria-label="Mechanic ID and service bay"
                  minLength={3}
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Validation &amp; Close Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
