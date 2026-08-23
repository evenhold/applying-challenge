import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { enrichMerchantUseCase } from './usecases/merchants/enrich.js';
import type { EnrichmentMessage } from './lib/sqs.js';

const POLL_INTERVAL_MS = 2000;
const MAX_MESSAGES = 10;
const WAIT_TIME_SECONDS = 5;

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || undefined,
});

const QUEUE_URL =
  process.env.SQS_QUEUE_URL || 'http://floci:4566/000000000000/merchants-enrichment';

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
    try {
      const body: EnrichmentMessage = JSON.parse(message.body || '{}');
      console.log(`[enricher] Processing merchant: ${body.merchantId}`);
      await enrichMerchantUseCase(body);
      console.log(`[enricher] Completed merchant: ${body.merchantId}`);

      await client.send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle!,
        }),
      );
      processed++;
    } catch (error) {
      console.error(`[enricher] Failed to process message ${message.MessageId}:`, error);
    }
  }

  return processed;
}

console.log('[enricher] SQS Worker started');
console.log(`[enricher] Queue: ${QUEUE_URL}`);
console.log(`[enricher] Polling every ${POLL_INTERVAL_MS}ms`);

async function loop() {
  while (true) {
    try {
      const count = await pollOnce();
      if (count > 0) {
        console.log(`[enricher] Processed ${count} message(s)`);
      }
    } catch (error) {
      console.error('[enricher] Poll error:', error);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

loop();
