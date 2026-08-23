import { z } from 'zod';
import { documentTypeSchema, merchantStatusSchema } from './common.js';

export const createMerchantSchema = z.object({
  documentType: documentTypeSchema,
  documentNumber: z.string().min(1, 'documentNumber is required'),
});

export const updateMerchantSchema = z
  .object({
    businessName: z.string().max(200).optional(),
    address: z.string().max(300).optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z
      .string()
      .regex(/^\d{9}$/, 'phone must be 9 digits')
      .optional(),
    status: merchantStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type CreateMerchantBody = z.infer<typeof createMerchantSchema>;
export type UpdateMerchantBody = z.infer<typeof updateMerchantSchema>;
