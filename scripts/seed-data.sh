#!/bin/bash
set -euo pipefail

# =============================================================================
# Seed Data - Inserta merchants de prueba en DynamoDB (FLOCI)
# Ejecutar: make db-seed
# =============================================================================

ENDPOINT="http://floci:4566"
REGION="us-east-1"
TABLE="merchants"

echo "🔍 Verificando que la tabla $TABLE existe..."

TABLE_STATUS=$(aws dynamodb describe-table \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query 'Table.TableStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$TABLE_STATUS" != "ACTIVE" ]; then
  echo "❌ Tabla $TABLE no existe. Ejecuta 'make db-setup' primero."
  exit 1
fi

echo "🌱 Insertando merchants de prueba..."
echo ""

# Merchant 1: RUC, pending_enrichment
aws dynamodb put-item \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --item '{
    "PK": {"S": "MERCHANT#test-ruc-001"},
    "SK": {"S": "PROFILE"},
    "id": {"S": "MERCHANT#test-ruc-001"},
    "documentType": {"S": "ruc"},
    "documentNumber": {"S": "20123456786"},
    "businessName": {"S": ""},
    "address": {"S": ""},
    "email": {"S": ""},
    "phone": {"S": ""},
    "sellerId": {"S": "seller-dev-001"},
    "status": {"S": "pending_enrichment"},
    "createdAt": {"S": "2026-08-22T10:00:00.000Z"},
    "updatedAt": {"S": "2026-08-22T10:00:00.000Z"},
    "GSI1PK": {"S": "SELLER#seller-dev-001"},
    "GSI1SK": {"S": "2026-08-22T10:00:00.000Z"},
    "GSI2PK": {"S": "STATUS#pending_enrichment"},
    "GSI2SK": {"S": "2026-08-22T10:00:00.000Z"}
  }'
echo "  ✅ MERCHANT#test-ruc-001  | RUC 20123456786 | pending_enrichment | seller-dev-001"

# Merchant 2: DNI, ready_to_submit
aws dynamodb put-item \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --item '{
    "PK": {"S": "MERCHANT#test-dni-002"},
    "SK": {"S": "PROFILE"},
    "id": {"S": "MERCHANT#test-dni-002"},
    "documentType": {"S": "dni"},
    "documentNumber": {"S": "12345678"},
    "businessName": {"S": "Juan Perez"},
    "address": {"S": "Av. Lima 123, San Isidro"},
    "email": {"S": "juan@test.com"},
    "phone": {"S": "999888777"},
    "sellerId": {"S": "seller-dev-001"},
    "status": {"S": "ready_to_submit"},
    "createdAt": {"S": "2026-08-22T11:00:00.000Z"},
    "updatedAt": {"S": "2026-08-22T11:05:00.000Z"},
    "GSI1PK": {"S": "SELLER#seller-dev-001"},
    "GSI1SK": {"S": "2026-08-22T11:00:00.000Z"},
    "GSI2PK": {"S": "STATUS#ready_to_submit"},
    "GSI2SK": {"S": "2026-08-22T11:05:00.000Z"}
  }'
echo "  ✅ MERCHANT#test-dni-002  | DNI 12345678    | ready_to_submit   | seller-dev-001"

# Merchant 3: RUC, submitted (different seller)
aws dynamodb put-item \
  --table-name "$TABLE" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --item '{
    "PK": {"S": "MERCHANT#test-ruc-003"},
    "SK": {"S": "PROFILE"},
    "id": {"S": "MERCHANT#test-ruc-003"},
    "documentType": {"S": "ruc"},
    "documentNumber": {"S": "20987654321"},
    "businessName": {"S": "Tech Corp SAC"},
    "address": {"S": "Calle Jr. de la Unión 456, Cercado"},
    "email": {"S": "info@techcorp.com"},
    "phone": {"S": "014567890"},
    "sellerId": {"S": "seller-dev-002"},
    "status": {"S": "submitted"},
    "createdAt": {"S": "2026-08-22T12:00:00.000Z"},
    "updatedAt": {"S": "2026-08-22T12:10:00.000Z"},
    "GSI1PK": {"S": "SELLER#seller-dev-002"},
    "GSI1SK": {"S": "2026-08-22T12:00:00.000Z"},
    "GSI2PK": {"S": "STATUS#submitted"},
    "GSI2SK": {"S": "2026-08-22T12:10:00.000Z"}
  }'
echo "  ✅ MERCHANT#test-ruc-003  | RUC 20987654321 | submitted          | seller-dev-002"

echo ""
echo "📊 Resumen de datos insertados:"
echo "  • 2 merchants para seller-dev-001 (1 pending, 1 ready)"
echo "  • 1 merchant para seller-dev-002 (1 submitted)"
echo ""
echo "🧪 Prueba los endpoints:"
echo "  curl http://localhost:3001/hello"
echo "  make db-shell"
