/**
 * Página: Registro de Usuario Institucional (Docente / Soporte / Admin) (HU-11, HU-21)
 * Reutiliza el componente unificado de autenticación con modo inicial 'register'.
 * Permite alternancia física fluida entre login y registro con cero parpadeo.
 * Responsable: GUERRA
 */

import LoginPage from './LoginPage'

export default function RegisterPage() {
  return <LoginPage initialMode="register" />
}
