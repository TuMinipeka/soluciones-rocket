/**
 * Enrutador principal de la aplicación y proveedor de autenticación.
 * Conecta los flujos funcionales de Guerra y los placeholders acordados con Mafe.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'

// Layout
import AppLayout from './layout/AppLayout'

// Páginas de Guerra (HU-21 a HU-24)
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ReservationPage from './pages/ReservationPage'
import LoansPage from './pages/LoansPage'
import IncidentPage from './pages/IncidentPage'

// Páginas de Mafe (Placeholders HU-18, HU-19, HU-20)
import SpacesPage from './pages/SpacesPage'
import DashboardPage from './pages/DashboardPage'
import IncidentsListPage from './pages/IncidentsListPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas protegidas con AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/spaces" replace />} />
            <Route path="/spaces" element={<SpacesPage />} />
            <Route path="/reservations" element={<ReservationPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/incidents" element={<IncidentPage />} />
            <Route path="/incidents-list" element={<IncidentsListPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/spaces" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
