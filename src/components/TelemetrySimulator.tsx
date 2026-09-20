import React, { useState } from 'react';
import { TelemetryPacket, VehicleRiskAssessment, UserRole, TelemetryValidationResult } from '../types';
import {
  Terminal,
  Send,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Flame,
  Droplets,
  ShieldCheck,
  Filter,
  Layers,
  AlertOctagon,
  Lock,
  Cpu,
  Database,
  Radio,
} from 'lucide-react';

interface TelemetrySimulatorProps {
  vehicles: VehicleRiskAssessment[];
  userRole?: UserRole;
  onIngestTelemetry: (packet: TelemetryPacket) => void;
}

export const TelemetrySimulator: React.FC<TelemetrySimulatorProps> = ({
  vehicles,
  userRole = 'ADMINISTRATOR',
  onIngestTelemetry,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.vehicleId || 'FP-104');
  const [coolantTemp, setCoolantTemp] = useState<number>(108.5);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(13.8);
  const [engineRpm, setEngineRpm] = useState<number>(1620);
  const [oilPressure, setOilPressure] = useState<number>(42.1);
  const [rateOfChangeCoolant, setRateOfChangeCoolant] = useState<number>(1.2); // deg C / sec
  const [errorCodes, setErrorCodes] = useState<string>('SPN-110-FMI-0, P0128');
  const [lastValidation, setLastValidation] = useState<TelemetryValidationResult | null>(null);
  const [lastResponse, setLastResponse] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dlqCounter, setDlqCounter] = useState<number>(0);
  const [dlqLog, setDlqLog] = useState<Array<{ timestamp: string; vehicleId: string; reason: string }>>([]);
  const [fastApiVehicleUuid, setFastApiVehicleUuid] = useState<string>('7b1e8472-8822-4a0b-990a-6623d387879e');
  const [fastApiResponse, setFastApiResponse] = useState<any | null>(null);
  const [fastApiLoading, setFastApiLoading] = useState<boolean>(false);

  const handleFetchFastApiRiskScore = async () => {
    setFastApiLoading(true);
    try {
      const res = await fetch(`/api/v1/vehicles/${fastApiVehicleUuid}/risk-score`);
      const data = await res.json();
      setFastApiResponse(data);
    } catch (err: any) {
      setFastApiResponse({ error: err.message || 'Failed to fetch risk score' });
    } finally {
      setFastApiLoading(false);
    }
  };

  const handleGenerateRandomUuid = () => {
    // Generate valid UUID v4
    const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setFastApiVehicleUuid(newUuid);
  };

  const handlePreset = (
    preset: 'OVERHEAT' | 'ALT_FAIL' | 'OIL_DROP' | 'NOMINAL' | 'OUT_OF_BOUNDS_DLQ' | 'SENSOR_NOISE_SPIKE'
  ) => {
    switch (preset) {
      case 'OVERHEAT':
        setCoolantTemp(114.2);
        setBatteryVoltage(14.0);
        setEngineRpm(1850);
        setOilPressure(38.0);
        setRateOfChangeCoolant(2.4);
        setErrorCodes('SPN-110-FMI-0 (Engine Coolant Overheat Critical)');
        break;
      case 'ALT_FAIL':
        setCoolantTemp(90.0);
        setBatteryVoltage(11.2);
        setEngineRpm(1500);
        setOilPressure(45.0);
        setRateOfChangeCoolant(0.2);
        setErrorCodes('SPN-168-FMI-1 (Battery Potential Low)');
        break;
      case 'OIL_DROP':
        setCoolantTemp(94.0);
        setBatteryVoltage(14.1);
        setEngineRpm(1700);
        setOilPressure(24.5);
        setRateOfChangeCoolant(0.5);
        setErrorCodes('SPN-100-FMI-1 (Engine Oil Pressure Low)');
        break;
      case 'NOMINAL':
        setCoolantTemp(89.5);
        setBatteryVoltage(14.2);
        setEngineRpm(1450);
        setOilPressure(48.0);
        setRateOfChangeCoolant(0.1);
        setErrorCodes('');
        break;
      case 'OUT_OF_BOUNDS_DLQ':
        // Physical impossibility: coolant temp exceeds 150C or battery exceeds 32V
        setCoolantTemp(178.5);
        setBatteryVoltage(38.4);
        setEngineRpm(9400);
        setOilPressure(145.0);
        setRateOfChangeCoolant(45.0);
        setErrorCodes('ERR-ADC-OPEN-CIRCUIT-RAIL');
        break;
      case 'SENSOR_NOISE_SPIKE':
        // Instant thermal spike (>15C/s) violating thermal mass laws
        setCoolantTemp(128.0);
        setBatteryVoltage(13.9);
        setEngineRpm(1600);
        setOilPressure(44.0);
        setRateOfChangeCoolant(36.8); // > 15 C/s rate of change
        setErrorCodes('INTERMITTENT-GROUND-LOOSE');
        break;
    }
  };

  const handleSendPacket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const parsedCoolant = parseFloat(coolantTemp.toString());
    const parsedVoltage = parseFloat(batteryVoltage.toString());
    const parsedRpm = parseInt(engineRpm.toString(), 10);
    const parsedOil = parseFloat(oilPressure.toString());

    // Step 1: Ingestion & Validation Logic (Apache Flink Pipeline Simulation)
    let validationStatus: 'VALIDATED' | 'QUARANTINED_DLQ' | 'SENSOR_NOISE_SMOOTHED' = 'VALIDATED';
    let errorMessage: string | undefined = undefined;
    let deadLetterQueueRoute: string | undefined = undefined;
    const boundaryViolations: string[] = [];

    // Check Physical Sensor Boundaries
    if (parsedCoolant < -40 || parsedCoolant > 150) {
      boundaryViolations.push(`Coolant Temp (${parsedCoolant}°C) outside physical envelope [-40°C, 150°C]`);
    }
    if (parsedVoltage < 0 || parsedVoltage > 32) {
      boundaryViolations.push(`Battery Voltage (${parsedVoltage}V) outside dual 12V/24V bus envelope [0V, 32V]`);
    }
    if (parsedRpm < 0 || parsedRpm > 8000) {
      boundaryViolations.push(`Engine RPM (${parsedRpm}) exceeds physical governor limit [0, 8000 RPM]`);
    }
    if (parsedOil < 0 || parsedOil > 120) {
      boundaryViolations.push(`Oil Pressure (${parsedOil} PSI) outside sender envelope [0, 120 PSI]`);
    }

    if (boundaryViolations.length > 0) {
      validationStatus = 'QUARANTINED_DLQ';
      errorMessage = `PHYSICAL_BOUND_VIOLATION: ${boundaryViolations.join('; ')}`;
      deadLetterQueueRoute = 'kafka.telemetry.quarantine.dlq.v1';
    } else if (rateOfChangeCoolant > 15.0) {
      // Step 2: Rate of change (dT/dt) anomaly detection
      validationStatus = 'SENSOR_NOISE_SMOOTHED';
      errorMessage = `THERMAL_MASS_RATE_VIOLATION: Instantaneous coolant dT/dt (${rateOfChangeCoolant}°C/s) exceeds maximum physical thermal gradient (15°C/s). Median filter applied; noise smoothed.`;
    }

    const boundsPassed = boundaryViolations.length === 0;
    const rateValid = rateOfChangeCoolant <= 15.0;

    const valResult: TelemetryValidationResult = {
      passed: boundsPassed && rateValid,
      status: validationStatus,
      quarantineReason: errorMessage,
      boundaryChecks: {
        coolant: parsedCoolant >= -40 && parsedCoolant <= 150,
        voltage: parsedVoltage >= 0 && parsedVoltage <= 32,
        rpm: parsedRpm >= 0 && parsedRpm <= 8000,
        oilPressure: parsedOil >= 0 && parsedOil <= 120,
      },
      rateOfChangeCheck: {
        passed: rateValid,
        thermalSpikeDelta: rateOfChangeCoolant,
      },
      filterAction:
        validationStatus === 'QUARANTINED_DLQ'
          ? 'Quarantined to Dead-Letter Queue (DLQ); Dropped from model inference'
          : validationStatus === 'SENSOR_NOISE_SMOOTHED'
          ? 'Median noise filter applied; smoothed 1Hz stream sent to inference'
          : 'Passthrough nominal telemetry stream',
      dlqTopic: deadLetterQueueRoute,
      mqttTopic: `/fleet/${selectedVehicleId}/telemetry`,
      protocol: 'MQTT 5.0 (TLS 1.3 / mTLS X.509 Cert Validated)',
      inferenceExecuted: validationStatus !== 'QUARANTINED_DLQ',
    };

    setLastValidation(valResult);

    if (validationStatus === 'QUARANTINED_DLQ') {
      setDlqCounter((prev) => prev + 1);
      setDlqLog((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          vehicleId: selectedVehicleId,
          reason: errorMessage || 'Physical boundary violation',
        },
        ...prev.slice(0, 4),
      ]);
    }

    const packet: TelemetryPacket = {
      vehicle_id: selectedVehicleId,
      timestamp: new Date().toISOString(),
      coolant_temp: parsedCoolant,
      battery_voltage: parsedVoltage,
      engine_rpm: parsedRpm,
      oil_pressure: parsedOil,
      error_codes: errorCodes ? errorCodes.split(',').map((c) => c.trim()) : [],
    };

    setTimeout(() => {
      // Only ingest to live fleet state if NOT quarantined in DLQ
      if (validationStatus !== 'QUARANTINED_DLQ') {
        onIngestTelemetry(packet);
      }

      setLastResponse({
        statusCode: validationStatus === 'QUARANTINED_DLQ' ? 422 : 202,
        status: validationStatus === 'QUARANTINED_DLQ' ? 'quarantined_dlq' : 'queued_and_inferred',
        vehicle_id: packet.vehicle_id,
        processed_at: new Date().toISOString(),
        validation_result: valResult,
        onnx_inference_latency_ms: validationStatus === 'QUARANTINED_DLQ' ? null : 3.18,
        pipeline_destination:
          validationStatus === 'QUARANTINED_DLQ'
            ? 'kafka.telemetry.quarantine.dlq.v1'
            : 'timescaledb_hypertable_telemetry_live',
        risk_evaluated:
          validationStatus === 'QUARANTINED_DLQ'
            ? 'DROPPED_FROM_INFERENCE'
            : packet.coolant_temp > 105 || packet.battery_voltage < 12.0
            ? 'ANOMALY_TRIGGERED'
            : 'NOMINAL',
      });
      setIsProcessing(false);
    }, 280);
  };

  return (
    <div id="telemetry-simulator" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>FastAPI REST Ingestion, Flink Validation & ONNX Evaluator</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Live Telemetry Ingestion & Stream Validation Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate 1–10 Hz CAN bus telemetry: MQTT 5.0 mTLS ingestion, Apache Flink boundary & rate-of-change validation, Dead-Letter Queue (DLQ), and sub-10ms ONNX inference.
          </p>
        </div>

        {/* Role Access Indicator */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Security Context:</span>
          <span className="font-bold text-white font-mono">{userRole}</span>
          {userRole !== 'ADMINISTRATOR' && (
            <span className="text-[10px] text-cyan-400 font-mono">(Simulation Sandbox)</span>
          )}
        </div>
      </div>

      {/* Interactive Ingestion Presets */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-300">
          Inject Real-World Scenario:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handlePreset('NOMINAL')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Nominal 1Hz Stream</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('OVERHEAT')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Thermal Overheat</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('ALT_FAIL')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Alternator Drop</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('OIL_DROP')}
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Oil Pressure Bleed</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('OUT_OF_BOUNDS_DLQ')}
            className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900/50 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Out-of-Bounds (DLQ Quarantine)</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('SENSOR_NOISE_SPIKE')}
            className="px-3 py-1.5 rounded-lg bg-yellow-950/80 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/50 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-yellow-400" />
            <span>Thermal Chatter (Noise Filter)</span>
          </button>
        </div>
      </div>

      {/* Validation Pipeline Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ingress Protocol</span>
            <span className="text-xs font-bold text-white font-mono">MQTT 5.0 (mTLS 1.3)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stream Validation</span>
            <span className="text-xs font-bold text-white font-mono">Flink Boundary + dT/dt</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time-Series Storage</span>
            <span className="text-xs font-bold text-white font-mono">TimescaleDB Hypertables</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">DLQ Quarantined</span>
            <span className="text-xs font-bold text-rose-400 font-mono">{dlqCounter} Packets Dropped</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Ingestion Form (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Packet Payload Parameters (Pydantic Schema)
            </h3>
            <p className="text-xs text-slate-400">
              Matches FastAPI TelemetryPacket contract with physical range constraints
            </p>
          </div>

          <form onSubmit={handleSendPacket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Asset ID</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.vehicleId} - {v.makeModel} ({v.driverName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Coolant Temp (°C) [-40 to 150]
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={coolantTemp}
                  onChange={(e) => setCoolantTemp(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Battery Voltage (V) [0 to 32]
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={batteryVoltage}
                  onChange={(e) => setBatteryVoltage(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Engine RPM [0 to 8000]
                </label>
                <input
                  type="number"
                  required
                  value={engineRpm}
                  onChange={(e) => setEngineRpm(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Oil Pressure (PSI) [0 to 120]
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={oilPressure}
                  onChange={(e) => setOilPressure(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Rate-of-Change Parameter */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Thermal Gradient Rate of Change (dT/dt °C/sec)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Max Physical: 15.0°C/s</span>
              </div>
              <input
                type="number"
                step="0.1"
                required
                value={rateOfChangeCoolant}
                onChange={(e) => setRateOfChangeCoolant(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Active J1939 Diagnostic Trouble Codes (DTCs)
              </label>
              <input
                type="text"
                placeholder="Comma separated SPN / FMI fault codes"
                value={errorCodes}
                onChange={(e) => setErrorCodes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Flink Validation & ONNX Scoring...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>POST to /api/v1/telemetry (Validate & Ingest)</span>
                </>
              )}
            </button>
          </form>

          {/* Dead-Letter Queue (DLQ) Audit Log */}
          {dlqLog.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-rose-400 flex items-center space-x-1.5 mb-2">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Dead-Letter Queue (DLQ) Quarantine Stream</span>
              </span>
              <div className="space-y-1.5">
                {dlqLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] p-2 rounded bg-rose-950/40 border border-rose-900/50 text-rose-300 flex justify-between items-center"
                  >
                    <span className="font-mono">{log.timestamp} • [{log.vehicleId}]</span>
                    <span className="text-[10px] text-rose-400 truncate max-w-xs">{log.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Ingestion Console & Validation Results (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl font-mono text-xs flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[11px] text-slate-300 font-bold ml-2">Pipeline Telemetry Inspection</span>
            </div>
            <span className="text-[10px] text-cyan-400">MQTT ➔ Flink ➔ ONNX</span>
          </div>

          {/* Validation Status Card */}
          {lastValidation && (
            <div
              className={`p-3 rounded-xl border ${
                lastValidation.status === 'VALIDATED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : lastValidation.status === 'SENSOR_NOISE_SMOOTHED'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs mb-1">
                <span className="flex items-center space-x-1.5">
                  {lastValidation.status === 'VALIDATED' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {lastValidation.status === 'SENSOR_NOISE_SMOOTHED' && <Filter className="w-4 h-4 text-amber-400" />}
                  {lastValidation.status === 'QUARANTINED_DLQ' && <AlertOctagon className="w-4 h-4 text-rose-400" />}
                  <span>Stage 2 Result: {lastValidation.status}</span>
                </span>
                <span className="text-[10px] font-mono">
                  {lastValidation.boundaryChecks.coolant &&
                  lastValidation.boundaryChecks.voltage &&
                  lastValidation.boundaryChecks.rpm &&
                  lastValidation.boundaryChecks.oilPressure
                    ? 'Bounds: OK'
                    : 'Bounds: VIOLATION'}{' '}
                  • {lastValidation.rateOfChangeCheck.passed ? 'dT/dt: OK' : 'dT/dt: CHATTER'}
                </span>
              </div>
              {lastValidation.quarantineReason && (
                <p className="text-[11px] mt-1 leading-relaxed opacity-90">{lastValidation.quarantineReason}</p>
              )}
              {lastValidation.dlqTopic && (
                <span className="text-[10px] font-mono block mt-1 text-rose-400">
                  Route: {lastValidation.dlqTopic}
                </span>
              )}
            </div>
          )}

          <div className="text-slate-400 text-[11px]">
            <span className="text-indigo-400 font-bold">MQTT.PUBLISH</span> /fleet/{selectedVehicleId}/telemetry
            <br />
            <span className="text-slate-500">Security:</span> mTLS 1.3 (Device X.509 CN: {selectedVehicleId}-dongle-iot)
            <br />
            <span className="text-slate-500">Payload Encoding:</span> Google Protocol Buffers (Protobuf v3)
          </div>

          {/* Response payload */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span
                className={`font-bold ${
                  lastResponse?.statusCode === 202
                    ? 'text-emerald-400'
                    : lastResponse?.statusCode === 422
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {lastResponse
                  ? `Pipeline Return: HTTP ${lastResponse.statusCode} (${lastResponse.status})`
                  : 'Awaiting telemetry packet...'}
              </span>
              {lastResponse?.onnx_inference_latency_ms && (
                <span className="text-slate-400 text-[10px]">
                  ONNX Latency: <strong className="text-cyan-400">{lastResponse.onnx_inference_latency_ms} ms</strong>
                </span>
              )}
            </div>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 overflow-x-auto max-h-72">
              <pre>
                {lastResponse
                  ? JSON.stringify(lastResponse, null, 2)
                  : '// Press "POST to /api/v1/telemetry" to simulate telemetry ingestion'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* FastAPI Microservice Real-Time Risk Score Inspector */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl font-sans">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">
                  FastAPI Real-Time Telematics Risk Score API
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  HTTP 200 OK
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                GET /api/v1/vehicles/<span className="text-cyan-400">&#123;vehicle_id: uuid.UUID&#125;</span>/risk-score
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleGenerateRandomUuid}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New UUID v4</span>
            </button>
            <button
              type="button"
              onClick={handleFetchFastApiRiskScore}
              disabled={fastApiLoading}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${fastApiLoading ? 'animate-spin' : ''}`} />
              <span>{fastApiLoading ? 'Executing Inference...' : 'Invoke FastAPI Endpoint'}</span>
            </button>
          </div>
        </div>

        {/* Input bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <div className="md:col-span-8">
            <label className="text-[11px] font-mono text-slate-400 mb-1 block">
              Path Parameter: vehicle_id (uuid.UUID or Fleet Asset ID)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={fastApiVehicleUuid}
                onChange={(e) => setFastApiVehicleUuid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 7b1e8472-8822-4a0b-990a-6623d387879e"
              />
            </div>
          </div>
          <div className="md:col-span-4 flex items-end">
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Quick Fleet IDs:</span>
              {['FP-042', 'FP-104', 'FP-208'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFastApiVehicleUuid(id)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] cursor-pointer"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Response Render */}
        {fastApiResponse && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
            {/* Visual Risk Summary Cards */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Failure Prob</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    {(fastApiResponse.failure_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Risk Level</span>
                  <span
                    className={`text-xs font-bold font-mono uppercase px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                      fastApiResponse.risk_level === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : fastApiResponse.risk_level === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {fastApiResponse.risk_level}
                  </span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Days to Fail</span>
                  <span className="text-base font-bold font-mono text-amber-300">
                    {fastApiResponse.estimated_days_to_failure}d
                  </span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Subsystem</span>
                  <span className="text-xs font-bold text-white truncate block mt-0.5">
                    {fastApiResponse.primary_subsystem}
                  </span>
                </div>
              </div>

              {/* TreeSHAP Explanations list */}
              <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>TreeSHAP Mechanic Feature Attributions (`shap_explanations`)</span>
                  <span className="text-[10px] font-mono text-cyan-400">Pydantic Model Validated</span>
                </div>
                {Array.isArray(fastApiResponse.shap_explanations) &&
                  fastApiResponse.shap_explanations.map((exp: any, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-mono text-[11px] text-cyan-300 font-bold block">
                          {exp.feature}
                        </span>
                        <p className="text-slate-300 text-xs mt-0.5">{exp.message}</p>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                        {exp.impact}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Raw JSON Schema Output */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                <span className="font-mono font-bold text-indigo-400">Response Payload (JSON)</span>
                <span className="font-mono text-[10px] text-slate-500">model: RiskScoreResponse</span>
              </div>
              <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56">
                {JSON.stringify(fastApiResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
