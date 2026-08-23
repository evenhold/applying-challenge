import { describe, expect, it } from 'vitest';
import type { LambdaEvent } from '../types/index.js';
import { handler } from './hello.js';

describe('Hello Handler', () => {
  it('should return 200 with hello message', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/hello',
      headers: {},
      requestContext: {},
    } as LambdaEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Hello World from Mini Onboarding API');
  });
});
