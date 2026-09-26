import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('FleetPulse render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fleet-theme flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 py-10">
          <section role="alert" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-9 w-9 text-amber-600" />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">FleetPulse couldn’t load this view</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Your saved fleet data is kept on this device. Reload the app and try again.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <RotateCcw className="h-4 w-4" /> Reload FleetPulse
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
