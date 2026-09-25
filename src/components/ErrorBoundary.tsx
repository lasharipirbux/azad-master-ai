import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCw, Trash2, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('⚠️ [Azad Master Error Boundary Caught]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('azad_master_') || key.startsWith('firebase:'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear local storage in Error Boundary:', e);
    }
    window.location.reload();
  };

  private handleSafeMode = () => {
    try {
      localStorage.setItem('azad_master_active_session_v2', JSON.stringify({
        uid: 'guest_safe_mode_' + Date.now(),
        name: 'Master Tailor',
        mode: 'direct',
        createdAt: new Date().toISOString()
      }));
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'نامعلوم خرابی پیش آئی ہے (Unknown runtime error)';
      const isRtl = true;

      return (
        <div 
          dir={isRtl ? 'rtl' : 'ltr'}
          className="min-h-screen flex items-center justify-center p-4 selection:bg-[#25d366] selection:text-white"
          style={{
            background: 'radial-gradient(circle at 50% 30%, #075e54 0%, #064e46 35%, #053b35 70%, #032824 100%)',
          }}
        >
          {/* Ambient background glows */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[90px]" />
          </div>

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-7 relative z-10 border border-slate-200">
            {/* Header Icon & Brand */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-sm animate-bounce">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                آزاد ماسٹر — محفوظ ریکوری موڈ
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Azad Master Safe Recovery Mode • Error Boundary
              </p>
            </div>

            {/* Error Message Box */}
            <div className="mb-5 p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed font-sans">
              <p className="font-bold mb-1 flex items-center gap-1.5 text-rose-700">
                <span>⚠️ خرابی کی تفصیل (Error Summary):</span>
              </p>
              <p className="font-mono text-[11px] bg-white/70 p-2 rounded border border-rose-100 break-all select-all">
                {errorMessage}
              </p>
              <p className="text-[11px] text-slate-600 mt-2">
                براؤزر یا کیشے میں کسی غلط ڈیٹا کی وجہ سے اسکرین وائٹ ہونے سے روکنے کے لیے یہ ریکوری ونڈو دکھائی جا رہی ہے۔ آپ نیچے دیئے گئے بٹنوں سے ایپ فوری بحال کر سکتے ہیں۔
              </p>
            </div>

            {/* Recovery Action Buttons */}
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full bg-[#075e54] hover:bg-[#054c44] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>دوبارہ لوڈ کریں (Reload Application)</span>
              </button>

              <button
                type="button"
                onClick={this.handleSafeMode}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>محفوظ موڈ میں کھولیں (Safe Mode Start)</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 active:scale-[0.98] font-bold py-2.5 px-4 rounded-xl border border-slate-300 hover:border-rose-300 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>کیشے صاف کریں اور ری سیٹ کریں (Reset Corrupted Cache)</span>
              </button>
            </div>

            {/* Technical Trace Accordion */}
            {this.state.errorInfo && (
              <details className="mt-3 pt-3 border-t border-slate-100 text-left" dir="ltr">
                <summary className="text-[11px] font-mono text-slate-500 cursor-pointer hover:text-slate-800 select-none">
                  View Technical Stack Trace
                </summary>
                <pre className="mt-2 text-[10px] font-mono bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto max-h-36">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Azad Master Tailoring App • Protected by Safe Error Boundary
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
