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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6 lg:gap-8">
          <NavLink to="/spaces" className="flex items-center gap-2.5 group select-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/40 text-[#6cd3f7] shadow-sm group-hover:scale-105 group-active:scale-95 transition-all duration-150">
              <svg className="w-5 h-5 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Campus Control
              </span>
              <span className="text-[10px] text-[#22d3ee] font-mono font-medium tracking-wider uppercase mt-1">
                Campuslands
              </span>
            </div>
          </NavLink>

          {/* Enlaces de navegación con selector deslizante / pill */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1c1c1e] p-1 rounded-full border border-white/[0.08]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 select-none ${
                    isActive
                      ? 'bg-[#2563eb] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
                      : 'text-[#a1a1a6] hover:text-white hover:bg-white/[0.04]'
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
          {/* Badge de Telemetría Enclave Seguro */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a2c]/80 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2fd9f4] animate-pulse" />
            <span className="text-[11px] font-mono text-[#a1a1a6] uppercase tracking-wider">
              Enclave Seguro
            </span>
          </div>

          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#1c1c1e] border border-white/[0.08]">
              <span className={`w-2 h-2 rounded-full ${currentRole.dot} animate-pulse-subtle`} />
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">
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
            className="text-xs text-[#8d90a0] hover:text-[#ff453a] hover:bg-white/[0.04]"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Navegación móvil secundaria horizontal */}
      <div className="flex md:hidden overflow-x-auto border-t border-white/[0.06] bg-[#131315]/95 px-3 py-2 gap-1.5 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#2563eb] text-white shadow-xs font-semibold'
                  : 'text-[#a1a1a6] bg-[#1c1c1e] border border-white/[0.06]'
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
