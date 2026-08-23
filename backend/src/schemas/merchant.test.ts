import { describe, expect, it } from 'vitest';
import { createMerchantSchema, updateMerchantSchema } from './merchant.js';

describe('createMerchantSchema', () => {
  it('should accept valid create input', () => {
    const input = { documentType: 'ruc', documentNumber: '20123456786' };
    expect(createMerchantSchema.parse(input)).toEqual(input);
  });

  it('should accept dni document type', () => {
    const input = { documentType: 'dni', documentNumber: '12345678' };
    expect(createMerchantSchema.parse(input)).toEqual(input);
  });

  it('should accept ce document type', () => {
    const input = { documentType: 'ce', documentNumber: 'ABC123456' };
    expect(createMerchantSchema.parse(input)).toEqual(input);
  });

  it('should reject when documentType is missing', () => {
    expect(() => createMerchantSchema.parse({ documentNumber: '123' })).toThrow();
  });

  it('should reject when documentNumber is missing', () => {
    expect(() => createMerchantSchema.parse({ documentType: 'ruc' })).toThrow();
  });

  it('should reject when documentNumber is empty', () => {
    expect(() => createMerchantSchema.parse({ documentType: 'ruc', documentNumber: '' })).toThrow();
  });

  it('should reject invalid documentType', () => {
    expect(() =>
      createMerchantSchema.parse({ documentType: 'passport', documentNumber: '123' }),
    ).toThrow();
  });
});

describe('updateMerchantSchema', () => {
  it('should accept valid update with businessName', () => {
    const input = { businessName: 'Test Business' };
    expect(updateMerchantSchema.parse(input)).toEqual(input);
  });

  it('should accept valid update with email', () => {
    const input = { email: 'test@example.com' };
    expect(updateMerchantSchema.parse(input)).toEqual(input);
  });

  it('should accept valid update with phone', () => {
    const input = { phone: '999888777' };
    expect(updateMerchantSchema.parse(input)).toEqual(input);
  });

  it('should accept valid update with status', () => {
    const input = { status: 'submitted' };
    expect(updateMerchantSchema.parse(input)).toEqual(input);
  });

  it('should accept multiple fields', () => {
    const input = {
      businessName: 'Updated',
      email: 'new@test.com',
      phone: '999888777',
    };
    expect(updateMerchantSchema.parse(input)).toEqual(input);
  });

  it('should reject empty object', () => {
    expect(() => updateMerchantSchema.parse({})).toThrow('At least one field is required');
  });

  it('should reject invalid email format', () => {
    expect(() => updateMerchantSchema.parse({ email: 'not-an-email' })).toThrow(
      'Invalid email format',
    );
  });

  it('should reject phone with wrong length', () => {
    expect(() => updateMerchantSchema.parse({ phone: '123' })).toThrow('phone must be 9 digits');
  });

  it('should reject phone with non-digit characters', () => {
    expect(() => updateMerchantSchema.parse({ phone: '999abc777' })).toThrow(
      'phone must be 9 digits',
    );
  });

  it('should reject invalid status', () => {
    expect(() => updateMerchantSchema.parse({ status: 'invalid' })).toThrow();
  });

  it('should reject businessName exceeding 200 chars', () => {
    expect(() => updateMerchantSchema.parse({ businessName: 'a'.repeat(201) })).toThrow();
  });

  it('should accept businessName at exactly 200 chars', () => {
    const input = { businessName: 'a'.repeat(200) };
    expect(updateMerchantSchema.parse(input)).toEqual(input);
  });
});
