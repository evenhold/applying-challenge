import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMerchantUseCase } from './getById.js';

vi.mock('../../lib/dynamodb.js', () => ({
  getMerchant: vi.fn().mockResolvedValue({
    id: 'MERCHANT#test-id',
    documentType: 'ruc',
    documentNumber: '20123456786',
    businessName: 'Test Business',
    address: 'Test Address',
    email: 'test@test.com',
    phone: '999999999',
    sellerId: 'seller-123',
    status: 'ready_to_submit',
    createdAt: '2026-08-23T00:00:00.000Z',
    updatedAt: '2026-08-23T00:00:00.000Z',
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getMerchantUseCase', () => {
  it('should return merchant when found and owned by seller', async () => {
    const { getMerchant } = await import('../../lib/dynamodb.js');

    const result = await getMerchantUseCase('MERCHANT#test-id', 'seller-123');

    expect(result).toMatchObject({
      id: 'MERCHANT#test-id',
      sellerId: 'seller-123',
    });
    expect(getMerchant).toHaveBeenCalledWith('MERCHANT#test-id');
  });

  it('should throw NotFoundError when merchant does not exist', async () => {
    const mod = await import('../../lib/dynamodb.js');
    const getMerchant = vi.mocked(mod.getMerchant);
    getMerchant.mockResolvedValueOnce(null);

    await expect(getMerchantUseCase('MERCHANT#notfound', 'seller-123')).rejects.toThrow(
      'Merchant MERCHANT#notfound not found',
    );
  });

  it('should throw NotFoundError when seller does not own the merchant', async () => {
    const mod = await import('../../lib/dynamodb.js');
    const getMerchant = vi.mocked(mod.getMerchant);
    getMerchant.mockResolvedValueOnce({
      id: 'MERCHANT#test-id',
      documentType: 'ruc',
      documentNumber: '20123456786',
      businessName: '',
      address: '',
      email: '',
      phone: '',
      sellerId: 'other-seller',
      status: 'pending_enrichment',
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
    });

    await expect(getMerchantUseCase('MERCHANT#test-id', 'seller-123')).rejects.toThrow(
      'Merchant MERCHANT#test-id not found',
    );
  });
});
