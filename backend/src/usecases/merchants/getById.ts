import { getMerchant } from '../../lib/dynamodb.js';
import type { Merchant } from '../../types/index.js';
import { NotFoundError } from '../../types/index.js';

export async function getMerchantUseCase(id: string, sellerId: string): Promise<Merchant> {
  const merchant = await getMerchant(id);

  if (!merchant) {
    throw new NotFoundError(`Merchant ${id} not found`);
  }

  if (merchant.sellerId !== sellerId) {
    throw new NotFoundError(`Merchant ${id} not found`);
  }

  return merchant;
}
