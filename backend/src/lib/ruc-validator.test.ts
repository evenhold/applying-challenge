import { describe, expect, it } from 'vitest';
import { validateDocumentNumber, validateRuc } from './ruc-validator.js';

describe('validateRuc', () => {
  it('should accept valid RUC starting with 1', () => {
    expect(validateRuc('10123456780')).toBe(true);
  });

  it('should accept valid RUC starting with 2', () => {
    expect(validateRuc('20123456786')).toBe(true);
  });

  it('should reject RUC with invalid length', () => {
    expect(validateRuc('1234567890')).toBe(false);
    expect(validateRuc('123456789012')).toBe(false);
  });

  it('should reject RUC with non-digit characters', () => {
    expect(validateRuc('1234567890a')).toBe(false);
  });

  it('should reject RUC starting with digit other than 1 or 2', () => {
    expect(validateRuc('30123456789')).toBe(false);
    expect(validateRuc('90123456789')).toBe(false);
  });

  it('should reject RUC with invalid check digit', () => {
    expect(validateRuc('20123456780')).toBe(false);
  });
});

describe('validateDocumentNumber', () => {
  it('should validate RUC through delegation', () => {
    expect(validateDocumentNumber('ruc', '20123456786')).toBe(true);
    expect(validateDocumentNumber('ruc', '00000000000')).toBe(false);
  });

  it('should validate DNI (8 digits)', () => {
    expect(validateDocumentNumber('dni', '12345678')).toBe(true);
    expect(validateDocumentNumber('dni', '1234567')).toBe(false);
    expect(validateDocumentNumber('dni', '123456789')).toBe(false);
    expect(validateDocumentNumber('dni', '1234567a')).toBe(false);
  });

  it('should validate CE (9-12 alphanumeric)', () => {
    expect(validateDocumentNumber('ce', 'ABC123456')).toBe(true);
    expect(validateDocumentNumber('ce', '123456789')).toBe(true);
    expect(validateDocumentNumber('ce', 'ABC12345678901')).toBe(false);
    expect(validateDocumentNumber('ce', 'ABC12345')).toBe(false);
  });

  it('should return false for unknown document type', () => {
    expect(validateDocumentNumber('passport' as never, '123456')).toBe(false);
  });
});
