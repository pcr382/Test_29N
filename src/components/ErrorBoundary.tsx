import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CONTACTO_EMAIL } from '../config';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onNavigateHome?: () => void;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary atrapó un error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome();
    } else {
      window.location.hash = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">
              Esta pantalla no se ha podido mostrar
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ha ocurrido un error inesperado al procesar los datos de esta vista.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={this.handleGoHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Volver al inicio</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs">
            <a
              href={`mailto:${CONTACTO_EMAIL}?subject=${encodeURIComponent('Error en Test 29N')}`}
              className="text-slate-600 hover:text-slate-900 underline underline-offset-2"
            >
              ¿Has visto un error?
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
