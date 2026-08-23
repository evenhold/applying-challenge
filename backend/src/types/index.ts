import type { z } from 'zod';
import type { documentTypeSchema, merchantStatusSchema } from '../schemas/common.js';
import type { createMerchantSchema, updateMerchantSchema } from '../schemas/merchant.js';

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type MerchantStatus = z.infer<typeof merchantStatusSchema>;

export interface Merchant {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  businessName: string;
  address: string;
  email: string;
  phone: string;
  sellerId: string;
  status: MerchantStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateMerchantInput = z.infer<typeof createMerchantSchema> & {
  sellerId: string;
};

export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export interface LambdaEvent {
  httpMethod: string;
  path: string;
  body?: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  headers: Record<string, string>;
  requestContext: {
    authorizer?: {
      claims?: {
        sub: string;
        email: string;
      };
    };
  };
}

export interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
