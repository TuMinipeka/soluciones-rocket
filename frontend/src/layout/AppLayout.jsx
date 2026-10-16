/**
 * Layout principal de la aplicación.
 * Contiene la barra de navegación y el <Outlet/> para el renderizado de páginas.
 * Área: MAFE (consumido por todas las páginas autenticadas de GUERRA y MAFE).
 */

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e4e2e4] flex flex-col font-sans antialiased selection:bg-[#2563eb] selection:text-white">
      {/* Barra de navegación superior fija */}
      <Navbar />

      {/* Contenedor principal donde se inyectan las páginas mediante <Outlet/> */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Pie sutil con estética Apple Dark Enclave */}
      <footer className="border-t border-white/[0.08] bg-[#0e0e10] py-6 text-center text-xs text-[#8d90a0]">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Campuslands Operations System</span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="font-mono text-[11px] text-[#22d3ee]">Enclave Seguro v4.8</span>
        </div>
      </footer>
    </div>
  )
}
