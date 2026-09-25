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
import { AppHeader } from './components/AppHeader';
import { TruckWagonGame } from './components/TruckWagonGame';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { generateFleetPulseDocx } from './services/docxExport';
import { Activity, CheckCircle2, Radio } from 'lucide-react';
import { AppView } from './navigation';

const pageCopy: Record<AppView, { section: string; title: string; description: string }> = {
  COMMAND_CENTER: { section: 'Operations', title: 'Fleet overview', description: 'A clear view of fleet health, vehicle alerts, and what needs attention next.' },
  MECHANIC_COPILOT: { section: 'Service', title: 'Work orders', description: 'Review repair priorities, inspect vehicle evidence, and track shop outcomes.' },
  TRUCK_GAME: { section: 'Fleet break', title: 'Truck & wagon run', description: 'Pick up cargo, add wagons, and see how long a road train you can keep moving.' },
  HYBRID_ML: { section: 'AI & analytics', title: 'AI architecture', description: 'See how FleetPulse combines telemetry and machine learning to estimate risk.' },
  AI_6_PHASES: { section: 'AI & analytics', title: 'AI lifecycle', description: 'Explore the six phases behind FleetPulse’s design and operations.' },
  DEPLOYMENT_TOPOLOGY: { section: 'Platform', title: 'System architecture', description: 'Explore how FleetPulse services connect across the platform.' },
  TELEMETRY_SIMULATOR: { section: 'Platform', title: 'Telemetry lab', description: 'Send sample vehicle readings and explore how the system responds.' },
  DIAGNOSTIC_CARD: { section: 'Vehicle health', title: 'Live diagnostics', description: 'Inspect an individual vehicle’s score, signals, and contributing factors.' },
};

function FleetPulseApp() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();

  const [vehicles, setVehicles] = useState<VehicleRiskAssessment[]>(INITIAL_VEHICLES);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [inventory] = useState<InventoryPart[]>(INVENTORY_PARTS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('FP-042');
  const [currentTab, setCurrentTab] = useState<AppView>('COMMAND_CENTER');
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

    if (v.failureProbability < 0.8) {
      showToast('A repair recommendation requires at least 80% model confidence.');
      return;
    }

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

    showToast(`Recommendation ${newId} sent for mechanic verification. Parts are not reserved until approved.`);
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
        if (json.success && Array.isArray(json.data)) setVehicles(json.data);
      }
    } catch {
      // Keep the latest local telemetry state if the backend is temporarily unavailable.
    }
  };

  // If auth is loading, show loading screen
  if (isLoading) {
    return (
      <div className="fleet-theme min-h-screen flex items-center justify-center bg-[#f5f5f7] text-slate-600 font-sans text-sm space-x-2">
        <Activity className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Initializing FleetPulse Session...</span>
      </div>
    );
  }

  // If unauthenticated, redirect to Login/Register AuthPage
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const page = pageCopy[currentTab];

  return (
    <div className="fleet-theme min-h-screen flex flex-col bg-[#f5f5f7] font-sans text-[#1d1d1f] selection:bg-blue-200 selection:text-slate-900">
      <AppHeader
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        pendingOrderCount={workOrders.filter((order) => order.status === 'PENDING_DISPATCH').length}
        user={user}
        currentUserRole={currentUserRole}
        onRoleChange={handleRoleChange}
        onExport={handleExportDocx}
        isExporting={isExporting}
        onLogout={logout}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">FleetPulse <span className="mx-1 text-slate-400">/</span> {page.section}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{page.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{page.description}</p>
        </div>
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

        {currentTab === 'TRUCK_GAME' && <TruckWagonGame />}

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
          <div className="space-y-6">
            <TelemetrySimulator
              vehicles={vehicles}
              userRole={currentUserRole}
              onIngestTelemetry={handleIngestTelemetry}
            />
            <LiveTelemetryStreamSimulator
              displayMode="inline"
              onSimulationTriggered={refreshFleetData}
            />
          </div>
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

      <footer className="border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
          <span>FleetPulse fleet operations</span>
          <span className="inline-flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-emerald-600" /> Telemetry connection active</span>
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
