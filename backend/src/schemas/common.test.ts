import { describe, expect, it } from 'vitest';
import { documentTypeSchema, merchantStatusSchema } from './common.js';

describe('documentTypeSchema', () => {
  it('should accept valid document types', () => {
    expect(documentTypeSchema.parse('ruc')).toBe('ruc');
    expect(documentTypeSchema.parse('dni')).toBe('dni');
    expect(documentTypeSchema.parse('ce')).toBe('ce');
  });

  it('should reject invalid document types', () => {
    expect(() => documentTypeSchema.parse('passport')).toThrow();
    expect(() => documentTypeSchema.parse('')).toThrow();
    expect(() => documentTypeSchema.parse('RUC')).toThrow();
  });
});

describe('merchantStatusSchema', () => {
  it('should accept valid statuses', () => {
    expect(merchantStatusSchema.parse('pending_enrichment')).toBe('pending_enrichment');
    expect(merchantStatusSchema.parse('enriching')).toBe('enriching');
    expect(merchantStatusSchema.parse('ready_to_submit')).toBe('ready_to_submit');
    expect(merchantStatusSchema.parse('submitted')).toBe('submitted');
    expect(merchantStatusSchema.parse('approved')).toBe('approved');
    expect(merchantStatusSchema.parse('rejected')).toBe('rejected');
  });

  it('should reject invalid statuses', () => {
    expect(() => merchantStatusSchema.parse('pending')).toThrow();
    expect(() => merchantStatusSchema.parse('')).toThrow();
  });
});
