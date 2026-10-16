/**
 * Ruta protegida para control de acceso y roles (HU-13, HU-21)
 * Responsable: GUERRA
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import LoadingState from '../components/feedback/LoadingState'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <LoadingState message="Verificando sesión segura…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-4">
          !
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Acceso restringido</h2>
        <p className="mt-2 text-sm text-zinc-500 max-w-md">
          Tu cuenta con rol <span className="font-mono font-medium text-zinc-700">[{user?.role || 'invitado'}]</span> no tiene permisos suficientes para acceder a esta sección.
        </p>
      </div>
    )
  }

  return children
}
