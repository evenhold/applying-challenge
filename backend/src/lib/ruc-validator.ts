import type { DocumentType } from '../types/index.js';

const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Calculate check digit using modulo 11 algorithm
 */
function calculateCheckDigit(digits: number[]): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * RUC_WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder >= 2 ? 11 - remainder : 0;
}

/**
 * Validate a Peruvian RUC (11 digits, modulo 11 check)
 */
export function validateRuc(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) {
    return false;
  }

  const firstDigit = Number.parseInt(ruc[0], 10);
  if (firstDigit !== 1 && firstDigit !== 2) {
    return false;
  }

  const digits = ruc.slice(0, 10).split('').map(Number);
  const expectedCheckDigit = calculateCheckDigit(digits);
  const actualCheckDigit = Number.parseInt(ruc[10], 10);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Validate document number based on type
 */
export function validateDocumentNumber(type: DocumentType, number: string): boolean {
  switch (type) {
    case 'ruc':
      return validateRuc(number);
    case 'dni':
      return /^\d{8}$/.test(number);
    case 'ce':
      return /^[A-Z0-9]{9,12}$/.test(number);
    default:
      return false;
  }
}
