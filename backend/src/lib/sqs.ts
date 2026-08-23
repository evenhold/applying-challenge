import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || undefined,
});

const QUEUE_URL =
  process.env.SQS_QUEUE_URL || 'http://floci:4566/000000000000/merchants-enrichment';

export interface EnrichmentMessage {
  merchantId: string;
  documentType: string;
  documentNumber: string;
  timestamp: string;
}

export async function sendEnrichmentMessage(
  merchantId: string,
  documentType: string,
  documentNumber: string,
): Promise<void> {
  const message: EnrichmentMessage = {
    merchantId,
    documentType,
    documentNumber,
    timestamp: new Date().toISOString(),
  };

  await client.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        merchantId: {
          DataType: 'String',
          StringValue: merchantId,
        },
      },
    }),
  );
}
