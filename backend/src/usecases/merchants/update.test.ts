import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateMerchantUseCase } from './update.js';

vi.mock('../../lib/dynamodb.js', () => ({
  updateMerchant: vi.fn().mockResolvedValue({
    id: 'MERCHANT#test-id',
    documentType: 'ruc',
    documentNumber: '20123456786',
    businessName: 'Updated Business',
    address: 'Test Address',
    email: 'test@test.com',
    phone: '999999999',
    sellerId: 'seller-123',
    status: 'ready_to_submit',
    createdAt: '2026-08-23T00:00:00.000Z',
    updatedAt: '2026-08-23T02:00:00.000Z',
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateMerchantUseCase', () => {
  it('should update merchant when found and owned by seller', async () => {
    const { updateMerchant } = await import('../../lib/dynamodb.js');

    const input = { businessName: 'Updated Business' };
    const result = await updateMerchantUseCase('MERCHANT#test-id', 'seller-123', input);

    expect(result.businessName).toBe('Updated Business');
    expect(updateMerchant).toHaveBeenCalledWith('MERCHANT#test-id', input);
  });

  it('should throw NotFoundError when merchant does not exist', async () => {
    const mod = await import('../../lib/dynamodb.js');
    const updateMerchant = vi.mocked(mod.updateMerchant);
    updateMerchant.mockResolvedValueOnce(null);

    await expect(
      updateMerchantUseCase('MERCHANT#notfound', 'seller-123', { businessName: 'Test' }),
    ).rejects.toThrow('Merchant MERCHANT#notfound not found');
  });

  it('should throw NotFoundError when seller does not own the merchant', async () => {
    const mod = await import('../../lib/dynamodb.js');
    const updateMerchant = vi.mocked(mod.updateMerchant);
    updateMerchant.mockResolvedValueOnce({
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

    await expect(
      updateMerchantUseCase('MERCHANT#test-id', 'seller-123', { businessName: 'Test' }),
    ).rejects.toThrow('Merchant MERCHANT#test-id not found');
  });

  it('should update merchant status to submitted', async () => {
    const mod = await import('../../lib/dynamodb.js');
    const updateMerchant = vi.mocked(mod.updateMerchant);
    updateMerchant.mockResolvedValueOnce({
      id: 'MERCHANT#test-id',
      documentType: 'ruc',
      documentNumber: '20123456786',
      businessName: '',
      address: '',
      email: '',
      phone: '',
      sellerId: 'seller-123',
      status: 'submitted',
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T02:00:00.000Z',
    });

    const result = await updateMerchantUseCase('MERCHANT#test-id', 'seller-123', {
      status: 'submitted',
    });

    expect(result.status).toBe('submitted');
  });
});
