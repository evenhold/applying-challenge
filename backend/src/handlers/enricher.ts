import type { EnrichmentMessage } from '../lib/sqs.js';
import type {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from '../types/index.js';
import { enrichMerchantUseCase } from '../usecases/merchants/enrich.js';
import { createChildLogger } from '../lib/logger.js';

const log = createChildLogger('enricher-handler');

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const message: EnrichmentMessage = JSON.parse(record.body);
      log.info({ merchantId: message.merchantId, messageId: record.messageId }, 'Processing record');
      await enrichMerchantUseCase(message);
      log.info({ merchantId: message.merchantId, messageId: record.messageId }, 'Record processed');
    } catch (error) {
      log.error({ messageId: record.messageId, error }, 'Failed to process record');
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
