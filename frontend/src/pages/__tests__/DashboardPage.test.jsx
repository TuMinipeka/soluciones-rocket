import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../DashboardPage';
import * as dashboardApi from '../../api/dashboard';

vi.mock('../../api/dashboard', () => ({
  getDashboardSummary: vi.fn(),
  getDashboardSummaryApi: vi.fn(),
}));

describe('DashboardPage (HU-19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar el estado de carga (LoadingState) inicialmente', () => {
    // Simular promesa pendiente
    dashboardApi.getDashboardSummaryApi.mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);
    expect(screen.getByText(/Cargando métricas consolidadas del campus/i)).toBeInTheDocument();
  });

  it('debe renderizar las 4 métricas clave cuando la consulta es exitosa', async () => {
    const mockSummary = {
      spaces_free: 7,
      spaces_occupied: 3,
      spaces_total: 10,
      active_loans: 18,
      disabled_resources: 1,
      open_incidents: 3,
      in_progress_incidents: 2,
      total_operations_today: 52,
      contingency_alert: null,
      recent_events: [],
    };

    dashboardApi.getDashboardSummaryApi.mockResolvedValue(mockSummary);

    render(<DashboardPage />);

    // Esperar a que se resuelva la carga
    await waitFor(() => {
      expect(screen.getByText(/Espacios Libres vs. Ocupados/i)).toBeInTheDocument();
    });

    expect(screen.getByText('7 / 10')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText(/1 recursos inhabilitados/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
  });

  it('debe renderizar ErrorMessage cuando ocurre una falla crítica del servidor', async () => {
    dashboardApi.getDashboardSummaryApi.mockRejectedValue(new Error('Fallo crítico 500'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Fallo al obtener resumen operativo/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Fallo crítico 500/i)).toBeInTheDocument();
  });

  it('debe renderizar EmptyState de forma limpia si la respuesta no contiene datos', async () => {
    dashboardApi.getDashboardSummaryApi.mockResolvedValue(null);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron métricas operativas/i)).toBeInTheDocument();
    });
  });
});
