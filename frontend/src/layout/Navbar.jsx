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
          <NavLink to="/spaces" className="flex items-center gap-2 group select-none">
            <img
              src="/campuslands_helmet.png"
              alt="Campuslands Helmet"
              className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-1.5">
              <img
                src="/campuslands_wordmark.png"
                alt="campuslands"
                className="h-[18px] w-auto object-contain"
              />
              <span className="text-base font-bold tracking-tight text-[#22d3ee] font-sans lowercase">
                control
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
