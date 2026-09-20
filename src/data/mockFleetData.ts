import { VehicleRiskAssessment, InventoryPart, WorkOrder, AIPhaseClarification } from '../types';

export const INITIAL_VEHICLES: VehicleRiskAssessment[] = [
  {
    vehicleId: 'FP-042',
    vin: '1FUJGLDR5NL892042',
    makeModel: 'Freightliner Cascadia 126 (Truck #42)',
    year: 2023,
    fleetGroup: 'Great Lakes Long-Haul',
    driverName: 'Tyler Brooks',
    currentRoute: 'Route 80: Toledo, OH ➔ Gary, IN',
    lat: 41.595,
    lng: -87.346,
    speedMph: 66,
    failureProbability: 0.88,
    riskLevel: 'CRITICAL',
    estimatedDaysToFailure: 2,
    primarySubsystem: 'Cooling System',
    subsystems: {
      cooling: 92,
      electrical: 28,
      transmission: 24,
      engine: 38,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    odometerMiles: 172890,
    shapExplanations: [
      {
        feature: 'Coolant Temp Variance vs Baseline',
        impactScore: 0.46,
        humanReadableMessage: 'Coolant temperature variance +18.7% under high load climbs (exceeding 105°C continuous threshold).',
      },
      {
        feature: 'Radiator Differential Pressure',
        impactScore: 0.31,
        humanReadableMessage: 'Radiator delta pressure drop (-4.4 PSI), indicating thermostat restriction or coolant aeration.',
      },
      {
        feature: 'Auxiliary Cooling Fan Slip',
        impactScore: 0.18,
        humanReadableMessage: 'Bimodal fan clutch engagement delay of 9.1 seconds detected on highway grades.',
      },
      {
        feature: 'Engine RPM Stability',
        impactScore: -0.05,
        humanReadableMessage: 'Nominal cylinder combustion balance observed under standard governor cruise.',
      },
    ],
    recentTelemetry: generateTelemetrySeries(109.2, 91.0, 13.9, 14.1, 1640, 1600, 42.5, 45.0, true),
    activeWorkOrderId: 'WO-8819',
  },
  {
    vehicleId: 'FP-104',
    vin: '1FUJGLDR5NL892014',
    makeModel: 'Freightliner Cascadia 126',
    year: 2023,
    fleetGroup: 'Great Lakes Long-Haul',
    driverName: 'Marcus Vance',
    currentRoute: 'Route 84: Chicago, IL ➔ Indianapolis, IN',
    lat: 41.525,
    lng: -87.521,
    speedMph: 64,
    failureProbability: 0.92,
    riskLevel: 'CRITICAL',
    estimatedDaysToFailure: 2,
    primarySubsystem: 'Cooling System',
    subsystems: {
      cooling: 94,
      electrical: 35,
      transmission: 22,
      engine: 48,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    odometerMiles: 184520,
    shapExplanations: [
      {
        feature: 'Coolant Temp Variance vs Baseline',
        impactScore: 0.44,
        humanReadableMessage: 'Coolant operating temperature spike (+18.4°C sustained above ambient regression baseline during high torque climbs).',
      },
      {
        feature: 'Radiator Pressure Delta',
        impactScore: 0.28,
        humanReadableMessage: 'Primary heat exchanger pressure drop detected (-4.2 PSI), pointing to impeller cavitation or pinhole thermostat leak.',
      },
      {
        feature: 'Fan Clutch Engagement Delay',
        impactScore: 0.16,
        humanReadableMessage: 'Auxiliary viscous fan clutch takes 8.2s longer to lock than standard profile under thermal load.',
      },
      {
        feature: 'Engine RPM Stability',
        impactScore: -0.06,
        humanReadableMessage: 'Engine rotational stability remains within nominal tolerances (protective factor).',
      },
    ],
    recentTelemetry: generateTelemetrySeries(108.5, 92.0, 13.8, 14.1, 1620, 1600, 42.1, 45.0, true),
    activeWorkOrderId: 'WO-8821',
  },
  {
    vehicleId: 'FP-209',
    vin: '1XKWD49X0PJ441920',
    makeModel: 'Kenworth T680 NextGen',
    year: 2022,
    fleetGroup: 'Midwest Metro Delivery',
    driverName: 'Elena Rostova',
    currentRoute: 'Route 12: Milwaukee, WI ➔ Rockford, IL',
    lat: 42.271,
    lng: -89.094,
    speedMph: 58,
    failureProbability: 0.81,
    riskLevel: 'HIGH',
    estimatedDaysToFailure: 4,
    primarySubsystem: 'Electrical',
    subsystems: {
      cooling: 18,
      electrical: 88,
      transmission: 14,
      engine: 25,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    odometerMiles: 142100,
    shapExplanations: [
      {
        feature: 'Alternator Ripple Voltage',
        impactScore: 0.39,
        humanReadableMessage: 'Alternator diode harmonic ripple exceeded 450mV peak-to-peak, indicating imminent rectifier bridge degradation.',
      },
      {
        feature: 'Battery Voltage Decay Under Cranking',
        impactScore: 0.31,
        humanReadableMessage: 'Cold-crank voltage dropped to 9.4V (standard safe threshold >10.8V), signaling cell sulfation in Bank A.',
      },
      {
        feature: 'Parasitic Key-Off Draw',
        impactScore: 0.14,
        humanReadableMessage: 'Key-off standby current draw is 1.8A (normal specification is <150mA).',
      },
    ],
    recentTelemetry: generateTelemetrySeries(89.2, 90.0, 12.1, 14.2, 1480, 1500, 46.5, 46.0, false, true),
    activeWorkOrderId: 'WO-8824',
  },
  {
    vehicleId: 'FP-315',
    vin: '1XP9DB9X8MD771239',
    makeModel: 'Peterbilt 579 UltraLoft',
    year: 2021,
    fleetGroup: 'Transcontinental Heavy',
    driverName: 'Darnell Washington',
    currentRoute: 'Route 90: Gary, IN ➔ South Bend, IN',
    lat: 41.593,
    lng: -86.250,
    speedMph: 68,
    failureProbability: 0.74,
    riskLevel: 'HIGH',
    estimatedDaysToFailure: 6,
    primarySubsystem: 'Transmission',
    subsystems: {
      cooling: 30,
      electrical: 20,
      transmission: 79,
      engine: 42,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    odometerMiles: 231400,
    shapExplanations: [
      {
        feature: 'Torque Converter Slip Ratio',
        impactScore: 0.36,
        humanReadableMessage: 'Slip ratio in 10th-to-11th gear shift transitions elevated by 14.3% during steady-state cruise.',
      },
      {
        feature: 'Transmission Sump Temperature',
        impactScore: 0.26,
        humanReadableMessage: 'Fluid sump temp sustained at 112°C against baseline 94°C, deteriorating clutch friction coefficients.',
      },
    ],
    recentTelemetry: generateTelemetrySeries(93.1, 91.0, 14.0, 14.0, 1750, 1650, 43.8, 45.0),
  },
  {
    vehicleId: 'FP-408',
    vin: '4V4NC9EH1NN392810',
    makeModel: 'Volvo VNL 860',
    year: 2023,
    fleetGroup: 'Great Lakes Long-Haul',
    driverName: 'Carlos Morales',
    currentRoute: 'Route 55: Joliet, IL ➔ Bloomington, IL',
    lat: 40.893,
    lng: -88.990,
    speedMph: 62,
    failureProbability: 0.46,
    riskLevel: 'MEDIUM',
    estimatedDaysToFailure: 14,
    primarySubsystem: 'Engine',
    subsystems: {
      cooling: 24,
      electrical: 19,
      transmission: 15,
      engine: 51,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    odometerMiles: 96400,
    shapExplanations: [
      {
        feature: 'Oil Pressure Baseline Drift',
        impactScore: 0.22,
        humanReadableMessage: 'Steady-state oil pressure degraded by 3.8 PSI over past 30 operating hours.',
      },
      {
        feature: 'DPF Differential Pressure',
        impactScore: 0.19,
        humanReadableMessage: 'Soot loading index showing early restriction in particulate filter.',
      },
    ],
    recentTelemetry: generateTelemetrySeries(91.0, 90.0, 14.2, 14.2, 1550, 1550, 40.2, 45.0),
  },
  {
    vehicleId: 'FP-512',
    vin: '1FDNF75P3PDA19283',
    makeModel: 'Ford F-750 Super Duty',
    year: 2024,
    fleetGroup: 'Metro Short-Haul',
    driverName: 'Sarah Jenkins',
    currentRoute: 'Route 290: Schaumburg, IL ➔ Downtown Chicago, IL',
    lat: 41.974,
    lng: -87.907,
    speedMph: 45,
    failureProbability: 0.12,
    riskLevel: 'LOW',
    estimatedDaysToFailure: 55,
    primarySubsystem: 'Cooling System',
    subsystems: {
      cooling: 14,
      electrical: 9,
      transmission: 8,
      engine: 11,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    odometerMiles: 38200,
    shapExplanations: [
      {
        feature: 'Coolant Flow Equilibrium',
        impactScore: -0.28,
        humanReadableMessage: 'Closed-loop cooling cycle functioning within 99.1% of factory thermodynamic tolerance.',
      },
      {
        feature: 'Battery Float Charging',
        impactScore: -0.19,
        humanReadableMessage: 'Regulated 14.2V charging with zero AC ripple.',
      },
    ],
    recentTelemetry: generateTelemetrySeries(89.5, 90.0, 14.2, 14.1, 1420, 1420, 47.0, 46.5),
  },
  {
    vehicleId: 'FP-620',
    vin: '1FUJGLDR8NL401923',
    makeModel: 'Freightliner Cascadia 116',
    year: 2022,
    fleetGroup: 'Midwest Metro Delivery',
    driverName: 'Tariq Al-Mansoor',
    currentRoute: 'Route 65: Lafayette, IN ➔ Indianapolis, IN',
    lat: 40.342,
    lng: -86.877,
    speedMph: 60,
    failureProbability: 0.19,
    riskLevel: 'LOW',
    estimatedDaysToFailure: 42,
    primarySubsystem: 'Electrical',
    subsystems: {
      cooling: 12,
      electrical: 21,
      transmission: 10,
      engine: 14,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    odometerMiles: 112900,
    shapExplanations: [
      {
        feature: 'Electrical Bus Stability',
        impactScore: -0.21,
        humanReadableMessage: 'Nominal charging profile and sensor ground references verified.',
      },
    ],
    recentTelemetry: generateTelemetrySeries(90.1, 90.0, 14.1, 14.1, 1500, 1500, 46.0, 46.0),
  },
];

function generateTelemetrySeries(
  cActual: number,
  cBase: number,
  vActual: number,
  vBase: number,
  rpmActual: number,
  rpmBase: number,
  oilActual: number,
  oilBase: number,
  elevateCoolant = false,
  dropVoltage = false
) {
  const points = 18;
  const list = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const factor = (points - 1 - i) / points;
    const time = new Date(now - i * 1000 * 60 * 15).toISOString();
    const cVal = elevateCoolant ? cBase + (cActual - cBase) * factor + (Math.random() * 2 - 1) : cActual + (Math.random() * 1.5 - 0.75);
    const vVal = dropVoltage ? vBase - (vBase - vActual) * factor + (Math.random() * 0.1 - 0.05) : vActual + (Math.random() * 0.1 - 0.05);
    const rpmVal = rpmActual + Math.sin(i) * 80 + (Math.random() * 40 - 20);
    const oilVal = oilActual - (elevateCoolant ? factor * 3 : 0) + (Math.random() * 1 - 0.5);

    list.push({
      timestamp: time,
      coolantTemp: parseFloat(cVal.toFixed(1)),
      coolantTempBaseline: cBase,
      batteryVoltage: parseFloat(vVal.toFixed(2)),
      batteryVoltageBaseline: vBase,
      engineRpm: Math.round(rpmVal),
      engineRpmBaseline: rpmBase,
      oilPressure: parseFloat(oilVal.toFixed(1)),
      oilPressureBaseline: oilBase,
    });
  }
  return list;
}

export const INVENTORY_PARTS: InventoryPart[] = [
  {
    partNumber: 'DT-COOL-882',
    name: 'High-Flow Thermostat & Water Pump Impeller Kit',
    subsystem: 'Cooling System',
    inStock: 6,
    reorderLeadDays: 2,
    unitCost: 385.0,
    compatibleModels: ['Freightliner Cascadia 126', 'Freightliner Cascadia 116', 'Western Star 49X'],
  },
  {
    partNumber: 'EL-ALT-4100',
    name: '24V 160A Brushless High-Output Alternator w/ Internal Rectifier',
    subsystem: 'Electrical',
    inStock: 3,
    reorderLeadDays: 3,
    unitCost: 620.0,
    compatibleModels: ['Kenworth T680 NextGen', 'Peterbilt 579 UltraLoft'],
  },
  {
    partNumber: 'TR-ACT-991',
    name: 'Automated Manual Transmission (AMT) Clutch Actuator Solenoid',
    subsystem: 'Transmission',
    inStock: 2,
    reorderLeadDays: 5,
    unitCost: 890.0,
    compatibleModels: ['Peterbilt 579 UltraLoft', 'Kenworth T680 NextGen'],
  },
  {
    partNumber: 'ENG-SEN-505',
    name: 'High-Accuracy Engine Oil Pressure Transducer',
    subsystem: 'Engine',
    inStock: 14,
    reorderLeadDays: 1,
    unitCost: 115.0,
    compatibleModels: ['Volvo VNL 860', 'Freightliner Cascadia 126', 'Ford F-750 Super Duty'],
  },
  {
    partNumber: 'BAT-AGM-31',
    name: 'Group 31 Heavy-Duty Deep Cycle AGM Battery Pack (x4 Set)',
    subsystem: 'Electrical',
    inStock: 8,
    reorderLeadDays: 2,
    unitCost: 960.0,
    compatibleModels: ['Kenworth T680 NextGen', 'Freightliner Cascadia 126', 'Volvo VNL 860'],
  },
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-8821',
    vehicleId: 'FP-104',
    vin: '1FUJGLDR5NL892014',
    makeModel: 'Freightliner Cascadia 126',
    primarySubsystem: 'Cooling System',
    priority: 'CRITICAL',
    status: 'PENDING_DISPATCH',
    failureProbability: 0.92,
    scheduledShopDate: 'Tomorrow at 07:30 AM',
    estimatedLaborHours: 3.5,
    assignedMechanic: 'Dave "Mac" MacIntyre (Shop Bay 4)',
    partsRequired: [
      {
        partNumber: 'DT-COOL-882',
        name: 'High-Flow Thermostat & Water Pump Impeller Kit',
        qty: 1,
        inStock: true,
      },
    ],
    notes: 'SHAP triggered: Coolant variance +18.4°C and radiator pressure delta. High risk of roadside breakdown within 48 hours.',
  },
  {
    id: 'WO-8824',
    vehicleId: 'FP-209',
    vin: '1XKWD49X0PJ441920',
    makeModel: 'Kenworth T680 NextGen',
    primarySubsystem: 'Electrical',
    priority: 'HIGH',
    status: 'SCHEDULED',
    failureProbability: 0.81,
    scheduledShopDate: 'Thursday at 01:00 PM',
    estimatedLaborHours: 2.0,
    assignedMechanic: 'Elena Rostova (Shop Bay 2)',
    partsRequired: [
      {
        partNumber: 'EL-ALT-4100',
        name: '24V 160A Brushless High-Output Alternator',
        qty: 1,
        inStock: true,
      },
      {
        partNumber: 'BAT-AGM-31',
        name: 'Group 31 AGM Battery Pack',
        qty: 1,
        inStock: true,
      },
    ],
    notes: 'Severe alternator ripple (>450mV) and cold-crank voltage sagging to 9.4V.',
  },
  {
    id: 'WO-8799',
    vehicleId: 'FP-315',
    vin: '1XP9DB9X8MD771239',
    makeModel: 'Peterbilt 579 UltraLoft',
    primarySubsystem: 'Transmission',
    priority: 'HIGH',
    status: 'COMPLETED',
    failureProbability: 0.74,
    scheduledShopDate: 'Yesterday at 09:00 AM',
    estimatedLaborHours: 4.0,
    assignedMechanic: 'Dave "Mac" MacIntyre',
    partsRequired: [
      {
        partNumber: 'TR-ACT-991',
        name: 'Clutch Actuator Solenoid',
        qty: 1,
        inStock: true,
      },
    ],
    notes: 'Prioritized ticket resolved with clutch actuator swap.',
    closedLoopFeedback: {
      tag: 'FAILURE_CONFIRMED',
      rootCauseIdentified: 'Solenoid coil micro-fracture causing intermittent clutch pressure bleed.',
      mechanicNotes: 'Confirmed diagnosis match with SHAP telemetry alert. Replaced part, bench-tested at 140 PSI.',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      mechanicId: 'MEC-402',
    },
  },
];

export const AI_6_PHASES: AIPhaseClarification[] = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    title: 'Phase 1: Problem Definition & KPI Formulation',
    subtitle: 'Framing Commercial Telematics Predictive Maintenance',
    summary:
      'Translating ambiguous hardware telemetry into an objective business problem: predicting catastrophic component failures 3 to 14 days before roadside breakdown.',
    whyWeDoThis:
      'In commercial trucking, an unplanned roadside breakdown costs $1,800 to $4,500 per event plus severe SLA breach penalties ($500/hr delay). Traditional preventative maintenance (e.g. oil change every 15,000 miles) wastes 35% of useful component life or misses sudden thermal/electrical failures.',
    architecturalDecisions: [
      {
        decision: 'Target Definition: Binary Classification vs. Remaining Useful Life (RUL) Regression',
        chosenApproach: 'Hybrid: LightGBM for 0–100% 7-day failure probability + PyTorch LSTM for Days to Failure regression.',
        rationale: 'Fleet managers make discrete decisions (pull truck from route vs. keep running), while maintenance planners need continuous schedule windows (days remaining).',
        tradeoffs: 'Dual model maintenance overhead is mitigated by unified ONNX runtime export.',
      },
      {
        decision: 'Cost-Asymmetric Loss Function (False Negative vs. False Positive)',
        chosenApproach: 'Weighted Log-Loss penalizing False Negatives (unpredicted breakdowns) 8x higher than False Positives (unnecessary shop inspections).',
        rationale: 'A missed engine blowout causes $4,000+ towing/cargo claims, whereas a 20-minute inspection in a scheduled depot costs only ~$65 in labor.',
        tradeoffs: 'Slightly higher shop inspection rate, which is filtered by Mechanic Copilot Explainability.',
      },
    ],
    keyClarifications: [
      {
        question: 'What constitutes an alertable "Critical" threshold?',
        answer: 'Failure Probability ≥ 80% OR Estimated Days to Failure ≤ 3 days, immediately routing an SMS/WebSocket event to Fleet Command and drafting a Work Order.',
        impactOnCode: 'Drives the riskLevel calculation and auto-generation of WO-8821 in the dispatch pipeline.',
      },
      {
        question: 'How do we handle multi-brand fleet heterogeneity (Freightliner Cascadia vs. Kenworth vs. Volvo)?',
        answer: 'Normalize sensor parameters to baseline deviation z-scores computed against model-specific OEM baselines.',
        impactOnCode: 'The ML feature matrix uses Coolant_Temp_Delta_Z instead of raw absolute Celsius.',
      },
    ],
    externalAIPrompt: {
      title: 'Prompt for Operations & Fleet Financial Analysts',
      role: 'Fleet Financial & Operations Specialist',
      promptText:
        'Act as a VP of Fleet Operations for a commercial logistics carrier with 450 Class 8 tractors. Review our predictive telematics SLA threshold model: we trigger proactive shop routing when failure probability exceeds 0.80 or RUL drops below 72 hours. What financial and operational risk parameters (driver detention pay, load swap costs, shop bay capacity constraints) should we inject into our cost-impact calculator to compute net ROI of FleetPulse?',
    },
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    title: 'Phase 2: Data Ingestion, Profiling & Preparation',
    subtitle: 'CAN Bus Signals, Edge Filtering & TimescaleDB Hypertables',
    summary:
      'Ingesting 1–10 Hz vehicle CAN bus telemetry through cellular OBD-II dongles into AWS IoT Core / Kinesis and TimescaleDB with time-bucket downsampling.',
    whyWeDoThis:
      'A single truck running 10 hours a day produces ~360,000 packets per sensor. Transmitting and storing uncompressed raw 10Hz data across 500 trucks costs over $35,000/month in cellular data and storage. We need edge deadband filtering and server-side TimescaleDB chunking.',
    architecturalDecisions: [
      {
        decision: 'Edge Dongle Ingestion Protocol: MQTT vs. HTTP/2',
        chosenApproach: 'MQTT with QoS 1 over TLS 1.3 via AWS IoT Core with local edge buffering during cellular dead zones.',
        rationale: 'Interstate highways have 15–20% intermittent dead zones. Edge dongles queue up to 48 hours of time-stamped packets and flush upon reconnection.',
        tradeoffs: 'Requires dongle firmware supporting embedded flash ring buffers.',
      },
      {
        decision: 'Database Storage Strategy: TimescaleDB Hypertables',
        chosenApproach: 'TimescaleDB hypertables partitioned into 7-day chunks with automatic continuous aggregates for 1-minute, 1-hour, and 1-day rollups.',
        rationale: 'Sub-millisecond query performance on rolling 7d/14d/30d diagnostic charts without table lockups.',
        tradeoffs: 'PostgreSQL extension dependency (fully supported in containerized deployments).',
      },
    ],
    keyClarifications: [
      {
        question: 'How do we detect sensor malfunction vs. vehicle mechanical failure?',
        answer: 'Cross-sensor correlation: an alternator failure exhibits voltage drop AND ripple spike; a broken sensor shows open-circuit rail reading (e.g. 0.00V or 255.0).',
        impactOnCode: 'Included in TelemetryPacket validation schema (ge/le ranges in Pydantic/FastAPI).',
      },
    ],
    externalAIPrompt: {
      title: 'Prompt for Embedded Telematics & TimescaleDB DBA',
      role: 'Embedded IoT & Time-Series Database Architect',
      promptText:
        'I am designing the edge-to-cloud ingestion pipeline for a fleet telematics platform using cellular OBD-II dongles. We stream J1939 CAN bus PGNs (Engine RPM, Coolant Temp, Oil Pressure, Battery Voltage) to AWS IoT Core and ingest into TimescaleDB. Please write the TimescaleDB hypertable DDL, compression policy (after 14 days), and continuous aggregate query for rolling 15-minute anomaly detection.',
    },
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    title: 'Phase 3: Model Development, Evaluation & Explainability',
    subtitle: 'LightGBM, PyTorch LSTM & SHAP TreeExplainer',
    summary:
      'Building the hybrid inference engine combining gradient-boosted trees for structured failure classification with PyTorch sequential LSTMs for time-series drift, explained via SHAP.',
    whyWeDoThis:
      'Black-box neural networks fail on shop floors: if a tablet tells a seasoned diesel mechanic "Risk 92%" without explaining WHICH part is failing (thermostat vs water pump vs hose), the mechanic will ignore the alert. SHAP provides transparent attribution.',
    architecturalDecisions: [
      {
        decision: 'Model Architecture: Tabular LightGBM + Sequential PyTorch LSTM',
        chosenApproach: 'Two-stage ensemble: LightGBM for rapid tabular feature scoring (sub-5ms) + LSTM for trend curvature on 24h rolling windows.',
        rationale: 'LightGBM provides native support for TreeSHAP with exact mathematical Shapley values in microseconds, enabling real-time explainability.',
        tradeoffs: 'Dual model pipeline export to ONNX runtime.',
      },
      {
        decision: 'Explainability Format: SHAP Impact Breakdown',
        chosenApproach: 'TreeSHAP additive feature contributions mapped to top 3 actionable mechanic observations.',
        rationale: 'Translates raw math (+0.44 log-odds) into "Coolant Temp Variance vs Baseline (+18.4°C)".',
        tradeoffs: 'Requires domain taxonomy linking sensor features to physical subsystems.',
      },
    ],
    keyClarifications: [
      {
        question: 'Why not use Gemini directly for real-time CAN bus inference?',
        answer: 'LLMs have 200–800ms latency and high cost per token for 10Hz streaming; LightGBM/ONNX processes in <5ms. We use Gemini for high-level maintenance triage summaries and natural language translation of SHAP vectors.',
        impactOnCode: 'Server provides instant ONNX classification and optional Gemini plain-language diagnostic generation.',
      },
    ],
    externalAIPrompt: {
      title: 'Prompt for Senior Machine Learning / XAI Engineer',
      role: 'Predictive Maintenance ML Engineer',
      promptText:
        'Design a Python training pipeline using LightGBM and TreeSHAP for commercial vehicle subsystem failure prediction. Features include rolling 6h/24h mean, variance, and baseline deviation of coolant temp, oil pressure, and alternator voltage. Show how to export the trained model and TreeSHAP explainer to ONNX / fast C++ runtime format for sub-10ms scoring.',
    },
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    title: 'Phase 4: Dual Application Architecture & Production Deployment Topology',
    subtitle: 'Fleet Command Center, Mechanic Copilot & Multi-Service Network Isolation',
    summary:
      'Engineering the dual-facing SaaS application alongside an isolated production topology: Desktop command center for operations leads and tablet-optimized copilot for shop mechanics, hardened with Ingress API Gateway auth and Redis Pub/Sub WebSocket decoupling.',
    whyWeDoThis:
      'Fleet managers and shop mechanics have conflicting workflows, while predictive telematics requires strict infrastructure isolation. Exposing FastAPI directly to ALBs risks ML worker DDoS, while container recycling during blue/green deployments breaks stateful WebSockets.',
    architecturalDecisions: [
      {
        decision: 'FastAPI Direct ALB Exposure Fix: Ingress API Gateway & Rate Limiting',
        chosenApproach: 'AWS API Gateway HTTP API with JWT Bearer authentication, token-bucket rate limiting (180 req/min), and private VPC Link to backend workers.',
        rationale: 'Exposing FastAPI directly to a public ALB bypasses authentication enforcement and leaves sub-5ms ONNX scoring workers vulnerable to unauthenticated DDoS attacks.',
        tradeoffs: 'Introduces a lightweight ~2ms ingress proxy latency, but guarantees authenticated traffic and DDoS protection.',
      },
      {
        decision: 'WebSocket Ingestion Statefulness Fix: Redis 7 Pub/Sub Decoupling',
        chosenApproach: 'Decoupled WebSocket state from container process memory into Redis 7 Pub/Sub channels (fleetpulse:telemetry:stream).',
        rationale: 'Standard ALB default stickiness breaks streaming telemetry WebSockets when ECS Fargate tasks auto-scale or recycle during blue/green deployments. Redis enables stateless task recycling without dropping packets.',
        tradeoffs: 'Requires maintaining a high-availability Redis cluster or AWS ElastiCache.',
      },
      {
        decision: 'Multi-Service Network Isolation: Dual-Network Docker Compose & ECS Fargate',
        chosenApproach: 'Isolated app_network (Frontend to FastAPI) and data_network (FastAPI to TimescaleDB & Redis Cache).',
        rationale: 'Prevents direct public exposure of database ports (5432) and cache (6379), mirroring AWS ECS Fargate security groups and private VPC subnets.',
        tradeoffs: 'Requires separate bridge network configuration in local dev and private subnets in AWS.',
      },
      {
        decision: 'Dual View Architecture: Dedicated Personas in Single Unified Responsive Platform',
        chosenApproach: 'Role-based contextual viewports with dedicated UX workflows and live real-time state synchronization.',
        rationale: 'Eliminates maintenance of two separate code repositories while giving each persona a tailored, distraction-free environment.',
        tradeoffs: 'Requires careful component modularity and responsive breakpoint testing.',
      },
    ],
    keyClarifications: [
      {
        question: 'Why not expose FastAPI directly to the public Application Load Balancer?',
        answer: 'Direct ALB exposure allows unauthenticated requests to reach GPU/CPU-intensive ML workers. An Ingress API Gateway enforces JWT signature verification and rate-limiting at the edge before packets touch compute nodes.',
        impactOnCode: 'Configured API Gateway ingress rate limiter in server.ts and network isolation in docker-compose.yml.',
      },
      {
        question: 'How do we prevent broken WebSocket streams during blue/green ECS deployments?',
        answer: 'By routing telemetry payloads through Redis Pub/Sub rather than in-memory socket state. When an old task drains and terminates, the client reconnects to the new task and immediately resumes the Redis event stream.',
        impactOnCode: 'Integrated broadcastSSE with Redis channel abstraction in server.ts and telemetry streaming simulator.',
      },
    ],
    externalAIPrompt: {
      title: 'Prompt for Cloud Infrastructure & Network Security Architect',
      role: 'AWS Cloud & DevSecOps Systems Architect',
      promptText:
        'Review the FleetPulse Phase 4 deployment topology. We have addressed FastAPI Direct ALB Exposure using AWS API Gateway with JWT validation and token-bucket rate limiting, and resolved WebSocket Ingestion Statefulness using Redis 7 Pub/Sub to allow zero-downtime ECS Fargate auto-scaling and blue/green deployments. Inspect our docker-compose.yml defining app_network and data_network isolation with TimescaleDB, Redis, FastAPI, and Next.js frontend, and recommend any additional AWS WAF rules or CloudWatch metrics alarms.',
    },
  },
  {
    id: 'phase-5',
    phaseNumber: 5,
    title: 'Phase 5: Shop Floor Execution & Closed-Loop Feedback',
    subtitle: '1-Click Dispatch, Inventory ERP Bridge & Ground-Truth Tagging',
    summary:
      'Bridging predictive alerts with physical reality: reserving shop bays, locking in-stock replacement parts, and collecting mechanic ground truth.',
    whyWeDoThis:
      'Predictive maintenance fails if replacement parts are out of stock (causing 5-day truck dead time) or if the model cannot learn from its mistakes. Mechanics are the only source of ground-truth labels (Failure Confirmed vs False Positive).',
    architecturalDecisions: [
      {
        decision: 'Closed-Loop Ground-Truth Collection',
        chosenApproach: 'Mandatory 10-second completion prompt on the mechanic tablet: tag whether the AI correctly identified the failing component or if it was a false positive.',
        rationale: 'Feeds clean ground-truth binary labels directly to Arize/MLflow retraining queues without requiring manual data labeling.',
        tradeoffs: 'Requires frictionless, 1-tap UX so mechanics do not skip or resent the form.',
      },
      {
        decision: 'Shop ERP & Inventory Bridge',
        chosenApproach: 'Direct querying of shop inventory databases showing real-time parts availability, unit costs, and lead times.',
        rationale: 'Prevents dispatching a truck to a depot that lacks the required alternator or impeller kit.',
        tradeoffs: 'Requires schema mapping to common shop management systems (Decisiv, Karmak, Trimble).',
      },
    ],
    keyClarifications: [
      {
        question: 'How does mechanic feedback prevent model drift?',
        answer: 'False positive tags trigger automatic review in Arize; if false positives on a specific sub-assembly cross 5%, that feature weight is decayed in the retraining cycle.',
        impactOnCode: 'Closed-loop tagging widget on every work order with live ground-truth telemetry feedback.',
      },
    ],
    externalAIPrompt: {
      title: 'Prompt for Shop Integration & ERP Engineer',
      role: 'Enterprise Systems Integration Specialist',
      promptText:
        'We need to integrate the FleetPulse Shop Work Order Bridge with commercial heavy-duty shop management software (e.g., Decisiv, Karmak Fusion, or SAP Plant Maintenance). Write the OpenAPI 3.0 specification for creating repair orders, reserving parts inventory, and syncing mechanic timecard labor hours.',
    },
  },
  {
    id: 'phase-6',
    phaseNumber: 6,
    title: 'Phase 6: Monitoring, Drift Detection & Continuous Retraining',
    subtitle: 'Arize AI, MLflow & Production Lifecycle Governance',
    summary:
      'Continuous telemetry monitoring for covariate shift (e.g., severe winter freeze changing baseline battery behavior) and automated model retraining.',
    whyWeDoThis:
      'Vehicle behavior shifts dramatically across seasons: winter temperatures drop battery capacity and increase crank times naturally. Without covariate shift monitoring, the model triggers hundreds of false electrical alerts every November.',
    architecturalDecisions: [
      {
        decision: 'Drift Monitoring Tooling: Arize AI / Evidently AI',
        chosenApproach: 'Continuous calculation of Population Stability Index (PSI) and Wasserstein Distance on telemetry distributions.',
        rationale: 'Alerts MLOps engineers before model degradation impacts fleet operations.',
        tradeoffs: 'Requires streaming distribution summaries to monitoring sinks.',
      },
      {
        decision: 'Continuous Retraining Pipeline Trigger',
        chosenApproach: 'Weekly batch retrain on verified ground-truth tickets + automated hotfix trigger if PSI > 0.25.',
        rationale: 'Keeps LightGBM and LSTM hyperplanes tuned to changing fleet duty cycles and seasonal weather variations.',
        tradeoffs: 'Requires automated shadow-deployment validation before updating ONNX model weights in production.',
      },
    ],
    keyClarifications: [
      {
        question: 'What is the SOC 2 Type II audit requirement for automated dispatch?',
        answer: 'Every automated work order and vehicle swap must have an immutable audit trail recording the model version, SHAP vector, timestamp, and authorizing human user.',
        impactOnCode: 'Audit metadata stored with every WorkOrder and RiskAssessment object.',
      },
    ],
    externalAIPrompt: {
      title: 'Prompt for MLOps & Production Governance Engineer',
      role: 'Principal MLOps Engineer',
      promptText:
        'Create an automated MLOps monitoring and retraining pipeline specification for FleetPulse using MLflow and Arize. Outline the CI/CD pipeline that takes verified ground-truth mechanic tags, detects feature drift (PSI > 0.2), triggers LightGBM retraining, runs shadow evaluation against holdout fleet validation sets, and updates production ONNX binaries.',
    },
  },
];
