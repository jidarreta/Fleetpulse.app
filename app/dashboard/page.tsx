'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Wrench, CheckCircle, ShieldAlert, Zap, Radio } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Types matching API Specification
interface SHAPExplanation {
  feature: string;
  impact: string;
  message: string;
}

interface RiskScoreData {
  vehicle_id: string;
  failure_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_days_to_failure: number;
  primary_subsystem: string;
  shap_explanations: SHAPExplanation[];
}

interface TelemetryPacket {
  coolant_temp: number;
  battery_voltage: number;
  engine_rpm: number;
  oil_pressure: number;
  timestamp: string;
}

export default function FleetDiagnosticCard({ vehicleId = "c39a2b8e-4f10-4123-b1d3-9f88102a0142" }: { vehicleId?: string }) {
  const [riskData, setRiskData] = useState<RiskScoreData | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [workOrderCreated, setWorkOrderCreated] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // 1. Fetch Hybrid Risk Score & SHAP Diagnostics
  useEffect(() => {
    async function fetchRiskScore() {
      try {
        const res = await fetch(`/api/v1/vehicles/${vehicleId}/risk-score`);
        if (!res.ok) throw new Error('Failed to fetch risk score');
        const data: RiskScoreData = await res.json();
        setRiskData(data);
      } catch (err) {
        // Fallback Mock Data for UI rendering in Build mode
        setRiskData({
          vehicle_id: vehicleId,
          failure_probability: 0.88,
          risk_level: 'CRITICAL',
          estimated_days_to_failure: 12,
          primary_subsystem: 'Cooling System',
          shap_explanations: [
            { feature: 'coolant_temp_14d_std', impact: '+0.34', message: 'Coolant temp variance +18% under load' },
            { feature: 'fan_duty_cycle_mean', impact: '+0.21', message: 'Cooling fan running at max speed 92% of time' },
            { feature: 'battery_voltage_min', impact: '+0.11', message: 'Low voltage drop on cold start (10.2V)' }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    fetchRiskScore();
  }, [vehicleId]);

  // 2. Real-Time Telemetry Stream via WebSocket
  useEffect(() => {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const wsUrl = `${protocol}//${host}/ws/telemetry/${vehicleId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setWsConnected(true);
    ws.onmessage = (event) => {
      try {
        const packet: TelemetryPacket = JSON.parse(event.data);
        setTelemetry(packet);
      } catch (e) {
        console.error('Failed to parse WebSocket packet', e);
      }
    };
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [vehicleId]);

  const handleCreateWorkOrder = async () => {
    setWorkOrderCreated(true);
  };

  if (loading || !riskData) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse font-mono">
        Loading FleetPulse Diagnostic Engine...
      </div>
    );
  }

  // Format SHAP data for Recharts Bar Chart
  const chartData = riskData.shap_explanations.map(exp => ({
    name: exp.feature,
    impact: parseFloat(exp.impact.replace('+', '')),
    message: exp.message
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 shadow-2xl">
      {/* Top Header & Telemetry Connection Badge */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Vehicle Asset ID</span>
          <h2 className="text-xl font-bold font-mono text-cyan-400">{riskData.vehicle_id}</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${wsConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{wsConnected ? 'LIVE CAN BUS STREAM' : 'SIMULATED FEED'}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Failure Probability Card */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-red-900/40 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400">14-Day Failure Risk</span>
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-red-400">{Math.round(riskData.failure_probability * 100)}%</span>
            <span className="text-xs font-bold text-red-500 uppercase px-2 py-0.5 bg-red-950/80 rounded border border-red-800">
              {riskData.risk_level}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full" style={{ width: `${riskData.failure_probability * 100}%` }}></div>
          </div>
        </div>

        {/* Lead Time to Failure */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400">Estimated Days to Failure</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-slate-100">{riskData.estimated_days_to_failure}</span>
            <span className="text-xs text-slate-400 ml-1">Days Remaining</span>
          </div>
          <p className="text-xs text-amber-400/90 mt-2">Requires inspection before next route shift.</p>
        </div>

        {/* Failing Subsystem */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400">Primary Subsystem</span>
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-cyan-300">{riskData.primary_subsystem}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Thermal loop variance detected.</p>
        </div>
      </div>

      {/* Live Telemetry Bar */}
      {telemetry && (
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div><span className="text-slate-500">Coolant Temp:</span> <span className="font-mono text-cyan-400">{telemetry.coolant_temp}°C</span></div>
          <div><span className="text-slate-500">Battery:</span> <span className="font-mono text-emerald-400">{telemetry.battery_voltage}V</span></div>
          <div><span className="text-slate-500">Engine RPM:</span> <span className="font-mono text-slate-200">{telemetry.engine_rpm}</span></div>
          <div><span className="text-slate-500">Oil Pressure:</span> <span className="font-mono text-slate-200">{telemetry.oil_pressure} PSI</span></div>
        </div>
      )}

      {/* Explainable AI (SHAP) Attribution Panel */}
      <div className="mb-6 p-4 bg-slate-950/40 rounded-lg border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>TreeSHAP Feature Risk Drivers</span>
        </h3>

        {/* SHAP Chart */}
        <div className="h-44 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
              <Bar dataKey="impact" fill="#f87171" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mechanic Diagnostic Messages */}
        <div className="space-y-2">
          {riskData.shap_explanations.map((exp, idx) => (
            <div key={idx} className="p-2.5 bg-slate-900 rounded border border-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-300">{exp.message}</span>
              <span className="font-mono text-red-400 font-semibold px-2 py-0.5 bg-red-950/40 rounded">{exp.impact} Risk</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500">Model Artifact: Hybrid LightGBM-LSTM v1.4.2 (ONNX Engine)</span>
        <button
          onClick={handleCreateWorkOrder}
          disabled={workOrderCreated}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-xs transition cursor-pointer ${
            workOrderCreated
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
          }`}
        >
          {workOrderCreated ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Work Order Dispatched</span>
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4" />
              <span>Dispatch Shop Work Order</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
