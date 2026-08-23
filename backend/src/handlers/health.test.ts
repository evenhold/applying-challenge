import { describe, expect, it } from 'vitest';
import type { LambdaEvent } from '../types/index.js';
import { handler } from './health.js';

describe('Health Handler', () => {
  it('should return 200 with healthy status', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      requestContext: {},
    } as LambdaEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('mini-onboarding-backend');
  });
});
