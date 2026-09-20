import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthRole } from '../types';
import {
  Activity,
  Shield,
  Wrench,
  LayoutDashboard,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, quickLoginAs } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<AuthRole>('OPERATIONS_MANAGER');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        const res = await register(name, email, password, role);
        if (!res.success) {
          setErrorMsg(res.message || 'Registration failed. Please check your credentials.');
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Invalid email or password. Check demo credentials below.');
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (selectedRole: AuthRole) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await quickLoginAs(selectedRole);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Quick login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="auth-page-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            FleetPulse<span className="text-cyan-400">.ai</span>
          </span>
        </div>
        <h2 className="text-center text-sm font-medium text-slate-400">
          Heavy-Duty Fleet Health & Predictive Maintenance Platform
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-2xl">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isRegisterMode
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isRegisterMode
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Rivera"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@fleetpulse.io"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Role & Operational Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('OPERATIONS_MANAGER')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'OPERATIONS_MANAGER'
                        ? 'bg-cyan-500/15 border-cyan-500 text-white ring-1 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[11px] font-bold text-white">Operations Manager</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Fleet Command Center, risk matrix, SLA avoidance, 1-click dispatch.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('FLEET_MECHANIC')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'FLEET_MECHANIC'
                        ? 'bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] font-bold text-white">Fleet Mechanic</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Mechanic Copilot, SHAP diagnostics, parts queue, closed-loop tagging.
                    </p>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : isRegisterMode ? 'Create Account & Sign In' : 'Sign In with JWT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                1-Click Demo Profiles
              </span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                Server Bcrypt + JWT
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('OPERATIONS_MANAGER')}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>Sarah Jenkins</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        OPERATIONS_MANAGER
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">ops@fleetpulse.io</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('FLEET_MECHANIC')}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>Dave "Mac" MacIntyre</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        FLEET_MECHANIC
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">mechanic@fleetpulse.io</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center space-x-2 text-slate-500 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected by Express JWT Middleware &amp; Bcrypt 10-Round Salt Hashing</span>
        </div>
      </div>
    </div>
  );
};
