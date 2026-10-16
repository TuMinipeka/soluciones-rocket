import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecommendationCard from '../RecommendationCard';

describe('RecommendationCard (HU-20)', () => {
  const mockAiRecommendation = {
    classification_source: 'ai',
    targetRoomId: 'SAL-004',
    targetRoomName: 'Spooki',
    reason: 'Aforo compatible (38 PCs disponibles) y climatización óptima.',
    confidence: 0.96,
    alternatives: [
      { id: 'SAL-004', name: 'Spooki', reason: 'Aforo compatible' },
    ],
  };

  const mockRulesRecommendation = {
    classification_source: 'rules',
    targetRoomId: 'SAL-010',
    targetRoomName: 'Artemis',
    reason: 'Regla Fallback Audiovisual R-204: proyector de repuesto disponible.',
    confidence: 0.88,
    alternatives: [
      { id: 'SAL-010', name: 'Artemis', reason: 'Proyector 4K disponible' },
    ],
  };

  const mockNoAlternatives = {
    classification_source: 'ai',
    alternatives: [],
    targetRoomId: null,
    targetRoomName: null,
    reason: 'Sin alternativas',
  };

  it('debe mostrar el badge visual distintivo de IA cuando el origen es "ai"', () => {
    render(<RecommendationCard recommendation={mockAiRecommendation} user={{ role: 'admin' }} />);

    expect(screen.getByText('Clasificación IA')).toBeInTheDocument();
    expect(screen.getByText(/Confianza: 96%/i)).toBeInTheDocument();
    expect(screen.getByText(/Spooki/i)).toBeInTheDocument();
  });

  it('debe mostrar el texto de fallback por reglas cuando el origen es "rules"', () => {
    render(<RecommendationCard recommendation={mockRulesRecommendation} user={{ role: 'admin' }} />);

    expect(screen.getByText('Reglas Locales (Fallback)')).toBeInTheDocument();
    expect(screen.getByText(/Artemis/i)).toBeInTheDocument();
  });

  it('debe OCULTAR el botón "Confirmar Reubicación" para roles teacher y support', () => {
    const { rerender } = render(
      <RecommendationCard recommendation={mockAiRecommendation} user={{ role: 'teacher' }} />
    );
    expect(screen.queryByText('Confirmar Reubicación')).not.toBeInTheDocument();

    rerender(<RecommendationCard recommendation={mockAiRecommendation} user={{ role: 'support' }} />);
    expect(screen.queryByText('Confirmar Reubicación')).not.toBeInTheDocument();
  });

  it('debe MOSTRAR y permitir ejecutar "Confirmar Reubicación" exclusivamente para rol admin', () => {
    const handleConfirm = vi.fn();
    render(
      <RecommendationCard
        recommendation={mockAiRecommendation}
        user={{ role: 'admin' }}
        onConfirm={handleConfirm}
      />
    );

    const confirmBtn = screen.getByText('Confirmar Reubicación');
    expect(confirmBtn).toBeInTheDocument();

    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('debe desplegar la alerta clara cuando no existan salas alternativas viables', () => {
    render(<RecommendationCard recommendation={mockNoAlternatives} user={{ role: 'admin' }} />);

    expect(
      screen.getByText(/No hay salas alternativas con aforo y equipamiento disponible para este horario/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Confirmar Reubicación')).not.toBeInTheDocument();
  });
});
