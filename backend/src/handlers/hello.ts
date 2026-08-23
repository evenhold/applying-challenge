import type { LambdaEvent, LambdaResponse } from '../types/index.js';

/**
 * Handler de hello world
 * GET /hello
 */
export async function handler(_event: LambdaEvent): Promise<LambdaResponse> {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello World from Mini Onboarding API',
      timestamp: new Date().toISOString(),
    }),
  };
}
