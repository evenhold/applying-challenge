import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMerchantUseCase } from './create.js';

vi.mock('../../lib/dynamodb.js', () => ({
  createMerchant: vi.fn().mockImplementation((input) =>
    Promise.resolve({
      id: 'MERCHANT#test-id',
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      businessName: '',
      address: '',
      email: '',
      phone: '',
      sellerId: input.sellerId,
      status: 'pending_enrichment',
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
    }),
  ),
}));

vi.mock('../../lib/sqs.js', () => ({
  sendEnrichmentMessage: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createMerchantUseCase', () => {
  it('should create merchant with valid RUC', async () => {
    const { createMerchant } = await import('../../lib/dynamodb.js');
    const { sendEnrichmentMessage } = await import('../../lib/sqs.js');

    const input = {
      documentType: 'ruc' as const,
      documentNumber: '20123456786',
      sellerId: 'seller-123',
    };

    const result = await createMerchantUseCase(input);

    expect(result).toMatchObject({
      id: 'MERCHANT#test-id',
      documentType: 'ruc',
      documentNumber: '20123456786',
      sellerId: 'seller-123',
      status: 'pending_enrichment',
    });
    expect(createMerchant).toHaveBeenCalledWith(input);
    expect(sendEnrichmentMessage).toHaveBeenCalledWith('MERCHANT#test-id', 'ruc', '20123456786');
  });

  it('should create merchant with valid DNI', async () => {
    const { createMerchant } = await import('../../lib/dynamodb.js');
    const { sendEnrichmentMessage } = await import('../../lib/sqs.js');

    const input = {
      documentType: 'dni' as const,
      documentNumber: '12345678',
      sellerId: 'seller-123',
    };

    const result = await createMerchantUseCase(input);

    expect(result.documentType).toBe('dni');
    expect(result.documentNumber).toBe('12345678');
    expect(createMerchant).toHaveBeenCalledWith(input);
    expect(sendEnrichmentMessage).toHaveBeenCalledWith('MERCHANT#test-id', 'dni', '12345678');
  });

  it('should throw ValidationError for invalid RUC', async () => {
    await expect(
      createMerchantUseCase({
        documentType: 'ruc',
        documentNumber: '00000000000',
        sellerId: 'seller-123',
      }),
    ).rejects.toThrow('Invalid document number for type ruc');
  });

  it('should throw ValidationError for invalid DNI', async () => {
    await expect(
      createMerchantUseCase({
        documentType: 'dni',
        documentNumber: '12345',
        sellerId: 'seller-123',
      }),
    ).rejects.toThrow('Invalid document number for type dni');
  });
});
