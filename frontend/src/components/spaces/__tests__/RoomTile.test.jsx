import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoomTile from '../RoomTile';

describe('RoomTile (HU-18)', () => {
  const mockRoomAvailable = {
    id: 'SAL-001',
    name: 'Auditorio',
    capacity: 100,
    status: 'available',
    equipment: ['Pantalla Gigante', 'Sonido Dolby'],
  };

  const mockRoomOccupied = {
    id: 'SAL-002',
    name: 'Cosmos',
    capacity: 25,
    status: 'occupied',
    currentReservation: { title: 'Clase Python' },
  };

  const mockRoomIncident = {
    id: 'SAL-005',
    name: 'Apolo',
    capacity: 34,
    status: 'incident',
    currentReservation: { title: 'Falla térmica' },
  };

  const mockRoomDisabled = {
    id: 'SAL-006',
    name: 'Blanca',
    capacity: 12,
    status: 'disabled',
    is_blocked: true,
  };

  it('debe renderizar el nombre, código y capacidad numérica oficial', () => {
    render(<RoomTile room={mockRoomAvailable} />);

    expect(screen.getByText('Auditorio')).toBeInTheDocument();
    expect(screen.getByText('SAL-001')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('debe reflejar el estado ocupado y mostrar la reserva en curso', () => {
    render(<RoomTile room={mockRoomOccupied} />);

    expect(screen.getByText('Cosmos')).toBeInTheDocument();
    expect(screen.getByText('Ocupada')).toBeInTheDocument();
    expect(screen.getByText('Clase Python')).toBeInTheDocument();
  });

  it('debe reflejar el estado de incidencia sin romper la interfaz', () => {
    render(<RoomTile room={mockRoomIncident} />);

    expect(screen.getByText('Apolo')).toBeInTheDocument();
    expect(screen.getByText('Con Incidencia')).toBeInTheDocument();
  });

  it('debe reflejar el estado inhabilitado/bloqueado', () => {
    render(<RoomTile room={mockRoomDisabled} />);

    expect(screen.getByText('Blanca')).toBeInTheDocument();
    expect(screen.getByText('Inhabilitada')).toBeInTheDocument();
  });

  it('debe responder al clic del usuario llamando a onClick con los datos de la sala', () => {
    const handleClick = vi.fn();
    render(<RoomTile room={mockRoomAvailable} onClick={handleClick} />);

    const tile = screen.getByRole('button');
    fireEvent.click(tile);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockRoomAvailable);
  });

  it('debe soportar accesibilidad por teclado ejecutando selección con Enter y Espacio', () => {
    const handleClick = vi.fn();
    render(<RoomTile room={mockRoomAvailable} onClick={handleClick} />);

    const tile = screen.getByRole('button');

    // Pulsar Enter
    fireEvent.keyDown(tile, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Pulsar Espacio
    fireEvent.keyDown(tile, { key: ' ', code: 'Space' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
