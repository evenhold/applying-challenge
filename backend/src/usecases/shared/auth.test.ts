import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LambdaEvent } from '../../types/index.js';
import { extractSellerId } from './auth.js';

describe('extractSellerId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return sellerId from JWT claims when authorizer exists', () => {
    vi.stubEnv('AUTH_MOCK', 'false');

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'seller-123',
            email: 'seller@test.com',
          },
        },
      },
    } as LambdaEvent;

    expect(extractSellerId(event)).toBe('seller-123');
  });

  it('should return undefined when authorizer is missing', () => {
    vi.stubEnv('AUTH_MOCK', 'false');

    const event = {
      requestContext: {},
    } as LambdaEvent;

    expect(extractSellerId(event)).toBeUndefined();
  });

  it('should return undefined when claims is missing', () => {
    vi.stubEnv('AUTH_MOCK', 'false');

    const event = {
      requestContext: {
        authorizer: {},
      },
    } as LambdaEvent;

    expect(extractSellerId(event)).toBeUndefined();
  });

  it('should return mock sellerId when AUTH_MOCK=true and no JWT', () => {
    vi.stubEnv('AUTH_MOCK', 'true');

    const event = {
      requestContext: {},
    } as LambdaEvent;

    expect(extractSellerId(event)).toBe('seller-dev-001');
  });

  it('should return JWT claims over mock when AUTH_MOCK=true and JWT exists', () => {
    vi.stubEnv('AUTH_MOCK', 'true');

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'seller-real-456',
          },
        },
      },
    } as LambdaEvent;

    expect(extractSellerId(event)).toBe('seller-real-456');
  });
});
