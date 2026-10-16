/**
 * Barra de navegación principal con diseño Apple Glassmorphic (HU-17, HU-21).
 * Área: MAFE (consumida en AppLayout).
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Button from '../components/ui/Button'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/spaces', label: 'Salas y Mapa' },
    { to: '/reservations', label: 'Reservas' },
    { to: '/loans', label: 'Recursos y Préstamos' },
    { to: '/incidents', label: 'Reportar Incidencia' },
    { to: '/incidents-list', label: 'Historial' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleStyles = {
    admin: { label: 'Admin', dot: 'bg-violet-500' },
    teacher: { label: 'Docente', dot: 'bg-emerald-500' },
    support: { label: 'Soporte', dot: 'bg-blue-500' },
  }

  const currentRole = roleStyles[user?.role] || { label: user?.role || 'Docente', dot: 'bg-emerald-500' }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <NavLink to="/spaces" className="flex items-center gap-2.5 group select-none">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold text-xs tracking-wider shadow-sm group-hover:scale-105 group-active:scale-95 transition-all duration-150">
              CL
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-900 leading-none">
                Campus Control
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase mt-0.5">
                Campuslands
              </span>
            </div>
          </NavLink>

          {/* Enlaces de navegación con selector deslizante / pill */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100/70 p-1 rounded-xl border border-zinc-200/50">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 select-none ${
                    isActive
                      ? 'bg-white text-zinc-900 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sección de usuario & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
              <span className={`w-2 h-2 rounded-full ${currentRole.dot} animate-pulse-subtle`} />
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-zinc-900 leading-tight">
                  {user.name || user.email}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {currentRole.label}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Navegación móvil secundaria horizontal */}
      <div className="flex md:hidden overflow-x-auto border-t border-zinc-200/40 px-3 py-2 gap-1.5 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                  : 'text-zinc-600 bg-white/70 border border-zinc-200/60'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
