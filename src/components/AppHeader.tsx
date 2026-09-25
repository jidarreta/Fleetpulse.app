import React, { useState } from 'react';
import {
  Activity, ArrowDownToLine, BrainCircuit, Check, ChevronDown, Cpu,
  LayoutDashboard, Layers, LogOut, Radio, Wrench,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { AppView } from '../navigation';

interface AppHeaderProps {
  currentTab: AppView;
  onNavigate: (view: AppView) => void;
  pendingOrderCount: number;
  user: User | null;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onExport: () => void;
  isExporting: boolean;
  onLogout: () => void;
}

const roleOptions: { role: UserRole; label: string }[] = [
  { role: 'FLEET_MANAGER', label: 'Fleet manager' },
  { role: 'MECHANIC', label: 'Mechanic' },
  { role: 'ADMINISTRATOR', label: 'Administrator' },
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab, onNavigate, pendingOrderCount, user, currentUserRole,
  onRoleChange, onExport, isExporting, onLogout,
}) => {
  const [openMenu, setOpenMenu] = useState<'ai' | 'platform' | 'account' | null>(null);
  const navigate = (view: AppView) => {
    onNavigate(view);
    setOpenMenu(null);
  };
  const isAIActive = currentTab === 'HYBRID_ML' || currentTab === 'AI_6_PHASES';
  const isPlatformActive = currentTab === 'DEPLOYMENT_TOPOLOGY' || currentTab === 'TELEMETRY_SIMULATOR';
  const navClass = (active: boolean) =>
    `inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      active ? 'bg-blue-50 text-blue-800 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  const dropdownClass = 'absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10';
  const menuItemClass = 'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <button type="button" onClick={() => navigate('COMMAND_CENTER')} className="flex shrink-0 items-center gap-3 rounded-xl text-left" aria-label="FleetPulse home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-blue-600 text-white shadow-md shadow-blue-600/15">
            <Activity className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight text-slate-900">FleetPulse<span className="text-blue-600">.ai</span></span>
            <span className="block text-[11px] text-slate-500">Fleet operations</span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Systems live
          </div>
          <button type="button" onClick={onExport} disabled={isExporting} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            <ArrowDownToLine className="h-4 w-4" />
            <span className="hidden sm:inline">{isExporting ? 'Preparing…' : 'Export report'}</span>
          </button>

          <div className="relative">
            <button type="button" onClick={() => setOpenMenu(openMenu === 'account' ? null : 'account')} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:bg-slate-50" aria-expanded={openMenu === 'account'} aria-haspopup="menu" aria-label="Account and workspace role">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">{user?.name?.charAt(0) || 'F'}</span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-28 truncate text-xs font-semibold text-slate-900">{user?.name || 'FleetPulse user'}</span>
                <span className="block text-[10px] text-slate-500">{currentUserRole === 'FLEET_MANAGER' ? 'Fleet manager' : currentUserRole === 'MECHANIC' ? 'Mechanic' : 'Administrator'}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {openMenu === 'account' && (
              <div className={`${dropdownClass} right-0 left-auto w-64`} role="menu" aria-label="Account menu">
                <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Workspace role</p>
                {roleOptions.map(({ role, label }) => (
                  <button key={role} type="button" role="menuitemradio" aria-checked={currentUserRole === role} onClick={() => { onRoleChange(role); setOpenMenu(null); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    {label}{currentUserRole === role && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
                <div className="my-2 border-t border-slate-100" />
                <button type="button" role="menuitem" onClick={() => { setOpenMenu(null); onLogout(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Main navigation" className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 pb-3 sm:px-8">
        <button type="button" onClick={() => navigate('COMMAND_CENTER')} className={navClass(currentTab === 'COMMAND_CENTER')}>
          <LayoutDashboard className="h-4 w-4" /> Fleet
        </button>
        <button type="button" onClick={() => navigate('MECHANIC_COPILOT')} className={navClass(currentTab === 'MECHANIC_COPILOT')}>
          <Wrench className="h-4 w-4" /> Work orders
          {pendingOrderCount > 0 && <span className="ml-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">{pendingOrderCount}</span>}
        </button>

        <div className="relative">
          <button type="button" onClick={() => setOpenMenu(openMenu === 'ai' ? null : 'ai')} className={navClass(isAIActive)} aria-expanded={openMenu === 'ai'} aria-haspopup="menu">
            <BrainCircuit className="h-4 w-4" /> AI &amp; analytics <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {openMenu === 'ai' && (
            <div className={dropdownClass} role="menu" aria-label="AI and analytics">
              <button type="button" role="menuitem" onClick={() => navigate('HYBRID_ML')} className={menuItemClass}>
                <Cpu className="mt-0.5 h-4 w-4 text-blue-600" />
                <span><span className="block text-sm font-semibold text-slate-900">AI architecture</span><span className="mt-0.5 block text-xs text-slate-500">Models and risk scoring</span></span>
              </button>
              <button type="button" role="menuitem" onClick={() => navigate('AI_6_PHASES')} className={menuItemClass}>
                <BrainCircuit className="mt-0.5 h-4 w-4 text-blue-600" />
                <span><span className="block text-sm font-semibold text-slate-900">AI lifecycle</span><span className="mt-0.5 block text-xs text-slate-500">Six phases and decisions</span></span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => setOpenMenu(openMenu === 'platform' ? null : 'platform')} className={navClass(isPlatformActive)} aria-expanded={openMenu === 'platform'} aria-haspopup="menu">
            <Layers className="h-4 w-4" /> Platform <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {openMenu === 'platform' && (
            <div className={dropdownClass} role="menu" aria-label="Platform tools">
              <button type="button" role="menuitem" onClick={() => navigate('DEPLOYMENT_TOPOLOGY')} className={menuItemClass}>
                <Layers className="mt-0.5 h-4 w-4 text-blue-600" />
                <span><span className="block text-sm font-semibold text-slate-900">System architecture</span><span className="mt-0.5 block text-xs text-slate-500">Deployment and connections</span></span>
              </button>
              <button type="button" role="menuitem" onClick={() => navigate('TELEMETRY_SIMULATOR')} className={menuItemClass}>
                <Radio className="mt-0.5 h-4 w-4 text-blue-600" />
                <span><span className="block text-sm font-semibold text-slate-900">Telemetry lab</span><span className="mt-0.5 block text-xs text-slate-500">Explore incoming vehicle data</span></span>
              </button>
            </div>
          )}
        </div>

        <button type="button" onClick={() => navigate('DIAGNOSTIC_CARD')} className={navClass(currentTab === 'DIAGNOSTIC_CARD')}>
          <Radio className="h-4 w-4" /> Diagnostics
        </button>
      </nav>
    </header>
  );
};
