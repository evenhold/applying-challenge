import type { LambdaEvent } from '../../types/index.js';

export function extractSellerId(event: LambdaEvent): string | undefined {
  return event.requestContext.authorizer?.claims?.sub;
}
