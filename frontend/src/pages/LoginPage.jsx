/**
 * Página: Iniciar Sesión (HU-12, HU-21)
 * Estética: Apple Design / Emil Kowalski Minimalismo
 * Responsable: GUERRA
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/feedback/ErrorMessage'

export default function LoginPage() {
  const { login, error: authError, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const from = location.state?.from?.pathname || '/spaces'

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (!email || !password) {
      setLocalError('Por favor ingresa tu correo institucional y contraseña.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setLocalError(err.message || 'Credenciales incorrectas.')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Campus Control</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] border border-white/[0.08] text-[11px] font-mono text-[#2fd9f4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2fd9f4] animate-pulse" />
              <span>Enclave Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Enclave */}
      <main className="flex-1 w-full pt-20 pb-12 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-[440px] bg-[#1c1c1e] rounded-[22px] border-t border-white/[0.12] border-x border-white/[0.05] border-b border-black/80 shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-8 sm:p-10 flex flex-col gap-6">
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#2563eb] to-[#2fd9f4] flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 ring-1 ring-white/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="absolute inset-0 rounded-[18px] bg-gradient-to-t from-black/25 via-transparent to-white/20 pointer-events-none" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Campus Control
            </h1>
            <p className="text-xs text-[#a1a1a6] mt-1">
              Sistema de Gestión Operativa • Campuslands
            </p>
          </div>

          {(localError || authError) && (
            <ErrorMessage message={localError || authError} />
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Campo Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#a1a1a6] px-1 flex items-center justify-between" htmlFor="email">
                <span>Correo institucional</span>
                <span className="text-[#8d90a0] font-mono text-[11px] font-normal lowercase">@campuslands.edu</span>
              </label>
              <div className="relative flex items-center bg-[#2a2a2c] rounded-[12px] border border-white/[0.08] transition-all duration-150 focus-within:ring-2 focus-within:ring-[#2563eb] focus-within:border-[#2563eb]">
                <div className="pl-3.5 pr-2 text-[#8d90a0]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="docente@campuslands.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent py-2.5 pr-3 text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-semibold text-[#a1a1a6]" htmlFor="password">
                  Contraseña
                </label>
                <span className="text-[11px] text-[#2fd9f4] hover:underline cursor-pointer">
                  Credencial institucional
                </span>
              </div>
              <div className="relative flex items-center bg-[#2a2a2c] rounded-[12px] border border-white/[0.08] transition-all duration-150 focus-within:ring-2 focus-within:ring-[#2563eb] focus-within:border-[#2563eb]">
                <div className="pl-3.5 pr-2 text-[#8d90a0]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent py-2.5 pr-2 text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none tracking-wider font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 mr-1 text-[#8d90a0] hover:text-[#f5f5f7] transition-colors"
                  aria-label="Alternar visibilidad"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* iOS Style Remember Toggle */}
            <div className="flex items-center justify-between py-1 px-1">
              <span className="text-xs text-[#a1a1a6] select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                Recordar este equipo
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-[46px] h-[26px] rounded-full relative p-0.5 transition-colors duration-200 focus:outline-none ${
                  rememberMe ? 'bg-[#2563eb]' : 'bg-[#353437]'
                }`}
              >
                <span
                  className={`block w-[22px] h-[22px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-200 ${
                    rememberMe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-12 rounded-full text-sm font-semibold tracking-wide"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </Button>
            </div>
          </form>

          {/* Sub-action registro */}
          <div className="pt-2 text-center border-t border-white/[0.06]">
            <span className="text-xs text-[#a1a1a6]">
              ¿No tienes cuenta institucional?{' '}
            </span>
            <Link
              to="/register"
              className="text-xs font-semibold text-[#2fd9f4] hover:text-[#6cd3f7] ml-1 transition-colors"
            >
              Registrar cuenta docente
            </Link>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="py-4 text-center text-xs text-[#8d90a0]">
        Campuslands • Enclave Seguro de Control Operativo
      </footer>
    </div>
  )
}
