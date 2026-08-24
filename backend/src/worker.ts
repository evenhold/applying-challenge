import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient, QueueDoesNotExistException } from '@aws-sdk/client-sqs';
import { enrichMerchantUseCase } from './usecases/merchants/enrich.js';
import type { EnrichmentMessage } from './lib/sqs.js';

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
        console.warn(`[enricher] Skipping message ${message.MessageId}: missing merchantId (body: ${rawBody})`);
        await deleteMessage(receiptHandle);
        continue;
      }

      console.log(`[enricher] Processing merchant: ${body.merchantId}`);
      await enrichMerchantUseCase(body);
      console.log(`[enricher] Completed merchant: ${body.merchantId}`);

      await deleteMessage(receiptHandle);
      processed++;
    } catch (error) {
      console.error(`[enricher] Failed to process message ${message.MessageId}:`, error);
      await deleteMessage(receiptHandle);
    }
  }

  return processed;
}

console.log('[enricher] SQS Worker started');
console.log(`[enricher] Queue: ${QUEUE_URL}`);
console.log(`[enricher] Polling every ${POLL_INTERVAL_MS}ms`);

async function loop() {
  let queueNotFoundLogged = false;
  while (true) {
    try {
      const count = await pollOnce();
      if (count > 0) {
        console.log(`[enricher] Processed ${count} message(s)`);
      }
      queueNotFoundLogged = false;
    } catch (error) {
      if (error instanceof QueueDoesNotExistException) {
        if (!queueNotFoundLogged) {
          console.warn('[enricher] SQS queue not found. Waiting for queue to be created...');
          queueNotFoundLogged = true;
        }
        await new Promise((r) => setTimeout(r, QUEUE_NOT_FOUND_INTERVAL_MS));
        continue;
      }
      console.error('[enricher] Poll error:', error);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

loop();
