/**
 * Sidebar opcional para navegación extendida (HU-17).
 * Área: MAFE (placeholder).
 */

import { NavLink } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

export default function Sidebar({ isOpen, onClose }) {
  if (!isOpen) return null

  const items = [
    { to: '/spaces', label: 'Mapa y Salas', icon: BuildingOffice2Icon },
    { to: '/reservations', label: 'Reservas de Espacios', icon: CalendarDaysIcon },
    { to: '/loans', label: 'Recursos y Préstamos', icon: ComputerDesktopIcon },
    { to: '/incidents', label: 'Reportar Incidencias', icon: ExclamationTriangleIcon },
    { to: '/incidents-list', label: 'Historial de Incidencias', icon: ClipboardDocumentListIcon },
    { to: '/dashboard', label: 'Dashboard Operativo', icon: ChartBarIcon },
  ]

  return (
    <aside className="w-64 border-r border-zinc-200/80 bg-white p-4 h-full flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Navegación
        </div>
        {items.map((item) => {
          const Icon = item.icon
          return (
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
              <Icon className="w-5 h-5 text-zinc-500" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}
