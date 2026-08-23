import { getMerchantsBySeller } from '../../lib/dynamodb.js';
import type { Merchant } from '../../types/index.js';

export async function listMerchantsUseCase(sellerId: string): Promise<Merchant[]> {
  return getMerchantsBySeller(sellerId);
}
