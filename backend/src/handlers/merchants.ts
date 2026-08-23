import {
  type LambdaEvent,
  type LambdaResponse,
  NotFoundError,
  ValidationError,
} from '../types/index.js';
import { createMerchantUseCase } from '../usecases/merchants/create.js';
import { getMerchantUseCase } from '../usecases/merchants/getById.js';
import { listMerchantsUseCase } from '../usecases/merchants/list.js';
import { updateMerchantUseCase } from '../usecases/merchants/update.js';
import { extractSellerId } from '../usecases/shared/auth.js';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
} as const;

function jsonError(statusCode: number, message: string): LambdaResponse {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify({ success: false, error: message }),
  };
}

function jsonResponse(statusCode: number, data: unknown): LambdaResponse {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify({ success: true, data }),
  };
}

function parseBody(event: LambdaEvent): Record<string, unknown> {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new ValidationError('Invalid JSON');
  }
}

function mapError(error: unknown): LambdaResponse {
  if (error instanceof ValidationError) {
    return jsonError(400, error.message);
  }
  if (error instanceof NotFoundError) {
    return jsonError(404, error.message);
  }
  return jsonError(500, 'Internal server error');
}

async function handleCreate(event: LambdaEvent, sellerId: string): Promise<LambdaResponse> {
  try {
    const body = parseBody(event);

    const { documentType, documentNumber } = body;
    if (!documentType || !documentNumber) {
      return jsonError(400, 'documentType and documentNumber are required');
    }

    const validTypes = ['ruc', 'dni', 'ce'];
    if (!validTypes.includes(documentType as string)) {
      return jsonError(400, `documentType must be one of: ${validTypes.join(', ')}`);
    }

    const merchant = await createMerchantUseCase({
      documentType: documentType as 'ruc' | 'dni' | 'ce',
      documentNumber: documentNumber as string,
      sellerId,
    });
    return jsonResponse(201, merchant);
  } catch (error) {
    return mapError(error);
  }
}

async function handleGetById(event: LambdaEvent, sellerId: string): Promise<LambdaResponse> {
  const id = event.pathParameters?.id;
  if (!id) return jsonError(400, 'Merchant id is required');

  try {
    const merchant = await getMerchantUseCase(id, sellerId);
    return jsonResponse(200, merchant);
  } catch (error) {
    return mapError(error);
  }
}

async function handleList(_event: LambdaEvent, sellerId: string): Promise<LambdaResponse> {
  const merchants = await listMerchantsUseCase(sellerId);
  return jsonResponse(200, merchants);
}

async function handleUpdate(event: LambdaEvent, sellerId: string): Promise<LambdaResponse> {
  const id = event.pathParameters?.id;
  if (!id) return jsonError(400, 'Merchant id is required');

  const body = parseBody(event);

  try {
    const merchant = await updateMerchantUseCase(id, sellerId, body);
    return jsonResponse(200, merchant);
  } catch (error) {
    return mapError(error);
  }
}

export async function handler(event: LambdaEvent): Promise<LambdaResponse> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const sellerId = extractSellerId(event);
  if (!sellerId) {
    return jsonError(401, 'Unauthorized');
  }

  switch (event.httpMethod) {
    case 'POST':
      return handleCreate(event, sellerId);
    case 'GET':
      if (event.pathParameters?.id) {
        return handleGetById(event, sellerId);
      }
      return handleList(event, sellerId);
    case 'PUT':
      return handleUpdate(event, sellerId);
    default:
      return jsonError(405, 'Method not allowed');
  }
}
