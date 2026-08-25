import type { LambdaEvent } from '../../types/index.js';

const MOCK_SELLER_ID = 'seller-dev-001';

export function extractSellerId(event: LambdaEvent): string | undefined {
  if (process.env.AUTH_MOCK === 'true') {
    return event.requestContext.authorizer?.claims?.sub || MOCK_SELLER_ID;
  }

  // API Gateway v2 payload format 2.0: claims at requestContext.authorizer.jwt.claims
  const v2Claims = (event as any).requestContext?.authorizer?.jwt?.claims;
  if (v2Claims?.sub) return v2Claims.sub;

  // Fallback: payload format 1.0
  return event.requestContext.authorizer?.claims?.sub;
}
