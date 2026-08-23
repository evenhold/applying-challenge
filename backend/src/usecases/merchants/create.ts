import { createMerchant } from '../../lib/dynamodb.js';
import { validateDocumentNumber } from '../../lib/ruc-validator.js';
import { sendEnrichmentMessage } from '../../lib/sqs.js';
import type { CreateMerchantInput, Merchant } from '../../types/index.js';
import { ValidationError } from '../../types/index.js';

export async function createMerchantUseCase(input: CreateMerchantInput): Promise<Merchant> {
  if (!validateDocumentNumber(input.documentType, input.documentNumber)) {
    throw new ValidationError(`Invalid document number for type ${input.documentType}`);
  }

  const merchant = await createMerchant(input);
  await sendEnrichmentMessage(merchant.id, input.documentType, input.documentNumber);

  return merchant;
}
