import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SuccessMessage from '../components/feedback/SuccessMessage';
import ErrorMessage from '../components/feedback/ErrorMessage';
import ErrorBoundary from '../components/feedback/ErrorBoundary';

/**
 * AppLayout: Contenedor principal con fondo #000000, Navbar superior fija y <Outlet />.
 * Soporta banners/toasts globales de feedback (HU-17).
 */
export default function AppLayout() {
  const [globalFeedback, setGlobalFeedback] = useState(null);

  // Leer usuario guardado o fallback seguro
  let currentUser = { role: 'ADMIN', name: 'Mafe Q' };
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  } catch (e) {
    // fallback
  }

  // Listener para eventos de feedback personalizados entre componentes desacoplados
  useEffect(() => {
    const handleCustomFeedback = (e) => {
      if (e.detail) {
        setGlobalFeedback(e.detail);
      }
    };
    window.addEventListener('campus:feedback', handleCustomFeedback);
    return () => window.removeEventListener('campus:feedback', handleCustomFeedback);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F7] flex flex-col selection:bg-[#2563EB] selection:text-white antialiased">
      {/* Skip to main content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2563EB] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Saltar al contenido principal
      </a>

      {/* Navbar Superior Fija */}
      <Navbar userRole={currentUser.role || 'ADMIN'} userName={currentUser.name || 'Mafe'} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 pt-16 flex flex-col w-full focus:outline-none" tabIndex={-1}>
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Global Notification Toast / Banner */}
          {globalFeedback && (
            <div className="mb-6 animate-fluid-enter">
              {globalFeedback.type === 'error' ? (
                <ErrorMessage
                  title={globalFeedback.title || 'Error del Sistema'}
                  message={globalFeedback.message}
                  onClose={() => setGlobalFeedback(null)}
                />
              ) : (
                <SuccessMessage
                  title={globalFeedback.title || 'Operación Exitosa'}
                  message={globalFeedback.message}
                  onClose={() => setGlobalFeedback(null)}
                />
              )}
            </div>
          )}

          {/* Renderizado de rutas hijas protegido contra pantallas blancas de error */}
          <ErrorBoundary>
            <Outlet context={{ setGlobalFeedback, userRole: currentUser.role || 'ADMIN' }} />
          </ErrorBoundary>
        </div>
      </main>

      {/* Footer del Sistema */}
      <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#1C1C1E]/60 py-4 text-center text-xs text-[#A1A1A6]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#30D158] inline-block" />
            <span className="font-medium text-[#F5F5F7]">Campus Control &bull; Monolito Modular Campuslands</span>
          </div>
          <span className="font-mono text-[11px] text-[#A1A1A6]">
            React 19 &bull; Vite &bull; Tailwind CSS &bull; HU-17 a HU-20
          </span>
        </div>
      </footer>
    </div>
  );
}
