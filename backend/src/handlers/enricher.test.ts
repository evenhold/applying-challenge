import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQSEvent } from '../types/index.js';
import { handler } from './enricher.js';

vi.mock('../usecases/merchants/enrich.js', () => ({
  enrichMerchantUseCase: vi.fn(),
}));

import { enrichMerchantUseCase } from '../usecases/merchants/enrich.js';

const mockEnrichMerchantUseCase = vi.mocked(enrichMerchantUseCase);

describe('enricher handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process all records successfully', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: 'msg-1',
          receiptHandle: 'handle-1',
          body: JSON.stringify({
            merchantId: 'MERCHANT#1',
            documentType: 'ruc',
            documentNumber: '20123456786',
            timestamp: '2026-08-23T10:00:00.000Z',
          }),
          attributes: {},
          messageAttributes: {},
        },
        {
          messageId: 'msg-2',
          receiptHandle: 'handle-2',
          body: JSON.stringify({
            merchantId: 'MERCHANT#2',
            documentType: 'dni',
            documentNumber: '12345678',
            timestamp: '2026-08-23T10:00:00.000Z',
          }),
          attributes: {},
          messageAttributes: {},
        },
      ],
    };

    mockEnrichMerchantUseCase.mockResolvedValue({
      merchant: {
        id: 'MERCHANT#test',
        documentType: 'ruc',
        documentNumber: '20123456786',
        businessName: 'Test',
        address: 'Test',
        email: 'test@test.com',
        phone: '999888777',
        sellerId: 'seller-123',
        status: 'ready_to_submit',
        createdAt: '2026-08-23T10:00:00.000Z',
        updatedAt: '2026-08-23T10:05:00.000Z',
      },
      emailSent: true,
    });

    const result = await handler(event);

    expect(result.batchItemFailures).toHaveLength(0);
    expect(mockEnrichMerchantUseCase).toHaveBeenCalledTimes(2);
  });

  it('should return failures for failed records', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: 'msg-1',
          receiptHandle: 'handle-1',
          body: JSON.stringify({
            merchantId: 'MERCHANT#1',
            documentType: 'ruc',
            documentNumber: '20123456786',
            timestamp: '2026-08-23T10:00:00.000Z',
          }),
          attributes: {},
          messageAttributes: {},
        },
        {
          messageId: 'msg-2',
          receiptHandle: 'handle-2',
          body: JSON.stringify({
            merchantId: 'MERCHANT#2',
            documentType: 'dni',
            documentNumber: '12345678',
            timestamp: '2026-08-23T10:00:00.000Z',
          }),
          attributes: {},
          messageAttributes: {},
        },
      ],
    };

    mockEnrichMerchantUseCase
      .mockResolvedValueOnce({
        merchant: {
          id: 'MERCHANT#1',
          documentType: 'ruc',
          documentNumber: '20123456786',
          businessName: 'Test',
          address: 'Test',
          email: 'test@test.com',
          phone: '999888777',
          sellerId: 'seller-123',
          status: 'ready_to_submit',
          createdAt: '2026-08-23T10:00:00.000Z',
          updatedAt: '2026-08-23T10:05:00.000Z',
        },
        emailSent: true,
      })
      .mockRejectedValueOnce(new Error('Processing error'));

    const result = await handler(event);

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-2');
  });

  it('should handle invalid JSON in message body', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: 'msg-1',
          receiptHandle: 'handle-1',
          body: 'invalid-json',
          attributes: {},
          messageAttributes: {},
        },
      ],
    };

    const result = await handler(event);

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-1');
  });
});
