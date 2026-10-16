import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ReservationPage from '../ReservationPage'
import { getSpacesApi, getSpaceReservationsApi } from '../../api/spaces'
import { getReservationsApi } from '../../api/reservations'

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ state: { preselectedDate: '2026-10-20' } }),
}))
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 2, name: 'Docente Uno', role: 'teacher' } }),
}))
vi.mock('../../api/spaces', () => ({
  getSpacesApi: vi.fn(),
  getSpaceReservationsApi: vi.fn(),
}))
vi.mock('../../api/reservations', () => ({
  getReservationsApi: vi.fn(),
  createReservationApi: vi.fn(),
  cancelReservationApi: vi.fn(),
}))
vi.mock('../../components/spaces/SpaceConciergeModal', () => ({
  default: () => null,
}))

describe('ReservationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSpacesApi.mockResolvedValue([{ id: 'SAL-002', name: 'Cosmos', capacity: 25, status: 'occupied' }])
    getSpaceReservationsApi.mockResolvedValue([{
      id: 7, date: '2026-10-20', start_time: '08:00:00', end_time: '10:00:00', status: 'confirmed',
    }])
    getReservationsApi.mockResolvedValue([{
      id: 7, space_id: 'SAL-002', space_name: 'Cosmos', user_id: 2, user_name: 'Docente Uno',
      date: '2026-10-20', start_time: '08:00:00', end_time: '10:00:00',
      attendees: 20, status: 'confirmed', title: 'Clase de prueba',
    }])
  })

  it('carga la franja completa y muestra sala, reserva y titular', async () => {
    render(<ReservationPage />)

    await waitFor(() => expect(getSpacesApi).toHaveBeenCalledWith({
      date: '2026-10-20', start_time: '08:00', end_time: '10:00',
    }))
    expect(await screen.findByRole('option', { name: 'Cosmos · 25 personas' })).toBeInTheDocument()
    expect(await screen.findByText('Historial de Reservas (1)')).toBeInTheDocument()
    expect((await screen.findAllByText('Docente Uno')).length).toBeGreaterThan(0)
    expect(await screen.findByText('08:00 – 10:00')).toBeInTheDocument()
  })

  it('mantiene las salas visibles si falla la consulta del historial', async () => {
    getReservationsApi.mockRejectedValue(new Error('Sin acceso al historial'))
    render(<ReservationPage />)

    expect(await screen.findByRole('option', { name: 'Cosmos · 25 personas' })).toBeInTheDocument()
    expect(await screen.findByText('Sin acceso al historial')).toBeInTheDocument()
  })
})
