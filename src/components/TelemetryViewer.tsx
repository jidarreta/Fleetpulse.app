import React, { useState } from 'react';
import { TelemetryReading } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { Activity, Clock, Play, Pause, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TelemetryViewerProps {
  telemetry: TelemetryReading[];
  vehicleId: string;
}

type SensorMetric = 'coolantTemp' | 'batteryVoltage' | 'oilPressure' | 'engineRpm';

export const TelemetryViewer: React.FC<TelemetryViewerProps> = ({ telemetry, vehicleId }) => {
  const [selectedMetric, setSelectedMetric] = useState<SensorMetric>('coolantTemp');
  const [windowRange, setWindowRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [isStreaming, setIsStreaming] = useState(true);

  const metricConfig: Record<
    SensorMetric,
    {
      name: string;
      unit: string;
      baselineKey: keyof TelemetryReading;
      min: number;
      max: number;
      color: string;
      baselineColor: string;
      safeRange: [number, number];
    }
  > = {
    coolantTemp: {
      name: 'Engine Coolant Temperature',
      unit: '°C',
      baselineKey: 'coolantTempBaseline',
      min: 70,
      max: 125,
      color: '#f43f5e', // Rose
      baselineColor: '#38bdf8', // Sky
      safeRange: [85, 96],
    },
    batteryVoltage: {
      name: 'Alternator & Battery Voltage',
      unit: 'V',
      baselineKey: 'batteryVoltageBaseline',
      min: 9.0,
      max: 16.0,
      color: '#f59e0b', // Amber
      baselineColor: '#10b981', // Emerald
      safeRange: [13.6, 14.4],
    },
    oilPressure: {
      name: 'Engine Oil Pressure',
      unit: 'PSI',
      baselineKey: 'oilPressureBaseline',
      min: 20,
      max: 65,
      color: '#a855f7', // Purple
      baselineColor: '#06b6d4', // Cyan
      safeRange: [40, 52],
    },
    engineRpm: {
      name: 'Engine Rotational Speed',
      unit: 'RPM',
      baselineKey: 'engineRpmBaseline',
      min: 600,
      max: 2400,
      color: '#3b82f6', // Blue
      baselineColor: '#64748b', // Slate
      safeRange: [1200, 1700],
    },
  };

  const currentCfg = metricConfig[selectedMetric];

  // Filter or slice based on window range (7d = last 10, 14d = last 14, 30d = all 18)
  const windowSlice =
    windowRange === '7d' ? 10 : windowRange === '14d' ? 14 : telemetry.length;
  const slicedTelemetry = telemetry.slice(Math.max(0, telemetry.length - windowSlice));

  // Format chart data for Recharts
  const chartData = slicedTelemetry.map((pt, idx) => {
    const d = new Date(pt.timestamp);
    const timeLabel = isNaN(d.getTime())
      ? `T-${slicedTelemetry.length - idx}h`
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      time: timeLabel,
      timestamp: pt.timestamp,
      actual: pt[selectedMetric] as number,
      baseline: pt[currentCfg.baselineKey] as number,
      safeMin: currentCfg.safeRange[0],
      safeMax: currentCfg.safeRange[1],
    };
  });

  const lastReading = chartData[chartData.length - 1];
  const isOutOfSpec =
    lastReading &&
    (lastReading.actual > currentCfg.safeRange[1] || lastReading.actual < currentCfg.safeRange[0]);

  return (
    <div id="telemetry-recharts-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              High-Frame-Rate Telemetry vs Historical Baseline Corridor
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Recharts TimescaleDB
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              TimescaleDB continuous aggregate over rolling operating windows ({windowRange})
            </p>
          </div>
        </div>

        {/* Rolling Window & Stream Toggles */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center space-x-1">
            {(['7d', '14d', '30d'] as const).map((win) => (
              <button
                key={win}
                id={`btn-window-${win}`}
                onClick={() => setWindowRange(win)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                  windowRange === win
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {win}
              </button>
            ))}
          </div>

          <button
            id="btn-toggle-telemetry-stream"
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isStreaming
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Live Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>Paused</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sensor Metric Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(metricConfig) as SensorMetric[]).map((key) => {
          const cfg = metricConfig[key];
          const isSelected = selectedMetric === key;
          const currentVal = telemetry[telemetry.length - 1]?.[key] as number;

          return (
            <button
              key={key}
              id={`metric-btn-${key}`}
              onClick={() => setSelectedMetric(key)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 truncate">
                {cfg.name.split(' ')[0]}
              </div>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span
                  className="text-base font-extrabold font-mono"
                  style={{ color: isSelected ? cfg.color : '#e2e8f0' }}
                >
                  {currentVal?.toFixed(key === 'batteryVoltage' ? 2 : 1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">{cfg.unit}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Baseline: {cfg.safeRange[0]}–{cfg.safeRange[1]} {cfg.unit}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Recharts Chart Area */}
      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 relative">
        {/* Out of Spec Alert Badge */}
        {isOutOfSpec && (
          <div className="absolute top-4 right-4 z-10 bg-rose-500/20 border border-rose-500/50 px-2.5 py-1 rounded-md flex items-center space-x-1.5 text-rose-300 text-xs font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Out-of-corridor thermal anomaly</span>
          </div>
        )}

        <div className="h-64 w-full select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                domain={[currentCfg.min, currentCfg.max]}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                unit={currentCfg.unit}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                formatter={(val: any, name: any) => {
                  const num = Number(val);
                  return [
                    `${num.toFixed(selectedMetric === 'batteryVoltage' ? 2 : 1)} ${currentCfg.unit}`,
                    name === 'actual' ? 'Live Sensor Value' : 'Baseline Envelope',
                  ];
                }}
              />

              {/* Normal Operating Baseline Corridor */}
              <ReferenceArea
                y1={currentCfg.safeRange[0]}
                y2={currentCfg.safeRange[1]}
                fill="#0284c7"
                fillOpacity={0.12}
                stroke="#0284c7"
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />

              {/* Baseline reference line */}
              <ReferenceLine
                y={(currentCfg.safeRange[0] + currentCfg.safeRange[1]) / 2}
                stroke={currentCfg.baselineColor}
                strokeDasharray="4 4"
                opacity={0.6}
              />

              {/* Baseline Curve */}
              <Line
                type="monotone"
                dataKey="baseline"
                stroke={currentCfg.baselineColor}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="baseline"
              />

              {/* Actual Live Sensor Stream */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke={currentCfg.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: currentCfg.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ffffff', stroke: currentCfg.color, strokeWidth: 2 }}
                name="actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-900 px-2 font-mono">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: currentCfg.color }} />
              <span className="text-slate-300">Live CAN Bus ({vehicleId})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span
                className="w-3 h-0.5 border-t border-dashed"
                style={{ borderColor: currentCfg.baselineColor }}
              />
              <span>Nominal Baseline Corridor ({currentCfg.safeRange[0]}–{currentCfg.safeRange[1]} {currentCfg.unit})</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Sampling: 10 Hz down-sampled to 1-min TimescaleDB buckets
          </span>
        </div>
      </div>
    </div>
  );
};
