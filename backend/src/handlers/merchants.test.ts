import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LambdaEvent, Merchant } from '../types/index.js';
import { handler } from './merchants.js';

vi.mock('../usecases/merchants/create.js', () => ({
  createMerchantUseCase: vi.fn().mockResolvedValue({
    id: 'MERCHANT#test-id',
    documentType: 'ruc',
    documentNumber: '20123456786',
    businessName: '',
    address: '',
    email: '',
    phone: '',
    sellerId: 'seller-123',
    status: 'pending_enrichment',
    createdAt: '2026-08-23T00:00:00.000Z',
    updatedAt: '2026-08-23T00:00:00.000Z',
  } satisfies Merchant),
}));

vi.mock('../usecases/merchants/list.js', () => ({
  listMerchantsUseCase: vi.fn().mockResolvedValue([]),
}));

vi.mock('../usecases/merchants/getById.js', () => ({
  getMerchantUseCase: vi.fn().mockResolvedValue({
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
  } satisfies Merchant),
}));

vi.mock('../usecases/merchants/update.js', () => ({
  updateMerchantUseCase: vi.fn().mockResolvedValue({
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
  } satisfies Merchant),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function createEvent(overrides: Partial<LambdaEvent>): LambdaEvent {
  return {
    httpMethod: 'POST',
    path: '/merchants',
    headers: {},
    pathParameters: undefined,
    queryStringParameters: undefined,
    requestContext: {
      authorizer: {
        claims: {
          sub: 'seller-123',
          email: 'seller@test.com',
        },
      },
    },
    ...overrides,
  } as LambdaEvent;
}

describe('Merchants Handler', () => {
  describe('OPTIONS /merchants', () => {
    it('should return 200 with CORS headers', async () => {
      const event = createEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.body).toBe('');
    });
  });

  describe('POST /merchants', () => {
    it('should return 401 when seller is not authenticated', async () => {
      vi.stubEnv('AUTH_MOCK', 'false');
      const event = createEvent({ requestContext: {} });
      const response = await handler(event);

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
      vi.stubEnv('AUTH_MOCK', 'true');
    });

    it('should return 400 when body is invalid JSON', async () => {
      const event = createEvent({ body: 'not-valid-json' });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid JSON');
    });

    it('should return 400 when documentType is missing', async () => {
      const event = createEvent({
        body: JSON.stringify({ documentNumber: '20123456786' }),
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Required');
    });

    it('should return 400 when documentNumber is missing', async () => {
      const event = createEvent({
        body: JSON.stringify({ documentType: 'ruc' }),
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Required');
    });

    it('should return 400 when documentType is invalid', async () => {
      const event = createEvent({
        body: JSON.stringify({ documentType: 'passport', documentNumber: '123456' }),
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('ruc');
      expect(body.error).toContain('dni');
      expect(body.error).toContain('ce');
    });

    it('should return 201 and create merchant when request is valid', async () => {
      const event = createEvent({
        body: JSON.stringify({ documentType: 'ruc', documentNumber: '20123456786' }),
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 'MERCHANT#test-id',
        documentType: 'ruc',
        documentNumber: '20123456786',
        sellerId: 'seller-123',
        status: 'pending_enrichment',
      });
    });
  });

  describe('GET /merchants', () => {
    it('should return 200 with merchants list', async () => {
      const event = createEvent({
        httpMethod: 'GET',
        path: '/merchants',
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  describe('GET /merchants/:id', () => {
    it('should return 200 with merchant', async () => {
      const event = createEvent({
        httpMethod: 'GET',
        path: '/merchants/MERCHANT#test-id',
        pathParameters: { id: 'MERCHANT#test-id' },
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 'MERCHANT#test-id',
        sellerId: 'seller-123',
      });
    });

    it('should list merchants when no id provided', async () => {
      const event = createEvent({
        httpMethod: 'GET',
        path: '/merchants',
        pathParameters: {},
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  describe('PUT /merchants/:id', () => {
    it('should return 200 with updated merchant', async () => {
      const event = createEvent({
        httpMethod: 'PUT',
        path: '/merchants/MERCHANT#test-id',
        pathParameters: { id: 'MERCHANT#test-id' },
        body: JSON.stringify({ businessName: 'Updated Business' }),
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 'MERCHANT#test-id',
        businessName: 'Updated Business',
      });
    });

    it('should return 400 when id is missing', async () => {
      const event = createEvent({
        httpMethod: 'PUT',
        path: '/merchants/',
        pathParameters: {},
        body: JSON.stringify({ businessName: 'Test' }),
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Merchant id is required');
    });
  });

  describe('DELETE /merchants/:id', () => {
    it('should return 405 for unsupported method', async () => {
      const event = createEvent({
        httpMethod: 'DELETE',
        path: '/merchants/MERCHANT#test-id',
        pathParameters: { id: 'MERCHANT#test-id' },
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Method not allowed');
    });
  });
});
