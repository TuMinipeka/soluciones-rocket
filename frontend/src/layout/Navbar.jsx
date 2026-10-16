/**
 * Barra de navegación principal con enlaces de flujo y sesión (HU-17, HU-21).
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
    { to: '/incidents-list', label: 'Historial Incidencias' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabels = {
    admin: 'Administrador',
    teacher: 'Docente',
    support: 'Soporte',
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <NavLink to="/spaces" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
              CL
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-900 leading-none">
                Campus Control
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
                Campuslands
              </span>
            </div>
          </NavLink>

          {/* Enlaces de navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
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
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-medium text-zinc-800 leading-tight">
                {user.name || user.email}
              </span>
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                {roleLabels[user.role] || user.role || 'Docente'}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-zinc-600 hover:text-zinc-900 border-zinc-200"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Navegación móvil secundaria */}
      <div className="flex md:hidden overflow-x-auto border-t border-zinc-100 px-4 py-2 gap-1 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `shrink-0 px-2.5 py-1 rounded-md text-xs font-medium ${
                isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 bg-zinc-100'
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
