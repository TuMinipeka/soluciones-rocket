import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Secondary/Collapsible Sidebar component for management views.
 */
export default function Sidebar({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <aside className={`w-64 shrink-0 bg-[#1C1C1E] border-r border-[rgba(255,255,255,0.08)] p-4 flex flex-col gap-2 ${className}`}>
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#A1A1A6]">
        Gestión
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-[0.75rem] text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2C2C2E] text-[#F5F5F7] border border-[rgba(255,255,255,0.1)]'
                  : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#2C2C2E]/40'
              }`
            }
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
