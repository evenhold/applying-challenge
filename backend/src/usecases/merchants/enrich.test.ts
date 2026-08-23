import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnrichmentMessage } from '../../lib/sqs.js';
import type { Merchant } from '../../types/index.js';

vi.mock('../../lib/dynamodb.js', () => ({
  getMerchant: vi.fn(),
  enrichMerchant: vi.fn(),
}));

vi.mock('../../lib/ses.js', () => ({
  sendEmail: vi.fn(),
  buildEnrichmentCompleteEmail: vi.fn(),
}));

vi.mock('../../lib/sunat.js', () => ({
  querySunat: vi.fn(),
}));

import { enrichMerchant, getMerchant } from '../../lib/dynamodb.js';
import { buildEnrichmentCompleteEmail, sendEmail } from '../../lib/ses.js';
import { querySunat } from '../../lib/sunat.js';
import { enrichMerchantUseCase } from './enrich.js';

const mockGetMerchant = vi.mocked(getMerchant);
const mockEnrichMerchant = vi.mocked(enrichMerchant);
const mockSendEmail = vi.mocked(sendEmail);
const mockBuildEmail = vi.mocked(buildEnrichmentCompleteEmail);
const mockQuerySunat = vi.mocked(querySunat);

const mockMerchant: Merchant = {
  id: 'MERCHANT#test-id',
  documentType: 'ruc',
  documentNumber: '20123456786',
  businessName: '',
  address: '',
  email: '',
  phone: '',
  sellerId: 'seller-123',
  status: 'pending_enrichment',
  createdAt: '2026-08-23T10:00:00.000Z',
  updatedAt: '2026-08-23T10:00:00.000Z',
};

const mockEnrichedMerchant: Merchant = {
  ...mockMerchant,
  businessName: 'Empresa ABC SAC',
  address: 'Av. Principal 123, San Isidro, Lima',
  email: 'contacto@abc.com',
  phone: '014567890',
  status: 'ready_to_submit',
  updatedAt: '2026-08-23T10:05:00.000Z',
};

describe('enrichMerchantUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enrich merchant with SUNAT data and send email', async () => {
    const message: EnrichmentMessage = {
      merchantId: 'MERCHANT#test-id',
      documentType: 'ruc',
      documentNumber: '20123456786',
      timestamp: '2026-08-23T10:00:00.000Z',
    };

    mockGetMerchant.mockResolvedValue(mockMerchant);
    mockQuerySunat.mockResolvedValue({
      businessName: 'Empresa ABC SAC',
      address: 'Av. Principal 123, San Isidro, Lima',
      email: 'contacto@abc.com',
      phone: '014567890',
      status: 'valid',
    });
    mockEnrichMerchant.mockResolvedValue(mockEnrichedMerchant);
    mockBuildEmail.mockReturnValue({
      to: 'seller@test.com',
      subject: 'Test',
      htmlBody: '<p>Test</p>',
    });

    const result = await enrichMerchantUseCase(message);

    expect(result.merchant.status).toBe('ready_to_submit');
    expect(result.merchant.businessName).toBe('Empresa ABC SAC');
    expect(result.emailSent).toBe(true);
    expect(mockQuerySunat).toHaveBeenCalledWith('ruc', '20123456786');
    expect(mockEnrichMerchant).toHaveBeenCalledWith('MERCHANT#test-id', {
      businessName: 'Empresa ABC SAC',
      address: 'Av. Principal 123, San Isidro, Lima',
      email: 'contacto@abc.com',
      phone: '014567890',
    });
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('should throw error when merchant not found', async () => {
    const message: EnrichmentMessage = {
      merchantId: 'MERCHANT#nonexistent',
      documentType: 'ruc',
      documentNumber: '20123456786',
      timestamp: '2026-08-23T10:00:00.000Z',
    };

    mockGetMerchant.mockResolvedValue(null);

    await expect(enrichMerchantUseCase(message)).rejects.toThrow(
      'Merchant MERCHANT#nonexistent not found',
    );
  });

  it('should throw error when SUNAT returns invalid document', async () => {
    const message: EnrichmentMessage = {
      merchantId: 'MERCHANT#test-id',
      documentType: 'ruc',
      documentNumber: '99999999999',
      timestamp: '2026-08-23T10:00:00.000Z',
    };

    mockGetMerchant.mockResolvedValue(mockMerchant);
    mockQuerySunat.mockResolvedValue({
      businessName: '',
      address: '',
      email: '',
      phone: '',
      status: 'invalid',
    });

    await expect(enrichMerchantUseCase(message)).rejects.toThrow('Document 99999999999 is invalid');
  });

  it('should handle email failure gracefully', async () => {
    const message: EnrichmentMessage = {
      merchantId: 'MERCHANT#test-id',
      documentType: 'ruc',
      documentNumber: '20123456786',
      timestamp: '2026-08-23T10:00:00.000Z',
    };

    mockGetMerchant.mockResolvedValue(mockMerchant);
    mockQuerySunat.mockResolvedValue({
      businessName: 'Empresa ABC SAC',
      address: 'Av. Principal 123, San Isidro, Lima',
      email: 'contacto@abc.com',
      phone: '014567890',
      status: 'valid',
    });
    mockEnrichMerchant.mockResolvedValue(mockEnrichedMerchant);
    mockSendEmail.mockRejectedValue(new Error('SES error'));

    const result = await enrichMerchantUseCase(message);

    expect(result.merchant.status).toBe('ready_to_submit');
    expect(result.emailSent).toBe(false);
  });
});
