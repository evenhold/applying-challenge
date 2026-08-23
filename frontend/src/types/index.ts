// Types para el dominio de Mini Onboarding

export interface Merchant {
  id: string;
  ruc: string;
  razonSocial: string;
  direccion: string;
  email: string;
  telefono: string;
  sellerId: string;
  status: MerchantStatus;
  createdAt: string;
  updatedAt: string;
}

export type MerchantStatus =
  | 'pending_enrichment'
  | 'enriching'
  | 'ready_to_submit'
  | 'submitted'
  | 'approved'
  | 'rejected';

export interface Seller {
  id: string;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
