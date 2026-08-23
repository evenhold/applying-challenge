#!/bin/bash
set -euo pipefail

# =============================================================================
# Setup DynamoDB - Crea tabla merchants + GSIs + SQS queue en FLOCI
# Ejecutar: make db-setup
# =============================================================================

ENDPOINT="http://floci:4566"
REGION="us-east-1"
TABLE="merchants"
QUEUE="merchants-enrichment"
AWS="docker compose run --rm awscli"

echo "🔍 Verificando si la tabla $TABLE existe..."

TABLE_STATUS=$($AWS dynamodb describe-table \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query 'Table.TableStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$TABLE_STATUS" = "ACTIVE" ]; then
  echo "✅ Tabla $TABLE ya existe. Saltando creación."
else
  echo "📝 Creando tabla $TABLE..."

  $AWS dynamodb create-table \
    --table-name "$TABLE" \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
      AttributeName=GSI1PK,AttributeType=S \
      AttributeName=GSI1SK,AttributeType=S \
      AttributeName=GSI2PK,AttributeType=S \
      AttributeName=GSI2SK,AttributeType=S \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes '[
      {
        "IndexName": "GSI1",
        "KeySchema": [
          {"AttributeName": "GSI1PK", "KeyType": "HASH"},
          {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "GSI2",
        "KeySchema": [
          {"AttributeName": "GSI2PK", "KeyType": "HASH"},
          {"AttributeName": "GSI2SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION"

  echo "⏳ Esperando que la tabla esté ACTIVE..."
  $AWS dynamodb wait table-exists \
    --table-name "$TABLE" \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION"

  echo "✅ Tabla $TABLE creada con GSIs."
fi

echo ""
echo "🔍 Verificando si la cola SQS $QUEUE existe..."

QUEUE_URL=$($AWS sqs get-queue-url \
  --queue-name "$QUEUE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query 'QueueUrl' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$QUEUE_URL" != "NOT_FOUND" ]; then
  echo "✅ Cola SQS $QUEUE ya existe."
else
  echo "📝 Creando cola SQS $QUEUE..."
  $AWS sqs create-queue \
    --queue-name "$QUEUE" \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" > /dev/null
  echo "✅ Cola SQS $QUEUE creada."
fi

echo ""
echo "Ejecuta 'make db-seed' para insertar datos de prueba."
