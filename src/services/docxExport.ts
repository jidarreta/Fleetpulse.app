import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { VehicleRiskAssessment, WorkOrder } from '../types';
import { AI_6_PHASES } from '../data/mockFleetData';

export async function generateFleetPulseDocx(
  vehicles: VehicleRiskAssessment[],
  workOrders: WorkOrder[]
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'FleetPulse Production Build Specification',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'End-to-End Architectural Solution, Telemetry Validation & AI 6-Phase Engineering Report',
                italics: true,
                size: 24,
                color: '4A5568',
              }),
            ],
            spacing: { after: 400 },
          }),

          // Section 1: Executive Overview
          new Paragraph({
            text: '1. Executive Product Vision & Dual SaaS Ecosystem',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'FleetPulse is an enterprise-grade predictive telematics and explainable AI platform designed for commercial logistics carriers and heavy-duty shop floors. The ecosystem bridges two critical operational personas:\n\n',
              }),
              new TextRun({
                text: '• Fleet Command Center (Web Desktop App): ',
                bold: true,
              }),
              new TextRun({
                text: 'For Operations Directors and Dispatchers to monitor live geo-spatial assets, prioritize fleet-wide failure probabilities, assess SLA financial risks, and execute preventative vehicle swaps.\n',
              }),
              new TextRun({
                text: '• Mechanic Copilot (Tablet/Mobile Web App): ',
                bold: true,
              }),
              new TextRun({
                text: 'For shop technicians to receive prioritized repair work orders, inspect SHAP root-cause telemetry breakdowns, view rolling 7d/14d/30d baselines, query ERP inventory stock, and submit closed-loop ground-truth tags.\n',
              }),
            ],
            spacing: { after: 250 },
          }),

          // Section 2: AI 6-Phase Lifecycle
          new Paragraph({
            text: '2. The AI 6-Phase Engineering Lifecycle: Deep Dive & Decisions',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: 'A structured walk-through of the six machine learning development phases, explaining why each design choice was made, operational trade-offs, and technical rationale:',
            spacing: { after: 200 },
          }),

          ...AI_6_PHASES.flatMap((phase) => [
            new Paragraph({
              text: `${phase.title} — ${phase.subtitle}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 250, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Operational Objective: ', bold: true }),
                new TextRun({ text: phase.summary + '\n' }),
                new TextRun({ text: 'Why We Do This: ', bold: true }),
                new TextRun({ text: phase.whyWeDoThis + '\n' }),
              ],
              spacing: { after: 150 },
            }),
            new Paragraph({
              text: 'Key Architectural Decisions & Trade-Offs:',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 100, after: 80 },
            }),
            ...phase.architecturalDecisions.flatMap((ad) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${ad.decision}: `, bold: true }),
                  new TextRun({ text: `${ad.chosenApproach} ` }),
                  new TextRun({ text: `[Rationale: ${ad.rationale}] `, italics: true }),
                ],
                spacing: { after: 80 },
              }),
            ]),
            new Paragraph({
              text: 'Specialist AI Prompt for Technical Review:',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 100, after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Role: ${phase.externalAIPrompt.role}\n`, bold: true, color: '2B6CB0' }),
                new TextRun({ text: `"${phase.externalAIPrompt.promptText}"`, italics: true }),
              ],
              spacing: { after: 200 },
            }),
          ]),

          // Section 3: Ingestion & Validation Architecture
          new Paragraph({
            text: '3. Vehicle Telemetry Ingestion & Stream Validation Strategy',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Data Sources & Edge Capture:\n', bold: true }),
              new TextRun({
                text: '• Physical Bus: Commercial vehicles broadcast diagnostics via SAE J1939 CAN bus through heavy-duty 9-pin Type II Deutsch connectors and OBD-II dongles.\n• Edge Polling: Telematics control units (TCUs) sample J1939 Parameter Group Numbers (PGNs) at 10Hz (Coolant Temp SPN 110, Battery Potential SPN 168, Engine Speed SPN 190, Oil Pressure SPN 100).\n• Edge Deadband Compression: Dongles apply deadband filtering—transmitting only when sensor values deviate by >1.0% or every 5 seconds, reducing cellular payload overhead by 65%.\n\n',
              }),
              new TextRun({ text: 'Ingestion Protocol & Security:\n', bold: true }),
              new TextRun({
                text: '• Transport: MQTT 5.0 with QoS 1 over TLS 1.3 on port 8883 to AWS IoT Core / EMQX broker cluster.\n• Authentication: Hardware-backed Mutual TLS (mTLS) with X.509 device certificates generated during vehicle onboarding.\n• Serialization: Google Protocol Buffers (Protobuf v3) for compact, strongly-typed binary serialization.\n\n',
              }),
              new TextRun({ text: 'Real-Time Stream Validation (Apache Flink):\n', bold: true }),
              new TextRun({
                text: '• Tier 1 (Physical Boundary Checks): Coolant Temp [-40°C, 150°C], Battery Voltage [0V, 32V], RPM [0, 8000], Oil Pressure [0, 120 PSI]. Values violating physical bounds are rejected immediately.\n• Tier 2 (Thermal Inertia Rate-of-Change dT/dt): Coolant temperature cannot physically rise >15°C/second due to thermal mass. Sudden spikes indicate loose ground or sensor ADC chatter. A median smoothing filter is applied, preventing false roadside engine shutdowns.\n• Tier 3 (Dead-Letter Queue Routing): Corrupted or out-of-bounds frames are diverted to kafka.telemetry.quarantine.dlq.v1 for cryptographic auditing and hardware diagnostics.\n• Tier 4 (Sub-10ms Inference): Validated telemetry streams directly to compiled ONNX LightGBM runtimes, outputting real-time risk scores in under 4ms.\n\n',
              }),
              new TextRun({ text: 'TimescaleDB Storage, Continuous Aggregates & Retention (timescale_pipeline.sql):\n', bold: true }),
              new TextRun({
                text: '• Base Table & Hypertable: vehicle_telemetry partitioned along recorded_at with 8 vehicle_id hash partitions and 1-day chunk time intervals. Accelerated via idx_vehicle_telemetry_lookup on (vehicle_id, recorded_at DESC).\n• 1-Minute Continuous Aggregates: Materialized view telemetry_1min_avg down-samples 10 Hz telemetry into time-weighted stats (stats_agg, AVG, STDDEV, MIN, MAX) on a 1-minute refresh schedule, eliminating model feature calculation bottlenecks.\n• Compression & Retention Policies: Segmented by vehicle_id and ordered by recorded_at DESC, achieving ~90% compression for chunks older than 7 days, with automated 90-day TTL data retention.',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Section 4: Machine Learning Architecture & Production Python Modules
          new Paragraph({
            text: '4. Machine Learning Architecture: PyTorch 2.0 LSTM & Hybrid ONNX Serving',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'PyTorch 2.0 Sequence Model (VehicleLSTMPredictor in hybrid_model.py):\n', bold: true }),
              new TextRun({
                text: '• Input Tensor: Shape (batch_size, 14, 5) representing a 14-day rolling sequence of 5 core engineered telematics signals (coolant temp max, battery voltage min, oil pressure variance, engine load-weighted RPM, active DTC count).\n• Neural Architecture: 2-layer stacked LSTM (input_dim=5, hidden_dim=64, num_layers=2, dropout=0.20), batch normalization over the terminal temporal step, followed by dense projection to a Sigmoid activation.\n• ONNX Compilation: Exported via torch.onnx.export with dynamic batch axes and opset=17, yielding sub-4ms tensor evaluations.\n\n',
              }),
              new TextRun({ text: 'Hybrid Ensemble Architecture (FleetPulseEnsemble in hybrid_model.py):\n', bold: true }),
              new TextRun({
                text: '• Meta-Score Equation: Blended via 0.60 * LightGBM_Score + 0.40 * LSTM_Score.\n• Concurrent Execution: Evaluates both ONNX Runtime sessions simultaneously using thread pools to eliminate serialization lag.\n• Calibrated Risk Tiers: Maps blended probabilities into operational urgency thresholds: CRITICAL (>=85%), HIGH (>=65%), MEDIUM (>=35%), LOW (<35%), alongside estimated operational days to failure.\n\n',
              }),
              new TextRun({ text: 'FastAPI Microservice & TreeSHAP Explanations (inference_router.py):\n', bold: true }),
              new TextRun({
                text: '• REST Endpoint: GET /api/v1/vehicles/{vehicle_id}/risk-score returning VehicleRiskAssessment schema.\n• Dual-Tier Feature Store: In-memory Redis hot caching with continuous aggregate fallback to TimescaleDB hypertables.\n• Mechanic Translation Layer: Extracts top-3 anomalous features from TreeSHAP values and maps raw metrics into actionable technician guidance (e.g., "Coolant temperature variance elevated +18% under highway gradient load").',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Section 5: Role-Based Access Control (RBAC)
          new Paragraph({
            text: '5. Role-Based Access Control (RBAC) Governance Framework',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: 'To ensure operational integrity and regulatory compliance, FleetPulse enforces strict separation of concerns across three core personas:',
            spacing: { after: 150 },
          }),
          createRbacTable(),

          // Section 6: Monitored Assets
          new Paragraph({
            text: '6. Current Monitored Assets & Risk Matrix',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          createFleetTable(vehicles),

          // Section 7: Closed-Loop Ground-Truth Verification Log
          new Paragraph({
            text: '7. Closed-Loop Ground-Truth Verification Log',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: 'Work orders executed through the Mechanic Copilot with shop ground-truth verification tags for continuous retraining:',
            spacing: { after: 150 },
          }),
          ...workOrders.map(
            (wo) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `[${wo.id}] ${wo.vehicleId} (${wo.makeModel}) - Status: ${wo.status}\n`, bold: true }),
                  new TextRun({ text: `Priority: ${wo.priority} | Subsystem: ${wo.primarySubsystem} | Failure Prob: ${(wo.failureProbability * 100).toFixed(0)}%\n` }),
                  new TextRun({ text: `Shop Schedule: ${wo.scheduledShopDate} | Assigned: ${wo.assignedMechanic || 'Unassigned'}\n` }),
                  new TextRun({ text: `Parts: ${wo.partsRequired.map((p: { name: string; qty: number }) => `${p.name} (Qty: ${p.qty})`).join(', ')}\n` }),
                  wo.closedLoopFeedback
                    ? new TextRun({
                        text: `Ground-Truth Tag: ${wo.closedLoopFeedback.tag} | Root Cause: ${wo.closedLoopFeedback.rootCauseIdentified} | Mechanic: ${wo.closedLoopFeedback.mechanicId}\n`,
                        bold: true,
                        color: wo.closedLoopFeedback.tag === 'FAILURE_CONFIRMED' ? '22543D' : '742A2A',
                      })
                    : new TextRun({ text: 'Ground-Truth Tag: Pending shop completion\n', italics: true }),
                ],
                spacing: { after: 150 },
              })
          ),

          // Section 8: Phase 4 Production Deployment Topology & Infrastructure Hardening
          new Paragraph({
            text: '8. Phase 4 Production Deployment Topology & Multi-Service Network Isolation',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Structural Risk 1: FastAPI Direct ALB Exposure & Mitigation:\n', bold: true }),
              new TextRun({
                text: '• Vulnerability: Exposing the FastAPI prediction service directly to an internet-facing Application Load Balancer bypasses authentication enforcement, leaving low-latency ONNX scoring workers vulnerable to unauthenticated DDoS attacks.\n• Architectural Resolution: Enforce AWS API Gateway HTTP API at the public ingress with JWT Bearer signature verification, token-bucket rate limiting (180 req/min per IP), and private VPC Link to backend workers. FastAPI microservices reside strictly in private subnets.\n\n',
              }),
              new TextRun({ text: 'Structural Risk 2: WebSocket Ingestion Statefulness & Mitigation:\n', bold: true }),
              new TextRun({
                text: '• Vulnerability: Standard ALB default stickiness breaks streaming telemetry WebSockets when ECS Fargate tasks auto-scale horizontally or recycle during blue/green deployments.\n• Architectural Resolution: Decoupled WebSocket state from container process memory into Redis 7 Pub/Sub channels (fleetpulse:telemetry:stream). Clients reconnect to any active node and resume the event stream without telemetry packet loss.\n\n',
              }),
              new TextRun({ text: 'Multi-Service Network Isolation & Docker Compose Environment (docker-compose.yml):\n', bold: true }),
              new TextRun({
                text: '• app_network (Bridge 1): Connects nextjs_frontend (Port 3000) to fastapi_backend (Port 8000).\n• data_network (Bridge 2 - Isolated): Air-gapped network connecting fastapi_backend to timescaledb (Port 5432, persistent volume timescaledb_data) and redis_cache (Port 6379).\n• Production ECS Fargate Alignment: Accurately mirrors AWS ECS task definition security groups, private VPC subnet segmentation, and container health checks (pg_isready -U admin -d fleetpulse).',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Section 9: Conclusion & Roadmap
          new Paragraph({
            text: '9. Production Build Roadmap & Next Milestones',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• Phase 1 (Months 1–3): Ingestion pipeline, Flink stream validation, TimescaleDB hypertables, baseline LightGBM model.\n• Phase 2 (Months 4–6): Fleet Command Center dashboard, TreeSHAP explainability visualizer, granular RBAC.\n• Phase 3 (Months 7–9): Mechanic Copilot tablet UX, 1-click work orders, closed-loop ground-truth tagging.\n• Phase 4 (Months 10–12): Enterprise ERP integrations (Decisiv/Karmak), automated Arize/MLflow drift retraining, SOC 2 Type II compliance.',
              }),
            ],
            spacing: { after: 300 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

function createRbacTable(): Table {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'CCCCCC',
  };

  const borders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'User Role', bold: true })] })],
        width: { size: 18, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Primary Responsibilities', bold: true })] })],
        width: { size: 27, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Command Center Rights', bold: true })] })],
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Mechanic Copilot Rights', bold: true })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders,
      }),
    ],
  });

  const roles = [
    {
      role: 'Fleet Manager',
      resp: 'Fleet operations, dispatch optimization, delivery SLA compliance, preventative vehicle swaps.',
      commandCenter: 'Full: Live asset map, risk ranking, 1-click dispatch, vehicle swaps, SLA downtime cost analytics.',
      mechanicCopilot: 'Read-Only: View work order status and shop turnaround times. Restricted from status mutations and ground-truth tagging.',
    },
    {
      role: 'Mechanic',
      resp: 'Depot diagnostics, physical repairs, parts replacement, ground-truth failure verification.',
      commandCenter: 'Limited: View vehicle list and subsystem SHAP diagnostics. Restricted from dispatching and financial SLA metrics.',
      mechanicCopilot: 'Full: Prioritized repair queue, ERP inventory reservation, bay time logging, mandatory ground-truth failure tags.',
    },
    {
      role: 'Administrator',
      resp: 'System governance, IoT credential provisioning, MLOps model retraining, audit trails.',
      commandCenter: 'Full Administrative: All operational and configuration controls.',
      mechanicCopilot: 'Full Administrative: All diagnostic tools, pipeline simulation, DLQ inspection, and MLOps retraining queues.',
    },
  ];

  const dataRows = roles.map(
    (r) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: r.role, bold: true })] })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: r.resp })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: r.commandCenter })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: r.mechanicCopilot })],
            borders,
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function createFleetTable(vehicles: VehicleRiskAssessment[]): Table {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'CCCCCC',
  };

  const borders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Vehicle ID', bold: true })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Make / Model', bold: true })] })],
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Risk Level', bold: true })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Failure Prob', bold: true })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Est. Days', bold: true })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Subsystem', bold: true })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders,
      }),
    ],
  });

  const dataRows = vehicles.map(
    (v) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: v.vehicleId })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: v.makeModel })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: v.riskLevel })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: `${(v.failureProbability * 100).toFixed(0)}%` })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: `${v.estimatedDaysToFailure} days` })],
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ text: v.primarySubsystem })],
            borders,
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}
