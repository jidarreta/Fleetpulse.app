import React, { useState } from 'react';
import { ShapExplanation } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Activity, AlertOctagon, CheckCircle2, Info, ArrowUpRight, ArrowDownRight, BarChart3, ListOrdered } from 'lucide-react';

interface ShapVisualizerProps {
  explanations: ShapExplanation[];
  failureProbability: number;
  primarySubsystem: string;
}

export const ShapVisualizer: React.FC<ShapVisualizerProps> = ({
  explanations,
  failureProbability,
  primarySubsystem,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');
  const maxAbsScore = Math.max(...explanations.map((e) => Math.abs(e.impactScore)), 0.5);

  // Transform for Recharts
  const rechartsData = explanations.map((e) => ({
    feature: e.feature.length > 24 ? `${e.feature.slice(0, 22)}...` : e.feature,
    fullFeature: e.feature,
    impact: parseFloat(e.impactScore.toFixed(3)),
    message: e.humanReadableMessage,
    isRisk: e.impactScore > 0,
  }));

  return (
    <div id="shap-breakdown-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Explainable AI (TreeSHAP) Root-Cause Diagnostic
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LightGBM ONNX
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Feature contribution attribution translating ML metrics into human-readable mechanic messages
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2 py-1 text-xs font-medium rounded flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar Chart</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-1 text-xs font-medium rounded flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
          </div>

          <div className="text-right pl-2">
            <span className="text-[10px] font-mono text-slate-400 block">Subsystem:</span>
            <span className="text-xs font-bold text-indigo-300 uppercase">{primarySubsystem}</span>
          </div>
        </div>
      </div>

      {/* Probability summary bar */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              failureProbability >= 0.8
                ? 'bg-rose-500 shadow-rose-500/50 shadow-md'
                : failureProbability >= 0.6
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
          <div>
            <span className="text-xs font-medium text-slate-300">Composite ML Failure Risk:</span>
            <span className="ml-2 text-base font-bold font-mono text-white">
              {(failureProbability * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Baseline Prior: 12.4% ➔ Anomaly Delta: +{((failureProbability - 0.124) * 100).toFixed(1)}%
        </div>
      </div>

      {/* View 1: Recharts Bar Chart View */}
      {viewMode === 'chart' && (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2 px-1">
            <span>SHAP Feature Contribution (log-odds impact)</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="text-rose-400 flex items-center gap-1 font-mono">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Drives Failure Risk (+)
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Protective Normal (-)
              </span>
            </div>
          </div>

          <div className="h-52 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rechartsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  width={130}
                />
                <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    maxWidth: '320px',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(3)} log-odds`, 'SHAP Impact']}
                  labelFormatter={(lbl: any, payload: any) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.fullFeature} — "${item.message}"` : lbl;
                  }}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {rechartsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isRisk ? '#f43f5e' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* View 2: Detailed Mechanic Explanations Cards */}
      <div className="space-y-2.5 pt-1">
        {explanations.map((exp, idx) => {
          const isRisk = exp.impactScore > 0;
          const percentageWidth = Math.min(100, Math.round((Math.abs(exp.impactScore) / maxAbsScore) * 85));

          return (
            <div
              key={idx}
              id={`shap-feature-${idx}`}
              className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  {isRisk ? (
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs font-semibold text-slate-200">{exp.feature}</span>
                </div>
                <div className="font-mono text-xs font-bold">
                  <span className={isRisk ? 'text-rose-400' : 'text-emerald-400'}>
                    {isRisk ? `+${exp.impactScore.toFixed(2)}` : exp.impactScore.toFixed(2)} log-odds
                  </span>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden my-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isRisk ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${percentageWidth}%` }}
                />
              </div>

              {/* Plain language actionable translation for mechanic */}
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed pl-6 flex items-start">
                <span className="text-slate-300 font-medium">"{exp.humanReadableMessage}"</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Mechanic Plain Language Summary Callout */}
      <div className="mt-2 bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-3 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-300 leading-normal">
          <strong className="text-indigo-300 font-semibold block mb-0.5">Automated Mechanic Diagnostic Direction:</strong>
          {failureProbability >= 0.8
            ? `Immediate inspection advised on ${primarySubsystem}. Primary root-cause points to thermal/pressure variance exceeding calibrated OEM thresholds by >18%. Schedule depot bay intervention prior to interstate dispatch.`
            : `Subsystem operates within allowable wear thresholds. Continue standard telemetry monitoring at 10Hz sampling.`}
        </div>
      </div>
    </div>
  );
};
