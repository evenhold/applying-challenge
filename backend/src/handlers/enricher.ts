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
      await enrichMerchantUseCase(message);
    } catch (error) {
      console.error(`Failed to process record ${record.messageId}:`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
