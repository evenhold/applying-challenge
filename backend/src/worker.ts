import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { enrichMerchantUseCase } from './usecases/merchants/enrich.js';
import type { EnrichmentMessage } from './lib/sqs.js';
import { createChildLogger } from './lib/logger.js';

const log = createChildLogger('enricher');
const POLL_INTERVAL_MS = 2000;
const MAX_MESSAGES = 10;
const WAIT_TIME_SECONDS = 5;
const QUEUE_NOT_FOUND_INTERVAL_MS = 10000;

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://floci:4566',
});

const QUEUE_URL =
  process.env.SQS_QUEUE_URL || 'http://floci:4566/000000000000/merchants-enrichment';

async function deleteMessage(receiptHandle: string): Promise<void> {
  await client.send(
    new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle,
    }),
  );
}

async function pollOnce(): Promise<number> {
  const result = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: MAX_MESSAGES,
      WaitTimeSeconds: WAIT_TIME_SECONDS,
      MessageAttributeNames: ['All'],
    }),
  );

  const messages = result.Messages || [];
  if (messages.length === 0) return 0;

  let processed = 0;

  for (const message of messages) {
    const receiptHandle = message.ReceiptHandle!;
    try {
      const rawBody = message.Body || '{}';
      const body: EnrichmentMessage = JSON.parse(rawBody);

      if (!body.merchantId) {
        log.warn({ messageId: message.MessageId, body: rawBody }, 'Skipping message: missing merchantId');
        await deleteMessage(receiptHandle);
        continue;
      }

      log.info({ merchantId: body.merchantId, messageId: message.MessageId }, 'Processing merchant');
      const start = Date.now();
      await enrichMerchantUseCase(body);
      const duration = Date.now() - start;
      log.info({ merchantId: body.merchantId, duration }, 'Merchant enriched');

      await deleteMessage(receiptHandle);
      processed++;
    } catch (error) {
      log.error({ messageId: message.MessageId, error }, 'Failed to process message');
      await deleteMessage(receiptHandle);
    }
  }

  return processed;
}

log.info({ queue: QUEUE_URL, pollInterval: POLL_INTERVAL_MS }, 'SQS Worker started');

async function loop() {
  let queueNotFoundLogged = false;
  while (true) {
    try {
      const count = await pollOnce();
      if (count > 0) {
        log.info({ count }, 'Batch processed');
      }
      queueNotFoundLogged = false;
    } catch (error: any) {
      if (error?.name === 'QueueDoesNotExist' || error?.Code === 'AWS.SimpleQueueService.NonExistentQueue') {
        if (!queueNotFoundLogged) {
          log.warn('SQS queue not found. Waiting for queue to be created...');
          queueNotFoundLogged = true;
        }
        await new Promise((r) => setTimeout(r, QUEUE_NOT_FOUND_INTERVAL_MS));
        continue;
      }
      log.error({ error }, 'Poll error');
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

loop();
