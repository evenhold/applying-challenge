import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listMerchantsUseCase } from './list.js';

vi.mock('../../lib/dynamodb.js', () => ({
  getMerchantsBySeller: vi.fn().mockResolvedValue([
    {
      id: 'MERCHANT#1',
      documentType: 'ruc',
      documentNumber: '20123456786',
      businessName: 'Business 1',
      address: 'Address 1',
      email: 'test1@test.com',
      phone: '999999999',
      sellerId: 'seller-123',
      status: 'pending_enrichment',
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
    },
    {
      id: 'MERCHANT#2',
      documentType: 'dni',
      documentNumber: '12345678',
      businessName: '',
      address: '',
      email: '',
      phone: '',
      sellerId: 'seller-123',
      status: 'ready_to_submit',
      createdAt: '2026-08-23T01:00:00.000Z',
      updatedAt: '2026-08-23T01:00:00.000Z',
    },
  ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listMerchantsUseCase', () => {
  it('should return merchants for seller', async () => {
    const { getMerchantsBySeller } = await import('../../lib/dynamodb.js');

    const result = await listMerchantsUseCase('seller-123');

    expect(result).toHaveLength(2);
    expect(getMerchantsBySeller).toHaveBeenCalledWith('seller-123');
  });

  it('should return empty array when seller has no merchants', async () => {
    const mod = await import('../../lib/dynamodb.js');
    const getMerchantsBySeller = vi.mocked(mod.getMerchantsBySeller);
    getMerchantsBySeller.mockResolvedValueOnce([]);

    const result = await listMerchantsUseCase('seller-noone');

    expect(result).toHaveLength(0);
  });
});
