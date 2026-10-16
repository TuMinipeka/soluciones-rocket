import { useEffect, useState } from 'react'

export default function App() {
  const [apiStatus, setApiStatus] = useState('Comprobando conexión…')

  useEffect(() => {
    let active = true
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error('API no disponible')
        return response.json()
      })
      .then((result) => {
        if (active) setApiStatus(result.status === 'ok' ? 'API y base de datos disponibles' : 'Estado inesperado')
      })
      .catch(() => {
        if (active) setApiStatus('API no disponible')
      })
    return () => { active = false }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Campuslands</p>
      <h1 className="text-4xl font-bold tracking-tight">Gestión operativa</h1>
      <p className="text-lg text-slate-600">
        Base del proyecto preparada. Los flujos de espacios, reservas, recursos e incidencias
        se incorporarán según los contratos y criterios del reto.
      </p>
      <p role="status" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        {apiStatus}
      </p>
    </main>
  )
}
