import React, { useState } from 'react';
import {
  Radio,
  Flame,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface LiveTelemetryStreamSimulatorProps {
  onSimulationTriggered?: (type: string, message: string) => void;
}

export const LiveTelemetryStreamSimulator: React.FC<LiveTelemetryStreamSimulatorProps> = ({
  onSimulationTriggered,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const handleSimulate = async (type: 'COOLING_OVERHEAT' | 'BATTERY_DECAY' | 'RESET') => {
    setIsLoading(true);
    setLastActionStatus(null);
    try {
      const endpoint =
        type === 'RESET' ? '/api/v1/telemetry/reset' : '/api/v1/telemetry/simulate-spike';

      const body =
        type === 'RESET'
          ? undefined
          : JSON.stringify({
              type,
              vehicleId: type === 'COOLING_OVERHEAT' ? 'FP-042' : 'FP-209',
            });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body } : {}),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLastActionStatus(json.message);
        onSimulationTriggered?.(type, json.message);
      } else {
        setLastActionStatus(json.message || 'Simulation command failed');
      }
    } catch (err: any) {
      setLastActionStatus(`Failed to contact simulator backend: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      id="live-telemetry-simulator-widget"
      aria-label="Live Telemetry Stream Simulator"
      className="fixed bottom-4 right-4 z-50 transition-all duration-300 max-w-sm w-[92vw] sm:w-96"
    >
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Widget Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                Live Telemetry Stream Simulator
              </span>
              <span className="text-[10px] text-cyan-300 font-mono block">
                CAN Bus Anomaly Injection
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Widget' : 'Expand Widget'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Widget Body */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inject real-time CAN bus telemetry anomalies to test the LightGBM &amp; PyTorch LSTM inference pipeline, 
              risk matrix scoring, and mechanic dispatch.
            </p>

            {/* Simulator Action Buttons */}
            <div className="space-y-2">
              {/* Button 1: Trigger Cooling Overheat (Truck #42) */}
              <button
                id="btn-simulate-cooling-overheat"
                disabled={isLoading}
                onClick={() => handleSimulate('COOLING_OVERHEAT')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-500/60 transition-all text-left group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition-transform">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                      Trigger Cooling Overheat (Truck #42)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Spikes FP-042 coolant to 114.8°C (+18% variance)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                  96% Risk
                </span>
              </button>

              {/* Button 2: Simulate Battery Voltage Decay */}
              <button
                id="btn-simulate-battery-decay"
                disabled={isLoading}
                onClick={() => handleSimulate('BATTERY_DECAY')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-amber-900/40 hover:border-amber-500/60 transition-all text-left group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Simulate Battery Voltage Decay
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Drops alternator bus to 11.2V (FP-209)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  91% Risk
                </span>
              </button>

              {/* Button 3: Reset Fleet Baseline */}
              <button
                id="btn-simulate-reset-baseline"
                disabled={isLoading}
                onClick={() => handleSimulate('RESET')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 transition-all text-left group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Reset Fleet Baseline
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Restores all CAN sensors to nominal baselines
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  Nominal
                </span>
              </button>
            </div>

            {/* Feedback message */}
            {lastActionStatus && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{lastActionStatus}</span>
              </div>
            )}

            {/* Footer metadata */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" />
                SSE Stream Active
              </span>
              <span>10 Hz Sampling</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
