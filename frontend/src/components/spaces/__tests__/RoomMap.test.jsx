import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoomMap, { OFFICIAL_CAMPUS_ROOMS } from '../RoomMap';

describe('RoomMap (HU-18)', () => {
  it('debe renderizar las 10 salas oficiales con sus capacidades exactas', () => {
    render(<RoomMap rooms={OFFICIAL_CAMPUS_ROOMS} />);

    // Verificar las 10 salas oficiales
    const expectedRooms = [
      { name: 'Auditorio', cap: '100' },
      { name: 'Spooki', cap: '38' },
      { name: 'Apolo', cap: '34' },
      { name: 'Artemis', cap: '32' },
      { name: 'Cosmos', cap: '25' },
      { name: 'Skilab', cap: '20' },
      { name: 'Blanca', cap: '12' },
      { name: 'Azul', cap: '10' },
      { name: 'Amarillas', cap: '6' },
      { name: 'Verdes', cap: '6' },
    ];

    expectedRooms.forEach(({ name, cap }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getAllByText(cap).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('debe renderizar la leyenda de estados accesible', () => {
    render(<RoomMap rooms={OFFICIAL_CAMPUS_ROOMS} />);

    expect(screen.getByText(/Estados:/i)).toBeInTheDocument();
    expect(screen.getAllByText('Disponible').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ocupada').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Con Incidencia').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inhabilitada / Mantenimiento').length).toBeGreaterThanOrEqual(1);
  });

  it('debe abrir la ficha técnica modal al seleccionar una sala', () => {
    render(<RoomMap rooms={OFFICIAL_CAMPUS_ROOMS} />);

    // Hacer clic en Auditorio
    const auditorioBtn = screen.getByLabelText(/Sala Auditorio/i);
    fireEvent.click(auditorioBtn);

    // Debe mostrar modal con equipamiento y aforo
    expect(screen.getByText(/Ficha técnica de espacio y equipamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/Aforo Máximo/i)).toBeInTheDocument();
    expect(screen.getByText(/Pantalla Gigante Láser/i)).toBeInTheDocument();
  });

  it('debe renderizar el estado de carga cuando loading es true', () => {
    render(<RoomMap loading={true} />);

    expect(screen.getByText(/Cargando mapa de espacios y aforos del campus/i)).toBeInTheDocument();
  });

  it('debe renderizar el mensaje de error cuando ocurre un fallo', () => {
    const handleRetry = vi.fn();
    render(<RoomMap error="Error de conexión con el backend" onRetry={handleRetry} />);

    expect(screen.getByText(/Error de conexión con el backend/i)).toBeInTheDocument();
    const retryBtn = screen.getByText('Reintentar');
    fireEvent.click(retryBtn);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
