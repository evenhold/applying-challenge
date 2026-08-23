import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { CreateMerchantInput, Merchant, UpdateMerchantInput } from '../types/index.js';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || undefined,
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'merchants';

function generateMerchantId(): string {
  return `MERCHANT#${crypto.randomUUID()}`;
}

export async function createMerchant(input: CreateMerchantInput): Promise<Merchant> {
  const now = new Date().toISOString();
  const merchant: Merchant = {
    id: generateMerchantId(),
    documentType: input.documentType,
    documentNumber: input.documentNumber,
    businessName: '',
    address: '',
    email: '',
    phone: '',
    sellerId: input.sellerId,
    status: 'pending_enrichment',
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: merchant.id,
        SK: 'PROFILE',
        ...merchant,
        GSI1PK: `SELLER#${input.sellerId}`,
        GSI1SK: now,
        GSI2PK: `STATUS#${merchant.status}`,
        GSI2SK: now,
      },
    }),
  );

  return merchant;
}

export async function getMerchant(id: string): Promise<Merchant | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: id, SK: 'PROFILE' },
    }),
  );

  if (!result.Item) return null;

  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...merchant } = result.Item;
  return merchant as Merchant;
}

export async function getMerchantsBySeller(sellerId: string): Promise<Merchant[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :sellerId',
      ExpressionAttributeValues: { ':sellerId': `SELLER#${sellerId}` },
    }),
  );

  return (result.Items || []).map((item) => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...merchant } = item;
    return merchant as Merchant;
  });
}

export async function updateMerchant(
  id: string,
  input: UpdateMerchantInput,
): Promise<Merchant | null> {
  const existing = await getMerchant(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: Merchant = { ...existing, ...input, updatedAt: now };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: id,
        SK: 'PROFILE',
        ...updated,
        GSI1PK: `SELLER#${existing.sellerId}`,
        GSI1SK: existing.createdAt,
        GSI2PK: `STATUS#${updated.status}`,
        GSI2SK: now,
      },
    }),
  );

  return updated;
}
