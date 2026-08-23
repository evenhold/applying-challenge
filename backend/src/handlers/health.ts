import type { LambdaEvent, LambdaResponse } from '../types/index.js';

/**
 * Handler de health check
 * GET /health
 */
export async function handler(_event: LambdaEvent): Promise<LambdaResponse> {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'healthy',
      service: 'mini-onboarding-backend',
      timestamp: new Date().toISOString(),
    }),
  };
}
