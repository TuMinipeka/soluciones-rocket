/**
 * Sidebar opcional para navegación extendida (HU-17).
 * Área: MAFE (placeholder).
 */

import { NavLink } from 'react-router-dom'

export default function Sidebar({ isOpen, onClose }) {
  if (!isOpen) return null

  const items = [
    { to: '/spaces', label: 'Mapa y Salas', icon: '🏛️' },
    { to: '/reservations', label: 'Reservas de Espacios', icon: '📅' },
    { to: '/loans', label: 'Recursos y Préstamos', icon: '💻' },
    { to: '/incidents', label: 'Reportar Incidencias', icon: '⚠️' },
    { to: '/incidents-list', label: 'Historial de Incidencias', icon: '📋' },
    { to: '/dashboard', label: 'Dashboard Operativo', icon: '📊' },
  ]

  return (
    <aside className="w-64 border-r border-zinc-200/80 bg-white p-4 h-full flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Navegación
        </div>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-100 font-semibold text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
