import { enrichMerchant, getMerchant } from '../../lib/dynamodb.js';
import { buildEnrichmentCompleteEmail, sendEmail } from '../../lib/ses.js';
import type { EnrichmentMessage } from '../../lib/sqs.js';
import { querySunat } from '../../lib/sunat.js';
import type { Merchant } from '../../types/index.js';

export interface EnrichResult {
  merchant: Merchant;
  emailSent: boolean;
}

export async function enrichMerchantUseCase(message: EnrichmentMessage): Promise<EnrichResult> {
  const { merchantId, documentType, documentNumber } = message;

  const merchant = await getMerchant(merchantId);
  if (!merchant) {
    throw new Error(`Merchant ${merchantId} not found`);
  }

  const sunatData = await querySunat(documentType, documentNumber);

  if (sunatData.status === 'invalid') {
    throw new Error(`Document ${documentNumber} is invalid according to SUNAT`);
  }

  const enriched = await enrichMerchant(merchantId, {
    businessName: sunatData.businessName,
    address: sunatData.address,
    email: sunatData.email,
    phone: sunatData.phone,
  });

  if (!enriched) {
    throw new Error(`Failed to update merchant ${merchantId}`);
  }

  let emailSent = false;
  try {
    const email = buildEnrichmentCompleteEmail(sunatData.businessName, documentNumber);
    await sendEmail(email);
    emailSent = true;
  } catch {
    console.error(`Failed to send email for merchant ${merchantId}`);
  }

  return { merchant: enriched, emailSent };
}
