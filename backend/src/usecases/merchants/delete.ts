import { deleteMerchant, getMerchant } from '../../lib/dynamodb.js';
import { NotFoundError } from '../../types/index.js';

export async function deleteMerchantUseCase(id: string, sellerId: string): Promise<void> {
  const merchant = await getMerchant(id);

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  if (merchant.sellerId !== sellerId) {
    throw new NotFoundError('Merchant not found');
  }

  await deleteMerchant(id);
}
