import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpieza automática tras cada prueba unitaria
afterEach(() => {
  cleanup();
});
