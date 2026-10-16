/**
 * Página: Autenticación Unificada (Iniciar Sesión / Registro) (HU-11, HU-12, HU-21)
 * Implementa animaciones físicas continuas con Tailwind (sin parpadeos de recarga):
 * - Segmented control con pastilla deslizante física (CSS transform smooth glide).
 * - Expansión/colapso animado de campos de registro con cubic-bezier natural.
 * - Transición de foco con glow neón azul y feedback táctil instantáneo.
 * - Astronauta 3D con flotación en microgravedad y paneles holográficos.
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function LoginPage({ initialMode }) {
  const { login, register, error: authError, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Determinar modo inicial según prop o ruta actual
  const isRegisterPath = initialMode === 'register' || location.pathname === '/register'
  const [mode, setMode] = useState(isRegisterPath ? 'register' : 'login')

  // Campos de formulario
  const [roleType, setRoleType] = useState('teacher')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const from = location.state?.from?.pathname || '/spaces'

  // Sincronizar estado si la ruta cambia externamente
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
    } else {
      setMode(location.pathname === '/register' ? 'register' : 'login')
    }
  }, [location.pathname, initialMode])

  // Sanitización y restricción de caracteres en tiempo real
  const handleNameChange = (e) => {
    const val = e.target.value
    // Permitir sólo letras, tildes comunes, puntos, guiones y espacios (máximo 80 caracteres)
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ.\-\s]*$/.test(val) && val.length <= 80) {
      setName(val)
    }
  }

  const handleEmailChange = (e) => {
    // Sanitizar en tiempo real: sin espacios, minúsculas, caracteres válidos para correo, máx 100 caracteres
    const val = e.target.value.replace(/\s/g, '').toLowerCase()
    if (/^[a-zA-Z0-9@._+-]*$/.test(val) && val.length <= 100) {
      setEmail(val)
    }
  }

  const handlePasswordChange = (e) => {
    const val = e.target.value
    if (val.length <= 128) {
      setPassword(val)
    }
  }

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value
    if (val.length <= 128) {
      setConfirmPassword(val)
    }
  }

  // Validación reactiva para micro-feedback
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const noSurroundingSpaces = password.trim() === password && password.length > 0
  const isNotIdentical =
    (!email || password.toLowerCase() !== email.toLowerCase()) &&
    (!name || password.toLowerCase() !== name.trim().toLowerCase())
  const isPasswordSecure = hasMinLength && hasLetter && hasNumber && noSurroundingSpaces && isNotIdentical
  const passwordsMatch = mode === 'register' && isPasswordSecure && password === confirmPassword

  // Cambio de pestaña suave sin recarga ni parpadeo
  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return
    setMode(newMode)
    setLocalError(null)
    clearError()
    // Actualizar URL sin desmontar el componente (elimina el parpadeo de navegación)
    window.history.replaceState(null, '', newMode === 'register' ? '/register' : '/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setLocalError('Por favor ingresa tu correo institucional y contraseña.')
        return
      }
      if (!isEmailValid) {
        setLocalError('Por favor ingresa un correo electrónico con formato válido (ej. usuario@campuslands.edu).')
        return
      }

      setIsSubmitting(true)
      try {
        await login({ email: email.trim().toLowerCase(), password })
        navigate(from, { replace: true })
      } catch (err) {
        setLocalError(err.message || 'Credenciales incorrectas o sesión no autorizada.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Flujo de Registro (HU-11 con validaciones estrictas del backend)
      const cleanName = name.trim().replace(/\s+/g, ' ')
      if (!cleanName || cleanName.length < 2) {
        setLocalError('Por favor ingresa un nombre válido (mínimo 2 caracteres).')
        return
      }
      if (!isEmailValid) {
        setLocalError('Por favor ingresa un correo electrónico institucional válido.')
        return
      }
      if (password.length < 8) {
        setLocalError('La contraseña debe tener al menos 8 caracteres.')
        return
      }
      if (!hasLetter) {
        setLocalError('La contraseña debe contener al menos una letra.')
        return
      }
      if (!hasNumber) {
        setLocalError('La contraseña debe contener al menos un número.')
        return
      }
      if (password.trim() !== password) {
        setLocalError('La contraseña no debe iniciar ni terminar con espacios.')
        return
      }
      if (email && password.toLowerCase() === email.toLowerCase()) {
        setLocalError('La contraseña no puede ser idéntica a tu dirección de correo.')
        return
      }
      if (cleanName && password.toLowerCase() === cleanName.toLowerCase()) {
        setLocalError('La contraseña no puede ser idéntica a tu nombre.')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Las contraseñas no coinciden. Por favor verifica.')
        return
      }

      setIsSubmitting(true)
      try {
        await register({ name: cleanName, email: email.trim().toLowerCase(), password, role: roleType })
        navigate(from, { replace: true })
      } catch (err) {
        setLocalError(err.message || 'Error al procesar el registro de la cuenta.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0e0e10] text-[#f5f5f7] font-sans selection:bg-[#2563eb] selection:text-white antialiased overflow-hidden">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA (50%): Formulario Campus Control        */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#121214] border-r border-white/[0.06] flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-12 xl:px-20 z-10 relative">
        {/* Glow sutil en la parte superior con Primary #2563EB */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[380px] h-[160px] bg-gradient-to-b from-[#2563eb]/15 to-transparent blur-3xl pointer-events-none" />

        {/* Cabecera: Logo Oficial con Casco Astronauta y Badge Enclave */}
        <header className="flex items-center justify-between w-full mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center gap-3 select-none">
            <img
              src="/campuslands_helmet.png"
              alt="Emblema Astronauta Campuslands"
              className="h-8 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-transform duration-300 hover:scale-105"
            />
            <div className="flex items-baseline gap-1.5 font-brand leading-none">
              <span className="text-[22px] font-bold text-white tracking-normal lowercase">
                campuslands
              </span>
              <span className="text-[22px] font-bold text-[#22d3ee] tracking-normal lowercase">
                control
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] border border-[#0891b2]/35 text-[11px] font-mono text-[#22d3ee] shadow-sm">
            <svg className="w-3 h-3 text-[#22d3ee]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Enclave Seguro</span>
          </div>
        </header>

        {/* Cuerpo Central del Formulario */}
        <main className="w-full max-w-[420px] mx-auto my-auto py-2 relative z-10">
          {/* Título y Subtítulo con Transición Suave */}
          <div key={mode} className="text-center mb-6 animate-tab-fade">
            <h1 className="text-3xl sm:text-[34px] font-bold text-white tracking-tight">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h1>
            <p className="text-xs sm:text-sm text-[#8e8e93] mt-1.5 font-normal">
              {mode === 'login'
                ? 'Ingresa tus credenciales para acceder a la plataforma'
                : 'Regístrate para acceder a los recursos telemáticos del campus'}
            </p>
          </div>

          {/* Segmented Control iOS Dark con Pastilla Deslizante Física (Cero Parpadeo) */}
          <div className="relative bg-[#161618] p-1 rounded-2xl flex items-center mb-6 border border-white/[0.06] select-none">
            {/* Pastilla deslizante animada */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-[#2c2c2e] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-300"
              style={{
                transform: mode === 'register' ? 'translateX(calc(100% + 4px))' : 'translateX(0px)',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 cursor-pointer ${
                mode === 'login' ? 'text-white' : 'text-[#8e8e93] hover:text-[#f5f5f7]'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('register')}
              className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 cursor-pointer ${
                mode === 'register' ? 'text-white' : 'text-[#8e8e93] hover:text-[#f5f5f7]'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Alerta de Error Sutil Pastel */}
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
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Selector de Rol / Perfil Institucional (Docente / Soporte / Admin) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                mode === 'register'
                  ? 'max-h-24 opacity-100 mb-4 transform translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 transform -translate-y-2 pointer-events-none'
              }`}
            >
              <label className="block text-[10px] uppercase font-bold tracking-wider text-[#717684] mb-1.5 px-0.5">
                ROL / PERFIL INSTITUCIONAL
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'teacher', label: 'Docente' },
                  { id: 'support', label: 'Soporte' },
                  { id: 'admin', label: 'Admin' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoleType(item.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      roleType === item.id
                        ? 'bg-[#2563eb]/20 border-[#2563eb] text-[#22d3ee] shadow-sm'
                        : 'bg-[#1c1c1e] border-white/[0.06] text-[#8e8e93] hover:text-[#f5f5f7]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Nombre Completo (Animado: se despliega suavemente en modo registro) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                mode === 'register'
                  ? 'max-h-28 opacity-100 mb-4 transform translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 transform -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/25 focus-within:shadow-[0_0_15px_rgba(37,99,235,0.18)] bg-[#1c1c1e] transition-all duration-200 p-3 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] shrink-0 border border-white/[0.04]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="name" className="block text-[10px] uppercase font-bold tracking-wider text-[#8e8e93]">
                    NOMBRE COMPLETO
                  </label>
                  <input
                    id="name"
                    type="text"
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Carlos Mendoza"
                    value={name}
                    onChange={handleNameChange}
                    disabled={isSubmitting}
                    className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-medium focus:outline-none"
                  />
                </div>
                {name.trim().length >= 2 && (
                  <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)]">
                    ✓
                  </div>
                )}
              </div>
            </div>

            {/* Input Correo */}
            <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/25 focus-within:shadow-[0_0_15px_rgba(37,99,235,0.18)] bg-[#1c1c1e] transition-all duration-200 p-3 flex items-center gap-3.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] shrink-0 border border-white/[0.04]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="email" className="block text-[10px] uppercase font-bold tracking-wider text-[#8e8e93]">
                  CORREO INSTITUCIONAL
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={100}
                  autoComplete="email"
                  placeholder="usuario@campuslands.edu"
                  value={email}
                  onChange={handleEmailChange}
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
            <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/25 focus-within:shadow-[0_0_15px_rgba(37,99,235,0.18)] bg-[#1c1c1e] transition-all duration-200 p-3 flex items-center gap-3.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] shrink-0 border border-white/[0.04]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="password" className="block text-[10px] uppercase font-bold tracking-wider text-[#8e8e93]">
                  {mode === 'register' ? 'CONTRASEÑA (MÍNIMO 8 CARACTERES: LETRAS Y NÚMEROS)' : 'CONTRASEÑA'}
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isSubmitting}
                  className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-mono tracking-widest focus:outline-none"
                />
              </div>
              {mode === 'register' && isPasswordSecure && (
                <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)] mr-1">
                  ✓
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#8e8e93] hover:text-white p-1.5 transition-all duration-150 active:scale-90 cursor-pointer"
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

            {/* Campo Confirmar Contraseña (Animado: se despliega suavemente en modo registro) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                mode === 'register'
                  ? 'max-h-28 opacity-100 mb-2 transform translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 transform -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="rounded-2xl border border-white/[0.08] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/25 focus-within:shadow-[0_0_15px_rgba(37,99,235,0.18)] bg-[#1c1c1e] transition-all duration-200 p-3 flex items-center gap-3.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] shrink-0 border border-white/[0.04]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="confirmPassword" className="block text-[10px] uppercase font-bold tracking-wider text-[#8e8e93]">
                    CONFIRMAR CONTRASEÑA
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={isSubmitting}
                    className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] font-mono tracking-widest focus:outline-none"
                  />
                </div>
                {passwordsMatch && (
                  <div className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center text-[10px] font-bold shrink-0 animate-modal-pop shadow-[0_0_8px_rgba(48,209,88,0.4)]">
                    ✓
                  </div>
                )}
              </div>
            </div>

            {/* Checklist sutil de requisitos de contraseña en tiempo real */}
            {mode === 'register' && password.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] mb-3 px-1">
                <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-[#30d158] font-medium' : 'text-[#8e8e93]'}`}>
                  <span>{hasMinLength ? '✓' : '•'}</span> 8+ caracteres
                </span>
                <span className={`inline-flex items-center gap-1 ${hasLetter && hasNumber ? 'text-[#30d158] font-medium' : 'text-[#8e8e93]'}`}>
                  <span>{hasLetter && hasNumber ? '✓' : '•'}</span> Letras y números
                </span>
                {confirmPassword.length > 0 && (
                  <span className={`inline-flex items-center gap-1 ${passwordsMatch ? 'text-[#30d158] font-medium' : 'text-[#ff453a]'}`}>
                    <span>{passwordsMatch ? '✓' : '✕'}</span> {passwordsMatch ? 'Coinciden' : 'No coinciden'}
                  </span>
                )}
              </div>
            )}

            {/* Toggle iOS Nativo (Sólo visible en modo login) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                mode === 'login'
                  ? 'max-h-12 opacity-100 mb-2 transform translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 transform -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="flex items-center justify-between py-1 px-0.5 select-none">
                <span
                  onClick={() => setRememberMe(!rememberMe)}
                  className="text-xs sm:text-sm text-[#8e8e93] font-medium cursor-pointer transition-colors hover:text-white"
                >
                  Recordar este equipo
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-[48px] h-[28px] rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    rememberMe ? 'bg-[#2563eb]' : 'bg-[#2c2c2e]'
                  }`}
                >
                  <span
                    className={`block w-[24px] h-[24px] bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-200 ${
                      rememberMe ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Botón Principal con Transición Suave de Texto y Estado */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-semibold text-sm sm:text-base tracking-wide shadow-[0_4px_24px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.6)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{mode === 'login' ? 'Iniciando sesión…' : 'Creando cuenta…'}</span>
                  </>
                ) : (
                  <span key={mode} className="animate-tab-fade inline-block">
                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Pie de Página */}
        <footer className="w-full text-center py-2 mt-4">
          <p key={mode} className="text-[11px] text-[#717684] leading-relaxed max-w-sm mx-auto animate-tab-fade">
            {mode === 'login'
              ? 'Acceso al sistema telemático del campus para gestionar salas, préstamos de equipos y monitoreo en tiempo real con cifrado de extremo a extremo.'
              : 'Al registrarte aceptas las políticas de asignación telemática de recursos y normativa institucional de Campuslands.'}
          </p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA (50%): Imagen del Astronauta Full Bleed   */}
      {/* ========================================================= */}
      <div className="hidden lg:block lg:w-1/2 min-h-screen relative overflow-hidden bg-[#08090b]">
        <img
          src="/astronaut_cover.jpg"
          alt="Astronauta Campuslands en el espacio"
          className="w-full h-full object-cover object-center"
        />
      </div>
    </div>
  )
}
