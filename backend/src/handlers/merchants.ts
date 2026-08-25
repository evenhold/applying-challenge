import { ZodError } from 'zod';
import { createMerchantSchema, updateMerchantSchema } from '../schemas/merchant.js';
import { type LambdaEvent, type LambdaResponse, NotFoundError } from '../types/index.js';
import { createMerchantUseCase } from '../usecases/merchants/create.js';
import { getMerchantUseCase } from '../usecases/merchants/getById.js';
import { listMerchantsUseCase } from '../usecases/merchants/list.js';
import { updateMerchantUseCase } from '../usecases/merchants/update.js';
import { deleteMerchantUseCase } from '../usecases/merchants/delete.js';
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

function parseJsonBody(event: LambdaEvent): unknown {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new ZodError([
      {
        code: 'custom',
        message: 'Invalid JSON',
        path: [],
      },
    ]);
  }
}

function mapError(error: unknown): LambdaResponse {
  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join(', ');
    return jsonError(400, message);
  }
  if (error instanceof NotFoundError) {
    return jsonError(404, error.message);
  }
  return jsonError(500, 'Internal server error');
}

async function handleCreate(event: LambdaEvent, sellerId: string): Promise<LambdaResponse> {
  try {
    const raw = parseJsonBody(event);
    const parsed = createMerchantSchema.parse(raw);

    const merchant = await createMerchantUseCase({
      ...parsed,
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

  try {
    const raw = parseJsonBody(event);
    const parsed = updateMerchantSchema.parse(raw);

    const merchant = await updateMerchantUseCase(id, parsed);
    return jsonResponse(200, merchant);
  } catch (error) {
    return mapError(error);
  }
}

async function handleDelete(event: LambdaEvent, sellerId: string): Promise<LambdaResponse> {
  const id = event.pathParameters?.id;
  if (!id) return jsonError(400, 'Merchant id is required');

  try {
    await deleteMerchantUseCase(id, sellerId);
    return jsonResponse(200, { deleted: true });
  } catch (error) {
    return mapError(error);
  }
}

export async function handler(event: LambdaEvent): Promise<LambdaResponse> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const httpMethod = event.httpMethod || (event as any).requestContext?.http?.method || 'GET';
  const path = event.path || (event as any).rawPath || '';

  if (path === '/health') {
    return jsonResponse(200, {
      status: 'healthy',
      service: 'mini-onboarding-backend',
      timestamp: new Date().toISOString(),
    });
  }

  const sellerId = extractSellerId(event);
  if (!sellerId) {
    return jsonError(401, 'Unauthorized');
  }

  switch (httpMethod) {
    case 'POST':
      return handleCreate(event, sellerId);
    case 'GET':
      if (event.pathParameters?.id) {
        return handleGetById(event, sellerId);
      }
      return handleList(event, sellerId);
    case 'PUT':
      return handleUpdate(event, sellerId);
    case 'DELETE':
      return handleDelete(event, sellerId);
    default:
      return jsonError(405, 'Method not allowed');
  }
}
