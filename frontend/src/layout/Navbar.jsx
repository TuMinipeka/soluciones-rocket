import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

/**
 * Navbar: Barra de navegación fija con foco accesible, badge de rol y drawer móvil oscuro.
 */
export default function Navbar({ userRole = 'ADMIN', userName = 'Mafe' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Salas', path: '/spaces', icon: '🏢' },
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Incidencias', path: '/incidents', icon: '⚠️' },
    { name: 'Reservas', path: '/reservations', icon: '📅' },
    { name: 'Préstamos', path: '/loans', icon: '💻' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('campus_auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed top-0 left-0 right-0 z-40 bg-[#1C1C1E]/95 backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand oficial */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group select-none rounded-[0.75rem] p-1 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              aria-label="Ir al Dashboard de Campus Control"
            >
              <img
                src="/campuslands_helmet.png"
                alt="Campuslands Helmet"
                className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.35)] group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="flex items-baseline gap-1.5 leading-none font-sans">
                <span className="text-[19px] font-bold text-white tracking-tight lowercase">
                  campuslands
                </span>
                <span className="text-[19px] font-bold text-[#22D3EE] tracking-tight lowercase">
                  control
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block animate-pulse ml-0.5" title="Sistema Activo" />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links con foco visible */}
          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-[0.75rem] text-sm font-medium transition-all duration-150 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                    isActive
                      ? 'bg-[#2C2C2E] text-[#F5F5F7] border border-[rgba(255,255,255,0.12)] shadow-sm'
                      : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#2C2C2E]/50'
                  }`
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* User info, Role Badge & Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[0.75rem] bg-[#2C2C2E]/60 border border-[rgba(255,255,255,0.06)]">
              <div className="w-6 h-6 rounded-full bg-[#2563EB]/25 border border-[#2563EB]/40 flex items-center justify-center text-xs font-semibold text-[#60A5FA]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-[#F5F5F7]">{userName}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#0891B2]/20 text-[#22D3EE] border border-[#0891B2]/40 tracking-wider">
                {userRole}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-2 text-[#A1A1A6] hover:text-[#FF453A] rounded-[0.75rem] hover:bg-[#2C2C2E] focus:outline-none focus:ring-2 focus:ring-[#FF453A] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Botón hamburguesa móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[0.75rem] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#2C2C2E] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil desplegable oscuro */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[rgba(255,255,255,0.08)] bg-[#1C1C1E] px-4 pt-3 pb-5 space-y-2 animate-fluid-enter shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A1A1A6]">Usuario:</span>
              <span className="text-xs font-semibold text-[#F5F5F7]">{userName}</span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0891B2]/20 text-[#22D3EE] border border-[#0891B2]/40">
              {userRole}
            </span>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-[0.75rem] text-sm font-medium transition-colors flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                  isActive
                    ? 'bg-[#2C2C2E] text-[#F5F5F7] font-semibold border border-[rgba(255,255,255,0.08)]'
                    : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#2C2C2E]/50'
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}

          <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-[0.75rem] text-sm font-medium text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#FF453A]"
            >
              <span aria-hidden="true">🚪</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
