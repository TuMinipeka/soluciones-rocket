/**
 * Página: Iniciar Sesión (HU-12, HU-21)
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
      setLocalError(err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-zinc-900 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold text-lg shadow-sm mb-4">
          CL
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Campuslands Operations
        </h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
          Acceso Seguro al Campus
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-zinc-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(localError || authError) && (
              <ErrorMessage message={localError || authError} />
            )}

            <Input
              label="Correo institucional"
              type="email"
              required
              autoComplete="email"
              placeholder="nombre@campuslands.com"
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
                size="md"
                className="w-full"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión…' : 'Ingresar'}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
            <p className="text-xs text-zinc-500">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="font-semibold text-zinc-900 hover:underline"
              >
                Crear cuenta docente
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
