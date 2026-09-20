import React, { useState } from 'react';
import { VehicleRiskAssessment } from '../types';
import { Truck, Navigation, AlertTriangle, ShieldCheck, MapPin, Gauge } from 'lucide-react';

interface InteractiveMapProps {
  vehicles: VehicleRiskAssessment[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const [hoveredVehicle, setHoveredVehicle] = useState<VehicleRiskAssessment | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  // Midwest corridor bounding box coordinates
  // Lat: 39.8 to 43.0, Lng: -90.5 to -85.5
  const minLat = 39.8;
  const maxLat = 43.0;
  const minLng = -90.5;
  const maxLng = -85.5;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(92, y)) };
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filterRisk === 'ALL') return true;
    return v.riskLevel === filterRisk;
  });

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500',
          border: 'border-rose-600',
          ring: 'ring-rose-400',
          text: 'text-rose-400',
          fill: '#f43f5e',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-600',
          ring: 'ring-amber-400',
          text: 'text-amber-400',
          fill: '#f59e0b',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          ring: 'ring-yellow-400',
          text: 'text-yellow-400',
          fill: '#eab308',
        };
      default:
        return {
          bg: 'bg-emerald-500',
          border: 'border-emerald-600',
          ring: 'ring-emerald-400',
          text: 'text-emerald-400',
          fill: '#10b981',
        };
    }
  };

  return (
    <div id="fleet-map-container" className="relative w-full h-[480px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/60 shadow-lg pointer-events-auto flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 tracking-wide">Midwest Freight Corridor (I-80 / I-90 / I-65)</span>
          </div>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-300 font-mono">{vehicles.length} Active Tractors</span>
        </div>

        {/* Risk Filter Chips */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-lg pointer-events-auto flex items-center space-x-1">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
            <button
              key={risk}
              id={`filter-map-${risk.toLowerCase()}`}
              onClick={() => setFilterRisk(risk)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                filterRisk === risk
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 w-full h-full bg-[#0b1120] select-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle grid mesh */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.15" />
            </pattern>
            {/* Gradient for Lake Michigan */}
            <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          <rect width="100" height="100" fill="url(#grid)" />

          {/* Lake Michigan visual outline */}
          <path
            d="M 52,0 C 58,15 62,28 60,42 C 58,48 54,54 50,56 C 47,56 46,50 48,36 C 49,20 48,10 47,0 Z"
            fill="url(#lakeGrad)"
            stroke="#334155"
            strokeWidth="0.3"
          />
          <text x="56" y="24" fill="#475569" fontSize="2.8" fontWeight="600" letterSpacing="0.2">
            Lake Michigan
          </text>

          {/* Major Interstate Highway Corridors */}
          {/* I-90 / I-80 corridor */}
          <path
            d="M 5,30 Q 30,35 48,56 T 95,64"
            fill="none"
            stroke="#334155"
            strokeWidth="0.8"
            strokeDasharray="1.5,1.5"
          />
          {/* I-65 Southbound */}
          <path
            d="M 48,56 L 68,96"
            fill="none"
            stroke="#334155"
            strokeWidth="0.8"
            strokeDasharray="1.5,1.5"
          />
          {/* I-55 Southwest */}
          <path
            d="M 48,56 L 20,95"
            fill="none"
            stroke="#334155"
            strokeWidth="0.8"
            strokeDasharray="1.5,1.5"
          />

          {/* Major Metropolitan Hub Labels */}
          <g className="text-slate-500 font-sans">
            <circle cx="48" cy="56" r="1.2" fill="#64748b" />
            <text x="50" y="58" fill="#94a3b8" fontSize="2.4" fontWeight="600">
              Chicago Terminal Hub
            </text>

            <circle cx="70" cy="94" r="0.9" fill="#475569" />
            <text x="72" y="95" fill="#64748b" fontSize="2.0">
              Indianapolis Depot
            </text>

            <circle cx="32" cy="22" r="0.9" fill="#475569" />
            <text x="34" y="23" fill="#64748b" fontSize="2.0">
              Milwaukee Central
            </text>

            <circle cx="21" cy="94" r="0.9" fill="#475569" />
            <text x="23" y="95" fill="#64748b" fontSize="2.0">
              Bloomington Yard
            </text>
          </g>

          {/* Connect Selected Vehicle to Depot with route line */}
          {selectedVehicleId && (() => {
            const v = vehicles.find((item) => item.vehicleId === selectedVehicleId);
            if (!v) return null;
            const p = project(v.lat, v.lng);
            return (
              <line
                x1={p.x}
                y1={p.y}
                x2="48"
                y2="56"
                stroke="#38bdf8"
                strokeWidth="0.5"
                strokeDasharray="1,1"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* Vehicle Interactive Pins */}
        {filteredVehicles.map((v) => {
          const { x, y } = project(v.lat, v.lng);
          const isSelected = v.vehicleId === selectedVehicleId;
          const colors = getStatusColor(v.riskLevel);

          return (
            <div
              key={v.vehicleId}
              id={`map-pin-${v.vehicleId}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onSelectVehicle(v.vehicleId)}
              onMouseEnter={() => setHoveredVehicle(v)}
              onMouseLeave={() => setHoveredVehicle(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20 group"
            >
              {/* Pulsing ring for critical/high assets */}
              {(v.riskLevel === 'CRITICAL' || v.riskLevel === 'HIGH') && (
                <span
                  className={`absolute -inset-2 rounded-full animate-ping opacity-60 ${colors.bg}`}
                />
              )}

              {/* Pin body */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg transition-all ${
                  colors.bg
                } ${colors.border} ${
                  isSelected ? 'ring-4 ring-cyan-400 scale-110 shadow-cyan-500/50' : ''
                }`}
              >
                <Truck className="w-4 h-4 text-white" />
              </div>

              {/* Badge label */}
              <div
                className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md pointer-events-none ${
                  isSelected ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'bg-slate-900/90 text-slate-200 border border-slate-700'
                }`}
              >
                {v.vehicleId} ({(v.failureProbability * 100).toFixed(0)}%)
              </div>
            </div>
          );
        })}

        {/* Hover / Active Detail Card Overlay */}
        {hoveredVehicle && (
          <div
            className="absolute bottom-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-2xl w-80 pointer-events-none animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white font-mono">{hoveredVehicle.vehicleId}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      getStatusColor(hoveredVehicle.riskLevel).bg
                    } text-white`}
                  >
                    {hoveredVehicle.riskLevel} RISK
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">{hoveredVehicle.makeModel}</p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-white font-mono">
                  {(hoveredVehicle.failureProbability * 100).toFixed(0)}%
                </span>
                <span className="block text-[10px] text-slate-400">Failure Prob</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-slate-500" /> Current Route
                </span>
                <p className="text-slate-200 truncate font-mono text-[10px]">{hoveredVehicle.currentRoute}</p>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-500" /> Speed & Est. Days
                </span>
                <p className="text-slate-200 font-mono text-[10px]">
                  {hoveredVehicle.speedMph} mph | <span className="text-rose-400 font-bold">{hoveredVehicle.estimatedDaysToFailure}d to breakdown</span>
                </p>
              </div>
            </div>

            <div className="mt-2 text-[11px] bg-slate-800/80 p-2 rounded border border-slate-700/60">
              <span className="text-slate-400 block text-[10px]">Primary Anomaly:</span>
              <span className="text-amber-300 font-medium leading-tight">
                {hoveredVehicle.shapExplanations[0]?.humanReadableMessage || 'Subsystem nominal'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Critical (&gt;80% Prob)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>High Risk (70-79%)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
            <span>Watch (30-69%)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Normal (&lt;30%)</span>
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          GIS Projection: WGS84 | 10Hz MQTT Stream
        </div>
      </div>
    </div>
  );
};
