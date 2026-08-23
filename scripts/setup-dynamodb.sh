#!/bin/bash
set -euo pipefail

# =============================================================================
# Setup DynamoDB - Crea tabla merchants + GSIs en FLOCI
# Ejecutar: make db-setup
# =============================================================================

ENDPOINT="http://floci:4566"
REGION="us-east-1"
TABLE="merchants"

echo "🔍 Verificando si la tabla $TABLE existe..."

TABLE_STATUS=$(aws dynamodb describe-table \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query 'Table.TableStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$TABLE_STATUS" = "ACTIVE" ]; then
  echo "✅ Tabla $TABLE ya existe. Saltando creación."
  exit 0
fi

echo "📝 Creando tabla $TABLE..."

aws dynamodb create-table \
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
aws dynamodb wait table-exists \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION"

echo "✅ Tabla $TABLE creada con GSIs."
echo ""
echo "Ejecuta 'make db-seed' para insertar datos de prueba."
