/**
 * Página: Registro de Usuario Docente (HU-11, HU-21)
 * Regla de negocio estricta: El registro público NO ofrece elección de rol.
 * Todas las cuentas creadas reciben automáticamente el rol 'teacher' en el backend.
 * Diseño 100% fiel al mockup oficial de Campus Control:
 * - Lado izquierdo: Enclave oscuro con tipografía SF Pro, micro-labels, segmented control y botón azul vibrante.
 * - Lado derecho: Astronauta interactuando con paneles holográficos y badges de telemetría.
 * Responsable: GUERRA
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function RegisterPage() {
  const { register, error: authError, clearError } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const isEmailValid = email.length > 5 && email.includes('@') && email.includes('.')
  const passwordsMatch = password.length > 0 && password === confirmPassword

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
      // Regla estricta HU-11: Se envía únicamente name, email y password.
      await register({ name, email, password })
      navigate('/spaces', { replace: true })
    } catch (err) {
      setLocalError(err.message || 'Error al procesar el registro de la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#08090b] text-[#e4e2e4] font-sans selection:bg-[#1d68f2] selection:text-white antialiased overflow-hidden">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA (50%): Formulario Campus Control        */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#0d0f12] border-r border-white/[0.04] flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-12 xl:px-20 z-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[380px] h-[160px] bg-gradient-to-b from-[#1d68f2]/10 to-transparent blur-3xl pointer-events-none" />

        {/* Cabecera: Logo de 3 discos y Badge Enclave Seguro */}
        <header className="flex items-center justify-between w-full mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center gap-2.5">
            {/* Casco Oficial de Astronauta Campuslands */}
            <img
              src="/campuslands_helmet.png"
              alt="Emblema Astronauta Campuslands"
              className="h-8 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]"
            />
            {/* Tipografía Oficial campuslands + control */}
            <div className="flex items-center gap-1.5">
              <img
                src="/campuslands_wordmark.png"
                alt="campuslands"
                className="h-[21px] w-auto object-contain"
              />
              <span className="text-lg font-bold tracking-tight text-[#22d3ee] font-sans lowercase">
                control
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131b22] border border-[#1b3445] text-[11px] font-mono text-[#22d3ee] shadow-sm">
            <svg className="w-3 h-3 text-[#22d3ee]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Enclave Seguro</span>
          </div>
        </header>

        {/* Cuerpo Central del Formulario */}
        <main className="w-full max-w-[420px] mx-auto my-auto py-2 relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-[34px] font-bold text-white tracking-tight">
              Crear cuenta docente
            </h1>
            <p className="text-xs sm:text-sm text-[#8e8e93] mt-1.5 font-normal">
              Regístrate para reservar salas y acceder a recursos telemáticos
            </p>
          </div>

          {/* Segmented Control iOS Dark Style */}
          <div className="bg-[#15171d] p-1 rounded-2xl flex items-center mb-6 border border-white/[0.04] select-none">
            <Link
              to="/login"
              className="flex-1 py-2 rounded-xl text-[#717684] hover:text-white text-xs sm:text-sm font-medium text-center transition-all cursor-pointer"
            >
              Iniciar sesión
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-[#262933] text-white text-xs sm:text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-white/[0.06] text-center transition-all cursor-default"
            >
              Registrarse
            </button>
          </div>

          {/* Alerta de Error Sutil */}
          {(localError || authError) && (
            <div className="bg-[#ff453a]/12 border border-[#ff453a]/30 text-[#ff8077] px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 mb-5 shadow-[0_2px_12px_rgba(255,69,58,0.08)] animate-fluid-enter">
              <svg className="w-4 h-4 shrink-0 text-[#ff453a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="leading-snug">{localError || authError}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Input Nombre */}
            <div className="rounded-2xl border border-white/[0.07] focus-within:border-[#1d68f2] focus-within:ring-2 focus-within:ring-[#1d68f2]/30 bg-[#171920] transition-all p-3 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#20232c] flex items-center justify-center text-[#717684] shrink-0 border border-white/[0.03]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="name" className="block text-[10px] uppercase font-bold tracking-wider text-[#717684]">
                  NOMBRE COMPLETO
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Prof. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#52525b] font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Input Correo */}
            <div className="rounded-2xl border border-white/[0.07] focus-within:border-[#1d68f2] focus-within:ring-2 focus-within:ring-[#1d68f2]/30 bg-[#171920] transition-all p-3 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#20232c] flex items-center justify-center text-[#717684] shrink-0 border border-white/[0.03]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="reg-email" className="block text-[10px] uppercase font-bold tracking-wider text-[#717684]">
                  CORREO INSTITUCIONAL
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="docente@campuslands.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#52525b] font-medium focus:outline-none"
                />
              </div>
              {isEmailValid && (
                <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)]">
                  ✓
                </div>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="rounded-2xl border border-white/[0.07] focus-within:border-[#1d68f2] focus-within:ring-2 focus-within:ring-[#1d68f2]/30 bg-[#171920] transition-all p-3 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#20232c] flex items-center justify-center text-[#717684] shrink-0 border border-white/[0.03]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="reg-password" className="block text-[10px] uppercase font-bold tracking-wider text-[#717684]">
                  CONTRASEÑA (MÍNIMO 6 CARACTERES)
                </label>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#52525b] font-mono tracking-widest focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#717684] hover:text-white p-1.5 transition-colors cursor-pointer"
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

            {/* Input Confirmar Contraseña */}
            <div className="rounded-2xl border border-white/[0.07] focus-within:border-[#1d68f2] focus-within:ring-2 focus-within:ring-[#1d68f2]/30 bg-[#171920] transition-all p-3 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#20232c] flex items-center justify-center text-[#717684] shrink-0 border border-white/[0.03]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="confirmPassword" className="block text-[10px] uppercase font-bold tracking-wider text-[#717684]">
                  CONFIRMAR CONTRASEÑA
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#52525b] font-mono tracking-widest focus:outline-none"
                />
              </div>
              {passwordsMatch && (
                <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)]">
                  ✓
                </div>
              )}
            </div>

            {/* Botón de Registro */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1d68f2] hover:bg-[#1558d6] active:scale-[0.98] text-white font-semibold text-sm sm:text-base tracking-wide shadow-[0_4px_24px_rgba(29,104,242,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creando cuenta…</span>
                  </>
                ) : (
                  'Registrar cuenta docente'
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Pie de Página */}
        <footer className="w-full text-center py-2 mt-4">
          <p className="text-[11px] text-[#717684] leading-relaxed max-w-sm mx-auto">
            Al registrarte aceptas las políticas de asignación telemática de recursos y normativa institucional de Campuslands.
          </p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA (50%): Astronauta con Paneles Holográficos*/}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-gradient-to-b from-[#080a0f] via-[#0c0e18] to-[#07080d] items-center justify-center p-8 xl:p-12 select-none">
        <div className="absolute top-12 left-16 w-1.5 h-1.5 bg-white rounded-full animate-twinkle" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-36 left-40 w-1 h-1 bg-cyan-300 rounded-full animate-twinkle" style={{ animationDelay: '1.4s' }} />
        <div className="absolute top-24 right-20 w-1.5 h-1.5 bg-blue-300 rounded-full animate-twinkle" style={{ animationDelay: '0.8s' }} />
        <div className="absolute bottom-24 left-24 w-1.5 h-1.5 bg-white rounded-full animate-twinkle" style={{ animationDelay: '2.1s' }} />
        <div className="absolute bottom-36 right-20 w-1 h-1 bg-cyan-200 rounded-full animate-twinkle" style={{ animationDelay: '1.7s' }} />
        <div className="absolute top-1/2 right-12 w-1.5 h-1.5 bg-white/70 rounded-full animate-twinkle" style={{ animationDelay: '2.5s' }} />

        <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-500/15 pointer-events-none animate-orbit" />
        <div className="absolute w-[360px] h-[360px] rounded-full border border-cyan-400/10 pointer-events-none animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '32s' }} />

        {/* Resplandor cósmico difuso */}
        <div className="absolute w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-blue-600/20 via-cyan-500/15 to-purple-600/10 blur-3xl pointer-events-none" />

        {/* Astronauta interactuando con paneles holográficos limpio y centrado */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Resplandor cian reactivo al holograma */}
          <div className="absolute top-[28%] left-[25%] w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none animate-pulse-subtle" />

          <div className="relative animate-astronaut group cursor-pointer transition-transform duration-700">
            <img
              src="/astronaut_hologram_interactive.png"
              alt="Astronauta interactuando con consola holográfica"
              className="max-h-[490px] xl:max-h-[540px] w-auto object-contain drop-shadow-[0_25px_50px_rgba(34,211,238,0.3)] transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
