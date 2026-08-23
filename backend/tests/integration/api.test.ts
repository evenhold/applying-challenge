import { describe, it, expect } from 'vitest';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const AUTH_HEADER = 'Bearer mock-integration-test-token';

describe('Integration: Health endpoints', () => {
  it('GET /health should return healthy', async () => {
    const res = await fetch(`${BACKEND_URL}/health`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('mini-onboarding-backend');
  });

  it('GET /hello should return message', async () => {
    const res = await fetch(`${BACKEND_URL}/hello`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toContain('Hello');
  });
});

describe('Integration: Merchants CRUD', () => {
  let createdMerchantId: string;

  it('POST /merchants should create a merchant', async () => {
    const res = await fetch(`${BACKEND_URL}/merchants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify({
        documentType: 'ruc',
        documentNumber: '20123456786',
      }),
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.documentType).toBe('ruc');
    expect(body.data.documentNumber).toBe('20123456786');
    expect(body.data.status).toBe('pending_enrichment');
    expect(body.data.id).toMatch(/^MERCHANT#/);

    createdMerchantId = body.data.id;
  });

  it('GET /merchants should list merchants', async () => {
    const res = await fetch(`${BACKEND_URL}/merchants`, {
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /merchants/:id should return a merchant', async () => {
    const encodedId = encodeURIComponent(createdMerchantId);
    const res = await fetch(`${BACKEND_URL}/merchants/${encodedId}`, {
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdMerchantId);
    expect(body.data.documentType).toBe('ruc');
  });

  it('PUT /merchants/:id should update merchant status', async () => {
    const encodedId = encodeURIComponent(createdMerchantId);
    const res = await fetch(`${BACKEND_URL}/merchants/${encodedId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify({ status: 'submitted' }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('submitted');
  });

  it('GET /merchants/:id with invalid ID should return 404', async () => {
    const res = await fetch(`${BACKEND_URL}/merchants/MERCHANT%23nonexistent`, {
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(404);
  });

  it('POST /merchants with missing fields should return 400', async () => {
    const res = await fetch(`${BACKEND_URL}/merchants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('POST /merchants with invalid JSON should return 400', async () => {
    const res = await fetch(`${BACKEND_URL}/merchants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: 'not-json',
    });

    expect(res.status).toBe(400);
  });

  it('GET /nonexistent should return 404', async () => {
    const res = await fetch(`${BACKEND_URL}/nonexistent`);
    expect(res.status).toBe(404);
  });
});
