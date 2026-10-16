/**
 * Página: Registro de Usuario (HU-11, HU-21)
 * Regla de negocio: El registro público NO ofrece elección de rol.
 * Todas las cuentas creadas reciben automáticamente el rol 'teacher' en el backend.
 * Responsable: GUERRA
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/feedback/ErrorMessage'

export default function RegisterPage() {
  const { register, error: authError, clearError } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden. Por favor verifica.')
      return
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      // Regla estricta HU-11: Se envía únicamente name, email y password. No se envía rol.
      await register({ name, email, password })
      navigate('/spaces', { replace: true })
    } catch (err) {
      setLocalError(err.message || 'Error al procesar el registro de la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e4e2e4] flex flex-col justify-between selection:bg-[#2563eb] selection:text-white relative overflow-hidden font-sans">
      {/* Dynamic Glow Scrim Background */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[340px] bg-gradient-to-b from-[#2563eb]/15 via-[#2fd9f4]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Micro-Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e10]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="h-14 w-full px-6 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2a2a2c] border border-white/[0.08] flex items-center justify-center text-[#22d3ee]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Campus Control</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] border border-white/[0.08] text-[11px] font-mono text-[#2fd9f4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2fd9f4] animate-pulse" />
              <span>Alta de Usuarios</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Enclave */}
      <main className="flex-1 w-full pt-20 pb-12 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-[460px] bg-[#1c1c1e] rounded-[22px] border-t border-white/[0.12] border-x border-white/[0.05] border-b border-black/80 shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-8 sm:p-10 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#2563eb] to-[#2fd9f4] flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 ring-1 ring-white/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="absolute inset-0 rounded-[18px] bg-gradient-to-t from-black/25 via-transparent to-white/20 pointer-events-none" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Registro Docente
            </h1>
            <p className="text-xs text-[#a1a1a6] mt-1">
              Acceso a Salas y Equipos • Campuslands
            </p>
          </div>

          {(localError || authError) && (
            <ErrorMessage message={localError || authError} />
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <Input
              label="Nombre completo"
              type="text"
              required
              autoComplete="name"
              placeholder="Prof. Carlos Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              label="Correo institucional"
              type="email"
              required
              autoComplete="email"
              placeholder="carlos.perez@campuslands.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              label="Contraseña"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              helperText="Mínimo 6 caracteres"
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Aviso de rol predeterminado conforme a HU-11 */}
            <div className="rounded-[12px] bg-[#2a2a2c] p-3 border border-white/[0.08] text-xs text-[#a1a1a6] flex items-start gap-2.5">
              <span className="text-base text-[#22d3ee]">ℹ️</span>
              <span className="leading-relaxed">
                Toda cuenta pública registrada recibe automáticamente permisos de <strong className="text-white">docente</strong> para reservar espacios y solicitar equipos.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-12 rounded-full text-sm font-semibold tracking-wide"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Registrando cuenta…' : 'Crear Cuenta Docente'}
              </Button>
            </div>
          </form>

          <div className="pt-2 text-center border-t border-white/[0.06]">
            <p className="text-xs text-[#a1a1a6]">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link
                to="/login"
                className="font-bold text-[#2fd9f4] hover:text-[#6cd3f7] ml-1 transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#8d90a0]">
        Campuslands • Enclave Seguro de Control Operativo
      </footer>
    </div>
  )
}
