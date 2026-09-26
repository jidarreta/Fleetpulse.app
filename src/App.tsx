import React, { useState, useEffect, useRef } from 'react';
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
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { generateFleetPulseDocx } from './services/docxExport';
import { Activity, CheckCircle2, Radio } from 'lucide-react';
import { AppView } from './navigation';
import { PendingApiRequest, readLocalData, writeLocalData } from './services/localData';

const STORAGE_KEYS = {
  vehicles: 'fleetpulse_vehicles_v1',
  workOrders: 'fleetpulse_work_orders_v1',
  selectedVehicle: 'fleetpulse_selected_vehicle_v1',
  currentTab: 'fleetpulse_current_tab_v1',
  role: 'fleetpulse_role_override_v1',
  pendingRequests: 'fleetpulse_pending_requests_v1',
} as const;

const validViews: AppView[] = [
  'COMMAND_CENTER', 'MECHANIC_COPILOT', 'TRUCK_GAME', 'HYBRID_ML',
  'AI_6_PHASES', 'DEPLOYMENT_TOPOLOGY', 'TELEMETRY_SIMULATOR', 'DIAGNOSTIC_CARD',
];

function loadVehicles(): VehicleRiskAssessment[] {
  const saved = readLocalData<unknown>(STORAGE_KEYS.vehicles, null);
  return Array.isArray(saved) && saved.every((item) => item && typeof item.vehicleId === 'string')
    ? saved as VehicleRiskAssessment[]
    : INITIAL_VEHICLES;
}

function loadWorkOrders(): WorkOrder[] {
  const saved = readLocalData<unknown>(STORAGE_KEYS.workOrders, null);
  return Array.isArray(saved) && saved.every((item) => item && typeof item.id === 'string' && typeof item.vehicleId === 'string')
    ? saved as WorkOrder[]
    : INITIAL_WORK_ORDERS;
}

function loadPendingRequests(): PendingApiRequest[] {
  const saved = readLocalData<unknown>(STORAGE_KEYS.pendingRequests, []);
  return Array.isArray(saved)
    ? saved.filter((item): item is PendingApiRequest => Boolean(
        item && typeof item.id === 'string' && typeof item.url === 'string' &&
        (item.method === 'POST' || item.method === 'PATCH') && typeof item.body === 'string' &&
        typeof item.requiresAuth === 'boolean' && typeof item.createdAt === 'string'
      ))
    : [];
}

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

  const [vehicles, setVehicles] = useState<VehicleRiskAssessment[]>(loadVehicles);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(loadWorkOrders);
  const [inventory] = useState<InventoryPart[]>(INVENTORY_PARTS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    const saved = readLocalData<unknown>(STORAGE_KEYS.selectedVehicle, null);
    return typeof saved === 'string' ? saved : 'FP-042';
  });
  const [currentTab, setCurrentTab] = useState<AppView>(() => {
    const saved = readLocalData<string>(STORAGE_KEYS.currentTab, 'COMMAND_CENTER');
    return validViews.includes(saved as AppView) ? saved as AppView : 'COMMAND_CENTER';
  });
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(() => {
    const saved = readLocalData<string | null>(STORAGE_KEYS.role, null);
    return saved === 'FLEET_MANAGER' || saved === 'MECHANIC' || saved === 'ADMINISTRATOR' ? saved : null;
  });
  const [pendingRequests, setPendingRequests] = useState<PendingApiRequest[]>(loadPendingRequests);
  const [storageError, setStorageError] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const priorRole = useRef(user?.role);

  // Sync tab with user role upon login
  useEffect(() => {
    if (user && !priorRole.current) {
      if (user.role === 'OPERATIONS_MANAGER') {
        setCurrentTab('COMMAND_CENTER');
      } else if (user.role === 'FLEET_MECHANIC') {
        setCurrentTab('MECHANIC_COPILOT');
      }
    }
    priorRole.current = user?.role;
  }, [user?.role]);

  useEffect(() => {
    const saved = [
      writeLocalData(STORAGE_KEYS.vehicles, vehicles),
      writeLocalData(STORAGE_KEYS.workOrders, workOrders),
      writeLocalData(STORAGE_KEYS.selectedVehicle, selectedVehicleId),
      writeLocalData(STORAGE_KEYS.currentTab, currentTab),
      writeLocalData(STORAGE_KEYS.role, roleOverride),
      writeLocalData(STORAGE_KEYS.pendingRequests, pendingRequests),
    ].every(Boolean);
    setStorageError(!saved);
  }, [vehicles, workOrders, selectedVehicleId, currentTab, roleOverride, pendingRequests]);

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
    let active = true;
    setSyncStatus('loading');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const syncInitialData = async () => {
      const unsynced: PendingApiRequest[] = [];
      for (const request of pendingRequests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(request.requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: request.body,
          });
          if (!response.ok) throw new Error(`Saved update returned ${response.status}.`);
        } catch {
          unsynced.push(request);
        }
      }
      if (!active) return;
      setPendingRequests(unsynced);
      if (unsynced.length) {
        setSyncStatus('offline');
        return;
      }

      const results = await Promise.allSettled([
        fetch('/api/v1/vehicles', { signal: controller.signal }).then(async (res) => {
          if (!res.ok) throw new Error(`Vehicle sync failed (${res.status})`);
          return res.json();
        }),
        fetch('/api/v1/work-orders', { signal: controller.signal }).then(async (res) => {
          if (!res.ok) throw new Error(`Work order sync failed (${res.status})`);
          return res.json();
        }),
      ]);
      if (!active) return;
      let failed = false;
      const [vehicleResult, orderResult] = results;
      if (vehicleResult.status === 'fulfilled' && vehicleResult.value?.success && Array.isArray(vehicleResult.value.data)) {
        setVehicles(vehicleResult.value.data);
      } else failed = true;
      if (orderResult.status === 'fulfilled' && orderResult.value?.success && Array.isArray(orderResult.value.data)) {
        setWorkOrders(orderResult.value.data);
      } else failed = true;
      setSyncStatus(failed ? 'offline' : 'online');
    };
    void syncInitialData().finally(() => window.clearTimeout(timeout));

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
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [syncAttempt, token]);

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

  const retryFleetSync = () => setSyncAttempt((attempt) => attempt + 1);

  useEffect(() => {
    const retryWhenOnline = () => retryFleetSync();
    window.addEventListener('online', retryWhenOnline);
    return () => window.removeEventListener('online', retryWhenOnline);
  }, []);

  const sendOrQueueRequest = (
    request: Omit<PendingApiRequest, 'id' | 'createdAt'>,
    failureMessage: string,
  ) => {
    fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: request.body,
    }).then((res) => {
      if (!res.ok) throw new Error(`Request failed (${res.status}).`);
    }).catch(() => {
      setPendingRequests((previous) => [...previous, {
        ...request,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      }]);
      setSyncStatus('offline');
      showToast(failureMessage);
    });
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
    setWorkOrders((previous) => [newOrder, ...previous]);
    setVehicles((prev) =>
      prev.map((item) => (item.vehicleId === vehicleId ? { ...item, activeWorkOrderId: newId } : item))
    );

    sendOrQueueRequest(
      { url: '/api/v1/work-orders', method: 'POST', body: JSON.stringify(newOrder), requiresAuth: true },
      `Work order ${newId} is saved here and queued to sync.`,
    );

    showToast(`Recommendation ${newId} sent for mechanic verification. Parts are not reserved until approved.`);
  };

  const handleUpdateWorkOrder = (updated: WorkOrder) => {
    setWorkOrders((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));

    sendOrQueueRequest(
      { url: `/api/v1/work-orders/${updated.id}`, method: 'PATCH', body: JSON.stringify(updated), requiresAuth: true },
      `Work order ${updated.id} is saved here and queued to sync.`,
    );

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

    sendOrQueueRequest(
      {
        url: `/api/v1/work-orders/${workOrderId}`,
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({
        status: 'COMPLETED',
        closedLoopFeedback: feedback,
      }),
      },
      'Validation is saved here and queued to sync.',
    );

    showToast(
      `Ground-truth tagged: ${feedback.tag === 'FAILURE_CONFIRMED' ? 'Failure Confirmed' : 'False Positive'}.`
    );
  };

  // Telemetry stream ingestion handler (simulates FastAPI + ONNX runtime evaluation)
  const handleIngestTelemetry = (packet: TelemetryPacket) => {
    sendOrQueueRequest(
      { url: '/api/v1/telemetry', method: 'POST', body: JSON.stringify(packet), requiresAuth: false },
      'Telemetry is saved here and queued to sync.',
    );

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

    showToast(`Telemetry ingested locally for ${packet.vehicle_id}.`);
  };

  const refreshFleetData = async () => {
    try {
      const res = await fetch('/api/v1/vehicles');
      if (!res.ok) throw new Error(`Fleet refresh failed (${res.status}).`);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error('Fleet refresh returned invalid data.');
      setVehicles(json.data);
      setSyncStatus(pendingRequests.length ? 'offline' : 'online');
    } catch {
      setSyncStatus('offline');
      showToast('Could not refresh fleet data. Your saved data is still available.');
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
        <div className="fixed left-4 right-4 top-24 z-50 flex items-center space-x-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-200 shadow-2xl animate-in slide-in-from-top-2 sm:left-auto sm:right-6 sm:max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        {syncStatus !== 'online' && (
          <div className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${syncStatus === 'loading' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`} role="status" aria-live="polite">
            <span>{syncStatus === 'loading' ? `Syncing fleet data${pendingRequests.length ? ` and ${pendingRequests.length} saved change${pendingRequests.length === 1 ? '' : 's'}` : ''}… Your saved data remains available.` : pendingRequests.length ? `${pendingRequests.length} saved change${pendingRequests.length === 1 ? '' : 's'} waiting to sync. Your data is saved on this device.` : 'Could not reach the fleet service. Showing saved data on this device.'}</span>
            {syncStatus === 'offline' && <button type="button" onClick={retryFleetSync} className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100">Try again</button>}
          </div>
        )}
        {storageError && <p role="alert" className="mb-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">This browser could not save your latest changes. Check that local storage is available and not full.</p>}
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
      <AppErrorBoundary>
        <FleetPulseApp />
      </AppErrorBoundary>
    </AuthProvider>
  );
}
