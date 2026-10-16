import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Componente defectuoso de prueba
const ProblemChild = ({ shouldThrow, message }) => {
  if (shouldThrow) {
    throw new Error(message || 'Error simulado de prueba');
  }
  return <div>Contenido renderizado correctamente</div>;
};

describe('ErrorBoundary (Graceful Degradation & Defensive UI)', () => {
  // Silenciar console.error durante las pruebas de error esperado
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('debe renderizar a los hijos cuando no ocurren errores', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenido renderizado correctamente')).toBeInTheDocument();
  });

  it('debe capturar el error y mostrar la interfaz de recuperación evitando la pantalla blanca', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Fallo crítico inesperado en el render" />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Se produjo un error inesperado/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fallo crítico inesperado en el render/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Reintentar vista')).toBeInTheDocument();
    expect(screen.getByText('Recargar página')).toBeInTheDocument();
  });

  it('debe mostrar mensaje amigable de conexión cuando el error es de red o backend', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Failed to fetch backend data" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Conexión Interrumpida con el Servidor/i)).toBeInTheDocument();
    expect(screen.getByText(/El backend no respondió a tiempo o se está reiniciando/i)).toBeInTheDocument();
  });

  it('debe permitir reiniciar el estado al hacer clic en Reintentar vista', () => {
    const handleReset = vi.fn();
    const { rerender } = render(
      <ErrorBoundary onReset={handleReset}>
        <ProblemChild shouldThrow={true} message="Error inicial" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Reintentar vista')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar vista'));

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
