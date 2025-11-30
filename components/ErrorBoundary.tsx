import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-500 font-tech p-4">
          <div className="max-w-md w-full bg-slate-900/80 border border-red-900/50 p-8 rounded-sm shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center relative overflow-hidden">
            
            {/* Background noise */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-red-500 animate-pulse" />
            
            <h1 className="text-2xl font-bold tracking-widest text-red-500 mb-2">SYSTEM FAILURE</h1>
            <p className="font-data text-red-200/70 mb-6 text-sm">
              Critical runtime error detected. The simulation has been suspended to prevent memory corruption.
            </p>

            <div className="bg-black/50 p-4 rounded text-left mb-6 overflow-hidden">
                <code className="text-[10px] text-red-400 font-mono break-all">
                    {this.state.error?.message || 'Unknown Error'}
                </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-900/20 border border-red-500/50 hover:bg-red-900/40 text-red-100 transition-all uppercase tracking-widest text-xs font-bold"
            >
              <RefreshCcw size={16} />
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}