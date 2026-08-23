import { updateMerchant } from '../../lib/dynamodb.js';
import type { Merchant, UpdateMerchantInput } from '../../types/index.js';
import { NotFoundError } from '../../types/index.js';

export async function updateMerchantUseCase(
  id: string,
  sellerId: string,
  input: UpdateMerchantInput,
): Promise<Merchant> {
  const existing = await updateMerchant(id, input);

  if (!existing) {
    throw new NotFoundError(`Merchant ${id} not found`);
  }

  if (existing.sellerId !== sellerId) {
    throw new NotFoundError(`Merchant ${id} not found`);
  }

  return existing;
}
