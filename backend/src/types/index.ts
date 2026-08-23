// Domain types for Mini Onboarding

export type DocumentType = 'ruc' | 'dni' | 'ce';

export type MerchantStatus =
  | 'pending_enrichment'
  | 'enriching'
  | 'ready_to_submit'
  | 'submitted'
  | 'approved'
  | 'rejected';

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

export interface CreateMerchantInput {
  documentType: DocumentType;
  documentNumber: string;
  sellerId: string;
}

export interface UpdateMerchantInput {
  businessName?: string;
  address?: string;
  email?: string;
  phone?: string;
  status?: MerchantStatus;
}

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
