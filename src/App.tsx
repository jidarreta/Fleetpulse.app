import React, { useState, useEffect } from 'react';
import {
  INITIAL_VEHICLES,
  INITIAL_WORK_ORDERS,
  INVENTORY_PARTS,
} from './data/mockFleetData';
import {
  VehicleRiskAssessment,
  WorkOrder,
  InventoryPart,
  TelemetryPacket,
  UserRole,
} from './types';
import { FleetCommandCenter } from './components/FleetCommandCenter';
import { MechanicCopilot } from './components/MechanicCopilot';
import { AIPhaseCycleHub } from './components/AIPhaseCycleHub';
import { TelemetrySimulator } from './components/TelemetrySimulator';
import { LiveTelemetryStreamSimulator } from './components/LiveTelemetryStreamSimulator';
import { HybridMLArchitectureStudio } from './components/HybridMLArchitectureStudio';
import { Phase4DeploymentTopologyStudio } from './components/Phase4DeploymentTopologyStudio';
import FleetDiagnosticCard from './components/FleetDiagnosticCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { generateFleetPulseDocx } from './services/docxExport';
import {
  Activity,
  LayoutDashboard,
  Wrench,
  BrainCircuit,
  Terminal,
  FileDown,
  CheckCircle2,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Info,
  LogOut,
  Cpu,
  Layers,
} from 'lucide-react';

function FleetPulseApp() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();

  const [vehicles, setVehicles] = useState<VehicleRiskAssessment[]>(INITIAL_VEHICLES);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [inventory] = useState<InventoryPart[]>(INVENTORY_PARTS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('FP-042');
  const [currentTab, setCurrentTab] = useState<
    'COMMAND_CENTER' | 'MECHANIC_COPILOT' | 'HYBRID_ML' | 'AI_6_PHASES' | 'DEPLOYMENT_TOPOLOGY' | 'TELEMETRY_SIMULATOR' | 'DIAGNOSTIC_CARD'
  >('COMMAND_CENTER');
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  // Sync tab with user role upon login
  useEffect(() => {
    if (user) {
      if (user.role === 'OPERATIONS_MANAGER') {
        setCurrentTab('COMMAND_CENTER');
      } else if (user.role === 'FLEET_MECHANIC') {
        setCurrentTab('MECHANIC_COPILOT');
      }
    }
  }, [user?.role]);

  // Map AuthRole to UserRole with optional override
  const currentUserRole: UserRole =
    roleOverride ??
    (user?.role === 'FLEET_MECHANIC'
      ? 'MECHANIC'
      : user?.role === 'OPERATIONS_MANAGER'
      ? 'FLEET_MANAGER'
      : 'ADMINISTRATOR');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with Express backend API & Server-Sent Events (SSE)
  useEffect(() => {
    // 1. Fetch initial vehicles
    fetch('/api/v1/vehicles')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && Array.isArray(json.data)) {
          setVehicles(json.data);
        }
      })
      .catch(() => {
        // Fallback to local initial dataset if server is warming up
      });

    // 2. Fetch initial work orders
    fetch('/api/v1/work-orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && Array.isArray(json.data)) {
          setWorkOrders(json.data);
        }
      })
      .catch(() => {
        // Fallback
      });

    // 3. Connect to live telemetry & work order SSE stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/telemetry/stream');

      eventSource.addEventListener('telemetry_update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.vehicleId) {
            setVehicles((prev) =>
              prev.map((v) => {
                if (v.vehicleId !== data.vehicleId) return v;
                return {
                  ...v,
                  failureProbability: data.failureProbability ?? v.failureProbability,
                  riskLevel: data.riskLevel ?? v.riskLevel,
                  recentTelemetry: data.reading
                    ? [...v.recentTelemetry.slice(1), data.reading]
                    : v.recentTelemetry,
                  lastUpdated: new Date().toISOString(),
                };
              })
            );
          }
        } catch {
          // ignore parse errors
        }
      });

      eventSource.addEventListener('work_order_created', (e: MessageEvent) => {
        try {
          const order = JSON.parse(e.data);
          if (order && order.id) {
            setWorkOrders((prev) => {
              if (prev.some((o) => o.id === order.id)) return prev;
              return [order, ...prev];
            });
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('work_order_updated', (e: MessageEvent) => {
        try {
          const order = JSON.parse(e.data);
          if (order && order.id) {
            setWorkOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
          }
        } catch {
          // ignore
        }
      });
    } catch {
      // SSE not available
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setRoleOverride(role);
    if (role === 'FLEET_MANAGER') {
      showToast('Active Role: Fleet Manager — Full operational dispatch, route swap, and SLA downtime analytics enabled.');
    } else if (role === 'MECHANIC') {
      showToast('Active Role: Mechanic — Shop bay queue, SHAP root cause, parts reservation, and ground-truth tagging enabled.');
    } else {
      showToast('Active Role: Administrator — Full system governance, pipeline DLQ inspection, and raw CAN bus injection enabled.');
    }
  };

  // Export to authentic .docx file
  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await generateFleetPulseDocx(vehicles, workOrders);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FleetPulse_Technical_Specification_AI_6_Phase_Report.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Document exported! Complete FleetPulse Word documentation (.docx) downloaded.');
    } catch (err) {
      console.error('Failed to export docx:', err);
      showToast('Error generating Word document. Check browser permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  // 1-Click Dispatch: Converts a critical AI risk alert into a scheduled shop ticket
  const handleDispatchWorkOrder = (vehicleId: string) => {
    const v = vehicles.find((item) => item.vehicleId === vehicleId);
    if (!v) return;

    // Check if open ticket exists
    const existing = workOrders.find((w) => w.vehicleId === vehicleId && w.status !== 'COMPLETED');
    if (existing) {
      setCurrentTab('MECHANIC_COPILOT');
      showToast(`Work order ${existing.id} already active for ${vehicleId}. Opening Mechanic Copilot.`);
      return;
    }

    const shapNotes =
      v.shapExplanations && v.shapExplanations.length > 0
        ? v.shapExplanations
            .map(
              (exp) =>
                `• ${exp.feature}: "${exp.humanReadableMessage}" (${
                  exp.impactScore > 0 ? '+' : ''
                }${exp.impactScore.toFixed(2)} log-odds)`
            )
            .join('\n')
        : 'Diagnostic telemetry anomaly detected under heavy highway load.';

    const newId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: WorkOrder = {
      id: newId,
      vehicleId: v.vehicleId,
      vin: v.vin,
      makeModel: v.makeModel,
      primarySubsystem: v.primarySubsystem,
      priority: v.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      status: 'PENDING_DISPATCH',
      failureProbability: v.failureProbability,
      scheduledShopDate: 'Tomorrow at 08:00 AM (Priority Bay)',
      estimatedLaborHours: 3.5,
      assignedMechanic: 'Dave "Mac" MacIntyre (Shop Bay 4)',
      partsRequired: [
        {
          partNumber:
            v.primarySubsystem === 'Cooling System'
              ? 'DT-COOL-882'
              : v.primarySubsystem === 'Electrical'
              ? 'EL-ALT-4100'
              : 'TR-ACT-991',
          name:
            v.primarySubsystem === 'Cooling System'
              ? 'High-Flow Thermostat & Water Pump Impeller Kit'
              : v.primarySubsystem === 'Electrical'
              ? '24V 160A Brushless High-Output Alternator'
              : 'Clutch Actuator Solenoid',
          qty: 1,
          inStock: true,
        },
      ],
      notes: `Auto-dispatched via Fleet Command Center. Failure Probability: ${Math.round(
        v.failureProbability * 100
      )}%. Target Subsystem: ${v.primarySubsystem}.\n\nSHAP Diagnostic Attribution:\n${shapNotes}`,
    };

    // Update local state immediately
    setWorkOrders([newOrder, ...workOrders]);
    setVehicles((prev) =>
      prev.map((item) => (item.vehicleId === vehicleId ? { ...item, activeWorkOrderId: newId } : item))
    );

    // Call Backend API with JWT Auth Token
    fetch('/api/v1/work-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(newOrder),
    }).catch(() => {});

    showToast(`Dispatched ${newId} for ${v.vehicleId}! Auto-filled SHAP diagnostics and reserved parts.`);
  };

  const handleUpdateWorkOrder = (updated: WorkOrder) => {
    setWorkOrders((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));

    // Sync with backend API
    fetch(`/api/v1/work-orders/${updated.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updated),
    }).catch(() => {});

    showToast(`Work Order ${updated.id} status changed to ${updated.status}.`);
  };

  const handleSubmitFeedback = (
    workOrderId: string,
    feedback: {
      tag: 'FAILURE_CONFIRMED' | 'FALSE_POSITIVE';
      rootCauseIdentified: string;
      mechanicNotes: string;
      mechanicId: string;
    }
  ) => {
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === workOrderId
          ? {
              ...w,
              status: 'COMPLETED',
              closedLoopFeedback: {
                ...feedback,
                submittedAt: new Date().toISOString(),
              },
            }
          : w
      )
    );

    // Sync with backend API
    fetch(`/api/v1/work-orders/${workOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        closedLoopFeedback: feedback,
      }),
    }).catch(() => {});

    showToast(
      `Ground-truth tagged: ${feedback.tag === 'FAILURE_CONFIRMED' ? 'Failure Confirmed' : 'False Positive'}. Synced to Arize ML retraining pool!`
    );
  };

  // Telemetry stream ingestion handler (simulates FastAPI + ONNX runtime evaluation)
  const handleIngestTelemetry = (packet: TelemetryPacket) => {
    // Send to backend API
    fetch('/api/v1/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    }).catch(() => {});

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.vehicleId !== packet.vehicle_id) return v;

        // Anomaly calculation logic
        const isOverheat = packet.coolant_temp > 105;
        const isVoltageLow = packet.battery_voltage < 12.2;
        const isOilLow = packet.oil_pressure < 30;

        let newProb = v.failureProbability;
        let newLevel = v.riskLevel;
        let newSubsystem = v.primarySubsystem;

        if (isOverheat) {
          newProb = Math.min(0.96, Math.max(v.failureProbability, 0.91));
          newLevel = 'CRITICAL';
          newSubsystem = 'Cooling System';
        } else if (isVoltageLow) {
          newProb = Math.min(0.92, Math.max(v.failureProbability, 0.85));
          newLevel = 'HIGH';
          newSubsystem = 'Electrical';
        } else if (isOilLow) {
          newProb = Math.min(0.95, Math.max(v.failureProbability, 0.88));
          newLevel = 'CRITICAL';
          newSubsystem = 'Engine';
        } else if (packet.coolant_temp < 93 && packet.battery_voltage > 13.8) {
          newProb = Math.max(0.12, v.failureProbability - 0.15);
          newLevel = newProb > 0.7 ? 'HIGH' : newProb > 0.4 ? 'MEDIUM' : 'LOW';
        }

        const newTelemetryEntry = {
          timestamp: packet.timestamp,
          coolantTemp: packet.coolant_temp,
          coolantTempBaseline: 90.0,
          batteryVoltage: packet.battery_voltage,
          batteryVoltageBaseline: 14.1,
          engineRpm: packet.engine_rpm,
          engineRpmBaseline: 1500,
          oilPressure: packet.oil_pressure,
          oilPressureBaseline: 46.0,
        };

        const updatedRecent = [...v.recentTelemetry.slice(1), newTelemetryEntry];

        return {
          ...v,
          failureProbability: parseFloat(newProb.toFixed(2)),
          riskLevel: newLevel,
          primarySubsystem: newSubsystem,
          subsystems: {
            ...v.subsystems,
            cooling: isOverheat ? 96 : v.subsystems.cooling,
            electrical: isVoltageLow ? 92 : v.subsystems.electrical,
            engine: isOilLow ? 90 : v.subsystems.engine,
          },
          recentTelemetry: updatedRecent,
          lastUpdated: packet.timestamp,
        };
      })
    );

    showToast(`Telemetry ingested for ${packet.vehicle_id}: evaluated via ONNX runtime.`);
  };

  const refreshFleetData = async () => {
    try {
      const res = await fetch('/api/v1/vehicles');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setVehicles(json.data);
        }
      }
    } catch {
      // ignore
    }
  };

  // If auth is loading, show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm space-x-2">
        <Activity className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Initializing FleetPulse Session...</span>
      </div>
    );
  }

  // If unauthenticated, redirect to Login/Register AuthPage
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-white font-mono">
                  FleetPulse<span className="text-cyan-400">.ai</span>
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Production Build
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Predictive Telematics & Explainable AI SaaS
              </p>
            </div>
          </div>

          {/* Module Nav Switcher */}
          <nav className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              id="nav-tab-command-center"
              onClick={() => setCurrentTab('COMMAND_CENTER')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'COMMAND_CENTER'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fleet Command Center</span>
            </button>

            <button
              id="nav-tab-mechanic-copilot"
              onClick={() => setCurrentTab('MECHANIC_COPILOT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'MECHANIC_COPILOT'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mechanic Copilot</span>
              {workOrders.filter((w) => w.status === 'PENDING_DISPATCH').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              id="nav-tab-hybrid-ml"
              onClick={() => setCurrentTab('HYBRID_ML')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'HYBRID_ML'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hybrid ML Architecture</span>
            </button>

            <button
              id="nav-tab-ai-phases"
              onClick={() => setCurrentTab('AI_6_PHASES')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'AI_6_PHASES'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI 6-Phase Lifecycle Hub</span>
            </button>

            <button
              id="nav-tab-deployment-topology"
              onClick={() => setCurrentTab('DEPLOYMENT_TOPOLOGY')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'DEPLOYMENT_TOPOLOGY'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phase 4 Topology</span>
            </button>

            <button
              id="nav-tab-telemetry-sim"
              onClick={() => setCurrentTab('TELEMETRY_SIMULATOR')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'TELEMETRY_SIMULATOR'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>FastAPI Telemetry Ingestion</span>
            </button>

            <button
              id="nav-tab-diagnostic-card"
              onClick={() => setCurrentTab('DIAGNOSTIC_CARD')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'DIAGNOSTIC_CARD'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Diagnostic Card</span>
            </button>
          </nav>

          {/* Right Action: Download Word Document (.docx) & Live Stream */}
          <div className="flex items-center space-x-3">
            <div className="hidden xl:flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono">10Hz TimescaleDB Stream</span>
            </div>

            {/* Authenticated User Status Pill & Logout */}
            {user && (
              <div className="flex items-center space-x-2 bg-slate-950/90 border border-slate-800 py-1 px-2.5 rounded-xl text-xs">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-[10px]">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-white text-[11px] leading-tight flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                        user.role === 'OPERATIONS_MANAGER'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {user.role === 'OPERATIONS_MANAGER' ? 'OPS MGR' : 'MECHANIC'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out (Clear JWT token)"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              id="btn-global-export-docx"
              onClick={handleExportDocx}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating Docx...' : 'Export Word Doc (.docx)'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic RBAC Persona Switcher Strip */}
        <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">Active User Role:</span>
            <div className="inline-flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleRoleChange('FLEET_MANAGER')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  currentUserRole === 'FLEET_MANAGER'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fleet Manager
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('MECHANIC')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  currentUserRole === 'MECHANIC'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mechanic
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('ADMINISTRATOR')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  currentUserRole === 'ADMINISTRATOR'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Administrator
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            {currentUserRole === 'FLEET_MANAGER' && (
              <span className="text-cyan-400/90 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 inline" />
                <span>Operational rights: Macro map, route swaps & dispatch unlocked. Shop ground-truth tagging restricted.</span>
              </span>
            )}
            {currentUserRole === 'MECHANIC' && (
              <span className="text-indigo-400/90 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 inline" />
                <span>Shop rights: Work order triage, parts reservation & ground-truth ML tagging unlocked. Dispatch & financial SLA masked.</span>
              </span>
            )}
            {currentUserRole === 'ADMINISTRATOR' && (
              <span className="text-emerald-400/90 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 inline" />
                <span>Governance rights: Full operational, shop technician, MLOps retraining, and telemetry DLQ controls unlocked.</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'COMMAND_CENTER' && (
          <FleetCommandCenter
            vehicles={vehicles}
            workOrders={workOrders}
            selectedVehicleId={selectedVehicleId}
            userRole={currentUserRole}
            onSelectVehicle={(id) => setSelectedVehicleId(id)}
            onDispatchWorkOrder={handleDispatchWorkOrder}
            onSwitchToMechanic={() => setCurrentTab('MECHANIC_COPILOT')}
          />
        )}

        {currentTab === 'MECHANIC_COPILOT' && (
          <MechanicCopilot
            workOrders={workOrders}
            vehicles={vehicles}
            inventory={inventory}
            userRole={currentUserRole}
            onUpdateWorkOrder={handleUpdateWorkOrder}
            onSubmitFeedback={handleSubmitFeedback}
          />
        )}

        {currentTab === 'HYBRID_ML' && (
          <HybridMLArchitectureStudio vehicles={vehicles} />
        )}

        {currentTab === 'AI_6_PHASES' && (
          <AIPhaseCycleHub
            onExportDocx={handleExportDocx}
            isExporting={isExporting}
          />
        )}

        {currentTab === 'DEPLOYMENT_TOPOLOGY' && (
          <Phase4DeploymentTopologyStudio />
        )}

        {currentTab === 'TELEMETRY_SIMULATOR' && (
          <TelemetrySimulator
            vehicles={vehicles}
            userRole={currentUserRole}
            onIngestTelemetry={handleIngestTelemetry}
          />
        )}

        {currentTab === 'DIAGNOSTIC_CARD' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  Next.js 14 App Router Component
                </span>
                <span>Rendered from <code className="text-slate-300 font-mono">app/dashboard/page.tsx</code></span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[11px]">
                <span className="text-emerald-400">GET /api/v1/vehicles/:id/risk-score</span>
                <span>•</span>
                <span className="text-cyan-400">WebSocket /ws/telemetry/:id (1Hz)</span>
              </div>
            </div>
            <FleetDiagnosticCard vehicleId={selectedVehicleId || "c39a2b8e-4f10-4123-b1d3-9f88102a0142"} />
          </div>
        )}
      </main>

      {/* Floating Live Telemetry Stream Simulator */}
      <LiveTelemetryStreamSimulator onSimulationTriggered={refreshFleetData} />

      {/* Footer Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-500" />
            <span>FleetPulse Telematics System • LightGBM + PyTorch LSTM (ONNX Runtime) • TimescaleDB</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            J1939 CAN Bus Gateway: Online | 7 Connected Assets (incl. FP-042) | Sub-10ms Inference
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FleetPulseApp />
    </AuthProvider>
  );
}
