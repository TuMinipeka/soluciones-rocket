/**
 * Página: Iniciar Sesión (HU-12, HU-21)
 * Estructura Split-Screen 50/50:
 * - Lado izquierdo: Blanco puro minimalista, SF Pro, segmented control, banner pastel, toggle iOS
 * - Lado derecho: Atmósfera inmersiva azul cielo con ilustración 3D de la torre de seguridad/enclave
 * Responsable: GUERRA
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

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

  // Validación rápida de email para mostrar el checkmark verde igual a la referencia
  const isEmailValid = email.length > 5 && email.includes('@') && email.includes('.')

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
      setLocalError(err.message || 'Credenciales incorrectas o sesión no autorizada.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-[#1d1d1f] font-sans selection:bg-[#0071e3] selection:text-white antialiased">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA (50%): Formulario Blanco Impecable     */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-12 xl:px-20 z-10">
        {/* Cabecera de Marca y Badge Enclave Seguro */}
        <header className="flex items-center justify-between w-full mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            {/* Logo Geométrico Moderno */}
            <div className="w-8 h-8 rounded-xl bg-[#1d1d1f] flex items-center justify-center text-white shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-[#1d1d1f]">
              Campus Control
            </span>
          </div>

          {/* Badge Enclave Seguro translúcido con peso visual ínfimo */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/50 text-[11px] font-medium text-[#0071e3] backdrop-blur-sm">
            <svg className="w-3 h-3 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Enclave Seguro</span>
          </div>
        </header>

        {/* Cuerpo Central del Formulario */}
        <main className="w-full max-w-[420px] mx-auto my-auto py-2">
          {/* Título y Subtítulo */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-[34px] font-bold text-[#1d1d1f] tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-xs sm:text-sm text-[#86868b] mt-1.5 font-normal">
              Ingresa tus credenciales para acceder a la plataforma
            </p>
          </div>

          {/* Segmented Control iOS Style */}
          <div className="bg-[#f2f2f7] p-1 rounded-2xl flex items-center mb-6 select-none">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-white text-[#1d1d1f] text-xs sm:text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center transition-all cursor-default"
            >
              Iniciar sesión
            </button>
            <Link
              to="/register"
              className="flex-1 py-2 rounded-xl text-[#86868b] hover:text-[#1d1d1f] text-xs sm:text-sm font-medium text-center transition-all cursor-pointer"
            >
              Registrarse
            </Link>
          </div>

          {/* Alerta de Error Sutil tono Pastel/Salmón */}
          {(localError || authError) && (
            <div className="bg-[#fff1f0] border border-[#ffccc7] text-[#cf1322] px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 mb-5 shadow-[0_2px_8px_rgba(207,19,34,0.04)] animate-fluid-enter">
              <svg className="w-4 h-4 shrink-0 text-[#ff4d4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="leading-snug">{localError || authError}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Input Correo */}
            <div className="rounded-2xl border border-[#e5e5ea] focus-within:border-[#0071e3] focus-within:ring-4 focus-within:ring-[#0071e3]/10 bg-white transition-all p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f2f2f7] flex items-center justify-center text-[#86868b] shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="email" className="block text-[10px] uppercase font-bold tracking-wider text-[#86868b]">
                  Correo institucional
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="usuario@campuslands.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] font-medium focus:outline-none"
                />
              </div>
              {/* Checkmark verde dinámico (referencia visual) */}
              {isEmailValid && (
                <div className="w-5 h-5 rounded-full bg-[#34c759] text-white flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-sm">
                  ✓
                </div>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="rounded-2xl border border-[#e5e5ea] focus-within:border-[#0071e3] focus-within:ring-4 focus-within:ring-[#0071e3]/10 bg-white transition-all p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f2f2f7] flex items-center justify-center text-[#86868b] shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="password" className="block text-[10px] uppercase font-bold tracking-wider text-[#86868b]">
                  Contraseña
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] font-mono tracking-wider focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#86868b] hover:text-[#1d1d1f] p-1.5 transition-colors cursor-pointer"
                aria-label="Alternar visibilidad de contraseña"
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

            {/* Toggle "Recordar este equipo" estilo iOS Nativo */}
            <div className="flex items-center justify-between py-1 px-0.5 select-none">
              <span
                onClick={() => setRememberMe(!rememberMe)}
                className="text-xs sm:text-sm text-[#1d1d1f] font-medium cursor-pointer"
              >
                Recordar este equipo
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-[48px] h-[28px] rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                  rememberMe ? 'bg-[#0071e3]' : 'bg-[#e5e5ea]'
                }`}
              >
                <span
                  className={`block w-[24px] h-[24px] bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
                    rememberMe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Botón de Acción Principal Apple systemBlue */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-semibold text-sm sm:text-base tracking-wide shadow-[0_4px_16px_rgba(0,113,227,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Iniciando sesión…</span>
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </div>

            {/* Divisor Or Continue With */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e5ea]" />
              </div>
              <span className="relative px-3 bg-white text-xs text-[#86868b] font-medium">
                O continuar con
              </span>
            </div>

            {/* Botones Sociales / SSO Apple Style */}
            <div className="flex items-center justify-center gap-3.5">
              {/* Google */}
              <button
                type="button"
                className="w-11 h-11 rounded-full border border-[#e5e5ea] hover:border-[#d2d2d7] hover:bg-[#f9f9fb] active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                aria-label="Iniciar con Google Workspace"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </button>

              {/* Apple */}
              <button
                type="button"
                className="w-11 h-11 rounded-full bg-[#1d1d1f] hover:bg-black active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm"
                aria-label="Iniciar con Apple ID"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.71-13.98-5.77-8.8-10.45-18.73-14.04-29.77-3.59-11.05-5.39-21.72-5.39-32.01 0-14.24 3.66-26.24 10.99-35.98 7.33-9.74 16.59-14.73 27.79-14.99 4.89 0 10.22 1.25 15.99 3.75 5.76 2.5 9.78 3.86 12.06 4.08 1.96-.22 6.14-1.63 12.55-4.22 6.42-2.59 11.96-3.75 16.63-3.48 12.28.65 22.39 5.38 30.33 14.19-10.87 6.63-16.19 15.76-15.98 27.39.22 9.02 3.69 16.79 10.43 23.32 6.74 6.52 14.95 10.32 23.64 11.41-2.07 6.08-4.68 12.28-7.83 18.59zm-31.42-108.62c0 5.98-2.28 11.85-6.85 17.61-4.57 5.76-10.33 9.45-17.28 11.08-.22-1.3-.33-2.6-.33-3.91 0-6.09 2.45-12.06 7.34-17.93 4.89-5.87 10.65-9.4 17.28-10.59.11 1.24.16 2.34.16 3.74z" />
                </svg>
              </button>

              {/* Campuslands Key */}
              <button
                type="button"
                className="w-11 h-11 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm"
                aria-label="Acceso con Token Campuslands"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
            </div>
          </form>
        </main>

        {/* Pie de Página Institucional */}
        <footer className="w-full text-center py-2 mt-4">
          <p className="text-[11px] sm:text-xs text-[#86868b] leading-relaxed max-w-sm mx-auto">
            Accede al sistema telemático del campus para gestionar salas, préstamos de equipos y monitoreo en tiempo real con cifrado de extremo a extremo.
          </p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA (50%): Atmósfera Inmersiva Azul Cielo     */}
      {/* y Torre 3D de Seguridad (Enclave Seguro)                  */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-gradient-to-br from-[#ebf5ff] via-[#d6ebff] to-[#a3d3ff] items-center justify-center p-8 xl:p-14 select-none">
        {/* Destellos de luz verticales (igual a la referencia visual) */}
        <div className="absolute top-12 left-16 w-[2px] h-36 bg-gradient-to-b from-transparent via-white/70 to-transparent blur-[1px] opacity-75" />
        <div className="absolute top-28 left-40 w-[2px] h-48 bg-gradient-to-b from-transparent via-white/80 to-transparent blur-[1px] opacity-60" />
        <div className="absolute top-8 right-24 w-[2px] h-52 bg-gradient-to-b from-transparent via-white/80 to-transparent blur-[1px] opacity-70" />
        <div className="absolute bottom-20 left-28 w-[2px] h-40 bg-gradient-to-b from-transparent via-white/60 to-transparent blur-[1px] opacity-50" />
        <div className="absolute bottom-16 right-36 w-[2px] h-32 bg-gradient-to-b from-transparent via-white/70 to-transparent blur-[1px] opacity-60" />

        {/* Resplandor radial de atmósfera celeste */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-white/40 blur-3xl pointer-events-none" />

        {/* Contenedor de la Ilustración 3D Premium con flotación */}
        <div className="relative z-10 flex flex-col items-center max-w-[460px] w-full">
          {/* Micro-badge flotante superior */}
          <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,113,227,0.12)] text-xs font-semibold text-[#0071e3] animate-pulse-subtle">
            <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
            <span>Campus Control • Enclave Seguro</span>
          </div>

          {/* Imagen de la Torre 3D de Campus / Seguridad */}
          <div className="relative group cursor-pointer">
            <img
              src="/campus_security_3d.jpg"
              alt="Torre 3D de Seguridad Campus Control"
              className="w-full max-w-[400px] xl:max-w-[440px] aspect-square object-contain rounded-[36px] drop-shadow-[0_25px_45px_rgba(37,99,235,0.22)] animate-float transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>

          {/* Micro-badge flotante inferior con métricas */}
          <div className="mt-4 flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,113,227,0.08)] text-[11px] font-medium text-[#1d1d1f]">
            <span className="flex items-center gap-1.5 text-[#34c759]">
              <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
              <span>TLS 1.3 Cifrado</span>
            </span>
            <span className="text-[#86868b]">•</span>
            <span className="text-[#86868b]">FastAPI & Groq Gateway</span>
          </div>
        </div>
      </div>
    </div>
  )
}
