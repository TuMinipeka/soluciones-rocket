import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import IncidentsListPage from '../IncidentsListPage'
import { getIncidentsApi } from '../../api/incidents'

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, role: 'admin', name: 'Admin' } }),
}))
vi.mock('../../api/incidents', () => ({ getIncidentsApi: vi.fn() }))

describe('IncidentsListPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra solo las incidencias recibidas de la API', async () => {
    getIncidentsApi.mockResolvedValue([{
      id: 5,
      description: 'Prueba técnica: proyector sin imagen',
      space_id: 'SAL-002',
      priority: 'medium',
      status: 'open',
      classification_source: 'ai',
    }])

    render(<IncidentsListPage />)

    expect((await screen.findAllByText('Prueba técnica: proyector sin imagen')).length).toBeGreaterThan(0)
    expect(screen.getByText('#5')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando SQLite no contiene incidencias', async () => {
    getIncidentsApi.mockResolvedValue([])

    render(<IncidentsListPage />)

    expect(await screen.findByText('No hay incidencias reportadas')).toBeInTheDocument()
    expect(screen.queryByText(/Fallo Crítico en Sistema de Aire Acondicionado/)).not.toBeInTheDocument()
  })

  it('informa el fallo de red sin inventar registros', async () => {
    getIncidentsApi.mockRejectedValue(new Error('Sin conexión con el backend'))

    render(<IncidentsListPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión con el backend')
    expect(screen.queryByText('No hay incidencias reportadas')).not.toBeInTheDocument()
    expect(screen.queryByText(/Fallo Crítico en Sistema de Aire Acondicionado/)).not.toBeInTheDocument()
  })
})
