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
    <header className="sticky top-0 z-40 w-full glass-header transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <NavLink to="/spaces" className="flex min-w-0 items-center gap-2.5 group select-none">
          <img
            src="/campuslands_helmet.png"
            alt="Campuslands Helmet"
            className="h-8 w-auto shrink-0 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] group-hover:scale-105 transition-transform"
          />
          <div className="hidden min-w-0 items-baseline gap-1.5 font-brand leading-none min-[420px]:flex">
            <span className="truncate text-[20px] font-bold text-white tracking-normal lowercase">
              campuslands
            </span>
            <span className="text-[20px] font-bold text-[#22d3ee] tracking-normal lowercase">
              control
            </span>
          </div>
        </NavLink>

        {/* Sección de usuario & Logout */}
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          {/* Badge de Telemetría Enclave Seguro */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a2c]/80 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2fd9f4] animate-pulse" />
            <span className="text-[11px] font-mono text-[#a1a1a6] uppercase tracking-wider">
              Enclave Seguro
            </span>
          </div>

          {user && (
            <div className="hidden min-w-0 max-w-52 items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#1c1c1e] px-3 py-1.5 sm:flex">
              <span className={`w-2 h-2 rounded-full ${currentRole.dot} animate-pulse-subtle`} />
              <div className="flex min-w-0 flex-col text-right">
                <span className="truncate text-xs font-semibold text-white leading-tight">
                  {user.name || user.email}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#a1a1a6]">
                  {currentRole.label}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="shrink-0 text-xs text-[#8d90a0] hover:text-[#ff453a] hover:bg-white/[0.04]"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Navegación principal en una fila independiente para evitar compresión. */}
      <div className="overflow-x-auto border-t border-white/[0.06] bg-[#131315]/95 scrollbar-none">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex min-w-max max-w-7xl items-center justify-start gap-1.5 px-3 py-2 md:justify-center sm:px-6 lg:px-8"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 select-none ${
                  isActive
                    ? 'border-[#2563eb] bg-[#2563eb] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
                    : 'border-white/[0.06] bg-[#1c1c1e] text-[#a1a1a6] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
