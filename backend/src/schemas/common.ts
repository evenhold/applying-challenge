import { z } from 'zod';

export const documentTypeSchema = z.enum(['ruc', 'dni', 'ce']);

export const merchantStatusSchema = z.enum([
  'pending_enrichment',
  'enriching',
  'ready_to_submit',
  'submitted',
  'approved',
  'rejected',
]);
