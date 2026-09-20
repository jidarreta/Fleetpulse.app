import React, { useState } from 'react';
import { AI_6_PHASES } from '../data/mockFleetData';
import { PythonModulesViewer } from './PythonModulesViewer';
import { Phase4DeploymentTopologyStudio } from './Phase4DeploymentTopologyStudio';
import {
  BrainCircuit,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Scale,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
} from 'lucide-react';

interface AIPhaseCycleHubProps {
  onExportDocx: () => void;
  isExporting: boolean;
}

export const AIPhaseCycleHub: React.FC<AIPhaseCycleHubProps> = ({
  onExportDocx,
  isExporting,
}) => {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const activePhase = AI_6_PHASES[activePhaseIndex];

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 3000);
  };

  const getPhaseIcon = (num: number) => {
    switch (num) {
      case 1:
        return <Scale className="w-4 h-4" />;
      case 2:
        return <Layers className="w-4 h-4" />;
      case 3:
        return <BrainCircuit className="w-4 h-4" />;
      case 4:
        return <Cpu className="w-4 h-4" />;
      case 5:
        return <ShieldCheck className="w-4 h-4" />;
      case 6:
        return <Activity className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div id="ai-6-phase-hub" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>AI 6-Phase Engineering Lifecycle & Clarification Framework</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            FleetPulse AI Co-Architecting Walkthrough
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Understand every design decision, why it was chosen, trade-offs, and how each component directly
            translates into production software. Export the entire technical architecture to Microsoft Word (.docx).
          </p>
        </div>

        <button
          id="btn-download-docx-hub"
          onClick={onExportDocx}
          disabled={isExporting}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          <span>{isExporting ? 'Packaging .docx...' : 'Download Full Project Report (.docx)'}</span>
        </button>
      </div>

      {/* 6-Phase Timeline Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {AI_6_PHASES.map((phase, idx) => {
          const isActive = idx === activePhaseIndex;

          return (
            <button
              key={phase.id}
              onClick={() => setActivePhaseIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/40 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Phase {phase.phaseNumber}
                </span>
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                  {getPhaseIcon(phase.phaseNumber)}
                </span>
              </div>
              <h4 className="text-xs font-bold truncate">{phase.title.split(':')[1]?.trim() || phase.title}</h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{phase.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Active Phase Deep-Dive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What & Why + Architectural Decisions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* What & Why Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400">
                Phase {activePhase.phaseNumber} Deep Dive
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">{activePhase.title}</h3>
              <p className="text-xs text-indigo-300 font-medium">{activePhase.subtitle}</p>
            </div>

            {/* What we are doing */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> What We Are Doing
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {activePhase.summary}
              </p>
            </div>

            {/* Why we are doing it */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Why We Are Doing It (Business & Engineering Rationale)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {activePhase.whyWeDoThis}
              </p>
            </div>
          </div>

          {/* Architectural Decisions & Tradeoffs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                Architectural Decisions & Trade-Offs
              </h3>
              <p className="text-xs text-slate-400">
                Evaluating alternatives and justifications for the chosen design patterns
              </p>
            </div>

            <div className="space-y-3.5">
              {activePhase.architecturalDecisions.map((ad, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">{ad.decision}</span>

                  <div className="text-xs">
                    <span className="text-slate-400 font-medium">Chosen Approach: </span>
                    <span className="text-cyan-300 font-semibold">{ad.chosenApproach}</span>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 font-medium">Technical Rationale: </span>
                    <span className="text-slate-300">{ad.rationale}</span>
                  </div>

                  <div className="text-[11px] bg-slate-900/90 p-2.5 rounded border border-slate-800 text-amber-300/90">
                    <strong>Engineering Trade-Off:</strong> {ad.tradeoffs}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clarifications & External AI Prompt (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Clarifications & Impact on Code */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Key Clarifications & Code Translation
              </h3>
              <p className="text-xs text-slate-400">
                How specific operational questions directly map into software logic
              </p>
            </div>

            <div className="space-y-3">
              {activePhase.keyClarifications.map((kc, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-indigo-300">
                    Q: {kc.question}
                  </div>
                  <div className="text-xs text-slate-300">
                    A: {kc.answer}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    Code Impact: {kc.impactOnCode}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specialist External AI Prompt */}
          <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-700/50 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Prompt for Other AI / Specialists
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Ready to Copy
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Use this tailored prompt to consult specialized AI models (e.g. Gemini Pro, Claude, ChatGPT) or external engineering experts regarding this phase:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
              <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                Target Persona: {activePhase.externalAIPrompt.role}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed select-all">
                "{activePhase.externalAIPrompt.promptText}"
              </p>

              <button
                onClick={() =>
                  handleCopyPrompt(activePhase.externalAIPrompt.promptText, activePhase.id)
                }
                className="mt-3 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md"
              >
                {copiedPromptId === activePhase.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Prompt Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt for External AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 4 Dedicated Production Deployment Topology & Docker Compose Studio */}
      {activePhase.phaseNumber === 4 && (
        <div className="pt-2">
          <Phase4DeploymentTopologyStudio />
        </div>
      )}

      {/* Production Python ML & FastAPI Serving Architecture */}
      <PythonModulesViewer />
    </div>
  );
};
