import type { LambdaEvent, LambdaResponse } from '../types/index.js';

/**
 * Handler placeholder para merchants
 * TODO: implementar en la fase de negocio
 */
export async function handler(_event: LambdaEvent): Promise<LambdaResponse> {
  return {
    statusCode: 501,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: 'Not implemented yet' }),
  };
}
