/**
 * Layout principal de la aplicación.
 * Contiene la barra de navegación y el <Outlet/> para el renderizado de páginas.
 * Área: MAFE (consumido por todas las páginas autenticadas de GUERRA y MAFE).
 */

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Barra de navegación superior fija */}
      <Navbar />

      {/* Contenedor principal donde se inyectan las páginas mediante <Outlet/> */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Pie sutil */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-400">
        <p>Campuslands Operations System • Sistema Central de Gestión Operativa</p>
      </footer>
    </div>
  )
}
