/**
 * Página: Registro de Usuario Docente (HU-11, HU-21)
 * Regla de negocio estricta: El registro público NO ofrece elección de rol.
 * Todas las cuentas creadas reciben automáticamente el rol 'teacher' en el backend.
 * Paleta de colores oscura (Apple Dark Enclave) con Astronauta Campuslands.
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0c] text-[#e4e2e4] font-sans selection:bg-[#2563eb] selection:text-white antialiased overflow-hidden">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA (50%): Formulario Dark Enclave          */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#0e0e10] border-r border-white/[0.04] flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-12 xl:px-20 z-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-gradient-to-b from-blue-600/10 to-transparent blur-3xl pointer-events-none" />

        {/* Cabecera de Marca */}
        <header className="flex items-center justify-between w-full mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#22d3ee] flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Campus Control
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-[11px] font-mono text-cyan-300 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Enclave Seguro</span>
          </div>
        </header>

        {/* Cuerpo Central */}
        <main className="w-full max-w-[420px] mx-auto my-auto py-2 relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-[34px] font-bold text-white tracking-tight">
              Crear cuenta docente
            </h1>
            <p className="text-xs sm:text-sm text-[#8d90a0] mt-1.5 font-normal">
              Regístrate para reservar salas y acceder a recursos telemáticos
            </p>
          </div>

          {/* Segmented Control iOS Dark Style */}
          <div className="bg-[#141416] p-1 rounded-2xl flex items-center mb-6 border border-white/[0.06] select-none">
            <Link
              to="/login"
              className="flex-1 py-2 rounded-xl text-[#8d90a0] hover:text-white text-xs sm:text-sm font-medium text-center transition-all cursor-pointer"
            >
              Iniciar sesión
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-[#2c2c2e] text-white text-xs sm:text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-white/[0.08] text-center transition-all cursor-default"
            >
              Registrarse
            </button>
          </div>

          {/* Alerta de Error Sutil tono Pastel/Salmón Adaptada */}
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
            <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/20 bg-[#1c1c1e] transition-all p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2a2a2c] flex items-center justify-center text-[#8d90a0] shrink-0 border border-white/[0.04]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="name" className="block text-[10px] uppercase font-bold tracking-wider text-[#8d90a0]">
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Prof. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Input Correo */}
            <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/20 bg-[#1c1c1e] transition-all p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2a2a2c] flex items-center justify-center text-[#8d90a0] shrink-0 border border-white/[0.04]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="reg-email" className="block text-[10px] uppercase font-bold tracking-wider text-[#8d90a0]">
                  Correo institucional
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
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-medium focus:outline-none"
                />
              </div>
              {isEmailValid && (
                <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)]">
                  ✓
                </div>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/20 bg-[#1c1c1e] transition-all p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2a2a2c] flex items-center justify-center text-[#8d90a0] shrink-0 border border-white/[0.04]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="reg-password" className="block text-[10px] uppercase font-bold tracking-wider text-[#8d90a0]">
                  Contraseña (mínimo 6 caracteres)
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
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-mono tracking-wider focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#8d90a0] hover:text-white p-1.5 transition-colors cursor-pointer"
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
            <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/20 bg-[#1c1c1e] transition-all p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2a2a2c] flex items-center justify-center text-[#8d90a0] shrink-0 border border-white/[0.04]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="confirmPassword" className="block text-[10px] uppercase font-bold tracking-wider text-[#8d90a0]">
                  Confirmar contraseña
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
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-mono tracking-wider focus:outline-none"
                />
              </div>
              {passwordsMatch && (
                <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)]">
                  ✓
                </div>
              )}
            </div>

            {/* Botón de Acción Principal */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-semibold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
          <p className="text-[11px] sm:text-xs text-[#8d90a0] leading-relaxed max-w-sm mx-auto">
            Al registrarte aceptas las políticas de asignación telemática de recursos y normativa institucional de Campuslands.
          </p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA (50%): Atmósfera Espacial & Astronauta    */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-gradient-to-b from-[#090a0f] via-[#0d101a] to-[#07080d] items-center justify-center p-8 xl:p-14 select-none">
        <div className="absolute top-16 left-12 w-1.5 h-1.5 bg-white rounded-full animate-twinkle" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-36 left-48 w-1 h-1 bg-cyan-300 rounded-full animate-twinkle" style={{ animationDelay: '1.4s' }} />
        <div className="absolute top-20 right-28 w-2 h-2 bg-blue-300 rounded-full animate-twinkle" style={{ animationDelay: '0.8s' }} />
        <div className="absolute bottom-28 left-20 w-1.5 h-1.5 bg-white rounded-full animate-twinkle" style={{ animationDelay: '2.1s' }} />
        <div className="absolute bottom-40 right-24 w-1 h-1 bg-cyan-200 rounded-full animate-twinkle" style={{ animationDelay: '1.7s' }} />
        <div className="absolute top-1/2 right-12 w-1.5 h-1.5 bg-white/70 rounded-full animate-twinkle" style={{ animationDelay: '2.5s' }} />

        <div className="absolute w-[540px] h-[540px] rounded-full border border-blue-500/15 pointer-events-none animate-orbit" />
        <div className="absolute w-[380px] h-[380px] rounded-full border border-cyan-400/10 pointer-events-none animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '35s' }} />

        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600/25 via-cyan-500/15 to-purple-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-[480px] w-full">
          <div className="mb-4 self-start translate-x-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c1c1e]/85 backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-xs font-semibold text-white animate-pulse-subtle">
            <span className="text-sm">🇨🇴</span>
            <span>Campus Control • Misión Espacial</span>
          </div>

          <div className="relative group cursor-pointer my-2">
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-32 h-32 bg-cyan-400/25 rounded-full blur-2xl pointer-events-none animate-pulse-subtle" />

            <img
              src="/astronaut_mascot.png"
              alt="Mascota Astronauta Campuslands"
              className="max-h-[500px] xl:max-h-[550px] w-auto object-contain drop-shadow-[0_20px_50px_rgba(34,211,238,0.3)] animate-astronaut transition-transform duration-700 group-hover:scale-105"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 95%, transparent 100%), linear-gradient(to bottom, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 95%, transparent 100%), linear-gradient(to bottom, black 92%, transparent 100%)',
              }}
            />
          </div>

          <div className="mt-4 self-end -translate-x-4 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#1c1c1e]/85 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.7)] text-[11px] font-medium text-white">
            <span className="flex items-center gap-2 text-[#30d158]">
              <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse shadow-[0_0_8px_rgba(48,209,88,0.6)]" />
              <span>Sistemas Telemáticos Online</span>
            </span>
            <span className="text-[#8d90a0]">•</span>
            <span className="text-cyan-300 font-mono">IA Groq Activa</span>
          </div>
        </div>
      </div>
    </div>
  )
}
