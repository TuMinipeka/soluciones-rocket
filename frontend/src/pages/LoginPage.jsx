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
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Cabecera de marca con insignia Apple */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold text-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] mb-4 select-none">
          CL
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Campuslands
        </h2>
        <p className="mt-1.5 text-xs uppercase tracking-widest text-zinc-400 font-bold">
          Sistema Central de Control Operativo
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] border-zinc-200/80 rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(localError || authError) && (
              <ErrorMessage message={localError || authError} />
            )}

            <Input
              label="Correo institucional"
              type="email"
              required
              autoComplete="email"
              placeholder="docente@campuslands.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              label="Contraseña"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-sm"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión…' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
            <p className="text-xs text-zinc-500">
              ¿No tienes cuenta en el campus?{' '}
              <Link
                to="/register"
                className="font-bold text-zinc-900 hover:underline"
              >
                Registrar cuenta docente
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
