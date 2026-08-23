import type { LambdaEvent } from '../../types/index.js';

const MOCK_SELLER_ID = 'seller-dev-001';

export function extractSellerId(event: LambdaEvent): string | undefined {
  if (process.env.AUTH_MOCK === 'true') {
    return event.requestContext.authorizer?.claims?.sub || MOCK_SELLER_ID;
  }
  return event.requestContext.authorizer?.claims?.sub;
}
