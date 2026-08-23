import { describe, expect, it } from 'vitest';
import type { LambdaEvent } from '../../types/index.js';
import { extractSellerId } from './auth.js';

describe('extractSellerId', () => {
  it('should return sellerId when authorizer claims exist', () => {
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
    const event = {
      requestContext: {},
    } as LambdaEvent;

    expect(extractSellerId(event)).toBeUndefined();
  });

  it('should return undefined when claims is missing', () => {
    const event = {
      requestContext: {
        authorizer: {},
      },
    } as LambdaEvent;

    expect(extractSellerId(event)).toBeUndefined();
  });
});
