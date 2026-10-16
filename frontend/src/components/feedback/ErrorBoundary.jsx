import React, { Component } from 'react';
import Button from '../ui/Button';

/**
 * ErrorBoundary: Captura excepciones no controladas en el árbol de componentes (HU-17).
 * Previene la "pantalla blanca de la muerte" (White Screen of Death) y ofrece recuperación limpia.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Registrar el error de forma segura en consola para diagnóstico
    console.error('[CampusControl ErrorBoundary]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isNetworkOrBackend =
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('fetch') ||
        error?.message?.toLowerCase().includes('backend') ||
        error?.message?.toLowerCase().includes('servidor');

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[420px] w-full flex flex-col items-center justify-center p-6 text-center animate-fluid-enter"
        >
          <div className="max-w-md w-full bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] rounded-[1.25rem] p-6 shadow-2xl relative overflow-hidden">
            {/* Gradiente sutil superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF453A] via-[#FF9F0A] to-[#2563EB]" />

            {/* Icono de Alerta */}
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 flex items-center justify-center text-[#FF453A] mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-extrabold text-[#F5F5F7] tracking-tight">
              {isNetworkOrBackend
                ? 'Conexión Interrumpida con el Servidor'
                : 'Se produjo un error inesperado'}
            </h2>

            <p className="text-xs text-[#A1A1A6] mt-2 leading-relaxed">
              {isNetworkOrBackend
                ? 'El backend no respondió a tiempo o se está reiniciando. No te preocupes, el sistema resguardó tu sesión y puedes reintentar.'
                : error?.message ||
                  'Ocurrió una excepción al procesar la vista. Hemos capturado el fallo para evitar el bloqueo del campus.'}
            </p>

            {/* Acciones de recuperación */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button variant="primary" size="sm" onClick={this.handleReset} className="w-full sm:w-auto">
                Reintentar vista
              </Button>
              <Button variant="outline" size="sm" onClick={this.handleReload} className="w-full sm:w-auto">
                Recargar página
              </Button>
              <Button variant="ghost" size="sm" onClick={this.handleGoDashboard} className="w-full sm:w-auto">
                Ir a Inicio
              </Button>
            </div>

            {/* Detalles técnicos colapsables */}
            {process.env.NODE_ENV !== 'production' && error && (
              <details className="mt-6 text-left border-t border-[rgba(255,255,255,0.06)] pt-4">
                <summary className="text-[11px] font-mono text-[#A1A1A6] cursor-pointer hover:text-[#F5F5F7]">
                  Detalles técnicos (Desarrollo)
                </summary>
                <pre className="mt-2 text-[10px] text-[#FF453A] bg-[#2C2C2E]/60 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                  {error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
