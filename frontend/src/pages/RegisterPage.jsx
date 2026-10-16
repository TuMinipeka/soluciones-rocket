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
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-zinc-900 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold text-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] mb-4 select-none">
          CL
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Registro Docente
        </h2>
        <p className="mt-1.5 text-xs uppercase tracking-widest text-zinc-400 font-bold">
          Acceso a Salas y Recursos Académicos
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] border-zinc-200/80 rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(localError || authError) && (
              <ErrorMessage message={localError || authError} />
            )}

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
              placeholder="••••••••"
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
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Aviso de rol predeterminado conforme a HU-11 */}
            <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/60 text-xs text-zinc-600 flex items-start gap-2.5">
              <span className="text-base">ℹ️</span>
              <span className="leading-relaxed">
                Toda cuenta pública creada recibe automáticamente permisos de <strong className="text-zinc-900">docente</strong> para reservar espacios y solicitar equipos.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-sm"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Registrando cuenta…' : 'Crear Cuenta'}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
            <p className="text-xs text-zinc-500">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-bold text-zinc-900 hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
