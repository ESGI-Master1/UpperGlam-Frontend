import type { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

const axiosError = (data: unknown): AxiosError => {
  return {
    isAxiosError: true,
    response: {
      data,
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {
        headers: {},
      },
    },
    toJSON: () => ({}),
    name: 'AxiosError',
    message: 'Request failed',
  } as AxiosError;
};

describe('getErrorMessage', () => {
  it('prefers nested API error messages', () => {
    expect(
      getErrorMessage(
        axiosError({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Adresse requise',
          },
        }),
        'Erreur inconnue'
      )
    ).toBe('Adresse requise');
  });

  it('falls back through known API fields', () => {
    expect(getErrorMessage(axiosError({ message: 'Paiement refuse' }), 'Erreur inconnue')).toBe(
      'Paiement refuse'
    );
    expect(getErrorMessage(axiosError({ detail: 'Timeout PSP' }), 'Erreur inconnue')).toBe(
      'Timeout PSP'
    );
  });

  it('uses the fallback for empty or unknown errors', () => {
    expect(getErrorMessage(new Error('   '), 'Erreur inconnue')).toBe('Erreur inconnue');
    expect(getErrorMessage(null, 'Erreur inconnue')).toBe('Erreur inconnue');
  });
});
