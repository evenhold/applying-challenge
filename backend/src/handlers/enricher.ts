import type { EnrichmentMessage } from '../lib/sqs.js';
import type {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from '../types/index.js';
import { enrichMerchantUseCase } from '../usecases/merchants/enrich.js';

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const message: EnrichmentMessage = JSON.parse(record.body);
      console.log(`[enricher] Processing merchant: ${message.merchantId}`);
      await enrichMerchantUseCase(message);
      console.log(`[enricher] Merchant enriched: ${message.merchantId}`);
    } catch (error: any) {
      console.error(`[enricher] Failed to process ${record.messageId}:`, error?.message || error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
