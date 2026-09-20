export type AuthRole = 'OPERATIONS_MANAGER' | 'FLEET_MECHANIC';
export type UserRole = 'OPERATIONS_MANAGER' | 'FLEET_MECHANIC' | 'FLEET_MANAGER' | 'MECHANIC' | 'ADMINISTRATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: 'OPERATIONS_MANAGER' | 'FLEET_MECHANIC';
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password_hash'>;
  message?: string;
}

export interface TelemetryValidationResult {
  passed: boolean;
  status: 'VALIDATED' | 'SENSOR_NOISE_SMOOTHED' | 'QUARANTINED_DLQ';
  quarantineReason?: string;
  boundaryChecks: {
    coolant: boolean; // -40 to 150 C
    voltage: boolean; // 0 to 32 V
    rpm: boolean;     // 0 to 8000
    oilPressure: boolean; // 0 to 120 PSI
  };
  rateOfChangeCheck: {
    passed: boolean;
    thermalSpikeDelta?: number; // deg C / sec
  };
  filterAction: string;
  dlqTopic?: string;
  mqttTopic: string;
  protocol: string;
  inferenceExecuted: boolean;
}

export interface ShapExplanation {
  feature: string;
  impactScore: number; // positive = drives failure risk up, negative = protective/normal
  humanReadableMessage: string;
}

export interface SubsystemHealth {
  cooling: number; // 0 to 100 risk score
  electrical: number;
  transmission: number;
  engine: number;
}

export interface TelemetryReading {
  timestamp: string;
  coolantTemp: number; // Celsius (-40 to 150)
  coolantTempBaseline: number;
  batteryVoltage: number; // Volts (0 to 30)
  batteryVoltageBaseline: number;
  engineRpm: number; // RPM (0 to 8000)
  engineRpmBaseline: number;
  oilPressure: number; // PSI (0 to 120)
  oilPressureBaseline: number;
}

export interface VehicleRiskAssessment {
  vehicleId: string;
  vin: string;
  makeModel: string;
  year: number;
  fleetGroup: string;
  driverName: string;
  currentRoute: string;
  lat: number;
  lng: number;
  speedMph: number;
  failureProbability: number; // 0.0 to 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedDaysToFailure: number;
  primarySubsystem: 'Cooling System' | 'Electrical' | 'Transmission' | 'Engine';
  subsystems: SubsystemHealth;
  lastUpdated: string; // ISO Timestamp
  odometerMiles: number;
  shapExplanations: ShapExplanation[];
  recentTelemetry: TelemetryReading[];
  activeWorkOrderId?: string;
}

export interface TelemetryPacket {
  vehicle_id: string;
  timestamp: string;
  coolant_temp: number;
  battery_voltage: number;
  engine_rpm: number;
  oil_pressure: number;
  error_codes?: string[];
}

export interface InventoryPart {
  partNumber: string;
  name: string;
  subsystem: 'Cooling System' | 'Electrical' | 'Transmission' | 'Engine';
  inStock: number;
  reorderLeadDays: number;
  unitCost: number;
  compatibleModels: string[];
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  vin: string;
  makeModel: string;
  primarySubsystem: 'Cooling System' | 'Electrical' | 'Transmission' | 'Engine';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'PENDING_DISPATCH' | 'SCHEDULED' | 'IN_SHOP' | 'COMPLETED';
  failureProbability: number;
  scheduledShopDate: string;
  estimatedLaborHours: number;
  assignedMechanic?: string;
  partsRequired: {
    partNumber: string;
    name: string;
    qty: number;
    inStock: boolean;
  }[];
  notes?: string;
  closedLoopFeedback?: {
    tag: 'FAILURE_CONFIRMED' | 'FALSE_POSITIVE';
    rootCauseIdentified: string;
    mechanicNotes: string;
    submittedAt: string;
    mechanicId: string;
  };
}

export interface AIPhaseClarification {
  id: string;
  phaseNumber: number;
  title: string;
  subtitle: string;
  summary: string;
  whyWeDoThis: string;
  architecturalDecisions: {
    decision: string;
    chosenApproach: string;
    rationale: string;
    tradeoffs: string;
  }[];
  keyClarifications: {
    question: string;
    answer: string;
    impactOnCode: string;
  }[];
  externalAIPrompt: {
    title: string;
    role: string;
    promptText: string;
  };
}

export interface HybridTabularFeatures {
  coolant_temp_14d_avg: number;
  coolant_temp_14d_std: number;
  coolant_temp_14d_max: number;
  battery_voltage_14d_avg: number;
  battery_voltage_14d_min: number;
  battery_voltage_rate_of_change: number;
  engine_rpm_14d_avg: number;
  oil_pressure_14d_min: number;
  cumulative_mileage: number;
  vehicle_age_years: number;
}

export interface HybridShapDiagnostic {
  feature: string;
  shap_impact_score: number;
  mechanic_summary: string;
}

export interface HybridInferenceResponse {
  failure_probability_percent: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  component_scores: {
    lightgbm_score: number;
    lstm_temporal_score: number;
  };
  shap_diagnostics: HybridShapDiagnostic[];
  execution_metadata?: {
    onnx_runtime_provider: string;
    latency_ms: number;
    weights: { lightgbm: number; lstm: number };
    sequence_shape: [number, number, number];
  };
}
